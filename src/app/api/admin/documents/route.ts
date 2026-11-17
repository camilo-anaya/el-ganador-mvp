import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import { dirname, extname, resolve } from "node:path";
import { NextResponse } from "next/server";
import { requestAccount } from "../../../../lib/auth";
import { query } from "../../../../lib/db";
import { removeObject, uploadObject, usesSupabaseStorage } from "../../../../lib/storage";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const maxFileSize = 5 * 1024 * 1024;

export async function GET(request: Request) {
  const account = await requestAccount(request);
  if (!account || account.role !== "business") return NextResponse.json({ error: "Inicia sesión con una cuenta de negocio." }, { status: 401 });
  const { rows: documents } = await query(`SELECT id, document_type, file_name, mime_type, review_status, uploaded_at
    FROM business_documents WHERE account_id = $1 ORDER BY uploaded_at DESC`, [account.id]);
  return NextResponse.json({ documents });
}

export async function POST(request: Request) {
  const account = await requestAccount(request);
  if (!account || account.role !== "business") return NextResponse.json({ error: "Inicia sesión con una cuenta de negocio." }, { status: 401 });
  let form: FormData; try { form = await request.formData(); } catch { return NextResponse.json({ error: "No pudimos leer el archivo." }, { status: 400 }); }
  const documentType = String(form.get("documentType") ?? "").trim(); const file = form.get("file");
  if (documentType.length < 3 || documentType.length > 120 || !(file instanceof File)) return NextResponse.json({ error: "Indica el tipo de documento y el archivo." }, { status: 400 });
  if (file.size < 1 || file.size > maxFileSize) return NextResponse.json({ error: "El archivo no puede superar 5 MB." }, { status: 400 });
  if (!["application/pdf", "image/jpeg", "image/png"].includes(file.type)) return NextResponse.json({ error: "Por ahora solo aceptamos PDF, JPG y PNG." }, { status: 400 });
  const bytes = Buffer.from(await file.arrayBuffer());
  const valid = file.type === "application/pdf" ? bytes.subarray(0, 5).toString("ascii") === "%PDF-"
    : file.type === "image/png" ? bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
      : bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (!valid) return NextResponse.json({ error: "El contenido no coincide con el formato del archivo." }, { status: 400 });
  const id = randomUUID(); const extension = file.type === "application/pdf" ? ".pdf" : file.type === "image/png" ? ".png" : ".jpg";
  const objectPath = `${account.id}/${id}${extension}`;
  const localPath = resolve(process.cwd(), "data", "private-business-documents", `${id}${extension}`);
  let storagePath = objectPath;
  try {
    if (usesSupabaseStorage()) await uploadObject("business-documents", objectPath, bytes, file.type);
    else {
      if (process.env.NODE_ENV === "production" || process.env.DATABASE_URL) throw new Error("Falta configurar el almacenamiento persistente de Supabase.");
      await mkdir(dirname(localPath), { recursive: true }); await writeFile(localPath, bytes, { flag: "wx" }); storagePath = localPath;
    }
    await query(`INSERT INTO business_documents (id, admin, account_id, document_type, file_name, mime_type, storage_path, review_status, uploaded_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending', $8)`,
    [id, account.business_name, account.id, documentType, file.name.slice(0, 200) || `documento${extname(file.name)}`, file.type, storagePath, new Date().toISOString()]);
  } catch (error) {
    if (storagePath === objectPath && usesSupabaseStorage()) await removeObject("business-documents", objectPath).catch(() => undefined);
    else await unlink(localPath).catch(() => undefined);
    console.error("Could not save private document metadata", error);
    return NextResponse.json({ error: "No pudimos guardar el archivo y el registro del documento." }, { status: 500 });
  }
  return NextResponse.json({ message: "Archivo recibido. Quedó pendiente de revisión." }, { status: 201 });
}
