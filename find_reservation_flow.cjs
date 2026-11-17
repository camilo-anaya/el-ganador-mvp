const fs = require('fs');
const lines = fs.readFileSync('app/page.tsx', 'utf8').split('\n');

lines.forEach((l, i) => {
  if (l.includes('/api/participations') || l.includes('handleReserve') || l.includes('handlePayment') || l.includes('confirmReservation') || l.includes('Pagar Seguro') || l.includes('Bancolombia') && l.includes('PSE')) {
    console.log(`${i+1}: ${l.trim()}`);
  }
});
