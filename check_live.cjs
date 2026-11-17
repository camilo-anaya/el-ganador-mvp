const http = require('http');

http.get('http://localhost:3000', (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log('STATUS:', res.statusCode);
    console.log('Has WhatsApp:', data.includes('WhatsApp'));
    console.log('Has Facebook:', data.includes('Facebook'));
    console.log('Has Instagram:', data.includes('Instagram'));
    console.log('Has Ver los 2 comentarios:', data.includes('Ver los 2 comentarios'));
    console.log('Has #ElGanador:', data.includes('#ElGanador'));
    console.log('Has Proximos Sorteos:', data.includes('Próximos Sorteos'));
    console.log('Has Feed Comercios:', data.includes('Feed Comercios'));
    console.log('Has Apartar Número:', data.includes('Apartar Número'));
  });
}).on('error', (err) => {
  console.error('Error:', err.message);
});
