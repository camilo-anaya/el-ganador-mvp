const https = require('https');

https.get('https://retailers-hats-kits-amino.trycloudflare.com/', (res) => {
  console.log('Tunnel Response Status:', res.statusCode);
}).on('error', (err) => {
  console.error('Tunnel Error:', err.message);
});
