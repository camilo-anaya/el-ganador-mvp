import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { createSession, verifyPassword } from "../../../../lib/auth";
import { query, withTransaction } from "../../../../lib/db";
import { getPlan, plans } from "../../../../lib/plans";
import { createWompiCheckoutUrl } from "../../../../lib/wompi";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let body: { email?: unknown; password?: unknown };
  try { body = await request.json() as typeof body; } catch { return NextResponse.json({ error: "Revisa el correo y la contraseña." }, { status: 400 }); }
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";
  if (email.length > 254 || password.length > 128 || !email) return NextResponse.json({ error: "Correo o contraseña incorrectos." }, { status: 401 });
  const cutoff = new Date(Date.now() - 15 * 60 * 1000).toISOString();
  const attemptsResult = await query("SELECT COUNT(*) AS count FROM auth_attempts WHERE email = $1 AND attempted_at > $2", [email, cutoff]);
  const attempts = Number((attemptsResult.rows[0] as { count: number }).count);
  if (attempts >= 8) return NextResponse.json({ error: "Demasiados intentos. Espera 15 minutos e inténtalo de nuevo." }, { status: 429 });
  const accountResult = await query("SELECT id, role, display_name, email, business_name, business_city, business_description, category, business_photo_url, plan, plan_expires_at, created_at, account_status, password_salt, password_hash FROM business_accounts WHERE email = $1", [email]);
  const account = accountResult.rows[0] as ({ id: string; password_salt: string; password_hash: string } & Record<string, unknown>) | undefined;
  if (!account || !verifyPassword(password, account.password_salt, account.password_hash)) {
    await query("INSERT INTO auth_attempts (email, attempted_at) VALUES ($1, $2)", [email, new Date().toISOString()]);
    await query("DELETE FROM auth_attempts WHERE attempted_at < $1", [cutoff]);
    return NextResponse.json({ error: "Correo o contraseña incorrectos." }, { status: 401 });
  }
  await query("DELETE FROM auth_attempts WHERE email = $1", [email]);
  const expiry = typeof account.plan_expires_at === "string" ? account.plan_expires_at : "";
  if (account.role === "business" && account.account_status === "active" && expiry && new Date(expiry).getTime() <= Date.now()) {
    await query("UPDATE business_accounts SET account_status = 'plan_expired' WHERE id = $1 AND account_status = 'active'", [account.id]);
    account.account_status = "plan_expired";
  }
  if (account.account_status !== "active") {
    if (account.role === "business" && ["pending_payment", "payment_failed", "payment_voided", "plan_expired"].includes(String(account.account_status))) {
      try {
        const checkout = await withTransaction(async (tx) => {
          // This update serializes concurrent resume attempts for the same account.
          await tx.query("UPDATE business_accounts SET account_status = account_status WHERE id = $1", [account.id]);
          const latestResult = await tx.query(`SELECT id, plan_id, reference, amount_in_cents, status
            FROM plan_payments WHERE account_id = $1 ORDER BY created_at DESC LIMIT 1`, [account.id]);
          const latest = latestResult.rows[0] as { id: string; plan_id: string; reference: string; amount_in_cents: number; status: string } | undefined;
          if (!latest) throw new Error("No encontramos un pago pendiente para esta cuenta. Contacta a soporte.");

          if (latest.status === "PENDING") {
            const amountInCents = Number(latest.amount_in_cents);
            const checkoutUrl = createWompiCheckoutUrl({ requestUrl: request.url, reference: latest.reference, amountInCents });
            return { checkoutUrl };
          }
          if (latest.status === "APPROVED" && account.account_status !== "plan_expired") throw new Error("El pago ya fue aprobado. Espera unos segundos y vuelve a iniciar sesión.");
          if (!["DECLINED", "ERROR", "VOIDED"].includes(latest.status) && !(latest.status === "APPROVED" && account.account_status === "plan_expired")) throw new Error("Tu pago sigue en revisión. Espera la confirmación de Wompi antes de intentar otra vez.");

          const selectedPlan = getPlan(latest.plan_id);
          if (selectedPlan.demoOnly || selectedPlan.subscriptionPrice <= 0 || !Object.hasOwn(plans, latest.plan_id)) {
            throw new Error("No pudimos determinar el plan asociado a tu pago. Contacta a soporte.");
          }
          const reference = randomUUID().replaceAll("-", "");
          const amountInCents = selectedPlan.subscriptionPrice * 100;
          const checkoutUrl = createWompiCheckoutUrl({ requestUrl: request.url, reference, amountInCents });
          const now = new Date().toISOString();
          await tx.query(`INSERT INTO plan_payments (id, account_id, plan_id, reference, amount_in_cents, currency, status, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, 'COP', 'PENDING', $6, $7)`, [randomUUID(), account.id, latest.plan_id, reference, amountInCents, now, now]);
          await tx.query("UPDATE business_accounts SET account_status = 'pending_payment' WHERE id = $1", [account.id]);
          return { checkoutUrl };
        });
        return NextResponse.json({ checkoutUrl: checkout.checkoutUrl, message: "Continúa tu pago seguro con Wompi para habilitar el plan." });
      } catch (error) {
        return NextResponse.json({ error: error instanceof Error ? error.message : "No pudimos recuperar el pago pendiente." }, { status: 503 });
      }
    }
    return NextResponse.json({ error: "Esta cuenta todavía no puede ingresar. Revisa el estado de tu plan o comunícate con soporte." }, { status: 403 });
  }
  // Vincular compras y participaciones previas realizadas con este correo
  await query("UPDATE participations SET buyer_account_id = $1 WHERE lower(buyer_email) = lower($2) AND buyer_account_id IS NULL", [account.id, email]);

  const { password_salt: _salt, password_hash: _hash, account_status: _status, ...safeAccount } = account;
  return await createSession(NextResponse.json({ account: safeAccount }), account.id, String(account.role));
}
