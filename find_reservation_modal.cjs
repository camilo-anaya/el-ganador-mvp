const fs = require('fs');
const lines = fs.readFileSync('app/page.tsx', 'utf8').split('\n');

lines.forEach((l, i) => {
  if (l.includes('reservationModal') || l.includes('selectedDraw &&')) {
    console.log(`${i+1}: ${l.trim()}`);
  }
});
