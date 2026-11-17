const fs = require('fs');
const css = fs.readFileSync('app/cuenta/page.css', 'utf8');
const lines = css.split('\n');
console.log('Total lines in page.css:', lines.length);

lines.forEach((l, i) => {
  if (l.includes('.portalHeader') || l.includes('.customerHeroCard') || l.includes('.customerTabsBar') || l.includes('@media (max-width')) {
    console.log(`${i+1}: ${l.trim()}`);
  }
});
