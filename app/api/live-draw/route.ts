import { NextResponse } from "next/server";
import { query } from "../../../lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

let tableEnsured = false;

async function ensureLiveDrawTable() {
  if (tableEnsured) return;
  await query(`
    CREATE TABLE IF NOT EXISTS live_draw_broadcast (
      id TEXT PRIMARY KEY,
      status TEXT NOT NULL,
      mode TEXT NOT NULL,
      carton_size INTEGER NOT NULL,
      selected TEXT,
      started_at_epoch_ms INTEGER NOT NULL,
      completed_at_epoch_ms INTEGER,
      act_data TEXT,
      list_hash TEXT,
      updated_at TEXT NOT NULL
    )
  `);
  tableEnsured = true;
}

// Caché en memoria para soportar miles de peticiones simultáneas con latencia sub-milisegundo
let cachedBroadcastData: any = null;
let lastBroadcastFetchTime = 0;

export async function GET() {
  try {
    const now = Date.now();
    if (cachedBroadcastData && now - lastBroadcastFetchTime < 1500) {
      return NextResponse.json({
        ok: true,
        broadcast: {
          ...cachedBroadcastData,
          serverTime: now,
        },
      });
    }

    await ensureLiveDrawTable();
    const res = await query<{
      id: string;
      status: string;
      mode: string;
      carton_size: number;
      selected: string;
      started_at_epoch_ms: number;
      completed_at_epoch_ms: number | null;
      act_data: string | null;
      list_hash: string | null;
      updated_at: string;
    }>("SELECT * FROM live_draw_broadcast WHERE id = $1 LIMIT 1", ["current"]);

    if (!res.rows.length) {
      const defaultBc = {
        id: "current",
        status: "idle",
        mode: "balotas",
        carton_size: 99,
        selected: null,
        started_at_epoch_ms: 0,
      };
      cachedBroadcastData = defaultBc;
      lastBroadcastFetchTime = now;
      return NextResponse.json({
        ok: true,
        broadcast: {
          ...defaultBc,
          serverTime: now,
        },
      });
    }

    const row = res.rows[0];
    let parsedActData = null;
    if (row.act_data) {
      try {
        parsedActData = JSON.parse(row.act_data);
      } catch {}
    }

    const broadcastPayload = {
      ...row,
      actData: parsedActData,
    };
    cachedBroadcastData = broadcastPayload;
    lastBroadcastFetchTime = now;

    return NextResponse.json({
      ok: true,
      broadcast: {
        ...broadcastPayload,
        serverTime: now,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || "Error al obtener estado de transmisión" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    // Invalidar caché de inmediato ante cualquier cambio
    cachedBroadcastData = null;
    lastBroadcastFetchTime = 0;

    await ensureLiveDrawTable();
    const body = await request.json();
    const action = body.action || "start";
    const mode = body.mode || "balotas";
    const cartonSize = Number(body.cartonSize || 99);
    const selected = body.selected || "";
    const startedAtEpochMs = Number(body.startedAtEpochMs || Date.now());
    const actDataJson = body.actData ? JSON.stringify(body.actData) : null;
    const listHash = body.listHash || "";

    const status = action === "start" ? "running" : action === "complete" ? "completed" : "idle";
    const nowIso = new Date().toISOString();

    await query(`
      INSERT INTO live_draw_broadcast (id, status, mode, carton_size, selected, started_at_epoch_ms, completed_at_epoch_ms, act_data, list_hash, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      ON CONFLICT(id) DO UPDATE SET
        status = excluded.status,
        mode = excluded.mode,
        carton_size = excluded.carton_size,
        selected = excluded.selected,
        started_at_epoch_ms = excluded.started_at_epoch_ms,
        completed_at_epoch_ms = excluded.completed_at_epoch_ms,
        act_data = excluded.act_data,
        list_hash = excluded.list_hash,
        updated_at = excluded.updated_at
    `, [
      "current",
      status,
      mode,
      cartonSize,
      selected,
      startedAtEpochMs,
      status === "completed" ? Date.now() : null,
      actDataJson,
      listHash,
      nowIso
    ]);

    return NextResponse.json({ ok: true, status });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || "Error al emitir sorteo en vivo" }, { status: 500 });
  }
}
