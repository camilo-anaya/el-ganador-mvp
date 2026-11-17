const fs = require('fs');
const path = require('path');

function searchDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules' && entry.name !== '.next' && entry.name !== '.git') {
        searchDir(fullPath);
      }
    } else if (/\.(tsx|ts|js|jsx|css|json)$/i.test(entry.name)) {
      const content = fs.readFileSync(fullPath, 'utf8');
      const matches = content.match(/whatsapp|facebook|instagram|comentari|hashtag|ver\s+los\s+\d+|andres_s/gi);
      if (matches) {
        console.log(`[FOUND in ${fullPath}]:`, Array.from(new Set(matches)));
      }
    }
  }
}

searchDir('app');
searchDir('components');
