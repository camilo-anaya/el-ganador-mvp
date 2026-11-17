const fs = require('fs');
const path = require('path');

const content = fs.readFileSync(path.join(__dirname, 'app', 'page.tsx'), 'utf8');
const lines = content.split('\n');

lines.forEach((line, idx) => {
  if (line.includes('Apartar')) {
    console.log(`L${idx + 1}: ${line.trim()}`);
  }
});
