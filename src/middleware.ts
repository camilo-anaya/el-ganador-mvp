// middleware.ts
// Separa en el borde las dos superficies de la app:
//   • Cliente      → "/" y rutas del comprador
//   • Empresarial  → "/empresario/*"
// Es enrutamiento de experiencia (cookie `elganador_surface`); la autorización
// real de datos vive en las APIs.
import { NextResponse, type NextRequest } from 'next/server';

const SURFACE_COOKIE = 'elganador_surface';

/** Rutas que pertenecen SOLO a la superficie cliente privada.
 * Nota: "/" (Marketplace) y "/todos-los-sorteos" son públicos para que los empresarios
 * puedan ver las rifas y publicidad de otros comercios.
 */
const CLIENT_ONLY_PREFIXES = [
  '/favoritos',
  '/perfil',
  '/cuenta',
  '/pago',
  '/chat-premio',
  '/novedades',
];

/** Rutas empresariales antiguas que ahora viven bajo /empresario. */
const LEGACY_BUSINESS_REDIRECTS: Record<string, string> = {
  '/publicidad': '/empresario/publicidad',
  '/crear-rifa': '/empresario/crear-rifa',
};

function isClientOnly(pathname: string) {
  return CLIENT_ONLY_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const surface = req.cookies.get(SURFACE_COOKIE)?.value;

  // 1) URLs empresariales heredadas → ruta nueva (conserva query string)
  const legacyTarget = LEGACY_BUSINESS_REDIRECTS[pathname];
  if (legacyTarget) {
    const url = req.nextUrl.clone();
    url.pathname = legacyTarget;
    return NextResponse.redirect(url);
  }

  // 2) Superficie empresarial: solo con sesión empresarial
  if (pathname === '/empresario' || pathname.startsWith('/empresario/')) {
    if (surface !== 'business') {
      const url = req.nextUrl.clone();
      url.pathname = '/ingreso';
      url.search = '?mode=login&role=business';
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  // 3) Superficie cliente: una sesión empresarial nunca navega aquí
  if (surface === 'business' && isClientOnly(pathname)) {
    const url = req.nextUrl.clone();
    url.pathname = '/empresario';
    url.search = '';
    return NextResponse.redirect(url);
  }

  void search;
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|assets|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico|mp4|webm|json|webmanifest|txt|xml|js|css|map)$).*)',
  ],
};
