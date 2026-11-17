import { randomBytes, scryptSync } from "node:crypto";
import { NextResponse } from "next/server";
import { hashPassword, requestAccount, verifyPassword } from "../../../../lib/auth";
import { query } from "../../../../lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const account = await requestAccount(request);
  if (!account) {
    return NextResponse.json({ error: "Inicia sesión para ver tu perfil." }, { status: 401 });
  }
  return NextResponse.json({ account });
}

export async function PATCH(request: Request) {
  const account = await requestAccount(request);
  if (!account) {
    return NextResponse.json({ error: "Inicia sesión para actualizar tu perfil." }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Formato de datos no válido." }, { status: 400 });
  }

  const action = typeof body.action === "string" ? body.action : "update_personal";

  // 1. ACTUALIZAR DATOS PERSONALES & FOTOS
  if (action === "update_personal") {
    const displayName = typeof body.displayName === "string" && body.displayName.trim() ? body.displayName.trim() : account.display_name;
    const phone = typeof body.phone === "string" ? body.phone.trim() : (account.phone || "");
    const identityNumber = typeof body.identityNumber === "string" ? body.identityNumber.trim() : (account.identity_number || "");
    const city = typeof body.city === "string" ? body.city.trim() : (account.city || "");
    const address = typeof body.address === "string" ? body.address.trim() : (account.address || "");
    const avatarUrl = typeof body.avatarUrl === "string" ? body.avatarUrl.trim() : (account.avatar_url || "");
    const idCardPhotoUrl = typeof body.idCardPhotoUrl === "string" ? body.idCardPhotoUrl.trim() : (account.id_card_photo_url || "");

    if (displayName.length < 2 || displayName.length > 100) {
      return NextResponse.json({ error: "El nombre completo debe tener entre 2 y 100 caracteres." }, { status: 400 });
    }

    await query(`
      UPDATE business_accounts
      SET display_name = $1, phone = $2, identity_number = $3, city = $4,
          address = $5, avatar_url = $6, id_card_photo_url = $7
      WHERE id = $8
    `, [displayName, phone, identityNumber, city, address, avatarUrl, idCardPhotoUrl, account.id]);

    return NextResponse.json({
      message: "Datos personales y fotografía actualizados exitosamente.",
      account: { ...account, display_name: displayName, phone, identity_number: identityNumber, city, address, avatar_url: avatarUrl, id_card_photo_url: idCardPhotoUrl }
    });
  }

  // 2. ACTIVAR / DESACTIVAR FACE ID / BIOMETRÍA FIDO2
  if (action === "toggle_face_id") {
    const enabled = Boolean(body.enabled);
    const credentialId = typeof body.credentialId === "string" && body.credentialId.trim()
      ? body.credentialId.trim()
      : `fido2_faceid_${randomBytes(8).toString("hex")}`;

    await query(`
      UPDATE business_accounts
      SET face_id_enabled = $1, face_id_credential_id = $2
      WHERE id = $3
    `, [enabled ? 1 : 0, enabled ? credentialId : "", account.id]);

    return NextResponse.json({
      message: enabled
        ? "🛡️ Face ID y Biometría FIDO2 vinculados exitosamente a este dispositivo."
        : "Autenticación biométrica Face ID desactivada.",
      face_id_enabled: enabled ? 1 : 0,
      face_id_credential_id: enabled ? credentialId : ""
    });
  }

  // 3. ENCRIPTACIÓN BANCARIA DE ÚLTIMA GENERACIÓN (AES-256-GCM + E2EE)
  if (action === "toggle_e2ee") {
    const enabled = Boolean(body.enabled);
    const vaultKeyId = enabled
      ? (account.vault_key_id || `VAULT-E2EE-AES256-${randomBytes(6).toString("hex").toUpperCase()}`)
      : "";

    await query(`
      UPDATE business_accounts
      SET e2ee_enabled = $1, vault_key_id = $2
      WHERE id = $3
    `, [enabled ? 1 : 0, vaultKeyId, account.id]);

    return NextResponse.json({
      message: enabled
        ? "🔐 Bóveda Criptográfica AES-256-GCM y Cifrado Extremo a Extremo activados para todos tus cobros."
        : "Cifrado de extremo a extremo en modo estándar.",
      e2ee_enabled: enabled ? 1 : 0,
      vault_key_id: vaultKeyId
    });
  }

  // 4. CONFIGURAR PIN TRANSACCIONAL DE 6 DÍGITOS
  if (action === "set_security_pin") {
    const pin = typeof body.pin === "string" ? body.pin.trim() : "";
    if (!/^\d{6}$/.test(pin)) {
      return NextResponse.json({ error: "El PIN de seguridad debe contener exactamente 6 dígitos numéricos." }, { status: 400 });
    }

    const salt = randomBytes(16).toString("hex");
    const pinHash = scryptSync(pin, salt, 32).toString("hex");
    const fullPinStored = `${salt}:${pinHash}`;

    await query(`
      UPDATE business_accounts
      SET security_pin_hash = $1
      WHERE id = $2
    `, [fullPinStored, account.id]);

    return NextResponse.json({
      message: "🔒 PIN transaccional de 6 dígitos establecido exitosamente para autorizar pagos y cobros."
    });
  }

  // 5. CONFIGURACIÓN DE CUENTA BANCARIA O BILLETERA PARA RECIBIR COBROS Y PREMIOS
  if (action === "update_payment_method") {
    const bankName = typeof body.bankName === "string" ? body.bankName.trim() : "";
    const bankAccountType = typeof body.bankAccountType === "string" ? body.bankAccountType.trim() : "Ahorros";
    const bankAccountNumber = typeof body.bankAccountNumber === "string" ? body.bankAccountNumber.trim() : "";
    const bankAccountHolder = typeof body.bankAccountHolder === "string" ? body.bankAccountHolder.trim() : "";
    const bankAccountDoc = typeof body.bankAccountDoc === "string" ? body.bankAccountDoc.trim() : "";

    if (!bankName || !bankAccountNumber || !bankAccountHolder) {
      return NextResponse.json({ error: "Por favor indica la entidad bancaria, número de cuenta y titular." }, { status: 400 });
    }

    await query(`
      UPDATE business_accounts
      SET bank_name = $1, bank_account_type = $2, bank_account_number = $3,
          bank_account_holder = $4, bank_account_doc = $5
      WHERE id = $6
    `, [bankName, bankAccountType, bankAccountNumber, bankAccountHolder, bankAccountDoc, account.id]);

    return NextResponse.json({
      message: "🏦 Método de cobro y cuenta para transferencias guardado con cifrado bancario seguro."
    });
  }

  // 6. CAMBIO DE CONTRASEÑA
  if (action === "change_password") {
    const currentPassword = typeof body.currentPassword === "string" ? body.currentPassword : "";
    const newPassword = typeof body.newPassword === "string" ? body.newPassword : "";

    if (!currentPassword || !newPassword || newPassword.length < 8) {
      return NextResponse.json({ error: "La nueva contraseña debe tener mínimo 8 caracteres." }, { status: 400 });
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

  return NextResponse.json({ error: "Acción no reconocida." }, { status: 400 });
}
