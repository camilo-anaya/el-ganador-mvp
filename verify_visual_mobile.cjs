const { chromium } = require('playwright');
const path = require('path');

async function run() {
  const browser = await chromium.launch({ headless: true });
  
  // Mobile Context 390x844 (iPhone 14)
  const contextMobile = await browser.newContext({
    viewport: { width: 390, height: 844 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1',
    deviceScaleFactor: 2
  });
  
  const page = await contextMobile.newPage();
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);

  // 1. Screenshot of the Top: Section title & ClosingSoonDrawCard
  const artifactDir = 'C:\\Users\\camil\\.gemini\\antigravity\\brain\\2efac539-cfa0-4198-a137-c34196d2714e';
  
  await page.screenshot({
    path: path.join(artifactDir, 'verif_85_mobile_edge_to_edge_clean_feed.png'),
    fullPage: false
  });
  console.log('Saved verif_85_mobile_edge_to_edge_clean_feed.png');

  // Scroll to ClosingSoonDrawCard specifically and capture
  const card = await page.$('.closingSoonCard3D');
  if (card) {
    await card.screenshot({
      path: path.join(artifactDir, 'verif_86_closing_card_100vw_sin_redes.png')
    });
    console.log('Saved verif_86_closing_card_100vw_sin_redes.png');
  }

  // Scroll to Sorteos Activos / Tendencias
  const fullMarket = await page.$('.marketSection.fullMarket');
  if (fullMarket) {
    await fullMarket.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    await fullMarket.screenshot({
      path: path.join(artifactDir, 'verif_87_sorteos_activos_titulos_cortos.png')
    });
    console.log('Saved verif_87_sorteos_activos_titulos_cortos.png');
  }

  // Scroll to Feed Comercios
  const news = await page.$('#novedades-locales');
  if (news) {
    await news.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    await news.screenshot({
      path: path.join(artifactDir, 'verif_88_feed_comercios_sin_redes.png')
    });
    console.log('Saved verif_88_feed_comercios_sin_redes.png');
  }

  await browser.close();
  console.log('All screenshots completed successfully!');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
