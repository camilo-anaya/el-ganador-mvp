const fs = require('fs');
const lines = fs.readFileSync('app/page.tsx', 'utf8').split('\n');
for (let i = 1340; i < 1435; i++) {
  console.log(i + 1, lines[i]);
}
