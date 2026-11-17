import { NextResponse } from "next/server";
import { query } from "../../../../lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

let tableEnsured = false;

async function ensureSpectatorTable() {
  if (tableEnsured) return;
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS spectator_sessions (
        session_id TEXT PRIMARY KEY,
        draw_id TEXT NOT NULL,
        duration_seconds INTEGER NOT NULL DEFAULT 0,
        last_heartbeat INTEGER NOT NULL,
        started_at INTEGER NOT NULL,
        reactions_count INTEGER NOT NULL DEFAULT 0
      )
    `);
    tableEnsured = true;
  } catch (err) {
    console.error("Error ensuring spectator_sessions table:", err);
  }
}

export async function GET(request: Request) {
  try {
    await ensureSpectatorTable();
    const { searchParams } = new URL(request.url);
    const drawId = searchParams.get("drawId") || "all";
    const now = Date.now();
    const cutoff = now - 45000; // active in last 45s

    // Count active sessions
    let activeResult;
    if (drawId !== "all") {
      activeResult = await query<{ count: number }>(
        "SELECT COUNT(*) as count FROM spectator_sessions WHERE last_heartbeat >= $1 AND draw_id = $2",
        [cutoff, drawId]
      );
    } else {
      activeResult = await query<{ count: number }>(
        "SELECT COUNT(*) as count FROM spectator_sessions WHERE last_heartbeat >= $1",
        [cutoff]
      );
    }

    const realActive = Number(activeResult.rows[0]?.count || 0);
    // Base platform rating count for social proof in MVP
    const simulatedBase = 1420 + (Math.floor(now / 15000) % 27) * 3;
    const activeSpectators = simulatedBase + realActive;

    const avgRetentionSeconds = 278; // ~4m 38s
    const peakSpectators = 2850 + realActive;
    const retentionRatePct = 91.4;
    const ratingScore = 4.9;

    return NextResponse.json({
      ok: true,
      stats: {
        activeSpectators,
        peakSpectators,
        avgRetentionSeconds,
        avgRetentionFormatted: "4m 38s",
        retentionRatePct,
        ratingScore,
        drawId,
        timestamp: now,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || "Error al obtener estadísticas de espectador" }, { status: 500 });
  }
}

// Cache en memoria para soportar 3,000+ espectadores concurrentes sin saturar la BD
let cachedActiveCount: number | null = null;
let lastCountTime = 0;

export async function POST(request: Request) {
  try {
    await ensureSpectatorTable();
    const body = await request.json();
    const sessionId = typeof body.sessionId === "string" && body.sessionId.length > 3 ? body.sessionId : `anon-${Date.now()}`;
    const drawId = typeof body.drawId === "string" ? body.drawId : "RIF-2026-000184";
    const durationSeconds = Number(body.durationSeconds || 0);
    const hasReaction = Boolean(body.reaction);
    const now = Date.now();

    await query(`
      INSERT INTO spectator_sessions (session_id, draw_id, duration_seconds, last_heartbeat, started_at, reactions_count)
      VALUES ($1, $2, $3, $4, $4, $5)
      ON CONFLICT(session_id) DO UPDATE SET
        draw_id = excluded.draw_id,
        duration_seconds = excluded.duration_seconds,
        last_heartbeat = excluded.last_heartbeat,
        reactions_count = spectator_sessions.reactions_count + excluded.reactions_count
    `, [sessionId, drawId, durationSeconds, now, hasReaction ? 1 : 0]);

    // Limpieza probabilística de sesiones antiguas (solo 1 de cada 100 peticiones para no saturar I/O)
    if (Math.random() < 0.01) {
      const cleanupCutoff = now - 7200000;
      query("DELETE FROM spectator_sessions WHERE last_heartbeat < $1", [cleanupCutoff]).catch(() => {});
    }

    // Conteo con caché en memoria de 4 segundos para soportar alta concurrencia
    let realActive = cachedActiveCount || 0;
    if (now - lastCountTime > 4000 || cachedActiveCount === null) {
      const activeRes = await query<{ count: number }>(
        "SELECT COUNT(*) as count FROM spectator_sessions WHERE last_heartbeat >= $1",
        [now - 45000]
      );
      realActive = Number(activeRes.rows[0]?.count || 0);
      cachedActiveCount = realActive;
      lastCountTime = now;
    }

    const simulatedBase = 1420 + (Math.floor(now / 15000) % 27) * 3;

    return NextResponse.json({
      ok: true,
      activeSpectators: simulatedBase + realActive,
      peakSpectators: 2850,
      avgRetentionFormatted: "4m 38s",
      ratingScore: 4.9,
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || "Error al procesar latido de espectador" }, { status: 500 });
  }
}
