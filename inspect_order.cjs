const fs = require('fs');
const lines = fs.readFileSync('app/page.tsx', 'utf8').split('\n');
console.log('--- Lines 1380 to 1425 ---');
for (let i = 1380; i < 1425; i++) console.log(i + 1, lines[i]);
console.log('--- Lines 1840 to 2200 ---');
for (let i = 1840; i < 2060; i++) console.log(i + 1, lines[i]);
