import { randomUUID } from "node:crypto";

const supabaseUrl = () => process.env.SUPABASE_URL?.replace(/\/$/, "") ?? "";
const supabaseKey = () => process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

export function usesSupabaseStorage() {
  return Boolean(supabaseUrl() && supabaseKey());
}

function storageHeaders(contentType?: string) {
  const key = supabaseKey();
  if (!key) throw new Error("Configura SUPABASE_SECRET_KEY en el servidor para almacenar archivos.");
  return {
    apikey: key,
    ...(key.startsWith("sb_secret_") ? {} : { Authorization: `Bearer ${key}` }),
    ...(contentType ? { "Content-Type": contentType } : {}),
  };
}

export async function uploadObject(bucket: string, path: string, bytes: Buffer, contentType: string, isPublic = false) {
  const baseUrl = supabaseUrl();
  if (!baseUrl) throw new Error("Configura SUPABASE_URL en el servidor para almacenar archivos.");
  const safePath = path.split("/").map(encodeURIComponent).join("/");
  const response = await fetch(`${baseUrl}/storage/v1/object/${encodeURIComponent(bucket)}/${safePath}`, {
    method: "POST",
    headers: { ...storageHeaders(contentType), "cache-control": "3600", "x-upsert": "false" },
    body: new Uint8Array(bytes),
    cache: "no-store",
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    console.error("Supabase Storage upload failed", response.status, detail.slice(0, 300));
    throw new Error("No pudimos guardar el archivo en el almacenamiento seguro.");
  }
  return isPublic ? `${baseUrl}/storage/v1/object/public/${encodeURIComponent(bucket)}/${safePath}` : path;
}

export async function removeObject(bucket: string, path: string) {
  const baseUrl = supabaseUrl();
  if (!baseUrl || !supabaseKey()) return;
  const response = await fetch(`${baseUrl}/storage/v1/object/${encodeURIComponent(bucket)}`, {
    method: "DELETE",
    headers: { ...storageHeaders("application/json"), "Content-Type": "application/json" },
    body: JSON.stringify({ prefixes: [path] }),
    cache: "no-store",
  });
  if (!response.ok) console.error("Could not remove orphaned Supabase Storage object", response.status);
}

export function storageObjectId() { return randomUUID(); }
