const fs = require('fs');
const path = require('path');

const pageFile = path.join(__dirname, 'app', 'page.tsx');
const code = fs.readFileSync(pageFile, 'utf8');

const markers = [
  'howItWorksBanner',
  'closingSoonSection3D',
  'NewsFeed',
  'pasarela-publicidad',
  'salas-sorteo-en-vivo',
  'marketSection fullMarket',
  'sponsorPasarelaSection',
  'enginePromo',
  'bizServicesSection'
];

markers.forEach(m => {
  const idx = code.indexOf(m);
  console.log(`${m.padEnd(25)}: index ${idx}`);
});
