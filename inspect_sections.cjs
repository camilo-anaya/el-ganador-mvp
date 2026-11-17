const fs = require('fs');
const lines = fs.readFileSync('app/page.tsx', 'utf8').split('\n');
lines.forEach((l, idx) => {
  if (l.includes('<section') || l.includes('id="a-punto-de-comenzar"') || l.includes('id="salas-sorteo-en-vivo"') || l.includes('id="pasarela-publicidad"') || l.includes('id="novedades-locales"') || l.includes('id="proximos-sorteos"') || l.includes('id="marcas-patrocinadoras"') || l.includes('multipleLiveRoomsSection') || l.includes('adShowcaseSection')) {
    console.log(idx + 1, l.trim());
  }
});
