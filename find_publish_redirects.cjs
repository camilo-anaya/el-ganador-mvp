const fs = require('fs');
const lines = fs.readFileSync('app/page.tsx', 'utf8').split('\n');
lines.forEach((l, i) => {
  if (i > 3950 && i < 4300 && (l.includes('router') || l.includes('window.location') || l.includes('ingreso') || l.includes('fetch'))) {
    console.log(`${i+1}: ${l.trim()}`);
  }
});
