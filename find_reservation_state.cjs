const fs = require('fs');
const lines = fs.readFileSync('app/page.tsx', 'utf8').split('\n');

lines.forEach((l, i) => {
  if (l.includes('const [reservation, setReservation]') || l.includes('setReservation')) {
    console.log(`${i+1}: ${l.trim()}`);
  }
});
