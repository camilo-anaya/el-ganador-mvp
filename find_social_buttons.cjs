const fs = require('fs');
const path = require('path');

function searchAll(dir) {
  const files = fs.readdirSync(dir, { withFileTypes: true });
  for (const f of files) {
    const full = path.join(dir, f.name);
    if (f.isDirectory()) {
      if (!['node_modules', '.next', '.git'].includes(f.name)) searchAll(full);
    } else if (/\.(tsx|ts|js|jsx|css|json|html)$/.test(f.name)) {
      const content = fs.readFileSync(full, 'utf8');
      if (content.includes('WhatsApp') && content.includes('Facebook') && content.includes('Instagram')) {
        console.log('MATCH IN:', full);
      }
    }
  }
}

searchAll('.');
