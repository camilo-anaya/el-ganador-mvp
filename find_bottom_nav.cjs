const fs = require('fs');
const lines = fs.readFileSync('app/page.tsx', 'utf8').split('\n');
lines.forEach((l, i) => {
  if (l.includes('bottomNav') || (l.includes('Perfil') && l.includes('button')) || l.includes('setScreen("account")') || l.includes('href="/cuenta"')) {
    console.log(`${i+1}: ${l.trim()}`);
  }
});
