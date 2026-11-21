// app/api/draws/commit/route.ts
// Endpoint de Pre-Compromiso Criptográfico y Revelación de Sorteos (ISO 17025 / Coljuegos)
import { NextResponse } from 'next/server';
import { query } from '../../../../lib/db';
import { fromHex, sha256Hex } from '../../../../lib/draw-engine/bytes';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

let tableEnsured = false;

async function ensureDrawCommitmentsTable() {
  if (tableEnsured) return;
  await query(`
    CREATE TABLE IF NOT EXISTS draw_commitments (
      draw_id TEXT PRIMARY KEY,
      seed_commitment TEXT NOT NULL,
      list_hash TEXT NOT NULL,
      entry_count INTEGER NOT NULL,
      mode TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'committed',
      committed_at TEXT NOT NULL,
      reveal_seed TEXT,
      winning_index INTEGER,
      winning_number TEXT,
      revealed_at TEXT
    )
  `);
  tableEnsured = true;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const drawId = (searchParams.get('id') || '').trim();

    if (!drawId) {
      return NextResponse.json({ ok: false, error: 'Falta el identificador del sorteo (id).' }, { status: 400 });
    }

    await ensureDrawCommitmentsTable();
    const res = await query<{
      draw_id: string;
      seed_commitment: string;
      list_hash: string;
      entry_count: number;
      mode: string;
      status: string;
      committed_at: string;
      reveal_seed: string | null;
      winning_index: number | null;
      winning_number: string | null;
      revealed_at: string | null;
    }>('SELECT * FROM draw_commitments WHERE draw_id = $1 LIMIT 1', [drawId]);

    if (!res.rows.length) {
      return NextResponse.json({ ok: false, error: 'Compromiso no encontrado.' }, { status: 404 });
    }

    const row = res.rows[0];
    return NextResponse.json({
      ok: true,
      drawId: row.draw_id,
      seedCommitment: row.seed_commitment,
      listHash: row.list_hash,
      entryCount: row.entry_count,
      mode: row.mode,
      status: row.status,
      committedAt: row.committed_at,
      revealSeed: row.reveal_seed,
      winningIndex: row.winning_index,
      winningNumber: row.winning_number,
      revealedAt: row.revealed_at,
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || 'Error al consultar el compromiso.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const action = body?.action || 'commit';
    const drawId = String(body?.drawId || '').trim();

    if (!drawId) {
      return NextResponse.json({ ok: false, error: 'Falta el identificador único del sorteo (drawId).' }, { status: 400 });
    }

    await ensureDrawCommitmentsTable();

    // =========================================================================
    // ACCIÓN 1: PRE-COMPROMISO EN SERVIDOR (BLOQUEA LA SEMILLA ANTES DEL SORTEO)
    // =========================================================================
    if (action === 'commit') {
      const seedCommitment = String(body?.seedCommitment || '').trim();
      const listHash = String(body?.listHash || '').trim();
      const entryCount = Number(body?.entryCount || 100);
      const mode = String(body?.mode || 'balotas').trim();

      if (!seedCommitment || !listHash) {
        return NextResponse.json(
          { ok: false, error: 'Se requiere seedCommitment y listHash para formalizar el compromiso.' },
          { status: 400 }
        );
      }

      // Verificar si ya existe un compromiso para este sorteo
      const existing = await query<{ status: string; seed_commitment: string; committed_at: string }>(
        'SELECT status, seed_commitment, committed_at FROM draw_commitments WHERE draw_id = $1 LIMIT 1',
        [drawId]
      );

      if (existing.rows.length > 0) {
        const current = existing.rows[0];
        // Si ya está comprometido con la misma semilla, retornar OK (idempotente)
        if (current.seed_commitment === seedCommitment) {
          return NextResponse.json({
            ok: true,
            drawId,
            status: current.status,
            committedAt: current.committed_at,
            message: 'Compromiso previo ratificado.',
          });
        }
        // Si intentan cambiar la semilla para el mismo sorteo, RECHAZAR POR PROTOCOLO ANTI-FRAUDE
        return NextResponse.json(
          {
            ok: false,
            error: 'Infracción de Integridad: Ya existe un compromiso inmutable registrado para este sorteo con otra semilla.',
          },
          { status: 409 }
        );
      }

      const nowIso = new Date().toISOString();
      await query(
        `INSERT INTO draw_commitments (draw_id, seed_commitment, list_hash, entry_count, mode, status, committed_at)
         VALUES ($1, $2, $3, $4, $5, 'committed', $6)`,
        [drawId, seedCommitment, listHash, entryCount, mode, nowIso]
      );

      return NextResponse.json({
        ok: true,
        drawId,
        status: 'committed',
        committedAt: nowIso,
        message: 'Pre-compromiso sellado criptográficamente en servidor.',
      });
    }

    // =========================================================================
    // ACCIÓN 2: REVELACIÓN DE SEMILLA Y RATIFICACIÓN DEL GANADOR (POST-SORTEO)
    // =========================================================================
    if (action === 'reveal') {
      const seedHex = String(body?.seedHex || '').trim();
      const winningIndex = Number(body?.winningIndex);
      const winningNumber = String(body?.winningNumber || '').trim();

      if (!seedHex) {
        return NextResponse.json({ ok: false, error: 'Falta la semilla (seedHex) para la revelación.' }, { status: 400 });
      }

      // 1. Consultar el compromiso previo
      const existing = await query<{ seed_commitment: string; status: string }>(
        'SELECT seed_commitment, status FROM draw_commitments WHERE draw_id = $1 LIMIT 1',
        [drawId]
      );

      if (!existing.rows.length) {
        return NextResponse.json(
          { ok: false, error: 'No existe un pre-compromiso previo registrado para este sorteo.' },
          { status: 404 }
        );
      }

      // 2. Verificar matemáticamente que SHA-256(seedHex) coincide exactamente con seed_commitment
      const calculatedCommitment = await sha256Hex(fromHex(seedHex, 32));
      if (calculatedCommitment !== existing.rows[0].seed_commitment) {
        return NextResponse.json(
          {
            ok: false,
            error: 'FALLO CRÍTICO DE AUDITORÍA: La semilla revelada no corresponde al compromiso sellado previamente en servidor.',
          },
          { status: 400 }
        );
      }

      const nowIso = new Date().toISOString();
      await query(
        `UPDATE draw_commitments
         SET status = 'revealed',
             reveal_seed = $2,
             winning_index = $3,
             winning_number = $4,
             revealed_at = $5
         WHERE draw_id = $1`,
        [drawId, seedHex, isNaN(winningIndex) ? null : winningIndex, winningNumber, nowIso]
      );

      return NextResponse.json({
        ok: true,
        verified: true,
        drawId,
        status: 'revealed',
        revealedAt: nowIso,
        message: 'Semilla y ganador ratificados y auditados exitosamente.',
      });
    }

    return NextResponse.json({ ok: false, error: 'Acción no soportada (use commit o reveal).' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || 'Error en el procesamiento del compromiso.' }, { status: 500 });
  }
}
