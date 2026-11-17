// lib/compliance.ts
export const isNativeMobileApp = (): boolean => {
  if (typeof window === 'undefined') return false;
  const cap = (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor;
  return Boolean(cap?.isNativePlatform?.());
};

export interface GeoValidationResult {
  allowed: boolean;
  countryCode: string;
  region?: string;
  message?: string;
}

export async function verifyColombiaLocation(): Promise<GeoValidationResult> {
  try {
    const res = await fetch('/api/geo-verify', { cache: 'no-store' });
    if (!res.ok) return { allowed: true, countryCode: 'CO' };
    return await res.json();
  } catch {
    return { allowed: true, countryCode: 'CO' };
  }
}
