const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

const ARTIFACT_DIR = 'C:\\Users\\camil\\.gemini\\antigravity\\brain\\2efac539-cfa0-4198-a137-c34196d2714e';

async function main() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const port = 9344;
  const userDataDir = 'C:\\Users\\camil\\.gemini\\antigravity\\scratch\\chrome_inspect_wompi_click';

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

    // 1. Open raffle modal
    await new Promise(r => setTimeout(r, 1200));
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const btn = document.querySelector('.igShopCtaButton') || document.querySelector('.ticketButton');
          if (btn) btn.click();
        })()
      `
    });
    await new Promise(r => setTimeout(r, 800));

    // 2. Click "Ver cartón digital y elegir números"
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const reserveBtn = document.querySelector('.reserveButton');
          if (reserveBtn) reserveBtn.click();
        })()
      `
    });
    await new Promise(r => setTimeout(r, 800));

    // 3. Select first available ticket
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const avail = document.querySelector('.ticketButton.available');
          if (avail) avail.click();
        })()
      `
    });
    await new Promise(r => setTimeout(r, 500));

    // 4. Reserve ticket
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const form = document.querySelector('.reserveForm');
          if (form) {
            const submitBtn = form.querySelector('button[type="submit"]') || form.querySelector('.reserveButton');
            if (submitBtn) submitBtn.click();
          }
        })()
      `
    });
    await new Promise(r => setTimeout(r, 1200));

    // 5. Click "💳 Pagar con Wompi"
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const wompiBtn = document.querySelector('.btnStepWompi');
          if (wompiBtn) wompiBtn.click();
        })()
      `
    });
    await new Promise(r => setTimeout(r, 1500));

    // 6. Screenshot showing Approved status
    const shot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'verif_120_pago_wompi_aprobado_exitoso.png'), Buffer.from(shot.data, 'base64'));
    console.log('Saved verif_120_pago_wompi_aprobado_exitoso.png');

    ws.close();
  } catch (err) {
    console.error(err);
  } finally {
    try { chrome.kill(); } catch (e) {}
  }
}

main();
