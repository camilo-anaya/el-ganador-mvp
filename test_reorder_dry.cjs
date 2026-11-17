const fs = require('fs');

const original = fs.readFileSync('app/page.tsx', 'utf8');

// 1. Extract howItWorksBanner block
const howItWorksRegex = /\{\/\* GUÍA DE 4 PASOS DIRECTA EN LA PÁGINA PRINCIPAL \*\/\}[\s\S]*?<\/section>\s*\)\}/;
const howMatch = original.match(howItWorksRegex);
if (!howMatch) {
  console.error('Could not find howItWorksBanner');
  process.exit(1);
}
const howItWorksBlock = howMatch[0];
console.log('Found howItWorksBlock, length:', howItWorksBlock.length);

// 2. Extract adShowcaseSection block
const adShowcaseRegex = /\{\/\* PASARELA DE PUBLICIDAD OFICIAL & ANUNCIOS DE PATROCINADORES \*\/\}[\s\S]*?<\/section>\s*\)\}/;
const adMatch = original.match(adShowcaseRegex);
if (!adMatch) {
  console.error('Could not find adShowcaseSection');
  process.exit(1);
}
const adShowcaseBlock = adMatch[0];
console.log('Found adShowcaseBlock, length:', adShowcaseBlock.length);

// 3. Extract multipleLiveRoomsSection block
const liveRoomsRegex = /\{\/\* SECCIÓN HERO: MÚLTIPLES SALAS DE SORTEO EN VIVO TRANSMITIENDO SIMULTÁNEAMENTE \*\/\}[\s\S]*?<\/section>\s*\)\}/;
const liveMatch = original.match(liveRoomsRegex);
if (!liveMatch) {
  console.error('Could not find multipleLiveRoomsSection');
  process.exit(1);
}
const liveRoomsBlock = liveMatch[0];
console.log('Found liveRoomsBlock, length:', liveRoomsBlock.length);

// 4. Extract closingSoonSection3D block
const closingRegex = /\{\/\* SECCIÓN 1: A PUNTO DE COMENZAR[\s\S]*?<\/section>\s*\)\}/;
const closingMatch = original.match(closingRegex);
if (!closingMatch) {
  console.error('Could not find closingSoonSection3D');
  process.exit(1);
}
const closingBlock = closingMatch[0];
console.log('Found closingBlock, length:', closingBlock.length);

// 5. Extract NewsFeed block
const newsFeedRegex = /\{\/\* SECCIÓN 2: FEED DE COMERCIOS \(PUBLICACIONES Y FOTOS VOLTEABLES DE EMPRESARIOS\) \*\/\}[\s\S]*?\{view === "home" && <NewsFeed onBusiness=\{openBusiness\} onOpenPublish=\{\(tab\) => openPublishModal\(tab \|\| "raffle"\)\} \/>\}/;
const newsMatch = original.match(newsFeedRegex);
if (!newsMatch) {
  console.error('Could not find NewsFeed block');
  process.exit(1);
}
const newsFeedBlock = newsMatch[0];
console.log('Found newsFeedBlock, length:', newsFeedBlock.length);

console.log('All blocks successfully matched!');
