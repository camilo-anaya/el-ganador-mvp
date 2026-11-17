const { query } = require('../lib/db');

async function main() {
  const p = await query('SELECT * FROM participations');
  console.log('Participations count:', p.rows.length);
  console.log('Participations:', p.rows);

  const d = await query('SELECT id, title, admin, live, available, sold, scheduled_at FROM draws');
  console.log('Draws count:', d.rows.length);
  console.log('Draws:', d.rows);
}

main().catch(console.error);
