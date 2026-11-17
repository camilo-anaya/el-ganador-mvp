const fs = require('fs');
const path = require('path');

const content = fs.readFileSync(path.join(__dirname, 'app', 'page.tsx'), 'utf8');
const lines = content.split('\n');

let insideBusiness = false;
lines.forEach((line, idx) => {
  if (line.includes('activeBusiness') && line.includes('{')) insideBusiness = true;
  if (insideBusiness) {
    if (line.includes('WhatsApp') || line.includes('Facebook') || line.includes('Instagram') || line.includes('redes') || line.includes('shareLinkBox')) {
      console.log(`L${idx + 1}: ${line.trim()}`);
    }
  }
  if (insideBusiness && line.includes('closeBusiness')) insideBusiness = false;
});
