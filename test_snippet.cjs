const http = require('http');

http.get('http://localhost:3000', (res) => {
  let data = '';
  res.on('data', (c) => data += c);
  res.on('end', () => {
    const idx = data.indexOf('Apartar');
    console.log('Apartar index:', idx);
    if (idx !== -1) {
      console.log('Snippet:', data.substring(idx - 40, idx + 80));
    }
  });
});
