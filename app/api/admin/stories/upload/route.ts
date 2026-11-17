import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { NextResponse } from "next/server";
import { requestAccount } from "../../../../../lib/auth";
import { uploadObject, usesSupabaseStorage } from "../../../../../lib/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const limit = 35 * 1024 * 1024; // 35 MB para fotos de alta resolución o videos cortos de móvil

export async function POST(request: Request) {
  const account = await requestAccount(request);
  if (!account || account.role !== "business") {
    return NextResponse.json({ error: "Inicia sesión con una cuenta de negocio." }, { status: 401 });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "No pudimos leer el archivo multimedia." }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File) || file.size < 1 || file.size > limit) {
    return NextResponse.json({ error: "Elige una foto o video de máximo 35 MB." }, { status: 400 });
  }

  const mime = file.type.toLowerCase();
  let mediaType: "image" | "video" = "image";
  let ext = "";

  if (mime === "image/jpeg" || mime === "image/jpg") {
    ext = "jpg";
    mediaType = "image";
  } else if (mime === "image/png") {
    ext = "png";
    mediaType = "image";
  } else if (mime === "image/webp") {
    ext = "webp";
    mediaType = "image";
  } else if (mime === "video/mp4") {
    ext = "mp4";
    mediaType = "video";
  } else if (mime === "video/webm") {
    ext = "webm";
    mediaType = "video";
  } else if (mime === "video/quicktime") {
    ext = "mov";
    mediaType = "video";
  } else if (mime.startsWith("video/")) {
    ext = "mp4";
    mediaType = "video";
  } else if (mime.startsWith("image/")) {
    ext = "jpg";
    mediaType = "image";
  } else {
    return NextResponse.json({ error: "Formato no compatible. Sube una foto (JPG, PNG, WebP) o un video (MP4, WebM, MOV)." }, { status: 400 });
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const filename = `${randomUUID()}.${ext}`;

  if (usesSupabaseStorage()) {
    try {
      const mediaUrl = await uploadObject("product-images", `stories/${account.id}/${filename}`, bytes, file.type, true);
      return NextResponse.json({ mediaUrl, mediaType }, { status: 201 });
    } catch (error) {
      console.error("Could not store story media in Supabase Storage", error);
      return NextResponse.json({ error: "No pudimos guardar el archivo en el almacenamiento seguro." }, { status: 500 });
    }
  }

  if (process.env.NODE_ENV === "production" && process.env.VERCEL) {
    return NextResponse.json({ error: "Falta configurar almacenamiento persistente en la nube." }, { status: 503 });
  }

  const directory = join(process.cwd(), "public", "uploads", "stories");
  await mkdir(directory, { recursive: true });
  await writeFile(resolve(directory, filename), bytes, { flag: "wx" });

  return NextResponse.json({ mediaUrl: `/uploads/stories/${filename}`, mediaType }, { status: 201 });
}
