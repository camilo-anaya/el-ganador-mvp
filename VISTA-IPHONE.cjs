const { spawn } = require("node:child_process");
const crypto = require("node:crypto");
const fs = require("node:fs");
const http = require("node:http");
const net = require("node:net");
const os = require("node:os");
const path = require("node:path");

const project = __dirname;
const privateIPv4 = (address) => /^10\.|^192\.168\.|^172\.(1[6-9]|2\d|3[01])\./.test(address);

function getLanAddress() {
  const interfaces = Object.entries(os.networkInterfaces())
    .filter(([name]) => !/(virtual|vethernet|wsl|docker|vmware|virtualbox|vpn|wireguard|tailscale)/i.test(name))
    .flatMap(([name, values]) => (values ?? []).filter((item) => item.family === "IPv4" && !item.internal && privateIPv4(item.address)).map((item) => ({ name, address: item.address })));
  interfaces.sort((a, b) => Number(/wi-?fi|wireless|wlan/i.test(b.name)) - Number(/wi-?fi|wireless|wlan/i.test(a.name)));
  return interfaces[0]?.address;
}

function portAvailable(host, port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once("error", () => resolve(false));
    server.listen(port, host, () => server.close(() => resolve(true)));
  });
}

async function pageIsElGanador(port) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 1200);
  try {
    const response = await fetch(`http://127.0.0.1:${port}/`, { signal: controller.signal });
    return response.ok && /el\s*ganador/i.test(await response.text());
  } catch {
    return false;
  } finally {
    clearTimeout(timeout);
  }
}

async function choosePort(host, start, end) {
  for (let port = start; port <= end; port += 1) {
    if (await portAvailable(host, port)) return port;
  }
  return null;
}

function constantTimeEqual(left, right) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function forwardRequest(request, response, backendPort) {
  const headers = { ...request.headers, host: `127.0.0.1:${backendPort}` };
  delete headers.authorization;
  delete headers.connection;
  delete headers["proxy-authorization"];
  const upstream = http.request({ hostname: "127.0.0.1", port: backendPort, path: request.url, method: request.method, headers }, (upstreamResponse) => {
    const responseHeaders = { ...upstreamResponse.headers };
    delete responseHeaders.connection;
    delete responseHeaders["keep-alive"];
    response.writeHead(upstreamResponse.statusCode ?? 502, responseHeaders);
    upstreamResponse.pipe(response);
  });
  upstream.on("error", () => {
    if (!response.headersSent) response.writeHead(502, { "content-type": "text/plain; charset=utf-8" });
    response.end("No se pudo conectar con la vista previa local.");
  });
  request.pipe(upstream);
}

function openOnThisPc(url) {
  const opener = spawn(process.env.ComSpec || "cmd.exe", ["/d", "/s", "/c", `start "" "${url}"`], {
    cwd: project,
    detached: true,
    stdio: "ignore",
    windowsHide: true,
  });
  opener.unref();
}

async function waitForApp(port) {
  const until = Date.now() + 90000;
  while (Date.now() < until) {
    if (await pageIsElGanador(port)) return true;
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  return false;
}

async function main() {
  if (process.platform !== "win32") throw new Error("Este acceso está preparado para Windows.");
  const lanHost = getLanAddress();
  if (!lanHost) throw new Error("No encontré una dirección Wi‑Fi privada. Conecta el PC a la misma red Wi‑Fi que el iPhone y vuelve a abrir este archivo.");

  let backendPort = null;
  for (let port = 3000; port <= 3010; port += 1) {
    if (await pageIsElGanador(port)) { backendPort = port; break; }
  }
  if (backendPort === null) {
    backendPort = await choosePort("127.0.0.1", 3000, 3010);
    if (!backendPort) throw new Error("Los puertos locales 3000–3010 están ocupados. Cierra las vistas previas anteriores e inténtalo de nuevo.");

    const stdout = fs.openSync(path.join(project, ".next-iphone-preview.out.log"), "a");
    const stderr = fs.openSync(path.join(project, ".next-iphone-preview.err.log"), "a");
    const server = spawn(process.env.ComSpec || "cmd.exe", ["/d", "/s", "/c", `npm run dev -- --hostname 127.0.0.1 --port ${backendPort}`], {
      cwd: project,
      detached: true,
      stdio: ["ignore", stdout, stderr],
      windowsHide: true,
    });
    server.unref();
    console.log("Iniciando la app en el equipo…");
    if (!(await waitForApp(backendPort))) throw new Error("La app no respondió. Revisa .next-iphone-preview.err.log en la carpeta del proyecto.");
  }

  const proxyPort = await choosePort(lanHost, 3100, 3110);
  if (!proxyPort) throw new Error("Los puertos 3100–3110 están ocupados en la red local.");
  const password = crypto.randomBytes(6).toString("hex");
  const expectedAuthorization = `Basic ${Buffer.from(`iphone:${password}`).toString("base64")}`;
  const proxy = http.createServer((request, response) => {
    const authorization = request.headers.authorization ?? "";
    if (!constantTimeEqual(authorization, expectedAuthorization)) {
      response.writeHead(401, { "www-authenticate": 'Basic realm="Vista privada El Ganador"', "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" });
      response.end("Vista de prueba privada. Ingresa el acceso mostrado en el PC.");
      return;
    }
    forwardRequest(request, response, backendPort);
  });

  proxy.on("error", (error) => console.error(`No se pudo abrir la vista en la Wi‑Fi: ${error.message}`));
  proxy.listen(proxyPort, lanHost, () => {
    const phoneUrl = `http://${lanHost}:${proxyPort}/`;
    console.log("");
    console.log("VISTA PRIVADA PARA IPHONE");
    console.log(`URL: ${phoneUrl}`);
    console.log("Usuario: iphone");
    console.log(`Clave temporal: ${password}`);
    console.log("");
    console.log("Conecta el iPhone a la misma Wi‑Fi y abre la URL en Safari.");
    console.log("Acceso limitado a esta red local y protegido con clave temporal. No se creó un túnel público.");
    console.log("Deja esta ventana abierta mientras pruebas; Ctrl+C cierra el acceso del iPhone.");
    openOnThisPc(`http://127.0.0.1:${backendPort}/`);
  });
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "No se pudo preparar la vista de iPhone.");
  process.exitCode = 1;
});
