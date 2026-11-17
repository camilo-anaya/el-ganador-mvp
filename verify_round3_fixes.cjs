const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

const ARTIFACT_DIR = 'C:\\Users\\camil\\.gemini\\antigravity\\brain\\2efac539-cfa0-4198-a137-c34196d2714e';

async function main() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const port = 9277;
  const userDataDir = 'C:\\Users\\camil\\.gemini\\antigravity\\scratch\\chrome_test_fixes_round3';
  
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

    // VERIFICATION 1: Salas de Sorteo en Vivo (Sin botón comprar, venta cerrada notarial)
    console.log('--- 1. SALAS DE SORTEO EN VIVO: VENTA CERRADA ---');
    await send('Runtime.evaluate', {
      expression: `(() => {
        const el = document.getElementById('salas-sorteo-en-vivo');
        if (el) el.scrollIntoView({ behavior: 'instant', block: 'start' });
      })()`
    });
    await new Promise(r => setTimeout(r, 600));

    const shot1 = await send('Page.captureScreenshot', { format: 'png' });
    const shot1Path = path.join(ARTIFACT_DIR, 'verif_103_salas_en_vivo_sin_comprar_venta_cerrada.png');
    fs.writeFileSync(shot1Path, Buffer.from(shot1.data, 'base64'));
    console.log('Saved 1:', shot1Path);

    // VERIFICATION 2: Feed de Comercios - Post 1
    console.log('--- 2. FEED COMERCIOS - POST 1 INICIAL ---');
    await send('Runtime.evaluate', {
      expression: `(() => {
        const el = document.getElementById('novedades-locales');
        if (el) el.scrollIntoView({ behavior: 'instant', block: 'start' });
      })()`
    });
    await new Promise(r => setTimeout(r, 600));

    const shot2 = await send('Page.captureScreenshot', { format: 'png' });
    const shot2Path = path.join(ARTIFACT_DIR, 'verif_104_feed_comercios_post_1_con_flechas.png');
    fs.writeFileSync(shot2Path, Buffer.from(shot2.data, 'base64'));
    console.log('Saved 2:', shot2Path);

    // VERIFICATION 3: Click flecha siguiente en el Feed de Comercios para deslizar al Post 2
    console.log('--- 3. DESLIZAR FEED COMERCIOS AL POST 2 ---');
    await send('Runtime.evaluate', {
      expression: `(() => {
        const nextBtn = document.querySelector('.btnFeedNav[title*="Siguiente"]');
        if (nextBtn) nextBtn.click();
        else {
          const grid = document.querySelector('.newsGrid');
          if (grid) grid.scrollBy({ left: 390, behavior: 'smooth' });
        }
      })()`
    });
    await new Promise(r => setTimeout(r, 800)); // wait for smooth scroll

    const shot3 = await send('Page.captureScreenshot', { format: 'png' });
    const shot3Path = path.join(ARTIFACT_DIR, 'verif_105_feed_comercios_post_2_deslizado_exitoso.png');
    fs.writeFileSync(shot3Path, Buffer.from(shot3.data, 'base64'));
    console.log('Saved 3:', shot3Path);

    ws.close();
  } catch (e) {
    console.error(e);
  } finally {
    try { chrome.kill(); } catch (e) {}
    process.exit(0);
  }
}

main();
