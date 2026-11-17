const fs = require('fs');
const lines = fs.readFileSync('app/cuenta/page.tsx', 'utf8').split('\n');

lines.forEach((l, i) => {
  if (l.includes('header') || l.includes('Volver al Marketplace') || l.includes('Subir foto') || l.includes('Fotografía de Perfil') || l.includes('Cambiar Perfil') || l.includes('Cerrar Sesión') || l.includes('input type="file"') || l.includes('isBusiness') || l.includes('activeTab')) {
    console.log(`${i+1}: ${l.trim()}`);
  }
});
