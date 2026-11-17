const fs = require('fs');
const path = require('path');

const pageFile = path.join(__dirname, 'app', 'page.tsx');
let page = fs.readFileSync(pageFile, 'utf8');

// 1. Quitar el NewsFeed de la línea 1925
const newsCall = '{view === "home" && <NewsFeed onBusiness={openBusiness} onOpenPublish={(tab) => openPublishModal(tab || "raffle")} />}';
page = page.replace(newsCall, '');

// 2. Quitar la sección duplicada upcomingSection3D (líneas 1964 a 2032)
const upcomingStart = '{/* SECCIÓN 2: PRÓXIMOS SORTEOS (FECHAS PROGRAMADAS DE JUEGO) - MULTITRANSMISIÓN 3D PREMIUM */}';
const upcomingEnd = '{/* PASARELA DE FOTOS Y EMPRESAS PATROCINADORAS EN EL FEED */}';

const idxUpStart = page.indexOf(upcomingStart);
const idxUpEnd = page.indexOf(upcomingEnd);

if (idxUpStart !== -1 && idxUpEnd !== -1) {
  page = page.slice(0, idxUpStart) + page.slice(idxUpEnd);
  console.log("Sección redundante upcomingSection3D eliminada!");
}

// 3. Colocar NewsFeed inmediatamente después de closingSoonSection3D
const closingEndTag = '</section>\n          )}';
const posClosing = page.indexOf(closingEndTag);

if (posClosing !== -1) {
  const insertPos = posClosing + closingEndTag.length;
  page = page.slice(0, insertPos) + '\n\n          ' + newsCall + page.slice(insertPos);
  console.log("NewsFeed reubicado correctamente justo después de A Punto de Comenzar!");
}

fs.writeFileSync(pageFile, page, 'utf8');
console.log("page.tsx reordenado!");
