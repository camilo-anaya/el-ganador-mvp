import { NextResponse } from "next/server";
import { query } from "../../../lib/db";

let tableEnsured = false;

async function ensureCertificatesTable() {
  if (tableEnsured) return;
  await query(`
    CREATE TABLE IF NOT EXISTS public_certificates (
      draw_id TEXT PRIMARY KEY,
      payload_json TEXT NOT NULL,
      created_at TEXT NOT NULL
    )
  `);
  tableEnsured = true;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const drawId = (searchParams.get("id") || "").trim();
    if (!drawId) {
      return NextResponse.json({ ok: false, error: "Falta el identificador del sorteo." }, { status: 400 });
    }

    await ensureCertificatesTable();
    const res = await query<{ payload_json: string; created_at: string }>(
      "SELECT payload_json, created_at FROM public_certificates WHERE draw_id = $1 LIMIT 1",
      [drawId]
    );

    if (!res.rows.length) {
      return NextResponse.json({ ok: false, error: "Constancia no encontrada." }, { status: 404 });
    }

    const parsed = JSON.parse(res.rows[0].payload_json);
    return NextResponse.json({ ok: true, certificateData: parsed, createdAt: res.rows[0].created_at });
  } catch {
    return NextResponse.json({ ok: false, error: "No fue posible consultar la constancia." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const drawId = String(body?.drawId || body?.actData?.certificate?.drawId || "").trim();
    const actData = body?.actData;

    if (!drawId || !actData || typeof actData !== "object") {
      return NextResponse.json({ ok: false, error: "Datos de constancia incompletos." }, { status: 400 });
    }

    const payloadJson = JSON.stringify(actData);
    if (payloadJson.length > 250_000) {
      return NextResponse.json({ ok: false, error: "Constancia demasiado extensa." }, { status: 413 });
    }

    await ensureCertificatesTable();
    const nowIso = new Date().toISOString();
    await query(
      `INSERT INTO public_certificates (draw_id, payload_json, created_at)
       VALUES ($1, $2, $3)
       ON CONFLICT (draw_id) DO UPDATE SET payload_json = EXCLUDED.payload_json`,
      [drawId, payloadJson, nowIso]
    );

    return NextResponse.json({ ok: true, drawId });
  } catch {
    return NextResponse.json({ ok: false, error: "No se pudo registrar la constancia." }, { status: 500 });
  }
}
