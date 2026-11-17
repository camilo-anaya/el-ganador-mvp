const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });

  // 1. Screenshot of "A Punto de Comenzar" (Tienda XYZ card)
  const aPuntoEl = await page.$('#a-punto-de-comenzar');
  if (aPuntoEl) {
    await aPuntoEl.scrollIntoView();
    await page.evaluate(() => window.scrollBy(0, 80));
    await new Promise(r => setTimeout(r, 600));
    await page.screenshot({ path: 'C:/Users/camil/.gemini/antigravity/brain/2efac539-cfa0-4198-a137-c34196d2714e/verif_106_a_punto_de_comenzar_actual.png' });
    console.log('Saved verif_106_a_punto_de_comenzar_actual.png');
  }

  // 2. Screenshot of Feed Comercios (Motos Caribe)
  const feedEl = await page.$('#novedades-locales');
  if (feedEl) {
    await feedEl.scrollIntoView();
    await new Promise(r => setTimeout(r, 600));
    await page.screenshot({ path: 'C:/Users/camil/.gemini/antigravity/brain/2efac539-cfa0-4198-a137-c34196d2714e/verif_107_feed_comercios_motos_caribe_actual.png' });
    console.log('Saved verif_107_feed_comercios_motos_caribe_actual.png');
  }

  await browser.close();
})();
