const fs = require('fs');
const path = require('path');

function search(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (!['node_modules', '.next', '.git'].includes(e.name)) search(full);
    } else if (/\.(tsx|ts|js|jsx|env.*|json)$/.test(e.name)) {
      const content = fs.readFileSync(full, 'utf8');
      if (/wompi/i.test(content)) {
        console.log(`Found WOMPI in: ${full}`);
      }
    }
  }
}

search('.');
