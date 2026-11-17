const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

const ARTIFACT_DIR = 'C:\\Users\\camil\\.gemini\\antigravity\\brain\\2efac539-cfa0-4198-a137-c34196d2714e';

async function main() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const port = 9275;
  const userDataDir = 'C:\\Users\\camil\\.gemini\\antigravity\\scratch\\chrome_test_ads_before_live';
  
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

    await send('Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true
    });

    await send('Page.navigate', { url: 'http://localhost:3000/' });
    await new Promise(r => setTimeout(r, 2500));

    // Scroll to #pasarela-publicidad
    console.log('--- SCROLL TO PASARELA DE PUBLICIDAD BEFORE SALAS DE SORTEO EN VIVO ---');
    await send('Runtime.evaluate', {
      expression: `(() => {
        const ad = document.getElementById('pasarela-publicidad');
        if (ad) ad.scrollIntoView({ behavior: 'instant', block: 'start' });
      })()`
    });
    await new Promise(r => setTimeout(r, 600));

    const shot1 = await send('Page.captureScreenshot', { format: 'png' });
    const shot1Path = path.join(ARTIFACT_DIR, 'verif_101_pasarela_publicidad_antes_de_salas_en_vivo.png');
    fs.writeFileSync(shot1Path, Buffer.from(shot1.data, 'base64'));
    console.log('Saved 1:', shot1Path);

    // Scroll slightly down to show the connection into Salas de Sorteo en Vivo
    await send('Runtime.evaluate', {
      expression: `window.scrollBy({ top: 220, behavior: 'instant' });`
    });
    await new Promise(r => setTimeout(r, 500));

    const shot2 = await send('Page.captureScreenshot', { format: 'png' });
    const shot2Path = path.join(ARTIFACT_DIR, 'verif_102_salas_de_sorteo_en_vivo_justo_despues.png');
    fs.writeFileSync(shot2Path, Buffer.from(shot2.data, 'base64'));
    console.log('Saved 2:', shot2Path);

    ws.close();
  } catch (e) {
    console.error('Error during test:', e);
  } finally {
    try { chrome.kill(); } catch (e) {}
    process.exit(0);
  }
}

main();
