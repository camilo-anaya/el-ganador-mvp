import { mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { Pool, type PoolClient, type QueryResultRow } from "pg";

declare global {
  // Keep one connection during Next.js development hot reloads.
  var elGanadorDb: DatabaseSync | undefined;
  var elGanadorTerritoryMigrationReady: boolean | undefined;
  var elGanadorPlanExpiryMigrationReady: boolean | undefined;
  // Reuse a small pool across Next.js requests and development hot reloads.
  var elGanadorPool: Pool | undefined;
}

export type DatabaseResult<T extends QueryResultRow = QueryResultRow> = { rows: T[]; rowCount: number };
export type DatabaseValue = string | number | bigint | null | Uint8Array;
export type DatabaseExecutor = { query<T extends QueryResultRow = QueryResultRow>(sql: string, values?: DatabaseValue[]): Promise<DatabaseResult<T>> };

function getPostgresPool() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("Configura DATABASE_URL para guardar los datos en Supabase.");
  if (!globalThis.elGanadorPool) {
    globalThis.elGanadorPool = new Pool({
      connectionString,
      max: Number(process.env.PG_POOL_SIZE ?? (process.env.VERCEL ? 2 : 5)),
      idleTimeoutMillis: 10_000,
      connectionTimeoutMillis: 8_000,
      statement_timeout: 15_000,
      allowExitOnIdle: true,
    });
    globalThis.elGanadorPool.on("error", (error) => console.error("Unexpected Supabase pool error", error));
  }
  return globalThis.elGanadorPool;
}

function localExecutor() {
  const db = getDatabase();
  return {
    async query<T extends QueryResultRow = QueryResultRow>(sql: string, values: DatabaseValue[] = []): Promise<DatabaseResult<T>> {
      const statement = db.prepare(sql.replace(/\$(\d+)/g, "?$1"));
      if (/^\s*(?:SELECT|WITH|PRAGMA)\b/i.test(sql) || /\bRETURNING\b/i.test(sql)) {
        const rows = statement.all(...values) as T[];
        return { rows, rowCount: rows.length };
      }
      const result = statement.run(...values);
      return { rows: [], rowCount: Number(result.changes) };
    },
  } satisfies DatabaseExecutor;
}

export async function query<T extends QueryResultRow = QueryResultRow>(sql: string, values: DatabaseValue[] = []): Promise<DatabaseResult<T>> {
  if (process.env.DATABASE_URL) {
    const result = await getPostgresPool().query<T>(sql, values as never[]);
    return { rows: result.rows, rowCount: result.rowCount ?? result.rows.length };
  }
  if (process.env.NODE_ENV === "production") throw new Error("Falta DATABASE_URL: la aplicación no guardará datos localmente en producción.");
  return localExecutor().query<T>(sql, values);
}

export async function withTransaction<T>(action: (executor: DatabaseExecutor) => Promise<T>): Promise<T> {
  if (process.env.DATABASE_URL) {
    const client = await getPostgresPool().connect();
    try {
      await client.query("BEGIN");
      await client.query("SET LOCAL statement_timeout = '10s'");
      const result = await action(postgresExecutor(client));
      await client.query("COMMIT");
      return result;
    } catch (error) {
      await client.query("ROLLBACK").catch(() => undefined);
      throw error;
    } finally {
      client.release();
    }
  }
  if (process.env.NODE_ENV === "production") throw new Error("Falta DATABASE_URL: la aplicación no guardará datos localmente en producción.");
  const db = getDatabase();
  db.exec("BEGIN IMMEDIATE");
  try {
    const result = await action(localExecutor());
    db.exec("COMMIT");
    return result;
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}

function postgresExecutor(client: PoolClient): DatabaseExecutor {
  return {
    async query<T extends QueryResultRow = QueryResultRow>(sql: string, values: DatabaseValue[] = []): Promise<DatabaseResult<T>> {
      const result = await client.query<T>(sql, values as never[]);
      return { rows: result.rows, rowCount: result.rowCount ?? result.rows.length };
    },
  };
}

const seedDraws = [
  { id: "RIF-2026-000184", title: "iPhone 18 Pro 256 GB", admin: "Tienda XYZ", category: "Tecnología", price: 20000, sold: 742, total: 1000, followers: 12482, live: 1, emoji: "📱", city: "Bogotá, Colombia", businessDescription: "Tienda de tecnología y accesorios. Este perfil pertenece al catálogo de demostración de EL GANADOR.", description: "iPhone 18 Pro con 256 GB de almacenamiento. La imagen y el premio son de muestra; las condiciones, fecha de entrega y reglamento se deben confirmar con el administrador antes de una rifa real." },
  { id: "RIF-2026-000185", title: "Yamaha XTZ", admin: "Motos Caribe", category: "Motos", price: 30000, sold: 634, total: 1000, followers: 8921, live: 0, emoji: "🏍️", city: "Barranquilla, Colombia", businessDescription: "Local de motocicletas y accesorios. Perfil y cifras de ejemplo para el prototipo.", description: "Motocicleta Yamaha XTZ. El modelo, año, color, documentación y forma de entrega se definirán en las condiciones oficiales del sorteo. Publicación de demostración." },
  { id: "RIF-2026-000186", title: "Set de joyería", admin: "Joyas ABC", category: "Joyería", price: 15000, sold: 381, total: 500, followers: 5310, live: 0, emoji: "💎", city: "Cartagena, Colombia", businessDescription: "Tienda de joyería. Perfil, seguidores y catálogo son datos de muestra.", description: "Set de joyería compuesto por varias piezas. Materiales, referencias y certificado deben especificarse en el reglamento antes de la publicación real." },
  { id: "RIF-2026-000187", title: "PlayStation 5", admin: "Game House", category: "Gaming", price: 18000, sold: 218, total: 500, followers: 3840, live: 0, emoji: "🎮", city: "Medellín, Colombia", businessDescription: "Local de videojuegos y consolas. Perfil de demostración.", description: "Consola PlayStation 5. La edición, los accesorios incluidos y la garantía deben confirmarse en las condiciones del sorteo." },
];

function createDatabase() {
  const filename = resolve(process.env.EL_GANADOR_DB_PATH ?? join(process.cwd(), "data", "el-ganador.sqlite"));
  mkdirSync(dirname(filename), { recursive: true });

  const db = new DatabaseSync(filename);
  db.exec("PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 5000; PRAGMA journal_mode = WAL;");
  db.exec(`
    CREATE TABLE IF NOT EXISTS draws (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      admin TEXT NOT NULL,
      category TEXT NOT NULL,
      unit_price INTEGER NOT NULL CHECK (unit_price > 0),
      total_tickets INTEGER NOT NULL CHECK (total_tickets > 0),
      followers INTEGER NOT NULL DEFAULT 0,
      live INTEGER NOT NULL DEFAULT 0,
      emoji TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      business_city TEXT NOT NULL DEFAULT 'Colombia',
      territory_scope TEXT NOT NULL DEFAULT 'unspecified',
      territory_department TEXT NOT NULL DEFAULT '',
      territory_municipality TEXT NOT NULL DEFAULT '',
      territory_municipalities TEXT NOT NULL DEFAULT '',
      territory_departments TEXT NOT NULL DEFAULT '',
      business_description TEXT NOT NULL DEFAULT '',
      business_followers INTEGER NOT NULL DEFAULT 0,
      category_details TEXT NOT NULL DEFAULT '{}',
      owner_id TEXT,
      product_value INTEGER NOT NULL DEFAULT 0,
      image_url TEXT NOT NULL DEFAULT '',
      published INTEGER NOT NULL DEFAULT 1,
      start_mode TEXT NOT NULL DEFAULT 'date',
      start_threshold INTEGER NOT NULL DEFAULT 100,
      scheduled_at TEXT,
      started_at TEXT,
      created_at TEXT NOT NULL DEFAULT '',
      published_at TEXT
    );
    CREATE TABLE IF NOT EXISTS participations (
      id TEXT PRIMARY KEY,
      draw_id TEXT NOT NULL REFERENCES draws(id),
      buyer_name TEXT NOT NULL,
      buyer_email TEXT NOT NULL,
      ticket_count INTEGER NOT NULL,
      ticket_numbers TEXT NOT NULL,
      total_amount INTEGER NOT NULL,
      status TEXT NOT NULL CHECK (status IN ('reserved', 'expired')),
      created_at TEXT NOT NULL,
      expires_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS tickets (
      draw_id TEXT NOT NULL REFERENCES draws(id),
      number INTEGER NOT NULL,
      status TEXT NOT NULL CHECK (status IN ('available', 'reserved', 'sold')),
      participation_id TEXT REFERENCES participations(id),
      hold_until TEXT,
      PRIMARY KEY (draw_id, number)
    );
    CREATE TABLE IF NOT EXISTS business_documents (
      id TEXT PRIMARY KEY,
      admin TEXT NOT NULL,
      account_id TEXT,
      document_type TEXT NOT NULL,
      file_name TEXT NOT NULL,
      mime_type TEXT NOT NULL,
      storage_path TEXT NOT NULL,
      review_status TEXT NOT NULL DEFAULT 'pending' CHECK (review_status IN ('pending', 'approved', 'rejected')),
      uploaded_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS business_accounts (
      id TEXT PRIMARY KEY,
      role TEXT NOT NULL CHECK (role IN ('business', 'customer')),
      display_name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE COLLATE NOCASE,
      password_salt TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      business_name TEXT NOT NULL DEFAULT '',
      business_city TEXT NOT NULL DEFAULT '',
      business_description TEXT NOT NULL DEFAULT '',
      category TEXT NOT NULL DEFAULT '',
      plan TEXT NOT NULL DEFAULT 'inicio',
      created_at TEXT NOT NULL,
      entity_type TEXT NOT NULL DEFAULT '',
      legal_name TEXT NOT NULL DEFAULT '',
      tax_id TEXT NOT NULL DEFAULT '',
      identity_number TEXT NOT NULL DEFAULT '',
      business_phone TEXT NOT NULL DEFAULT '',
      business_address TEXT NOT NULL DEFAULT '',
      business_photo_url TEXT NOT NULL DEFAULT '',
      account_status TEXT NOT NULL DEFAULT 'active',
      plan_expires_at TEXT
    );
    CREATE INDEX IF NOT EXISTS business_accounts_plan_expiry_idx ON business_accounts(plan_expires_at) WHERE plan_expires_at IS NOT NULL;
    CREATE TABLE IF NOT EXISTS business_sessions (
      token_hash TEXT PRIMARY KEY,
      account_id TEXT NOT NULL REFERENCES business_accounts(id) ON DELETE CASCADE,
      expires_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS business_sessions_account_idx ON business_sessions(account_id);
    CREATE INDEX IF NOT EXISTS business_sessions_expiry_idx ON business_sessions(expires_at);
    CREATE TABLE IF NOT EXISTS auth_attempts (
      email TEXT NOT NULL,
      attempted_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS auth_attempts_email_time_idx ON auth_attempts(email, attempted_at);
    CREATE TABLE IF NOT EXISTS business_news (
      id TEXT PRIMARY KEY,
      account_id TEXT NOT NULL REFERENCES business_accounts(id) ON DELETE CASCADE,
      content TEXT NOT NULL,
      image_url TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS business_news_account_created_idx ON business_news(account_id, created_at DESC);
    CREATE TABLE IF NOT EXISTS payment_events (
      id TEXT PRIMARY KEY,
      account_id TEXT NOT NULL REFERENCES business_accounts(id) ON DELETE CASCADE,
      event_type TEXT NOT NULL,
      description TEXT NOT NULL,
      amount INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS payment_events_account_created_idx ON payment_events(account_id, created_at DESC);
    CREATE TABLE IF NOT EXISTS plan_payments (
      id TEXT PRIMARY KEY,
      account_id TEXT NOT NULL REFERENCES business_accounts(id) ON DELETE CASCADE,
      plan_id TEXT NOT NULL,
      reference TEXT NOT NULL UNIQUE,
      wompi_transaction_id TEXT UNIQUE,
      amount_in_cents INTEGER NOT NULL,
      currency TEXT NOT NULL DEFAULT 'COP',
      status TEXT NOT NULL DEFAULT 'PENDING',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS plan_payments_account_idx ON plan_payments(account_id, created_at);
    CREATE INDEX IF NOT EXISTS participations_draw_idx ON participations(draw_id);
    CREATE INDEX IF NOT EXISTS tickets_draw_status_idx ON tickets(draw_id, status, number);
    CREATE INDEX IF NOT EXISTS tickets_participation_idx ON tickets(participation_id);
    CREATE INDEX IF NOT EXISTS tickets_hold_until_idx ON tickets(status, hold_until);
  `);

  const accountColumns = new Set((db.prepare("PRAGMA table_info(business_accounts)").all() as { name: string }[]).map((column) => column.name));
  if (!accountColumns.has("entity_type")) db.exec("ALTER TABLE business_accounts ADD COLUMN entity_type TEXT NOT NULL DEFAULT ''");
  if (!accountColumns.has("legal_name")) db.exec("ALTER TABLE business_accounts ADD COLUMN legal_name TEXT NOT NULL DEFAULT ''");
  if (!accountColumns.has("tax_id")) db.exec("ALTER TABLE business_accounts ADD COLUMN tax_id TEXT NOT NULL DEFAULT ''");
  if (!accountColumns.has("identity_number")) db.exec("ALTER TABLE business_accounts ADD COLUMN identity_number TEXT NOT NULL DEFAULT ''");
  if (!accountColumns.has("business_phone")) db.exec("ALTER TABLE business_accounts ADD COLUMN business_phone TEXT NOT NULL DEFAULT ''");
  if (!accountColumns.has("business_address")) db.exec("ALTER TABLE business_accounts ADD COLUMN business_address TEXT NOT NULL DEFAULT ''");
  if (!accountColumns.has("business_photo_url")) db.exec("ALTER TABLE business_accounts ADD COLUMN business_photo_url TEXT NOT NULL DEFAULT ''");
  if (!accountColumns.has("account_status")) db.exec("ALTER TABLE business_accounts ADD COLUMN account_status TEXT NOT NULL DEFAULT 'active'");
  if (!accountColumns.has("plan_expires_at")) db.exec("ALTER TABLE business_accounts ADD COLUMN plan_expires_at TEXT");
  const drawColumns = new Set((db.prepare("PRAGMA table_info(draws)").all() as { name: string }[]).map((column) => column.name));
  if (!drawColumns.has("description")) db.exec("ALTER TABLE draws ADD COLUMN description TEXT NOT NULL DEFAULT ''");
  if (!drawColumns.has("business_city")) db.exec("ALTER TABLE draws ADD COLUMN business_city TEXT NOT NULL DEFAULT 'Colombia'");
  if (!drawColumns.has("territory_scope")) db.exec("ALTER TABLE draws ADD COLUMN territory_scope TEXT NOT NULL DEFAULT 'unspecified'");
  if (!drawColumns.has("territory_department")) db.exec("ALTER TABLE draws ADD COLUMN territory_department TEXT NOT NULL DEFAULT ''");
  if (!drawColumns.has("territory_municipality")) db.exec("ALTER TABLE draws ADD COLUMN territory_municipality TEXT NOT NULL DEFAULT ''");
  if (!drawColumns.has("territory_municipalities")) db.exec("ALTER TABLE draws ADD COLUMN territory_municipalities TEXT NOT NULL DEFAULT ''");
  if (!drawColumns.has("territory_departments")) db.exec("ALTER TABLE draws ADD COLUMN territory_departments TEXT NOT NULL DEFAULT ''");
  if (!drawColumns.has("business_description")) db.exec("ALTER TABLE draws ADD COLUMN business_description TEXT NOT NULL DEFAULT ''");
  if (!drawColumns.has("business_followers")) db.exec("ALTER TABLE draws ADD COLUMN business_followers INTEGER NOT NULL DEFAULT 0");
  if (!drawColumns.has("category_details")) db.exec("ALTER TABLE draws ADD COLUMN category_details TEXT NOT NULL DEFAULT '{}'");
  if (!drawColumns.has("owner_id")) db.exec("ALTER TABLE draws ADD COLUMN owner_id TEXT");
  if (!drawColumns.has("product_value")) db.exec("ALTER TABLE draws ADD COLUMN product_value INTEGER NOT NULL DEFAULT 0");
  if (!drawColumns.has("image_url")) db.exec("ALTER TABLE draws ADD COLUMN image_url TEXT NOT NULL DEFAULT ''");
  if (!drawColumns.has("published")) db.exec("ALTER TABLE draws ADD COLUMN published INTEGER NOT NULL DEFAULT 1");
  if (!drawColumns.has("start_mode")) db.exec("ALTER TABLE draws ADD COLUMN start_mode TEXT NOT NULL DEFAULT 'date'");
  if (!drawColumns.has("start_threshold")) db.exec("ALTER TABLE draws ADD COLUMN start_threshold INTEGER NOT NULL DEFAULT 100");
  if (!drawColumns.has("scheduled_at")) db.exec("ALTER TABLE draws ADD COLUMN scheduled_at TEXT");
  if (!drawColumns.has("started_at")) db.exec("ALTER TABLE draws ADD COLUMN started_at TEXT");
  if (!drawColumns.has("created_at")) db.exec("ALTER TABLE draws ADD COLUMN created_at TEXT NOT NULL DEFAULT ''");
  if (!drawColumns.has("published_at")) db.exec("ALTER TABLE draws ADD COLUMN published_at TEXT");
  const participationColumns = new Set((db.prepare("PRAGMA table_info(participations)").all() as { name: string }[]).map((column) => column.name));
  if (!participationColumns.has("buyer_account_id")) db.exec("ALTER TABLE participations ADD COLUMN buyer_account_id TEXT");
  db.exec("CREATE INDEX IF NOT EXISTS participations_buyer_account_idx ON participations(buyer_account_id)");
  const documentColumns = new Set((db.prepare("PRAGMA table_info(business_documents)").all() as { name: string }[]).map((column) => column.name));
  if (!documentColumns.has("account_id")) db.exec("ALTER TABLE business_documents ADD COLUMN account_id TEXT");

  const drawCount = (db.prepare("SELECT COUNT(*) AS count FROM draws").get() as { count: number }).count;
  if (drawCount === 0) {
    const addDraw = db.prepare(`INSERT INTO draws
      (id, title, admin, category, unit_price, total_tickets, followers, live, emoji)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`);
    const addTicket = db.prepare("INSERT INTO tickets (draw_id, number, status) VALUES (?, ?, ?)");
    const addContent = db.prepare(`UPDATE draws SET description = ?, business_city = ?, business_description = ?, business_followers = ? WHERE id = ?`);

    db.exec("BEGIN IMMEDIATE");
    try {
      for (const draw of seedDraws) {
        addDraw.run(draw.id, draw.title, draw.admin, draw.category, draw.price, draw.total, draw.followers, draw.live, draw.emoji);
        addContent.run(draw.description, draw.city, draw.businessDescription, draw.followers, draw.id);
        for (let number = 1; number <= draw.total; number += 1) {
          addTicket.run(draw.id, number, number <= draw.sold ? "sold" : "available");
        }
      }
      db.exec("COMMIT");
    } catch (error) {
      db.exec("ROLLBACK");
      throw error;
    }
  }

  return db;
}

export function getDatabase() {
  if (!globalThis.elGanadorDb) globalThis.elGanadorDb = createDatabase();
  else if (!globalThis.elGanadorTerritoryMigrationReady) {
    const drawColumns = new Set((globalThis.elGanadorDb.prepare("PRAGMA table_info(draws)").all() as { name: string }[]).map((column) => column.name));
    if (!drawColumns.has("territory_scope")) globalThis.elGanadorDb.exec("ALTER TABLE draws ADD COLUMN territory_scope TEXT NOT NULL DEFAULT 'unspecified'");
    if (!drawColumns.has("territory_department")) globalThis.elGanadorDb.exec("ALTER TABLE draws ADD COLUMN territory_department TEXT NOT NULL DEFAULT ''");
    if (!drawColumns.has("territory_municipality")) globalThis.elGanadorDb.exec("ALTER TABLE draws ADD COLUMN territory_municipality TEXT NOT NULL DEFAULT ''");
    if (!drawColumns.has("territory_municipalities")) globalThis.elGanadorDb.exec("ALTER TABLE draws ADD COLUMN territory_municipalities TEXT NOT NULL DEFAULT ''");
    if (!drawColumns.has("territory_departments")) globalThis.elGanadorDb.exec("ALTER TABLE draws ADD COLUMN territory_departments TEXT NOT NULL DEFAULT ''");
    globalThis.elGanadorTerritoryMigrationReady = true;
  }
  if (!globalThis.elGanadorPlanExpiryMigrationReady) {
    const accountColumns = new Set((globalThis.elGanadorDb.prepare("PRAGMA table_info(business_accounts)").all() as { name: string }[]).map((column) => column.name));
    if (!accountColumns.has("plan_expires_at")) globalThis.elGanadorDb.exec("ALTER TABLE business_accounts ADD COLUMN plan_expires_at TEXT");
    globalThis.elGanadorPlanExpiryMigrationReady = true;
  }
  return globalThis.elGanadorDb;
}

export type DrawRow = {
  id: string;
  title: string;
  admin: string;
  category: string;
  unit_price: number;
  total_tickets: number;
  followers: number;
  live: number;
  emoji: string;
  description: string;
  business_city: string;
  business_description: string;
  business_followers: number;
  category_details: string;
  owner_id: string | null;
  business_photo_url: string;
  product_value: number;
  image_url: string;
  published: number;
  start_mode: string;
  start_threshold: number;
  scheduled_at: string | null;
  started_at: string | null;
  sold: number;
  reserved: number;
  available: number;
};

export async function releaseExpiredReservations(now = new Date().toISOString(), executor?: DatabaseExecutor) {
  const work = async (tx: DatabaseExecutor) => {
    await tx.query(`UPDATE tickets SET status = 'available', participation_id = NULL, hold_until = NULL
      WHERE status = 'reserved' AND hold_until <= $1`, [now]);
    await tx.query("UPDATE participations SET status = 'expired' WHERE status = 'reserved' AND expires_at <= $1", [now]);
  };
  if (executor) return work(executor);
  return withTransaction(work);
}

export async function activateEligibleDraws(now = new Date().toISOString(), executor?: DatabaseExecutor) {
  const work = (tx: DatabaseExecutor) => tx.query(`UPDATE draws SET live = 1, started_at = $1 WHERE live = 0 AND published = 1 AND
    ((start_mode = 'threshold' AND 100.0 * (SELECT COUNT(*) FROM tickets t WHERE t.draw_id = draws.id AND t.status = 'sold') / total_tickets >= start_threshold)
      OR (start_mode = 'date' AND scheduled_at IS NOT NULL AND scheduled_at <= $1))`, [now]);
  if (executor) return work(executor);
  return withTransaction(work);
}

