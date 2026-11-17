import { NextResponse } from "next/server";
import { hashPassword, requestAccount, verifyPassword } from "../../../../lib/auth";
import { query, withTransaction } from "../../../../lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const account = await requestAccount(request);
  if (!account || account.role !== "business") return NextResponse.json({ error: "Inicia sesión con una cuenta de negocio." }, { status: 401 });
  return NextResponse.json({ account });
}

export async function PATCH(request: Request) {
  const account = await requestAccount(request);
  if (!account || account.role !== "business") return NextResponse.json({ error: "Inicia sesión con una cuenta de negocio." }, { status: 401 });

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Revisa los datos enviados." }, { status: 400 });
  }

  // 1. CAMBIO DE CONTRASEÑA
  if (body.action === "change_password") {
    const currentPassword = typeof body.currentPassword === "string" ? body.currentPassword : "";
    const newPassword = typeof body.newPassword === "string" ? body.newPassword : "";

    if (!currentPassword || !newPassword || newPassword.length < 8) {
      return NextResponse.json({ error: "La nueva contraseña debe tener al menos 8 caracteres." }, { status: 400 });
    }

    const userRes = await query("SELECT password_salt, password_hash FROM business_accounts WHERE id = $1", [account.id]);
    const userRow = userRes.rows[0] as { password_salt: string; password_hash: string } | undefined;
    if (!userRow || !verifyPassword(currentPassword, userRow.password_salt, userRow.password_hash)) {
      return NextResponse.json({ error: "La contraseña actual es incorrecta." }, { status: 400 });
    }

    const { salt, hash } = hashPassword(newPassword);
    await query("UPDATE business_accounts SET password_salt = $1, password_hash = $2 WHERE id = $3", [salt, hash, account.id]);
    return NextResponse.json({ message: "Contraseña actualizada exitosamente." });
  }

  // 2. ACTUALIZACIÓN DE DATOS BANCARIOS (PARA DESEMBOLSOS)
  if (body.action === "update_bank") {
    const bankName = typeof body.bankName === "string" ? body.bankName.trim() : "";
    const bankAccountType = typeof body.bankAccountType === "string" ? body.bankAccountType.trim() : "Ahorros";
    const bankAccountNumber = typeof body.bankAccountNumber === "string" ? body.bankAccountNumber.trim() : "";
    const bankAccountHolder = typeof body.bankAccountHolder === "string" ? body.bankAccountHolder.trim() : "";
    const bankAccountDoc = typeof body.bankAccountDoc === "string" ? body.bankAccountDoc.trim() : "";

    if (!bankName || !bankAccountNumber || !bankAccountHolder) {
      return NextResponse.json({ error: "Completa el banco, número de cuenta y titular." }, { status: 400 });
    }

    await query(`
      UPDATE business_accounts
      SET bank_name = $1, bank_account_type = $2, bank_account_number = $3, bank_account_holder = $4, bank_account_doc = $5
      WHERE id = $6
    `, [bankName, bankAccountType, bankAccountNumber, bankAccountHolder, bankAccountDoc, account.id]);

    return NextResponse.json({ message: "Datos bancarios para desembolsos guardados con éxito." });
  }

  // 3. ACTUALIZACIÓN DE PERFIL PÚBLICO Y DATOS PERSONALES
  const name = typeof body.name === "string" ? body.name.trim() : account.business_name;
  const city = typeof body.city === "string" ? body.city.trim() : account.business_city;
  const description = typeof body.description === "string" ? body.description.trim() : account.business_description;
  const category = typeof body.category === "string" ? body.category.trim() : account.category;
  const legalName = typeof body.legalName === "string" ? body.legalName.trim() : account.legal_name;
  const identityNumber = typeof body.identityNumber === "string" ? body.identityNumber.trim() : account.identity_number;
  const taxId = typeof body.taxId === "string" ? body.taxId.trim() : account.tax_id;
  const email = typeof body.email === "string" && body.email.trim() ? body.email.trim().toLowerCase() : account.email;
  const phone = typeof body.phone === "string" ? body.phone.trim() : account.business_phone;
  const address = typeof body.address === "string" ? body.address.trim() : account.business_address;
  const photoUrl = typeof body.photoUrl === "string" ? body.photoUrl.trim() : account.business_photo_url;
  const bannerUrl = typeof body.bannerUrl === "string" ? body.bannerUrl.trim() : (account.business_banner_url || "");

  if (name.length < 2 || name.length > 100) {
    return NextResponse.json({ error: "El nombre del local debe tener entre 2 y 100 caracteres." }, { status: 400 });
  }

  await withTransaction(async (tx) => {
    await tx.query(`
      UPDATE business_accounts 
      SET business_name = $1, business_city = $2, business_description = $3, category = $4,
          legal_name = $5, identity_number = $6, tax_id = $7, business_phone = $8, business_address = $9,
          business_photo_url = $10, email = $11, business_banner_url = $12
      WHERE id = $13
    `, [name, city, description, category, legalName, identityNumber, taxId, phone, address, photoUrl, email, bannerUrl, account.id]);

    await tx.query(`
      UPDATE draws 
      SET admin = $1, business_city = $2, business_description = $3, business_photo_url = $4, business_banner_url = $5 
      WHERE owner_id = $6
    `, [name, city || "Colombia", description, photoUrl, bannerUrl, account.id]);
  });

  return NextResponse.json({ message: "Perfil y datos del negocio actualizados exitosamente." });
}
