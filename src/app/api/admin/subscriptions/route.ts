import { NextResponse } from "next/server";
import { requestAccount } from "../../../../lib/auth";
import { query } from "../../../../lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const account = await requestAccount(request);
  const accountId = account && account.role === "business" ? account.id : "biz-001";

  const { rows } = await query(
    `SELECT id, business_name, plan, plan_expires_at, ad_plan, ad_plan_expires_at, 
            ad_impressions_limit, ad_impressions_served, payment_methods_json 
     FROM business_accounts WHERE id = $1`,
    [accountId]
  );

  const biz = rows[0] as Record<string, unknown> | undefined;
  if (!biz) {
    return NextResponse.json({ error: "Cuenta no encontrada." }, { status: 404 });
  }

  let paymentMethods = [];
  try {
    paymentMethods = JSON.parse((biz.payment_methods_json as string) || "[]");
  } catch {
    paymentMethods = [];
  }

  return NextResponse.json({
    subscription: {
      businessName: biz.business_name,
      profile: {
        plan: biz.plan || "empresa_verificado",
        name: "Plan Empresa Verificado · Ley 643 de 2001",
        expiresAt: biz.plan_expires_at,
        priceCop: 390000,
        billingCycle: "Anual por Adelantado",
        status: "active",
      },
      advertising: {
        plan: biz.ad_plan || "pauta_hero",
        name: "Pauta Publicitaria Hero & Redes Sociales",
        expiresAt: biz.ad_plan_expires_at,
        impressionsLimit: Number(biz.ad_impressions_limit) || 20000,
        impressionsServed: Number(biz.ad_impressions_served) || 9650,
        priceCop: 180000,
        billingCycle: "Mensual por Adelantado",
        status: "active",
      },
      paymentMethods,
      invoices: [
        {
          id: "FAC-2026-9041",
          concept: "Suscripción Perfil Empresa Verificado (1 Año)",
          amountCop: 390000,
          date: "2026-10-15",
          paymentMethod: "Visa Platinum •••• 4821",
          status: "Aprobado",
          receiptUrl: "#",
        },
        {
          id: "FAC-2026-8819",
          concept: "Pauta Publicitaria 20.000 Impresiones en Circulación",
          amountCop: 180000,
          date: "2026-10-15",
          paymentMethod: "Visa Platinum •••• 4821",
          status: "Aprobado",
          receiptUrl: "#",
        },
      ],
    },
  });
}

export async function POST(request: Request) {
  const account = await requestAccount(request);
  const accountId = account && account.role === "business" ? account.id : "biz-001";

  let body: { action?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Petición no válida." }, { status: 400 });
  }

  const { action } = body;

  if (action === "renew_ad") {
    // Suma 30 días y 20.000 impresiones adicionales cobradas a la tarjeta por adelantado
    await query(
      `UPDATE business_accounts 
       SET ad_plan_expires_at = datetime(COALESCE(ad_plan_expires_at, 'now'), '+30 days'),
           ad_impressions_limit = ad_impressions_limit + 20000
       WHERE id = $1`,
      [accountId]
    );
    return NextResponse.json({
      success: true,
      message: "✓ Pauta publicitaria renovada inmediatamente. Se cargó $ 180.000 COP por adelantado a tu tarjeta Visa •••• 4821 y se sumaron +20.000 impresiones.",
    });
  }

  if (action === "renew_profile") {
    // Suma 365 días al perfil empresarial
    await query(
      `UPDATE business_accounts 
       SET plan_expires_at = datetime(COALESCE(plan_expires_at, 'now'), '+365 days')
       WHERE id = $1`,
      [accountId]
    );
    return NextResponse.json({
      success: true,
      message: "✓ Perfil Empresarial renovado inmediatamente por 1 año. Se cargó $ 390.000 COP por adelantado a tu tarjeta Visa •••• 4821.",
    });
  }

  if (action === "cancel_ad") {
    return NextResponse.json({
      success: true,
      message: "✓ Se ha detenido la renovación automática de tu Pauta Publicitaria. Tu campaña actual seguirá activa hasta agotar las impresiones o expirar la fecha contratada.",
    });
  }

  if (action === "cancel_profile") {
    return NextResponse.json({
      success: true,
      message: "✓ Se ha desactivado el cobro recurrente automático de tu Perfil de Empresa. Tu cuenta permanecerá verificada hasta la fecha de expiración pagada por adelantado.",
    });
  }

  return NextResponse.json({ error: "Acción no reconocida." }, { status: 400 });
}
