const fs = require('fs');
const lines = fs.readFileSync('app/page.tsx', 'utf8').split('\n');
lines.forEach((l, i) => {
  if (l.includes('/ingreso') || l.includes('/login') || l.includes('Ingresar') || l.includes('Crear Cuenta')) {
    console.log(`${i+1}: ${l.trim()}`);
  }
});
