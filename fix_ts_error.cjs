const fs = require('fs');
const path = require('path');

const pageFile = path.join(__dirname, 'app', 'page.tsx');
let code = fs.readFileSync(pageFile, 'utf8');

code = code.replace(
  'if (sp.targetAdmin) openBusiness(sp.targetAdmin);',
  'if ((sp as any).targetAdmin) openBusiness((sp as any).targetAdmin);'
);

fs.writeFileSync(pageFile, code, 'utf8');
console.log("Fixed targetAdmin type casting");
