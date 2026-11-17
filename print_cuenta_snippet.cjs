const fs = require('fs');
const lines = fs.readFileSync('app/cuenta/page.tsx', 'utf8').split('\n');
console.log('--- Lines 534 to 615 ---');
for (let i = 534; i < 615; i++) console.log(`${i+1}: ${lines[i]}`);

console.log('--- Lines 650 to 715 ---');
for (let i = 650; i < 715; i++) console.log(`${i+1}: ${lines[i]}`);
