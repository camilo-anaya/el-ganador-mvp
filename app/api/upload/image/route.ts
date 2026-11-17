import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { NextResponse } from "next/server";
import { requestAccount } from "../../../../lib/auth";
import { uploadObject, usesSupabaseStorage } from "../../../../lib/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const limit = 8 * 1024 * 1024; // 8 MB

export async function POST(request: Request) {
  const account = await requestAccount(request);
  if (!account) {
    return NextResponse.json({ error: "Inicia sesión para subir fotografías." }, { status: 401 });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "No pudimos leer la imagen enviada." }, { status: 400 });
  }

  const file = form.get("file");
  const folder = form.get("folder") === "kyc" ? "kyc" : "avatars";

  if (!(file instanceof File) || file.size < 1 || file.size > limit) {
    return NextResponse.json({ error: "Elige una fotografía de máximo 8 MB." }, { status: 400 });
  }

  const ext = file.type === "image/jpeg" ? "jpg"
    : file.type === "image/png" ? "png"
    : file.type === "image/webp" ? "webp"
    : "";

  if (!ext) {
    return NextResponse.json({ error: "La imagen debe ser JPG, PNG o WebP." }, { status: 400 });
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const valid = ext === "jpg" ? bytes.length > 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff
    : ext === "png" ? bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
    : bytes.length > 12 && bytes.subarray(0, 4).toString() === "RIFF" && bytes.subarray(8, 12).toString() === "WEBP";

  if (!valid) {
    return NextResponse.json({ error: "El contenido no coincide con un formato de imagen válido." }, { status: 400 });
  }

  const filename = `${randomUUID()}.${ext}`;

  if (usesSupabaseStorage()) {
    try {
      const imageUrl = await uploadObject("product-images", `${folder}/${account.id}/${filename}`, bytes, file.type, true);
      return NextResponse.json({ imageUrl }, { status: 201 });
    } catch (error) {
      console.error("Could not store image in Supabase Storage", error);
      return NextResponse.json({ error: "No pudimos guardar la imagen en el almacenamiento seguro." }, { status: 500 });
    }
  }

  if (process.env.NODE_ENV === "production" && process.env.VERCEL) {
    return NextResponse.json({ error: "Falta configurar almacenamiento persistente en la nube." }, { status: 503 });
  }

  const directory = join(process.cwd(), "public", "uploads", folder);
  await mkdir(directory, { recursive: true });
  await writeFile(resolve(directory, filename), bytes, { flag: "wx" });

  return NextResponse.json({ imageUrl: `/uploads/${folder}/${filename}` }, { status: 201 });
}
