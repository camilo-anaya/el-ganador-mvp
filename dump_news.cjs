const { query } = require('./lib/db');

async function main() {
  const { rows } = await query('SELECT id, business_name, image_url, images_json FROM business_news JOIN business_accounts ON business_accounts.id = business_news.account_id LIMIT 10');
  console.log(JSON.stringify(rows, null, 2));
}

main().catch(console.error);
