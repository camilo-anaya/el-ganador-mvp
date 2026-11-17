const fs = require('fs');
const lines = fs.readFileSync('app/page.tsx', 'utf8').split('\n');
lines.forEach((l, i) => {
  if (l.includes('+ Subir') || l.includes('openPublishModal') || l.includes('handleBuy') || l.includes('setScreen("publish")')) {
    console.log(`${i+1}: ${l.trim()}`);
  }
});
