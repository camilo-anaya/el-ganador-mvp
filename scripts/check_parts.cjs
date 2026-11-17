const { query } = require('../lib/db');
(async () => {
  const res = await query('SELECT count(*) as total, buyer_email FROM participations GROUP BY buyer_email');
  console.log(res.rows);
  process.exit(0);
})();
