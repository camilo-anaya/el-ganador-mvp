const fs = require('fs');
const lines = fs.readFileSync('app/cuenta/page.tsx', 'utf8').split('\n');
lines.forEach((l, i) => {
  if (l.includes('handleImageUpload') || l.includes('uploadFileInputHidden') || l.includes('Subir foto') || l.includes('type="file"')) {
    console.log(`${i+1}: ${l.trim()}`);
  }
});
