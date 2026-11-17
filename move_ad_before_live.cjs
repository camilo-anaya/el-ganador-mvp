const fs = require('fs');
const path = require('path');

const pageFile = path.join(__dirname, 'app', 'page.tsx');
let code = fs.readFileSync(pageFile, 'utf8');

// 1. Extract multipleLiveRoomsSection
const liveRoomsStart = '{/* SECCIÓN HERO: MÚLTIPLES SALAS DE SORTEO EN VIVO TRANSMITIENDO SIMULTÁNEAMENTE */}';
const liveRoomsEndTarget = '{/* SECCIÓN 1: A PUNTO DE COMENZAR';

const startIdx = code.indexOf(liveRoomsStart);
const endIdx = code.indexOf(liveRoomsEndTarget);

if (startIdx === -1 || endIdx === -1) {
  console.error("Could not find live rooms indices", { startIdx, endIdx });
  process.exit(1);
}

const liveRoomsSectionCode = code.substring(startIdx, endIdx).trim();

// Remove live rooms from its initial top position
code = code.substring(0, startIdx) + code.substring(endIdx);

// Now find where adShowcaseSection ends
const adShowcaseEndTarget = '</section>\n          )}';
// Let's locate adShowcaseSection
const adShowcaseIndex = code.indexOf('id="pasarela-publicidad"');
if (adShowcaseIndex === -1) {
  console.error("Could not find pasarela-publicidad");
  process.exit(1);
}

const closeSectionIndex = code.indexOf('</section>\n          )}', adShowcaseIndex);
if (closeSectionIndex === -1) {
  console.error("Could not find closing tag of adShowcaseSection");
  process.exit(1);
}

const insertionPoint = closeSectionIndex + '</section>\n          )}'.length;

// Prepare the updated liveRoomsSectionCode with clean title
const updatedLiveRoomsSectionCode = liveRoomsSectionCode
  .replace('Salas de Sorteo que Están Rifando Ahora', 'Salas de Sorteo en Vivo')
  .replace('<section className="multipleLiveRoomsSection">', '<section className="multipleLiveRoomsSection" id="salas-sorteo-en-vivo">');

// Insert live rooms immediately after adShowcaseSection
code = code.substring(0, insertionPoint) + '\n\n          ' + updatedLiveRoomsSectionCode + code.substring(insertionPoint);

fs.writeFileSync(pageFile, code, 'utf8');
console.log("Successfully placed Pasarela de Publicidad right BEFORE Salas de Sorteo en Vivo!");
