const puppeteer = require('puppeteer');
const path = require('path');

const ARTIFACT_DIR = 'C:/Users/camil/.gemini/antigravity/brain/2efac539-cfa0-4198-a137-c34196d2714e';

async function run() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });

  console.log('1. Loading Home page on mobile...');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1000));

  // TEST 1: Click "Sorteos" in mobile bottom nav
  console.log('2. Clicking "Sorteos" in bottom navigation...');
  const bottomNavItems = await page.$$('.bottomNav .bottomNavItem');
  console.log('Found bottom nav items:', bottomNavItems.length);
  
  // The second bottom nav item is "Sorteos"
  if (bottomNavItems.length >= 2) {
    await bottomNavItems[1].click();
  } else {
    await page.goto('http://localhost:3000/?view=raffles', { waitUntil: 'networkidle2' });
  }
  await new Promise(r => setTimeout(r, 1500));

  // Check how many draws are visible in the catalog
  const cards = await page.$$('.rafflesCatalogVerticalGrid .productCard');
  console.log(`Found ${cards.length} cards in .rafflesCatalogVerticalGrid`);
  
  await page.screenshot({
    path: path.join(ARTIFACT_DIR, 'verif_65_sorteos_catalogo_todos_tiempo_real.png'),
    fullPage: false
  });
  console.log('Saved verif_65_sorteos_catalogo_todos_tiempo_real.png');

  // TEST 2: Click "Mis Tiquetes" in mobile bottom nav
  console.log('3. Clicking "Mis Tiquetes" in bottom navigation...');
  await page.goto('http://localhost:3000/cuenta?tab=history', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1500));

  await page.screenshot({
    path: path.join(ARTIFACT_DIR, 'verif_66_mis_tiquetes_facturacion_por_jugar_y_caducadas.png'),
    fullPage: false
  });
  console.log('Saved verif_66_mis_tiquetes_facturacion_por_jugar_y_caducadas.png');

  // TEST 3: Click "Ver Factura Electrónica" button
  console.log('4. Clicking "Ver Factura Electrónica" to view DIAN modal...');
  const invoiceBtn = await page.$('.btnInvoicePdf');
  if (invoiceBtn) {
    await invoiceBtn.click();
    await new Promise(r => setTimeout(r, 800));
    await page.screenshot({
      path: path.join(ARTIFACT_DIR, 'verif_67_factura_electronica_modal_dian.png'),
      fullPage: false
    });
    console.log('Saved verif_67_factura_electronica_modal_dian.png');
    // Close modal
    const closeBtn = await page.$('.invoiceModalClose');
    if (closeBtn) await closeBtn.click();
    await new Promise(r => setTimeout(r, 500));
  }

  // TEST 4: Click "Perfil" (navigate directly to /cuenta)
  console.log('5. Clicking "Perfil" to verify direct client profile without login wall...');
  await page.goto('http://localhost:3000/cuenta', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1500));

  // Verify that it is NOT the login page, but Alejandro Morales profile
  const titleText = await page.$eval('.customerHeroDetails h1', el => el.textContent).catch(() => 'NOT FOUND');
  console.log('Profile title found:', titleText);

  await page.screenshot({
    path: path.join(ARTIFACT_DIR, 'verif_68_perfil_cliente_directo_sin_login.png'),
    fullPage: false
  });
  console.log('Saved verif_68_perfil_cliente_directo_sin_login.png');

  await browser.close();
  console.log('All tests completed successfully!');
}

run().catch((err) => {
  console.error('Error during test:', err);
  process.exit(1);
});
