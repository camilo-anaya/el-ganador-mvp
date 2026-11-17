const fs = require('fs');
const css = fs.readFileSync('app/globals.css', 'utf8');
const lines = css.split('\n');
lines.forEach((l, i) => {
  if (l.includes('.portalHeader')) {
    console.log(`${i+1}: ${l.trim()}`);
  }
});
