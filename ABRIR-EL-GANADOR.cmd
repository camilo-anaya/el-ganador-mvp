@echo off
setlocal
cd /d "%~dp0"
echo Iniciando la vista local de El Ganador...
node "%~dp0ABRIR-EL-GANADOR.cjs"
if errorlevel 1 (
  echo.
  echo No se pudo iniciar la app. El mensaje anterior indica el motivo.
)
echo.
echo Puedes cerrar esta ventana; la app se queda ejecutandose en segundo plano.
pause >nul
