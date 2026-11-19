import { NextResponse } from 'next/server';
import { createHash } from 'node:crypto';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const reference = String(body.reference || '').trim();
    const amountInCents = Number(body.amountInCents || 0);
    const currency = String(body.currency || 'COP').toUpperCase();

    if (!reference || !Number.isFinite(amountInCents) || amountInCents <= 0) {
      return NextResponse.json({ error: 'Parámetros inválidos.' }, { status: 400 });
    }

    const integritySecret = process.env.WOMPI_INTEGRITY_SECRET || '';
    if (!integritySecret || integritySecret.includes('tu_llave')) {
      return NextResponse.json({ signature: null, configured: false });
    }

    const signature = createHash('sha256')
      .update(`${reference}${amountInCents}${currency}${integritySecret}`)
      .digest('hex');

    return NextResponse.json({ signature, configured: true });
  } catch (err) {
    console.error('POST /api/payments/wompi-signature error:', err);
    return NextResponse.json({ signature: null, configured: false }, { status: 200 });
  }
}
