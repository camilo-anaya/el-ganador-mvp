const fs = require('fs');
const content = fs.readFileSync('app/page.tsx', 'utf8');

const s1 = content.indexOf('{/* GUÍA DE 4 PASOS DIRECTA EN LA PÁGINA PRINCIPAL */}');
console.log('s1 index:', s1);

const s2 = content.indexOf('{/* SECCIÓN 1: A PUNTO DE COMENZAR');
console.log('s2 index:', s2);

const s3 = content.indexOf('{/* SECCIÓN 2: FEED DE COMERCIOS');
console.log('s3 index:', s3);

const s4 = content.indexOf('{/* PASARELA DE PUBLICIDAD OFICIAL & ANUNCIOS DE PATROCINADORES */}');
console.log('s4 index:', s4);

const s5 = content.indexOf('{/* SECCIÓN HERO: MÚLTIPLES SALAS DE SORTEO EN VIVO');
console.log('s5 index:', s5);

const s6 = content.indexOf('{/* PASARELA DE FOTOS Y EMPRESAS PATROCINADORAS EN EL FEED */}');
console.log('s6 index:', s6);
