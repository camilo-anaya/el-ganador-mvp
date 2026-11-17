const fs = require('fs');
const lines = fs.readFileSync('app/page.tsx', 'utf8').split('\n');
console.log('--- Lines 2700 to 2760 in app/page.tsx ---');
for (let i = 2700; i < 2760; i++) console.log(`${i+1}: ${lines[i]}`);
