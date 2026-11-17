// lib/supabase.ts
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey || supabaseAnonKey === 'tu-anon-key-publica') {
  console.warn('⚠️ Faltan las variables de entorno de Supabase en tu .env.local');
}

// Instancia oficial de cliente Supabase
export const supabase: SupabaseClient = createClient(
  supabaseUrl || 'https://reabawvvduiibgjhqrbo.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  { auth: { persistSession: true } }
);

export function getSupabaseClient(): SupabaseClient | null {
  if (!supabaseUrl || !supabaseAnonKey || supabaseAnonKey === 'placeholder-key' || supabaseAnonKey === 'tu-anon-key-publica') {
    return null;
  }
  return supabase;
}

export interface UploadResult {
  url: string;
  path: string;
  isMock: boolean;
  error?: string;
}

/**
 * Función oficial: Sube cualquier archivo multimedia (imágenes, fotos de premios, comprobantes)
 * a Supabase Storage (bucket por defecto: 'elganador-storage') devolviendo directamente la URL pública.
 */
export async function uploadMediaToSupabase(
  file: File,
  bucketName: string = 'elganador-storage'
): Promise<string> {
  const fileExt = file.name ? file.name.split('.').pop() : 'png';
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;

  // Si no hay credenciales activas o estamos en modo offline, genera URL local para no bloquear la interfaz
  if (!supabaseAnonKey || supabaseAnonKey === 'placeholder-key' || supabaseAnonKey === 'tu-anon-key-publica') {
    return URL.createObjectURL(file);
  }

  const { error } = await supabase.storage.from(bucketName).upload(fileName, file, {
    cacheControl: '3600',
    upsert: false,
  });

  if (error) {
    console.error('Error subiendo archivo a Supabase Storage:', error.message);
    throw new Error('Fallo al subir el archivo multimedia a la nube.');
  }

  const { data: publicUrlData } = supabase.storage.from(bucketName).getPublicUrl(fileName);
  return publicUrlData.publicUrl;
}

/**
 * Sube un archivo (video hasta 120s o imagen) a Supabase Storage (bucket 'stories' o 'media')
 */
export async function uploadStoryToSupabase(
  file: File,
  merchantId: string = 'empresa_demo'
): Promise<UploadResult> {
  const fileExt = file.name ? file.name.split('.').pop() : 'mp4';
  const fileName = `${merchantId}/${Date.now()}_story.${fileExt}`;

  if (!supabaseAnonKey || supabaseAnonKey === 'placeholder-key' || supabaseAnonKey === 'tu-anon-key-publica') {
    const objectUrl = URL.createObjectURL(file);
    return {
      url: objectUrl,
      path: fileName,
      isMock: true,
    };
  }

  try {
    const bucket = 'stories';
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: true,
      });

    if (error) {
      console.warn('Error subiendo a Supabase Storage (bucket stories):', error.message);
      return {
        url: URL.createObjectURL(file),
        path: fileName,
        isMock: true,
        error: error.message,
      };
    }

    const { data: publicData } = supabase.storage.from(bucket).getPublicUrl(data.path);
    return {
      url: publicData.publicUrl,
      path: data.path,
      isMock: false,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn('Excepción en uploadStoryToSupabase:', msg);
    return {
      url: URL.createObjectURL(file),
      path: fileName,
      isMock: true,
      error: msg,
    };
  }
}

/**
 * Sube documentos de validación KYB (RUT, Cámara de Comercio, Cédula) a Supabase Storage
 */
export async function uploadKybDocumentToSupabase(
  file: File,
  merchantId: string,
  docType: 'rut' | 'camara_comercio' | 'cedula' | 'otro'
): Promise<UploadResult> {
  const fileExt = file.name ? file.name.split('.').pop() : 'pdf';
  const fileName = `${merchantId}/${docType}_${Date.now()}.${fileExt}`;

  if (!supabaseAnonKey || supabaseAnonKey === 'placeholder-key' || supabaseAnonKey === 'tu-anon-key-publica') {
    return {
      url: URL.createObjectURL(file),
      path: fileName,
      isMock: true,
    };
  }

  try {
    const bucket = 'kyb-documents';
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: true,
      });

    if (error) {
      return {
        url: URL.createObjectURL(file),
        path: fileName,
        isMock: true,
        error: error.message,
      };
    }

    const { data: publicData } = supabase.storage.from(bucket).getPublicUrl(data.path);
    return {
      url: publicData.publicUrl,
      path: data.path,
      isMock: false,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      url: URL.createObjectURL(file),
      path: fileName,
      isMock: true,
      error: msg,
    };
  }
}

/**
 * Subida segura de documentos legales a Supabase Storage (resoluciones, kyb-docs)
 * Sube el archivo al bucket 'legal-docs' y obtiene la URL pública del archivo.
 */
export async function uploadLegalDocument(
  file: File,
  folder: 'resoluciones' | 'kyb-docs' | 'pagos' | 'comprobantes' = 'pagos'
): Promise<string> {
  const fileExt = file.name ? file.name.split('.').pop() : 'pdf';
  const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

  // Si no hay credenciales activas, genera URL local de objeto para no bloquear el flujo
  if (!supabaseAnonKey || supabaseAnonKey === 'placeholder-key' || supabaseAnonKey === 'tu-anon-key-publica') {
    return URL.createObjectURL(file);
  }

  // Sube el archivo al bucket llamado 'legal-docs' en Supabase
  const { error } = await supabase.storage
    .from('legal-docs')
    .upload(fileName, file, { cacheControl: '3600', upsert: false });

  if (error) {
    console.error('Error al subir archivo a Supabase Storage:', error.message);
    throw new Error('No se pudo completar la subida del documento legal.');
  }

  // Obtiene la URL pública del archivo subido
  const { data: publicUrlData } = supabase.storage
    .from('legal-docs')
    .getPublicUrl(fileName);

  return publicUrlData.publicUrl;
}
