const fs = require('fs');
const lines = fs.readFileSync('app/page.tsx', 'utf8').split('\n');
lines.forEach((l, i) => {
  if (l.includes('setCurrentUser') || l.includes('currentUser') && l.includes('useState')) {
    console.log(`${i+1}: ${l.trim()}`);
  }
});
