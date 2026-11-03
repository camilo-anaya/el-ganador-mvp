$ErrorActionPreference = 'Stop'
$projectRoot = $PSScriptRoot
$distDir = '.next-live'
$env:NEXT_DEV_DIST_DIR = $distDir
Set-Location -LiteralPath $projectRoot

function Write-Status([string]$message) {
  Write-Host "`n$message" -ForegroundColor Cyan
}

function Test-FreePort([int]$port) {
  $listener = $null
  try {
    $listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Any, $port)
    $listener.Start()
    return $true
  } catch {
    return $false
  } finally {
    if ($listener) { $listener.Stop() }
  }
}

function Test-Http([string]$uri) {
  try {
    $request = [System.Net.HttpWebRequest]::Create($uri)
    $request.Method = 'GET'
    $request.Timeout = 2500
    $request.ReadWriteTimeout = 2500
    $response = $request.GetResponse()
    $reader = [System.IO.StreamReader]::new($response.GetResponseStream())
    $body = $reader.ReadToEnd()
    $reader.Dispose()
    $response.Dispose()
    return @{ Status = 200; Body = $body }
  } catch {
    return $null
  }
}

function Test-HttpStatus([string]$uri) {
  try {
    $request = [System.Net.HttpWebRequest]::Create($uri)
    $request.Method = 'GET'
    $request.Timeout = 2500
    $response = $request.GetResponse()
    $status = [int]$response.StatusCode
    $response.Dispose()
    return $status
  } catch {
    return 0
  }
}

if (-not (Test-Path -LiteralPath (Join-Path $projectRoot 'node_modules\next\dist\bin\next'))) {
  throw 'No encuentro Next.js instalado en este proyecto. Ejecuta primero npm install.'
}

Write-Status 'Compilando la versión actual de El Ganador…'
$buildSucceeded = $false
for ($attempt = 1; $attempt -le 2; $attempt++) {
  & npm.cmd run build
  if ($LASTEXITCODE -eq 0) {
    $buildSucceeded = $true
    break
  }
  if ($attempt -eq 1) {
    Write-Host 'La primera compilación tuvo un bloqueo temporal. Reintentando una vez…' -ForegroundColor Yellow
    Start-Sleep -Seconds 2
  }
}
if (-not $buildSucceeded) { throw 'La compilación falló dos veces. Revisa el error anterior; no se abrió una versión antigua.' }

$port = $null
foreach ($candidate in 3001..3020) {
  if (Test-FreePort $candidate) { $port = $candidate; break }
}
if (-not $port) { throw 'No encontré un puerto libre entre 3001 y 3020.' }

$stdoutPath = Join-Path $projectRoot ".next-live-server-$port.out.log"
$stderrPath = Join-Path $projectRoot ".next-live-server-$port.err.log"
$nodePath = (Get-Command node.exe -ErrorAction Stop).Source
$nextCli = Join-Path $projectRoot 'node_modules\next\dist\bin\next'
$serverArguments = "`"$nextCli`" start --hostname 0.0.0.0 --port $port"
Write-Status "Iniciando El Ganador en http://localhost:$port …"
$server = Start-Process -FilePath $nodePath -ArgumentList $serverArguments -WorkingDirectory $projectRoot -WindowStyle Hidden -PassThru -RedirectStandardOutput $stdoutPath -RedirectStandardError $stderrPath

$pageUri = "http://127.0.0.1:$port/cuenta"
$page = $null
for ($attempt = 1; $attempt -le 40; $attempt++) {
  Start-Sleep -Milliseconds 500
  $page = Test-Http $pageUri
  if ($page) { break }
  if ($server.HasExited) { break }
}

if (-not $page) {
  $details = @()
  foreach ($file in @($stdoutPath, $stderrPath)) {
    if (Test-Path -LiteralPath $file) { $details += Get-Content -LiteralPath $file -Tail 20 }
  }
  if (-not $details) { $details = 'No se generó el registro del servidor.' }
  throw "El servidor no respondió. Registro:`n$details"
}
$cssPath = [regex]::Match($page.Body, 'href="([^"]+\.css)"').Groups[1].Value
if (-not $cssPath) { throw 'La página respondió sin su hoja de estilos.' }
$css = Test-Http "http://127.0.0.1:$port$cssPath"
if (-not $css -or $css.Body -notmatch 'premiumLogoBand') { throw 'La hoja de estilos activa no contiene la franja nueva.' }

$hasClientBand = $false
$hasClientLogo = $false
$scriptPaths = [regex]::Matches($page.Body, '(?:src|href)="([^"]+\.js)(?:\?[^"]*)?"')
foreach ($match in $scriptPaths) {
  $bundle = Test-Http "http://127.0.0.1:$port$($match.Groups[1].Value)"
  if ($bundle) {
    if ($bundle.Body.Contains('premiumLogoBand')) { $hasClientBand = $true }
    if ($bundle.Body.Contains('el-ganador-logo.png')) { $hasClientLogo = $true }
  }
}
if (-not $hasClientBand -or -not $hasClientLogo) { throw 'El paquete de la ruta no incluye el contenedor y el logo nuevos.' }

$logoStatus = Test-HttpStatus "http://127.0.0.1:$port/el-ganador-logo.png"
if ($logoStatus -ne 200) { throw 'La página cargó, pero el archivo del logo no respondió con HTTP 200.' }

$openUri = "http://localhost:$port/cuenta"
Write-Status "Verificación correcta: /cuenta responde y contiene el logo. Abriendo $openUri"
try {
  Start-Process $openUri -ErrorAction Stop
} catch {
  Write-Host 'La app está activa. Windows bloqueó la apertura automática del navegador; usa el enlace mostrado arriba.' -ForegroundColor Yellow
}
Write-Host "El servidor quedó activo en el puerto $port. Registros: $stdoutPath y $stderrPath" -ForegroundColor Green
