const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

const ARTIFACT_DIR = 'C:\\Users\\camil\\.gemini\\antigravity\\brain\\2efac539-cfa0-4198-a137-c34196d2714e';

async function main() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const port = 9333;
  const userDataDir = 'C:\\Users\\camil\\.gemini\\antigravity\\scratch\\chrome_inspect_wompi_cdp';

  const chrome = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=' + port,
    '--disable-gpu',
    '--window-size=390,844',
    '--user-data-dir=' + userDataDir,
    'http://localhost:3000/cuenta'
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

    // 1. Snapshot /cuenta: verifying tab renamed to "Cuenta Bancaria & Cobro de Premios"
    await new Promise(r => setTimeout(r, 1200));
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const btn = Array.from(document.querySelectorAll('.customerTabBtn')).find(b => b.textContent.includes('Cuenta Bancaria'));
          if (btn) btn.click();
        })()
      `
    });
    await new Promise(r => setTimeout(r, 600));
    const shot1 = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'verif_118_cuenta_bancaria_sin_billetera.png'), Buffer.from(shot1.data, 'base64'));
    console.log('Saved verif_118_cuenta_bancaria_sin_billetera.png');

    // 2. Navigate to / and test reservation + Wompi payment step
    await send('Page.navigate', { url: 'http://localhost:3000/' });
    await new Promise(r => setTimeout(r, 1500));

    // Click on a raffle card to open reservation modal
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const btn = document.querySelector('.igShopCtaButton') || document.querySelector('.ticketButton');
          if (btn) btn.click();
        })()
      `
    });
    await new Promise(r => setTimeout(r, 1000));

    // In modal, click "Ver cartón digital y elegir números"
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const reserveBtn = document.querySelector('.reserveButton');
          if (reserveBtn) reserveBtn.click();
        })()
      `
    });
    await new Promise(r => setTimeout(r, 1000));

    // Select first available ticket
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const avail = document.querySelector('.ticketButton.available');
          if (avail) avail.click();
        })()
      `
    });
    await new Promise(r => setTimeout(r, 600));

    // Submit reservation form
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
    await new Promise(r => setTimeout(r, 1500));

    // Snapshot Step 2 showing "2. Pasarela Wompi Bancolombia (PSE · Nequi)"
    const shot2 = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'verif_119_modal_paso_wompi_bancolombia.png'), Buffer.from(shot2.data, 'base64'));
    console.log('Saved verif_119_modal_paso_wompi_bancolombia.png');

    // Click "💳 Pagar con Wompi"
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const wompiBtn = document.querySelector('.btnStepWompi');
          if (wompiBtn) wompiBtn.click();
        })()
      `
    });
    await new Promise(r => setTimeout(r, 2000));

    // Snapshot showing Wompi payment confirmed ("✅ Aprobado")
    const shot3 = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'verif_120_pago_wompi_aprobado_exitoso.png'), Buffer.from(shot3.data, 'base64'));
    console.log('Saved verif_120_pago_wompi_aprobado_exitoso.png');

    ws.close();
  } catch (err) {
    console.error(err);
  } finally {
    try { chrome.kill(); } catch (e) {}
  }
}

main();
