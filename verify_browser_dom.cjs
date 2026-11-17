const { chromium } = require('playwright');
const path = require('path');

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1',
    deviceScaleFactor: 2
  });
  const page = await context.newPage();
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);

  const textContent = await page.innerText('body');
  console.log('DOM has Apartar Número:', textContent.includes('Apartar Número'));
  console.log('DOM has Ver los 2 comentarios:', textContent.includes('Ver los 2 comentarios'));
  console.log('DOM has #ElGanador:', textContent.includes('#ElGanador'));
  console.log('DOM has WhatsApp:', textContent.includes('WhatsApp'));
  console.log('DOM has Facebook:', textContent.includes('Facebook'));
  console.log('DOM has Instagram:', textContent.includes('Instagram'));

  // Let's capture the full page or specific sections to verify
  const artifactDir = 'C:\\Users\\camil\\.gemini\\antigravity\\brain\\2efac539-cfa0-4198-a137-c34196d2714e';

  // 1. Screenshot of the Closing Soon section
  const closingSection = await page.$('.closingSoonSection3D');
  if (closingSection) {
    await closingSection.screenshot({
      path: path.join(artifactDir, 'verif_93_closing_section_final.png')
    });
    console.log('Captured verif_93_closing_section_final.png');
  }

  // 2. Screenshot of the News Feed section
  const newsSection = await page.$('#novedades-locales');
  if (newsSection) {
    await newsSection.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    await newsSection.screenshot({
      path: path.join(artifactDir, 'verif_94_feed_comercios_final.png')
    });
    console.log('Captured verif_94_feed_comercios_final.png');
  }

  // 3. Screenshot of Proximos Sorteos section
  const proximosSection = await page.$('.marketSection.fullMarket');
  if (proximosSection) {
    await proximosSection.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    await proximosSection.screenshot({
      path: path.join(artifactDir, 'verif_95_proximos_sorteos_final.png')
    });
    console.log('Captured verif_95_proximos_sorteos_final.png');
  }

  await browser.close();
}

run().catch(console.error);
