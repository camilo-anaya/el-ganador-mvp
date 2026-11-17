const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  try {
    const list = fs.readdirSync(dir);
    for (const file of list) {
      if (file === 'node_modules' || file === '.next' || file === '.git') continue;
      const full = path.join(dir, file);
      const stat = fs.statSync(full);
      if (stat.isDirectory()) {
        results = results.concat(walk(full));
      } else if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.json') || file.endsWith('.js')) {
        results.push(full);
      }
    }
  } catch (e) {}
  return results;
}

const files = walk('.');
for (const f of files) {
  const content = fs.readFileSync(f, 'utf8');
  if (content.includes('Motos Caribe') || content.includes('Ruleta 3D en Vivo')) {
    console.log('MATCH in:', f);
  }
}
