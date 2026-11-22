// src/lib/nativeActions.ts
export type UserRole = 'buyer' | 'business';

export interface UserSession {
  loggedIn: boolean;
  role: UserRole;
  name: string;
  email: string;
  phone: string;
  city: string;
}

export function getUserSession(): UserSession {
  if (typeof window === 'undefined') {
    return {
      loggedIn: true,
      role: 'buyer',
      name: 'Carlos Pérez',
      email: 'carlos@elganador.co',
      phone: '+57 300 456 7890',
      city: 'Barranquilla, Atlántico',
    };
  }
  const role = (localStorage.getItem('elganador_role') as UserRole) || 'buyer';
  const saved = localStorage.getItem('elganador_session');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      // Fallback limpio
    }
  }
  return {
    loggedIn: true,
    role,
    name: role === 'business' ? 'Motos Caribe Oficial' : 'Carlos Pérez',
    email: role === 'business' ? 'gerencia@motoscaribe.co' : 'carlos@elganador.co',
    phone: '+57 300 456 7890',
    city: 'Barranquilla, Atlántico',
  };
}

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Comprime y redimensiona imágenes del cliente a un tamaño óptimo (máx 1200px, 80% JPEG)
 * para evitar sobrepasar la cuota de 5MB de localStorage y garantizar carga ultrarrápida.
 */
export function compressImageFileToDataUrl(file: File, maxDim = 1200, quality = 0.8): Promise<string> {
  return new Promise((resolve) => {
    if (!file.type.startsWith('image/')) {
      fileToDataUrl(file).then(resolve).catch(() => resolve('/galeria-premios-el-ganador-realista.jpg'));
      return;
    }

    const reader = new FileReader();
    reader.onload = (readerEvent) => {
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          let { width, height } = img;

          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(String(readerEvent.target?.result || ''));
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL('image/jpeg', quality);
          resolve(compressed);
        } catch {
          resolve(String(readerEvent.target?.result || ''));
        }
      };
      img.onerror = () => {
        resolve(String(readerEvent.target?.result || ''));
      };
      img.src = String(readerEvent.target?.result || '');
    };
    reader.onerror = () => {
      resolve('/galeria-premios-el-ganador-realista.jpg');
    };
    reader.readAsDataURL(file);
  });
}

export async function shareRaffleLink(params: {
  title: string;
  text: string;
  path?: string;
}): Promise<'shared' | 'copied'> {
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://elganador.co';
  const fullUrl = `${baseUrl}${params.path || '/'}`;

  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share({
        title: params.title,
        text: `${params.text} — Participa oficial en El Ganador:`,
        url: fullUrl,
      });
      return 'shared';
    } catch {
      // Si el usuario cancela o no soporta share sheet, copia al portapapeles
    }
  }

  if (typeof navigator !== 'undefined' && navigator.clipboard) {
    await navigator.clipboard.writeText(`${params.title}: ${params.text} ${fullUrl}`);
  }
  return 'copied';
}
