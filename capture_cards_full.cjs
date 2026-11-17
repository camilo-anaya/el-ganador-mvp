const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');

const ARTIFACT_DIR = 'C:\\Users\\camil\\.gemini\\antigravity\\brain\\2efac539-cfa0-4198-a137-c34196d2714e';

async function main() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const port = 9299;
  const userDataDir = 'C:\\Users\\camil\\.gemini\\antigravity\\scratch\\chrome_inspect_cards';

  const chrome = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=' + port,
    '--disable-gpu',
    '--window-size=412,915',
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

    // 1. Snapshot Card 1: ClosingDrawFeedCard (Tienda XYZ)
    const clip1 = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const card = document.querySelector('.igPostCard.closingCard');
          if (!card) return null;
          card.scrollIntoView({ block: 'center' });
          const rect = card.getBoundingClientRect();
          return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
        })()
      `,
      returnByValue: true
    });

    await new Promise(r => setTimeout(r, 600));

    if (clip1.result && clip1.result.value) {
      const b = clip1.result.value;
      const shot1 = await send('Page.captureScreenshot', {
        format: 'png',
        clip: { x: Math.max(0, b.x), y: Math.max(0, b.y), width: b.width, height: b.height, scale: 1 }
      });
      fs.writeFileSync(ARTIFACT_DIR + '\\verif_110_card1_tienda_xyz_a_punto.png', Buffer.from(shot1.data, 'base64'));
      console.log('Saved verif_110_card1_tienda_xyz_a_punto.png');
    }

    // 2. Snapshot Card 2: NewsSocialPostCard (Motos Caribe)
    const clip2 = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const card = document.querySelector('.newsSocialPostCard');
          if (!card) return null;
          card.scrollIntoView({ block: 'center' });
          const rect = card.getBoundingClientRect();
          return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
        })()
      `,
      returnByValue: true
    });

    await new Promise(r => setTimeout(r, 600));

    if (clip2.result && clip2.result.value) {
      const b2 = clip2.result.value;
      const shot2 = await send('Page.captureScreenshot', {
        format: 'png',
        clip: { x: Math.max(0, b2.x), y: Math.max(0, b2.y), width: b2.width, height: b2.height, scale: 1 }
      });
      fs.writeFileSync(ARTIFACT_DIR + '\\verif_111_card2_motos_caribe_feed.png', Buffer.from(shot2.data, 'base64'));
      console.log('Saved verif_111_card2_motos_caribe_feed.png');
    }

    ws.close();
  } catch (err) {
    console.error(err);
  } finally {
    chrome.kill();
  }
}

main();
