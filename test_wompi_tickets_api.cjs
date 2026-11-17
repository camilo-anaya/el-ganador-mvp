const http = require('http');

async function testApi() {
  // 1. Create a participation
  const partReq = http.request('http://localhost:3000/api/participations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, (res) => {
    let buf = '';
    res.on('data', d => buf += d);
    res.on('end', () => {
      console.log('Participation response:', res.statusCode, buf);
      const data = JSON.parse(buf);
      if (data.reservation) {
        // 2. Call /api/payments/tickets
        const payReq = http.request('http://localhost:3000/api/payments/tickets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        }, (res2) => {
          let buf2 = '';
          res2.on('data', d => buf2 += d);
          res2.on('end', () => {
            console.log('Ticket Payment response:', res2.statusCode, buf2);
          });
        });
        payReq.write(JSON.stringify({ participationId: data.reservation.id, simulate: true }));
        payReq.end();
      }
    });
  });

  partReq.write(JSON.stringify({
    drawId: 'draw-001',
    buyerName: 'Alejandro Morales',
    buyerEmail: 'cliente@elganador.com',
    ticketNumbers: [1]
  }));
  partReq.end();
}

testApi();
