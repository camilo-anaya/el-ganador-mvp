const fs = require('fs');
const lines = fs.readFileSync('app/page.tsx', 'utf8').split('\n');

lines.forEach((l, i) => {
  if (l.includes('type Reservation')) {
    console.log(`${i+1}: ${l.trim()}`);
    for (let j = i; j < i + 12; j++) console.log(`  ${j+1}: ${lines[j]}`);
  }
});
