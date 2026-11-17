const fs = require('fs');

const lines = fs.readFileSync('app/page.tsx', 'utf8').split('\n');
lines.forEach((line, idx) => {
  if (/WhatsApp|Facebook|Instagram|andres_s|hashtag|comentario/i.test(line)) {
    console.log(`L${idx + 1}: ${line.trim()}`);
  }
});
