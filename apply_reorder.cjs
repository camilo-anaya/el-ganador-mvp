const fs = require('fs');

const file = 'app/page.tsx';
const original = fs.readFileSync(file, 'utf8');

// Backup
fs.writeFileSync(file + '.bak', original);

// 1. Match blocks
const howItWorksRegex = /\{\/\* GUÍA DE 4 PASOS DIRECTA EN LA PÁGINA PRINCIPAL \*\/\}[\s\S]*?<\/section>\s*\)\}/;
const adShowcaseRegex = /\{\/\* PASARELA DE PUBLICIDAD OFICIAL & ANUNCIOS DE PATROCINADORES \*\/\}[\s\S]*?<\/section>\s*\)\}/;
const liveRoomsRegex = /\{\/\* SECCIÓN HERO: MÚLTIPLES SALAS DE SORTEO EN VIVO TRANSMITIENDO SIMULTÁNEAMENTE \*\/\}[\s\S]*?<\/section>\s*\)\}/;
const closingRegex = /\{\/\* SECCIÓN 1: A PUNTO DE COMENZAR[\s\S]*?<\/section>\s*\)\}/;
const newsFeedRegex = /\{\/\* SECCIÓN 2: FEED DE COMERCIOS \(PUBLICACIONES Y FOTOS VOLTEABLES DE EMPRESARIOS\) \*\/\}[\s\S]*?\{view === "home" && <NewsFeed onBusiness=\{openBusiness\} onOpenPublish=\{\(tab\) => openPublishModal\(tab \|\| "raffle"\)\} \/>\}/;

const howItWorksBlock = original.match(howItWorksRegex)[0];
const adShowcaseBlock = original.match(adShowcaseRegex)[0];
const liveRoomsBlock = original.match(liveRoomsRegex)[0];
const closingBlock = original.match(closingRegex)[0];
const newsFeedBlock = original.match(newsFeedRegex)[0];

// Step 1: Remove howItWorksBlock from top
let step1 = original.replace(howItWorksRegex, '');

// Step 2: In step1, find the region from `{view !== "business" && view !== "subscriptions" && <>`
// up to `{/* PASARELA DE FOTOS Y EMPRESAS PATROCINADORAS EN EL FEED */}`
const targetRegionRegex = /\{view !== "business" && view !== "subscriptions" && <>[\s\S]*?\{\/\* PASARELA DE FOTOS Y EMPRESAS PATROCINADORAS EN EL FEED \*\/\}/;

const targetMatch = step1.match(targetRegionRegex);
if (!targetMatch) {
  console.error('Could not find targetRegion');
  process.exit(1);
}

const newRegion = `{view !== "business" && view !== "subscriptions" && <>
          {/* 1. PASARELA DE PUBLICIDAD OFICIAL & ANUNCIOS DE PATROCINADORES (DE PRIMERO) */}
          ${adShowcaseBlock}

          {/* 2. SECCIÓN HERO: MÚLTIPLES SALAS DE SORTEO EN VIVO (JUSTO DEBAJO DE LA PUBLICIDAD) */}
          ${liveRoomsBlock}

          {/* 3. A PUNTO DE COMENZAR (COMPRA DE ÚLTIMA HORA 1H A 3H ANTES) */}
          ${closingBlock}

          {/* 4. FEED DE COMERCIOS (PUBLICACIONES Y FOTOS VOLTEABLES DE EMPRESARIOS) */}
          ${newsFeedBlock}

          {/* 5. GUÍA DE 4 PASOS PARA PARTICIPAR */}
          ${howItWorksBlock}

          {/* PASARELA DE FOTOS Y EMPRESAS PATROCINADORAS EN EL FEED */}`;

const updated = step1.replace(targetRegionRegex, newRegion);

fs.writeFileSync(file, updated, 'utf8');
console.log('Successfully reordered sections in app/page.tsx!');
