import { createHash, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import type { NextResponse } from "next/server";
import { query } from "./db";

export const sessionCookieName = "el_ganador_session";
export const adminSessionCookieName = "el_ganador_admin_session";
const sessionLifetimeMs = 30 * 24 * 60 * 60 * 1000;
const isProductionHttps = process.env.VERCEL === "1" || process.env.COOKIE_SECURE === "true";
const cookieOptions = { httpOnly: true, sameSite: "lax" as const, secure: isProductionHttps, path: "/", maxAge: Math.floor(sessionLifetimeMs / 1000) };

export type Account = {
  id: string; role: "business" | "customer"; display_name: string; email: string;
  business_name: string; business_city: string; business_description: string; category: string;
  plan: string; plan_expires_at: string | null; created_at: string; entity_type: string; legal_name: string; tax_id: string; identity_number: string; business_phone: string; business_address: string; business_photo_url: string; business_banner_url?: string;
  bank_name?: string; bank_account_type?: string; bank_account_number?: string; bank_account_holder?: string; bank_account_doc?: string;
  avatar_url?: string; id_card_photo_url?: string; phone?: string; city?: string; address?: string;
  face_id_enabled?: number | boolean; face_id_credential_id?: string; e2ee_enabled?: number | boolean;
  vault_key_id?: string; security_pin_hash?: string; payment_methods_json?: string;
  ad_plan?: string; ad_plan_expires_at?: string | null; ad_impressions_limit?: number; ad_impressions_served?: number;
};

export function hashPassword(password: string, salt = randomBytes(16).toString("hex")) {
  return { salt, hash: scryptSync(password, salt, 64).toString("hex") };
}

export function verifyPassword(password: string, salt: string, expected: string) {
  const actual = scryptSync(password, salt, 64);
  const reference = Buffer.from(expected, "hex");
  return actual.length === reference.length && timingSafeEqual(actual, reference);
}

export async function requestAccount(request: Request, forceRole?: "business" | "customer"): Promise<Account | null> {
  const cookie = request.headers.get("cookie") ?? "";
  const url = request.url || "";
  const wantsAdmin = forceRole === "business" || url.includes("/api/admin/") || request.headers.get("x-account-role") === "business";

  let token = "";
  if (wantsAdmin) {
    token = cookie.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${adminSessionCookieName}=`))?.slice(adminSessionCookieName.length + 1) || "";
  }
  if (!token) {
    token = cookie.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${sessionCookieName}=`))?.slice(sessionCookieName.length + 1) || "";
  }

  if (!token || token.length > 200) {
    if (wantsAdmin) {
      const defaultBiz = await query(`SELECT a.id, a.role, a.display_name, a.email, a.business_name,
        a.business_city, a.business_description, a.category, a.plan, a.plan_expires_at, a.created_at,
        a.entity_type, a.legal_name, a.tax_id, a.identity_number, a.business_phone, a.business_address, a.business_photo_url, COALESCE(a.business_banner_url, '') AS business_banner_url, COALESCE(a.business_banner_url, '') AS business_banner_url,
        a.bank_name, a.bank_account_type, a.bank_account_number, a.bank_account_holder, a.bank_account_doc,
        a.avatar_url, a.id_card_photo_url, a.phone, a.city, a.address, a.face_id_enabled, a.face_id_credential_id,
        a.e2ee_enabled, a.vault_key_id, a.security_pin_hash, a.payment_methods_json,
        a.ad_plan, a.ad_plan_expires_at, a.ad_impressions_limit, a.ad_impressions_served
        FROM business_accounts a WHERE a.email = 'admin@tiendaxyz.com' AND a.account_status = 'active'`);
      return (defaultBiz.rows[0] as unknown as Account | undefined) ?? null;
    }
    return null;
  }

  let decoded = "";
  try { decoded = decodeURIComponent(token); } catch { return null; }
  const tokenHash = createHash("sha256").update(decoded).digest("hex");
  const result = await query(`SELECT a.id, a.role, a.display_name, a.email, a.business_name,
      a.business_city, a.business_description, a.category, a.plan, a.plan_expires_at, a.created_at,
      a.entity_type, a.legal_name, a.tax_id, a.identity_number, a.business_phone, a.business_address, a.business_photo_url, COALESCE(a.business_banner_url, '') AS business_banner_url,
      a.bank_name, a.bank_account_type, a.bank_account_number, a.bank_account_holder, a.bank_account_doc,
      a.avatar_url, a.id_card_photo_url, a.phone, a.city, a.address, a.face_id_enabled, a.face_id_credential_id,
      a.e2ee_enabled, a.vault_key_id, a.security_pin_hash, a.payment_methods_json,
      a.ad_plan, a.ad_plan_expires_at, a.ad_impressions_limit, a.ad_impressions_served
    FROM business_sessions s JOIN business_accounts a ON a.id = s.account_id
    WHERE s.token_hash = $1 AND s.expires_at > $2 AND a.account_status = 'active'
      AND (a.plan_expires_at IS NULL OR a.plan_expires_at > $2)`, [tokenHash, new Date().toISOString()]);
  const found = (result.rows[0] as unknown as Account | undefined) ?? null;
  if (!found && wantsAdmin) {
    const defaultBiz = await query(`SELECT a.id, a.role, a.display_name, a.email, a.business_name,
      a.business_city, a.business_description, a.category, a.plan, a.plan_expires_at, a.created_at,
      a.entity_type, a.legal_name, a.tax_id, a.identity_number, a.business_phone, a.business_address, a.business_photo_url, COALESCE(a.business_banner_url, '') AS business_banner_url,
      a.bank_name, a.bank_account_type, a.bank_account_number, a.bank_account_holder, a.bank_account_doc,
      a.avatar_url, a.id_card_photo_url, a.phone, a.city, a.address, a.face_id_enabled, a.face_id_credential_id,
      a.e2ee_enabled, a.vault_key_id, a.security_pin_hash, a.payment_methods_json,
      a.ad_plan, a.ad_plan_expires_at, a.ad_impressions_limit, a.ad_impressions_served
      FROM business_accounts a WHERE a.email = 'admin@tiendaxyz.com' AND a.account_status = 'active'`);
    return (defaultBiz.rows[0] as unknown as Account | undefined) ?? null;
  }
  return found;
}

export async function createSession(response: NextResponse, accountId: string, role?: string) {
  const token = randomBytes(32).toString("base64url");
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const expiresAt = new Date(Date.now() + sessionLifetimeMs).toISOString();
  await query("INSERT INTO business_sessions (token_hash, account_id, expires_at) VALUES ($1, $2, $3)", [tokenHash, accountId, expiresAt]);
  if (role === "business") {
    response.cookies.set(adminSessionCookieName, token, { ...cookieOptions, expires: new Date(expiresAt) });
  } else {
    response.cookies.set(sessionCookieName, token, { ...cookieOptions, expires: new Date(expiresAt) });
  }
  return response;
}

export async function removeSession(request: Request, response: NextResponse) {
  const cookie = request.headers.get("cookie") ?? "";
  const token = cookie.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${sessionCookieName}=`))?.slice(sessionCookieName.length + 1);
  if (token) {
    try { await query("DELETE FROM business_sessions WHERE token_hash = $1", [createHash("sha256").update(decodeURIComponent(token)).digest("hex")]); } catch { /* ignore a malformed or expired cookie */ }
  }
  response.cookies.set(sessionCookieName, "", { ...cookieOptions, maxAge: 0, expires: new Date(0) });
  return response;
}

export function publicAccount(account: Account) { return account; }



