const fs = require('fs');
const lines = fs.readFileSync('app/page.tsx', 'utf8').split('\n');
lines.forEach((l, i) => {
  if (l.includes('href="#') || l.includes('scrollIntoView')) {
    console.log(`${i+1}: ${l.trim()}`);
  }
});
