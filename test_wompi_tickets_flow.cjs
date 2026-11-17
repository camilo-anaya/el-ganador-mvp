const http = require('http');

http.get('http://localhost:3000/api/draws', (res) => {
  let buf = '';
  res.on('data', d => buf += d);
  res.on('end', () => {
    const draws = JSON.parse(buf).draws;
    console.log('Available draws:', draws.map(d => ({ id: d.id, title: d.title, available: d.available })));
    const target = draws.find(d => d.available > 0);
    if (!target) return;

    // Get an available ticket
    http.get(`http://localhost:3000/api/draws/${target.id}/tickets`, (tres) => {
      let tbuf = '';
      tres.on('data', d => tbuf += d);
      tres.on('end', () => {
        const tickets = JSON.parse(tbuf).tickets;
        const availTicket = tickets.find(t => t.status === 'available');
        console.log('Target draw:', target.id, 'Available ticket:', availTicket?.number);

        if (!availTicket) return;

        // 1. Create participation
        const partReq = http.request('http://localhost:3000/api/participations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        }, (pres) => {
          let pbuf = '';
          pres.on('data', d => pbuf += d);
          pres.on('end', () => {
            console.log('Participation response:', pres.statusCode, pbuf);
            const pdata = JSON.parse(pbuf);
            if (pdata.reservation) {
              // 2. Call /api/payments/tickets
              const payReq = http.request('http://localhost:3000/api/payments/tickets', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
              }, (wres) => {
                let wbuf = '';
                wres.on('data', d => wbuf += d);
                wres.on('end', () => {
                  console.log('Wompi Ticket Payment response:', wres.statusCode, wbuf);
                });
              });
              payReq.write(JSON.stringify({ participationId: pdata.reservation.id, simulate: true }));
              payReq.end();
            }
          });
        });
        partReq.write(JSON.stringify({
          drawId: target.id,
          buyerName: 'Alejandro Morales',
          buyerEmail: 'cliente@elganador.com',
          ticketNumbers: [availTicket.number]
        }));
        partReq.end();
      });
    });
  });
});
