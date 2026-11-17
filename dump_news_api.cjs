const http = require('http');

http.get('http://localhost:3000/api/news', (res) => {
  let data = '';
  res.on('data', c => data += c);
  res.on('end', () => {
    const json = JSON.parse(data);
    console.log('Posts count:', json.posts?.length);
    json.posts?.forEach((p, idx) => {
      console.log(`Post ${idx}:`, p.business_name, 'images:', p.images?.length, p.images);
    });
  });
});
