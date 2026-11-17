const fs = require('fs');
const lines = fs.readFileSync('lib/db.ts', 'utf8').split('\n');

lines.forEach((l, i) => {
  if (l.includes('CREATE TABLE') && (l.includes('participations') || l.includes('tickets') || l.includes('plan_payments'))) {
    console.log(`${i+1}: ${l.trim()}`);
  }
});
