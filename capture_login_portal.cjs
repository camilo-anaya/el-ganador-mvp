const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

const ARTIFACT_DIR = 'C:\\Users\\camil\\.gemini\\antigravity\\brain\\2efac539-cfa0-4198-a137-c34196d2714e';
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function captureViewport(url, width, height, filename) {
  const port = 9350;
  const userDataDir = 'C:\\Users\\camil\\.gemini\\antigravity\\scratch\\chrome_inspect_login_' + width;
  try { fs.rmSync(userDataDir, { recursive: true, force: true }); } catch(e){}

  const chrome = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=' + port,
    '--disable-gpu',
    `--window-size=${width},${height}`,
    '--user-data-dir=' + userDataDir,
    url
  ]);

  try {
    await new Promise(r => setTimeout(r, 2200));
    const pages = await new Promise((resolve, reject) => {
      http.get(`http://127.0.0.1:${port}/json`, res => {
        let buf = '';
        res.on('data', d => buf += d);
        res.on('end', () => resolve(JSON.parse(buf)));
      }).on('error', reject);
    });

    const page = pages.find(p => p.url.includes('localhost:3000') || p.title.includes('Ganador'));
    if (!page) throw new Error('Page not found');

    const ws = new WebSocket(page.webSocketDebuggerUrl);
    await new Promise(r => ws.onopen = r);

    let msgId = 1;
    function send(method, params = {}) {
      return new Promise((resolve, reject) => {
        const id = msgId++;
        const timer = setTimeout(() => reject(new Error('Timeout ' + method)), 15000);
        function handler(evt) {
          const data = JSON.parse(evt.data);
          if (data.id === id) {
            clearTimeout(timer);
            ws.removeEventListener('message', handler);
            if (data.error) reject(data.error);
            else resolve(data.result);
          }
        }
        ws.addEventListener('message', handler);
        ws.send(JSON.stringify({ id, method, params }));
      });
    }

    await send('Page.enable');
    await send('Emulation.setDeviceMetricsOverride', {
      width,
      height,
      deviceScaleFactor: width < 600 ? 2 : 1,
      mobile: width < 600
    });

    const snap = await send('Page.captureScreenshot', { format: 'png' });
    const filePath = path.join(ARTIFACT_DIR, filename);
    fs.writeFileSync(filePath, Buffer.from(snap.data, 'base64'));
    console.log(`Saved screenshot: ${filename}`);

    ws.close();
  } finally {
    chrome.kill('SIGKILL');
  }
}

async function run() {
  await captureViewport('http://localhost:3000/login', 1280, 800, 'verif_169_login_portal_pc_desktop.png');
  await new Promise(r => setTimeout(r, 1000));
  await captureViewport('http://localhost:3000/login', 390, 844, 'verif_170_login_portal_mobile.png');
}

run().catch(console.error);
