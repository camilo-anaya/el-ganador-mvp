import { createHash, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import type { NextResponse } from "next/server";
import { query } from "./db";

export const sessionCookieName = "el_ganador_session";
const sessionLifetimeMs = 30 * 24 * 60 * 60 * 1000;
const cookieOptions = { httpOnly: true, sameSite: "lax" as const, secure: process.env.NODE_ENV === "production", path: "/", maxAge: Math.floor(sessionLifetimeMs / 1000) };

export type Account = {
  id: string; role: "business" | "customer"; display_name: string; email: string;
  business_name: string; business_city: string; business_description: string; category: string;
  plan: string; plan_expires_at: string | null; created_at: string; entity_type: string; legal_name: string; tax_id: string; identity_number: string; business_phone: string; business_address: string; business_photo_url: string;
};

export function hashPassword(password: string, salt = randomBytes(16).toString("hex")) {
  return { salt, hash: scryptSync(password, salt, 64).toString("hex") };
}

export function verifyPassword(password: string, salt: string, expected: string) {
  const actual = scryptSync(password, salt, 64);
  const reference = Buffer.from(expected, "hex");
  return actual.length === reference.length && timingSafeEqual(actual, reference);
}

export async function requestAccount(request: Request): Promise<Account | null> {
  const cookie = request.headers.get("cookie") ?? "";
  const token = cookie.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${sessionCookieName}=`))?.slice(sessionCookieName.length + 1);
  if (!token || token.length > 200) return null;
  let decoded = "";
  try { decoded = decodeURIComponent(token); } catch { return null; }
  const tokenHash = createHash("sha256").update(decoded).digest("hex");
  const result = await query(`SELECT a.id, a.role, a.display_name, a.email, a.business_name,
      a.business_city, a.business_description, a.category, a.plan, a.plan_expires_at, a.created_at,
      a.entity_type, a.legal_name, a.tax_id, a.identity_number, a.business_phone, a.business_address, a.business_photo_url
    FROM business_sessions s JOIN business_accounts a ON a.id = s.account_id
    WHERE s.token_hash = $1 AND s.expires_at > $2 AND a.account_status = 'active'
      AND (a.plan_expires_at IS NULL OR a.plan_expires_at > $2)`, [tokenHash, new Date().toISOString()]);
  return (result.rows[0] as unknown as Account | undefined) ?? null;
}

export async function createSession(response: NextResponse, accountId: string) {
  const token = randomBytes(32).toString("base64url");
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const expiresAt = new Date(Date.now() + sessionLifetimeMs).toISOString();
  await query("INSERT INTO business_sessions (token_hash, account_id, expires_at) VALUES ($1, $2, $3)", [tokenHash, accountId, expiresAt]);
  response.cookies.set(sessionCookieName, token, { ...cookieOptions, expires: new Date(expiresAt) });
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



