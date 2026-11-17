const { query } = require('./lib/db');

async function test() {
  const d = await query('SELECT count(*) as c FROM draws');
  console.log('Draws count:', d.rows[0]);
  const p = await query('SELECT count(*) as c FROM participations');
  console.log('Participations count:', p.rows[0]);
}

test();
