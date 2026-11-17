const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');

const ARTIFACT_DIR = 'C:\\Users\\camil\\.gemini\\antigravity\\brain\\2efac539-cfa0-4198-a137-c34196d2714e';

async function main() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const port = 9288;
  const userDataDir = 'C:\\Users\\camil\\.gemini\\antigravity\\scratch\\chrome_inspect_current';

  const chrome = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=' + port,
    '--disable-gpu',
    '--window-size=390,844',
    '--user-data-dir=' + userDataDir,
    'http://localhost:3000/'
  ]);

  try {
    await new Promise(r => setTimeout(r, 2500));
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
    await send('Runtime.enable');
    await send('DOM.enable');

    // 1. Scroll to A Punto de Comenzar (Tienda XYZ)
    await send('Runtime.evaluate', {
      expression: `
        const el = document.getElementById('a-punto-de-comenzar');
        if (el) {
          el.scrollIntoView({ behavior: 'instant', block: 'start' });
          window.scrollBy(0, 40);
        }
      `
    });
    await new Promise(r => setTimeout(r, 1000));
    const shot1 = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(ARTIFACT_DIR + '\\verif_108_current_a_punto_de_comenzar.png', Buffer.from(shot1.data, 'base64'));
    console.log('Saved verif_108_current_a_punto_de_comenzar.png');

    // 2. Scroll to Feed Comercios (Motos Caribe)
    await send('Runtime.evaluate', {
      expression: `
        const el = document.getElementById('novedades-locales');
        if (el) {
          el.scrollIntoView({ behavior: 'instant', block: 'start' });
          window.scrollBy(0, 40);
        }
      `
    });
    await new Promise(r => setTimeout(r, 1000));
    const shot2 = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(ARTIFACT_DIR + '\\verif_109_current_feed_comercios.png', Buffer.from(shot2.data, 'base64'));
    console.log('Saved verif_109_current_feed_comercios.png');

    ws.close();
  } catch (err) {
    console.error(err);
  } finally {
    chrome.kill();
  }
}

main();
