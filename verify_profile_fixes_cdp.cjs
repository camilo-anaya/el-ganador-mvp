const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

const ARTIFACT_DIR = 'C:\\Users\\camil\\.gemini\\antigravity\\brain\\2efac539-cfa0-4198-a137-c34196d2714e';

async function main() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const port = 9322;
  const userDataDir = 'C:\\Users\\camil\\.gemini\\antigravity\\scratch\\chrome_inspect_profile_mobile';

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

    // 1. Snapshot Top of /cuenta (Header + Hero Card + Tabs)
    await new Promise(r => setTimeout(r, 1200));
    const shot1 = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'verif_115_perfil_movil_cabecera_y_hero.png'), Buffer.from(shot1.data, 'base64'));
    console.log('Saved verif_115_perfil_movil_cabecera_y_hero.png');

    // 2. Scroll to Tab "Datos Personales & Avatar" area
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          // Click tab if not active
          const tabBtn = Array.from(document.querySelectorAll('.customerTabBtn')).find(b => b.textContent.includes('Datos Personales'));
          if (tabBtn) tabBtn.click();
          const target = document.querySelector('.clientNoPhotoNotice') || document.querySelector('.customerBox');
          if (target) target.scrollIntoView({ behavior: 'instant', block: 'center' });
        })()
      `
    });
    await new Promise(r => setTimeout(r, 800));
    const shot2 = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'verif_116_perfil_movil_sin_subir_fotos_avatares.png'), Buffer.from(shot2.data, 'base64'));
    console.log('Saved verif_116_perfil_movil_sin_subir_fotos_avatares.png');

    // 3. Navigate back to marketplace /
    await send('Page.navigate', { url: 'http://localhost:3000/' });
    await new Promise(r => setTimeout(r, 1500));
    const shot3 = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'verif_117_marketplace_movil_sin_ingreso.png'), Buffer.from(shot3.data, 'base64'));
    console.log('Saved verif_117_marketplace_movil_sin_ingreso.png');

    ws.close();
  } catch (err) {
    console.error(err);
  } finally {
    try { chrome.kill(); } catch (e) {}
  }
}

main();
