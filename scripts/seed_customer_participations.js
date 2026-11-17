const { DatabaseSync } = require('node:sqlite');
const { randomUUID } = require('node:crypto');

const db = new DatabaseSync('./data/el-ganador.sqlite');

const client = db.prepare("SELECT id, email, display_name FROM business_accounts WHERE email = 'cliente@elganador.com'").get();
if (!client) {
  console.error("No se encontró la cuenta cliente@elganador.com");
  process.exit(1);
}

console.log("Cliente encontrado:", client);

// Limpiar participaciones viejas de prueba para cliente@elganador.com
db.prepare("DELETE FROM participations WHERE buyer_account_id = ? OR lower(buyer_email) = 'cliente@elganador.com'").run(client.id);

// 1. Rifa Por Jugar: iPhone 18 Pro (3 boletas)
db.prepare(`
  INSERT INTO participations (
    id, draw_id, buyer_name, buyer_email, ticket_count, ticket_numbers, total_amount, status, created_at, expires_at, buyer_account_id
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`).run(
  'FAC-2026-004819',
  'RIF-2026-000184',
  client.display_name,
  client.email,
  3,
  JSON.stringify([412, 413, 414]),
  60000,
  'reserved', // En juego / activo
  new Date(Date.now() - 2 * 3600000).toISOString(),
  new Date(Date.now() + 86400000 * 7).toISOString(),
  client.id
);

// 2. Rifa Por Jugar: Yamaha XTZ (2 boletas)
db.prepare(`
  INSERT INTO participations (
    id, draw_id, buyer_name, buyer_email, ticket_count, ticket_numbers, total_amount, status, created_at, expires_at, buyer_account_id
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`).run(
  'FAC-2026-005021',
  'RIF-2026-000185',
  client.display_name,
  client.email,
  2,
  JSON.stringify([150, 151]),
  60000,
  'reserved', // En juego / activo
  new Date(Date.now() - 24 * 3600000).toISOString(),
  new Date(Date.now() + 86400000 * 10).toISOString(),
  client.id
);

// 3. Rifa Ya Caducada: PlayStation 5 (2 boletas)
db.prepare(`
  INSERT INTO participations (
    id, draw_id, buyer_name, buyer_email, ticket_count, ticket_numbers, total_amount, status, created_at, expires_at, buyer_account_id
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`).run(
  'FAC-2026-003810',
  'RIF-2026-000187',
  client.display_name,
  client.email,
  2,
  JSON.stringify([88, 89]),
  36000,
  'expired', // Ya caducada / finalizada
  new Date(Date.now() - 15 * 86400000).toISOString(),
  new Date(Date.now() - 10 * 86400000).toISOString(),
  client.id
);

// 4. Rifa Ya Caducada: Set de Joyería (1 boleta)
db.prepare(`
  INSERT INTO participations (
    id, draw_id, buyer_name, buyer_email, ticket_count, ticket_numbers, total_amount, status, created_at, expires_at, buyer_account_id
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`).run(
  'FAC-2026-003102',
  'RIF-2026-000186',
  client.display_name,
  client.email,
  1,
  JSON.stringify([42]),
  15000,
  'expired', // Ya caducada / finalizada
  new Date(Date.now() - 28 * 86400000).toISOString(),
  new Date(Date.now() - 21 * 86400000).toISOString(),
  client.id
);

console.log("Participaciones creadas con éxito!");
const rows = db.prepare("SELECT * FROM participations WHERE buyer_account_id = ?").all(client.id);
console.log("Total compras en BD para el cliente:", rows.length);
