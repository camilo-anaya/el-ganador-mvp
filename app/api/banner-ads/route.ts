import { NextResponse } from 'next/server';
import { query } from '../../../lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function ensureBannerAdsTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS banner_ads (
      id TEXT PRIMARY KEY,
      business_email TEXT NOT NULL,
      brand TEXT NOT NULL,
      tag TEXT NOT NULL,
      category TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      coupon TEXT NOT NULL,
      cta_text TEXT NOT NULL,
      cta_link TEXT NOT NULL,
      image_url TEXT NOT NULL,
      badge TEXT NOT NULL,
      plan_id TEXT NOT NULL DEFAULT 'pro',
      billing_cycle TEXT NOT NULL DEFAULT 'mensual',
      priority INTEGER NOT NULL DEFAULT 1,
      paid INTEGER NOT NULL DEFAULT 0,
      active INTEGER NOT NULL DEFAULT 0,
      subscription_status TEXT NOT NULL DEFAULT 'pending',
      payment_reference TEXT,
      impressions INTEGER NOT NULL DEFAULT 0,
      clicks INTEGER NOT NULL DEFAULT 0,
      activated_at TEXT,
      expires_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);
}

function mapRowToAd(r: Record<string, unknown>) {
  return {
    id: String(r.id),
    businessEmail: String(r.business_email || ''),
    brand: String(r.brand || 'Patrocinador Oficial'),
    tag: String(r.tag || '⚡ PATROCINADOR OFICIAL'),
    category: String(r.category || 'Pauta Activa · Colombia'),
    title: String(r.title || ''),
    description: String(r.description || ''),
    coupon: String(r.coupon || 'Cupón: ELGANADOR'),
    ctaText: String(r.cta_text || 'Ver Vitrina & Promoción →'),
    ctaLink: String(r.cta_link || '/publicidad'),
    image: String(r.image_url || '/banner-el-ganador-oficial.jpg'),
    badge: String(r.badge || '✓ Suscripción activa'),
    planId: String(r.plan_id || 'pro'),
    billingCycle: String(r.billing_cycle || 'mensual'),
    priority: Number(r.priority || 1),
    paid: Number(r.paid) === 1,
    active: Number(r.active) === 1,
    subscriptionStatus: String(r.subscription_status || 'pending'),
    reference: r.payment_reference ? String(r.payment_reference) : null,
    impressions: Number(r.impressions || 0),
    clicks: Number(r.clicks || 0),
    activatedAt: r.activated_at ? String(r.activated_at) : null,
    expiresAt: r.expires_at ? String(r.expires_at) : null,
  };
}

export async function GET(request: Request) {
  try {
    await ensureBannerAdsTable();
    const nowIso = new Date().toISOString();

    // APAGADO AUTOMÁTICO: desactiva cualquier anuncio cuya suscripción ya venció
    await query(
      `UPDATE banner_ads
       SET active = 0, subscription_status = 'expired', updated_at = $1
       WHERE subscription_status = 'active' AND expires_at IS NOT NULL AND expires_at <= $2`,
      [nowIso, nowIso]
    );

    // Solo devuelve anuncios PAGADOS + ACTIVOS + NO VENCIDOS (ordenados por prioridad Enterprise > Pro)
    const { rows } = await query(
      `SELECT * FROM banner_ads
       WHERE paid = 1 AND active = 1 AND subscription_status = 'active'
         AND (expires_at IS NULL OR expires_at > $1)
       ORDER BY priority DESC, activated_at DESC`,
      [nowIso]
    );

    const activeAds = rows.map(mapRowToAd);

    // Si se consulta con ?email=..., devuelve también el estado propio de la empresa (activo, pausado, vencido o borrador)
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email')?.trim().toLowerCase();
    let myAd = null;
    if (email) {
      const own = await query(
        `SELECT * FROM banner_ads WHERE LOWER(business_email) = $1 ORDER BY updated_at DESC LIMIT 1`,
        [email]
      );
      if (own.rows[0]) {
        myAd = mapRowToAd(own.rows[0] as Record<string, unknown>);
      }
    }

    return NextResponse.json({
      ads: activeAds,
      myAd,
      activeSlots: activeAds.length,
      maxRecommendedSlots: 15,
    });
  } catch (error) {
    console.error('GET /api/banner-ads error:', error);
    return NextResponse.json({ ads: [], myAd: null, error: 'fallback_local' }, { status: 200 });
  }
}

export async function POST(request: Request) {
  try {
    await ensureBannerAdsTable();
    const body = await request.json();
    const action = String(body.action || 'save_draft');
    const nowIso = new Date().toISOString();

    if (action === 'track_click' && body.id) {
      await query(`UPDATE banner_ads SET clicks = clicks + 1 WHERE id = $1`, [String(body.id)]);
      return NextResponse.json({ ok: true });
    }

    const email = String(body.businessEmail || 'empresa@elganador.co').trim().toLowerCase();
    const existingRes = await query(
      `SELECT * FROM banner_ads WHERE LOWER(business_email) = $1 ORDER BY updated_at DESC LIMIT 1`,
      [email]
    );
    const existing = existingRes.rows[0] as Record<string, unknown> | undefined;

    if (action === 'toggle_pause' || action === 'cancel_subscription') {
      if (!existing) {
        return NextResponse.json({ error: 'No existe un anuncio para esta empresa.' }, { status: 404 });
      }
      const nextStatus = action === 'cancel_subscription' ? 'expired' : body.active ? 'active' : 'paused';
      const nextActive = nextStatus === 'active' && Number(existing.paid) === 1 && (!existing.expires_at || String(existing.expires_at) > nowIso) ? 1 : 0;
      const nextPaid = action === 'cancel_subscription' ? 0 : Number(existing.paid);

      await query(
        `UPDATE banner_ads SET active = $1, paid = $2, subscription_status = $3, updated_at = $4 WHERE id = $5`,
        [nextActive, nextPaid, nextStatus, nowIso, String(existing.id)]
      );
      const updated = await query(`SELECT * FROM banner_ads WHERE id = $1`, [String(existing.id)]);
      return NextResponse.json({ ok: true, ad: updated.rows[0] ? mapRowToAd(updated.rows[0] as Record<string, unknown>) : null });
    }

    const planId = String(body.planId || existing?.plan_id || 'pro');
    const billingCycle = String(body.billingCycle || existing?.billing_cycle || 'mensual');
    const priority = planId === 'enterprise' ? 2 : 1;
    const brand = String(body.brand || existing?.brand || 'Marca Patrocinadora').trim();
    const title = String(body.title || existing?.title || 'Promoción Oficial El Ganador').trim();
    const description = String(body.description || existing?.description || 'Empresa verificada con suscripción activa en El Ganador.').trim();
    const rawCoupon = String(body.coupon || existing?.coupon || 'ELGANADOR').trim();
    const coupon = rawCoupon.toLowerCase().startsWith('cupón') ? rawCoupon : `Cupón: ${rawCoupon}`;
    const ctaLink = String(body.ctaLink || existing?.cta_link || '/publicidad').trim() || '/publicidad';
    const imageUrl = String(body.image || existing?.image_url || '/banner-el-ganador-oficial.jpg').trim();
    const tag = planId === 'enterprise' ? '👑 PATROCINADOR ENTERPRISE VIP' : '⚡ PATROCINADOR PRO ACTIVO';
    const category = `${planId === 'enterprise' ? 'Cobertura Nacional' : 'Cobertura Regional'} · Suscripción ${billingCycle}`;
    const badge = `✓ Suscripción ${billingCycle} activa`;
    const ctaText = ctaLink.startsWith('http') ? 'Ir a la Oferta Directa ↗' : 'Ver Vitrina & Promoción →';

    const id = existing ? String(existing.id) : `ad-biz-${Date.now()}`;

    if (action === 'activate_subscription') {
      const days = billingCycle === 'anual' ? 365 : billingCycle === 'trimestral' ? 90 : 30;
      const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
      const reference = String(body.reference || `SUB-${Date.now()}`);

      if (existing) {
        await query(
          `UPDATE banner_ads
           SET brand = $1, tag = $2, category = $3, title = $4, description = $5,
               coupon = $6, cta_text = $7, cta_link = $8, image_url = $9, badge = $10,
               plan_id = $11, billing_cycle = $12, priority = $13, paid = 1, active = 1,
               subscription_status = 'active', payment_reference = $14,
               activated_at = $15, expires_at = $16, updated_at = $17
           WHERE id = $18`,
          [brand, tag, category, title, description, coupon, ctaText, ctaLink, imageUrl, badge, planId, billingCycle, priority, reference, nowIso, expiresAt, nowIso, id]
        );
      } else {
        await query(
          `INSERT INTO banner_ads (
            id, business_email, brand, tag, category, title, description, coupon, cta_text, cta_link,
            image_url, badge, plan_id, billing_cycle, priority, paid, active, subscription_status,
            payment_reference, impressions, clicks, activated_at, expires_at, created_at, updated_at
          ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,1,1,'active',$16,0,0,$17,$18,$19,$20)`,
          [id, email, brand, tag, category, title, description, coupon, ctaText, ctaLink, imageUrl, badge, planId, billingCycle, priority, reference, nowIso, expiresAt, nowIso, nowIso]
        );
      }

      const saved = await query(`SELECT * FROM banner_ads WHERE id = $1`, [id]);
      return NextResponse.json({ ok: true, ad: saved.rows[0] ? mapRowToAd(saved.rows[0] as Record<string, unknown>) : null });
    }

    // action === 'save_draft'
    // Si ya tiene suscripción pagada vigente, mantiene encendido el banner; si no, queda APAGADO (paid=0, active=0)
    const hasActivePaidSub =
      existing &&
      Number(existing.paid) === 1 &&
      existing.expires_at &&
      String(existing.expires_at) > nowIso;

    const paidFlag = hasActivePaidSub ? 1 : 0;
    const activeFlag = hasActivePaidSub && body.active !== false ? 1 : 0;
    const subStatus = hasActivePaidSub ? (activeFlag ? 'active' : 'paused') : 'pending';

    if (existing) {
      await query(
        `UPDATE banner_ads
         SET brand = $1, title = $2, description = $3, coupon = $4, cta_text = $5,
             cta_link = $6, image_url = $7, active = $8, subscription_status = $9, updated_at = $10
         WHERE id = $11`,
        [brand, title, description, coupon, ctaText, ctaLink, imageUrl, activeFlag, subStatus, nowIso, id]
      );
    } else {
      await query(
        `INSERT INTO banner_ads (
          id, business_email, brand, tag, category, title, description, coupon, cta_text, cta_link,
          image_url, badge, plan_id, billing_cycle, priority, paid, active, subscription_status,
          payment_reference, impressions, clicks, activated_at, expires_at, created_at, updated_at
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,NULL,0,0,NULL,NULL,$19,$20)`,
        [id, email, brand, tag, category, title, description, coupon, ctaText, ctaLink, imageUrl, badge, planId, billingCycle, priority, paidFlag, activeFlag, subStatus, nowIso, nowIso]
      );
    }

    const saved = await query(`SELECT * FROM banner_ads WHERE id = $1`, [id]);
    return NextResponse.json({ ok: true, ad: saved.rows[0] ? mapRowToAd(saved.rows[0] as Record<string, unknown>) : null });
  } catch (error) {
    console.error('POST /api/banner-ads error:', error);
    return NextResponse.json({ ok: false, error: 'Error guardando anuncio de banner.' }, { status: 500 });
  }
}
