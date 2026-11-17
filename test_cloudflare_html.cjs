const https = require('https');

https.get('https://retailers-hats-kits-amino.trycloudflare.com', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Status code:', res.statusCode);
    console.log('Includes "Ver los 2 comentarios":', data.includes('Ver los 2 comentarios'));
    console.log('Includes "btnFeedNav":', data.includes('btnFeedNav'));
    console.log('Includes "Compartir Link":', data.includes('Compartir Link'));
    console.log('Includes "whatsapp":', /whatsapp/i.test(data));
    console.log('Includes "instagram":', /instagram/i.test(data));
  });
}).on('error', err => {
  console.error('Error fetching tunnel:', err.message);
});
