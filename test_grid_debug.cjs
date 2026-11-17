const { spawn } = require('child_process');
const http = require('http');

async function testNewsGrid() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const port = 9276;
  const userDataDir = 'C:\\Users\\camil\\.gemini\\antigravity\\scratch\\chrome_test_newsgrid';
  
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

    const result = await send('Runtime.evaluate', {
      expression: `(() => {
        const grid = document.querySelector('.newsGrid');
        if (!grid) return { error: 'no grid' };
        const cs = window.getComputedStyle(grid);
        const cards = Array.from(grid.querySelectorAll('.newsSocialPostCard'));
        return {
          scrollWidth: grid.scrollWidth,
          clientWidth: grid.clientWidth,
          overflowX: cs.overflowX,
          display: cs.display,
          scrollSnapType: cs.scrollSnapType,
          cardsCount: cards.length,
          cardWidths: cards.map(c => ({
            w: c.offsetWidth,
            flex: window.getComputedStyle(c).flex,
            snapAlign: window.getComputedStyle(c).scrollSnapAlign
          }))
        };
      })()`,
      returnByValue: true
    });

    console.log('Grid Evaluation Result:', JSON.stringify(result.result?.value, null, 2));

    ws.close();
  } catch (e) {
    console.error(e);
  } finally {
    try { chrome.kill(); } catch (e) {}
    process.exit(0);
  }
}

testNewsGrid();
