const fs = require('fs');
const path = require('path');

function search(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (!['node_modules', '.next', '.git'].includes(e.name)) search(full);
    } else if (/\.(tsx|ts|js|jsx)$/.test(e.name)) {
      const content = fs.readFileSync(full, 'utf8');
      const lines = content.split('\n');
      lines.forEach((l, idx) => {
        if (l.includes('redirect(') || l.includes('window.location') || l.includes('router.push')) {
          console.log(`${full}:${idx+1}: ${l.trim()}`);
        }
      });
    }
  }
}

search('app');
if (fs.existsSync('middleware.ts')) {
  console.log('middleware.ts:', fs.readFileSync('middleware.ts', 'utf8'));
}
