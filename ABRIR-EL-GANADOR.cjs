const { spawn } = require("node:child_process");
const fs = require("node:fs");
const net = require("node:net");
const path = require("node:path");

const project = __dirname;
const firstPort = 3000;
const lastPort = 3010;

function checkPort(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once("error", () => resolve(false));
    server.listen(port, "127.0.0.1", () => server.close(() => resolve(true)));
  });
}

async function readPage(port) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 1200);
  try {
    const response = await fetch(`http://127.0.0.1:${port}/`, { signal: controller.signal });
    const body = await response.text();
    return response.ok && /el\s*ganador/i.test(body);
  } catch {
    return false;
  } finally {
    clearTimeout(timeout);
  }
}

function openBrowser(url) {
  const command = process.env.ComSpec || "cmd.exe";
  const opener = spawn(command, ["/d", "/s", "/c", `start "" "${url}"`], {
    cwd: project,
    detached: true,
    stdio: "ignore",
    windowsHide: true,
  });
  opener.unref();
}

function waitForServer(port, timeoutMs = 60000) {
  const startedAt = Date.now();
  return new Promise((resolve) => {
    const attempt = async () => {
      if (await readPage(port)) return resolve(true);
      if (Date.now() - startedAt >= timeoutMs) return resolve(false);
      setTimeout(attempt, 1000);
    };
    void attempt();
  });
}

async function main() {
  if (process.platform !== "win32") {
    throw new Error("Este acceso de un clic está preparado para Windows.");
  }

  for (let port = firstPort; port <= lastPort; port += 1) {
    if (await readPage(port)) {
      const url = `http://127.0.0.1:${port}/`;
      console.log(`El Ganador ya está activo: ${url}`);
      openBrowser(url);
      return;
    }
  }

  let selectedPort = null;
  for (let port = firstPort; port <= lastPort; port += 1) {
    if (await checkPort(port)) {
      selectedPort = port;
      break;
    }
  }
  if (!selectedPort) throw new Error("Los puertos 3000–3010 están ocupados. Cierra los servidores de desarrollo anteriores e inténtalo de nuevo.");

  const stdout = fs.openSync(path.join(project, ".next-local-preview.out.log"), "a");
  const stderr = fs.openSync(path.join(project, ".next-local-preview.err.log"), "a");
  const command = process.env.ComSpec || "cmd.exe";
  const server = spawn(command, ["/d", "/s", "/c", `npm run dev -- --hostname 127.0.0.1 --port ${selectedPort}`], {
    cwd: project,
    detached: true,
    stdio: ["ignore", stdout, stderr],
    windowsHide: true,
  });
  server.unref();

  const url = `http://127.0.0.1:${selectedPort}/`;
  console.log(`Iniciando El Ganador localmente en ${url}…`);
  if (!(await waitForServer(selectedPort))) {
    throw new Error(`La app no respondió en un minuto. Revisa .next-local-preview.err.log en la carpeta del proyecto.`);
  }
  console.log(`El Ganador está listo: ${url}`);
  openBrowser(url);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "No se pudo iniciar El Ganador.");
  process.exitCode = 1;
});
