const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'app', 'page.tsx');
const content = fs.readFileSync(file, 'utf8');

const lines = content.split('\n');
console.log('Total lines:', lines.length);

lines.forEach((line, idx) => {
  if (line.toLowerCase().includes('whatsapp') || line.toLowerCase().includes('instagram') || line.toLowerCase().includes('facebook')) {
    console.log(`Line ${idx + 1}: ${line.trim()}`);
  }
});
