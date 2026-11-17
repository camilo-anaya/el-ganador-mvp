const fs = require('fs');
const lines = fs.readFileSync('app/page.tsx', 'utf8').split('\n');
lines.forEach((l, i) => {
  if (i > 2820 && i < 3050 && (l.includes('window.location') || l.includes('router') || l.includes('ingreso') || l.includes('/cuenta'))) {
    console.log(`${i+1}: ${l.trim()}`);
  }
});
