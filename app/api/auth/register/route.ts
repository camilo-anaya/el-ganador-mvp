import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { NextResponse } from "next/server";
import { createSession, hashPassword, type Account } from "../../../../lib/auth";
import { query, withTransaction } from "../../../../lib/db";
import { plans, type PlanId } from "../../../../lib/plans";
import { removeObject, uploadObject, usesSupabaseStorage } from "../../../../lib/storage";
import { createWompiCheckoutUrl } from "../../../../lib/wompi";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const maxFileSize = 5 * 1024 * 1024;
type PendingDocument = { type: string; file: File; buffer: Buffer; extension: string };
type PendingImage = { file: File; buffer: Buffer; extension: string };
type StoredFile = { bucket: string; path: string; localPath?: string };

function fileExtension(mime: string) {
  return mime === "application/pdf" ? ".pdf" : mime === "image/png" ? ".png" : ".jpg";
}

async function readDocument(form: FormData, key: string, label: string, required: boolean): Promise<PendingDocument | null> {
  const value = form.get(key);
  if (!(value instanceof File) || value.size === 0) {
    if (required) throw new Error(`Adjunta el documento: ${label}.`);
    return null;
  }
  if (value.size > maxFileSize) throw new Error(`${label}: el archivo no puede superar 5 MB.`);
  if (!["application/pdf", "image/jpeg", "image/png"].includes(value.type)) throw new Error(`${label}: usa un archivo PDF, JPG o PNG.`);
  const buffer = Buffer.from(await value.arrayBuffer());
  const valid = value.type === "application/pdf" ? buffer.subarray(0, 5).toString("ascii") === "%PDF-"
    : value.type === "image/png" ? buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
      : buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  if (!valid) throw new Error(`${label}: el contenido del archivo no coincide con su formato.`);
  return { type: label, file: value, buffer, extension: fileExtension(value.type) };
}

async function readBusinessPhoto(form: FormData): Promise<PendingImage | null> {
  const value = form.get("businessPhoto");
  if (!(value instanceof File) || value.size === 0) return null;
  if (value.size > 8 * 1024 * 1024) throw new Error("La foto del negocio no puede superar 8 MB.");
  const extensions: Record<string, string> = { "image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp" };
  if (!extensions[value.type]) throw new Error("La foto del negocio debe ser JPG, PNG o WebP.");
  const buffer = Buffer.from(await value.arrayBuffer());
  const valid = value.type === "image/jpeg" ? buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff
    : value.type === "image/png" ? buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
      : buffer.length >= 12 && buffer.subarray(0, 4).toString("ascii") === "RIFF" && buffer.subarray(8, 12).toString("ascii") === "WEBP";
  if (!valid) throw new Error("El contenido de la foto no coincide con su formato.");
  return { file: value, buffer, extension: extensions[value.type] };
}

async function storeFile(bucket: string, path: string, bytes: Buffer, mime: string, isPublic: boolean, localPath?: string) {
  if (usesSupabaseStorage()) {
    const url = await uploadObject(bucket, path, bytes, mime, isPublic);
    return { bucket, path, url };
  }
  if (process.env.NODE_ENV === "production" || process.env.DATABASE_URL) throw new Error("Falta configurar el almacenamiento persistente de Supabase.");
  if (!localPath) throw new Error("No se definió una ruta local para el archivo.");
  await mkdir(dirname(localPath), { recursive: true });
  await writeFile(localPath, bytes, { flag: "wx" });
  return { bucket, path, url: localPath, localPath };
}

async function removeStoredFile(file: StoredFile) {
  if (file.localPath) await unlink(file.localPath).catch(() => undefined);
  else await removeObject(file.bucket, file.path).catch(() => undefined);
}

export async function POST(request: Request) {
  const isMultipart = request.headers.get("content-type")?.includes("multipart/form-data") ?? false;
  let data: Record<string, unknown>;
  let files: PendingDocument[] = [];
  let businessPhoto: PendingImage | null = null;
  let legalFields = { entityType: "", legalName: "", taxId: "", identityNumber: "", phone: "", address: "" };
  try {
    if (isMultipart) {
      const form = await request.formData();
      const fields = ["role", "displayName", "email", "password", "businessName", "category", "city", "description", "plan", "entityType", "legalName", "taxId", "identityNumber", "phone", "address"];
      data = Object.fromEntries(fields.map((key) => [key, form.get(key)]));
      legalFields = {
        entityType: String(form.get("entityType") ?? ""), legalName: String(form.get("legalName") ?? "").trim(),
        taxId: String(form.get("taxId") ?? "").trim(), identityNumber: String(form.get("identityNumber") ?? "").trim(),
        phone: String(form.get("phone") ?? "").trim(), address: String(form.get("address") ?? "").trim(),
      };
      if (data.role === "business") {
        if (!(legalFields.entityType === "natural" || legalFields.entityType === "legal")) throw new Error("Selecciona si el titular es persona natural o persona jurídica.");
        const identity = await readDocument(form, "identityDocument", "Documento de identidad del titular o representante legal", true);
        const rut = await readDocument(form, "rutDocument", "RUT", legalFields.entityType === "legal");
        const chamber = await readDocument(form, "chamberDocument", "Certificado de existencia y representación legal (Cámara de Comercio)", legalFields.entityType === "legal");
        files = [identity, rut, chamber].filter((file): file is PendingDocument => file !== null);
        businessPhoto = await readBusinessPhoto(form);
      }
    } else {
      const body: unknown = await request.json();
      if (!body || typeof body !== "object" || Array.isArray(body)) throw new Error("Revisa los datos del formulario.");
      data = body as Record<string, unknown>;
    }
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Revisa los datos del formulario." }, { status: 400 });
  }

  const role = data.role === "business" ? "business" : data.role === "customer" ? "customer" : "";
  const displayName = typeof data.displayName === "string" ? data.displayName.trim() : "";
  const email = typeof data.email === "string" ? data.email.trim().toLowerCase() : "";
  const password = typeof data.password === "string" ? data.password : "";
  const businessName = typeof data.businessName === "string" ? data.businessName.trim() : "";
  const category = typeof data.category === "string" ? data.category.trim() : "";
  const city = typeof data.city === "string" ? data.city.trim() : "";
  const description = typeof data.description === "string" ? data.description.trim() : "";
  const hasBusinessPlan = typeof data.plan === "string" && Object.hasOwn(plans, data.plan);
  if (role === "business" && !hasBusinessPlan) return NextResponse.json({ error: "Selecciona uno de los cuatro planes pagos o la demo gratis." }, { status: 400 });
  const requestedPlan = hasBusinessPlan ? data.plan as PlanId : "gratis";
  const plan = role === "business" ? requestedPlan : "gratis";
  const paymentRequired = role === "business" && !plans[requestedPlan].demoOnly;
  const paymentReference = paymentRequired ? randomUUID().replaceAll("-", "") : "";
  const amountInCents = paymentRequired ? plans[requestedPlan].subscriptionPrice * 100 : 0;
  const validPassword = role === "business"
    ? password.length >= 10 && password.length <= 20 && /(?=.*\p{Lu})(?=.*[^\p{L}\p{N}]).{10,20}/u.test(password)
    : password.length >= 10 && password.length <= 128;
  if (!role || displayName.length < 2 || displayName.length > 100 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254 || !validPassword) return NextResponse.json({ error: role === "business" ? "La contraseña debe tener entre 10 y 20 caracteres, con al menos una mayúscula y un símbolo." : "Completa nombre, correo y contraseña (mínimo 10 caracteres)." }, { status: 400 });
  if (role === "business" && (!isMultipart || businessName.length < 2 || businessName.length > 100 || category.length < 2 || category.length > 50 || city.length < 2 || city.length > 100 || description.length > 500)) return NextResponse.json({ error: "Completa los datos del local y sus soportes legales." }, { status: 400 });
  if (role === "business") {
    const { entityType, legalName, taxId, identityNumber, phone, address } = legalFields;
    if (legalName.length < 3 || legalName.length > 150 || identityNumber.length < 5 || identityNumber.length > 30 || !/^[+()\d\s.-]{7,24}$/.test(phone) || address.length < 5 || address.length > 180 || taxId.length > 30 || (entityType === "legal" && taxId.length < 5) || (entityType === "natural" && taxId.length > 0 && taxId.length < 5)) return NextResponse.json({ error: "Completa razón social o nombre legal, identificación, teléfono y dirección válidos. La persona jurídica también debe indicar el NIT." }, { status: 400 });
  }

  let checkoutUrl = "";
  if (paymentRequired) {
    try {
      checkoutUrl = createWompiCheckoutUrl({ requestUrl: request.url, reference: paymentReference, amountInCents });
    } catch (error) {
      return NextResponse.json({ error: error instanceof Error ? error.message : "No pudimos preparar el pago Wompi." }, { status: 503 });
    }
  }

  const existing = await query("SELECT 1 AS found FROM business_accounts WHERE lower(email) = $1 LIMIT 1", [email]);
  if (existing.rows.length) return NextResponse.json({ error: "Ya hay una cuenta con ese correo." }, { status: 409 });
  const id = randomUUID();
  const { salt, hash } = hashPassword(password);
  const saved: StoredFile[] = [];
  let businessPhotoUrl = "";
  const now = new Date().toISOString();
  try {
    for (const item of files) {
      const fileId = randomUUID();
      const path = `${id}/${fileId}${item.extension}`;
      const localPath = resolve(process.cwd(), "data", "private-business-documents", `${fileId}${item.extension}`);
      const stored = await storeFile("business-documents", path, item.buffer, item.file.type, false, localPath);
      saved.push(stored);
    }
    if (businessPhoto) {
      const photoId = randomUUID();
      const path = `${id}/${photoId}${businessPhoto.extension}`;
      const localPath = resolve(process.cwd(), "public", "uploads", "business", `${photoId}${businessPhoto.extension}`);
      const stored = await storeFile("business-photos", path, businessPhoto.buffer, businessPhoto.file.type, true, localPath);
      saved.push(stored);
      if (usesSupabaseStorage()) businessPhotoUrl = stored.url;
      else businessPhotoUrl = `/uploads/business/${photoId}${businessPhoto.extension}`;
    }

    const account = await withTransaction(async (tx) => {
      await tx.query(`INSERT INTO business_accounts
        (id, role, display_name, email, password_salt, password_hash, business_name, business_city, business_description, category, plan, created_at,
         entity_type, legal_name, tax_id, identity_number, business_phone, business_address, business_photo_url, account_status)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)`,
      [id, role, displayName, email, salt, hash, role === "business" ? businessName : "", role === "business" ? city : "", role === "business" ? description : "", role === "business" ? category : "", plan, now,
        role === "business" ? legalFields.entityType : "", role === "business" ? legalFields.legalName : "", role === "business" ? legalFields.taxId : "", role === "business" ? legalFields.identityNumber : "", role === "business" ? legalFields.phone : "", role === "business" ? legalFields.address : "", role === "business" ? businessPhotoUrl : "", paymentRequired ? "pending_payment" : "active"]);
      let storedIndex = 0;
      for (const item of files) {
        const storage = saved[storedIndex++];
        const storagePath = storage.localPath ?? storage.path;
        await tx.query(`INSERT INTO business_documents (id, admin, account_id, document_type, file_name, mime_type, storage_path, review_status, uploaded_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending', $8)`,
        [storage.path.split("/").at(-1)?.split(".")[0] ?? randomUUID(), businessName, id, item.type, item.file.name.slice(0, 200) || `documento${item.extension}`, item.file.type, storagePath, now]);
      }
      const accountResult = await tx.query(`SELECT id, role, display_name, email, business_name, business_city, business_description, category, plan, plan_expires_at, created_at,
          entity_type, legal_name, tax_id, identity_number, business_phone, business_address, business_photo_url, account_status
        FROM business_accounts WHERE id = $1`, [id]);
      if (paymentRequired) {
        await tx.query(`INSERT INTO plan_payments (id, account_id, plan_id, reference, amount_in_cents, currency, status, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, 'COP', 'PENDING', $6, $7)`, [randomUUID(), id, requestedPlan, paymentReference, amountInCents, now, now]);
      }
      return accountResult.rows[0] as Account & { account_status: string };
    });

    if (paymentRequired) {
      return NextResponse.json({ checkoutUrl, message: "Tu cuenta quedó pendiente de pago. Wompi confirmará la transacción antes de habilitar el acceso." }, { status: 201 });
    }
    return await createSession(NextResponse.json({ account }, { status: 201 }), id);
  } catch (error) {
    await Promise.all(saved.map(removeStoredFile));
    console.error("Could not save account and its files", error);
    const code = typeof error === "object" && error && "code" in error ? String(error.code) : "";
    if (code === "23505" || (error instanceof Error && /UNIQUE constraint failed/i.test(error.message))) return NextResponse.json({ error: "Ya hay una cuenta con ese correo." }, { status: 409 });
    return NextResponse.json({ error: "No pudimos guardar la cuenta y sus documentos. Inténtalo de nuevo." }, { status: 500 });
  }
}
