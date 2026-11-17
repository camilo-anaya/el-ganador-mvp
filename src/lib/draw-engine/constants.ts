// Motor El Ganador — constantes públicas y versionadas.
// Cambiar cualquiera de estos valores exige una nueva versión del motor (ENGINE_VERSION).

export const ENGINE_VERSION = "EG-ENGINE-1.0.0";
export const DERIVATION_ALGORITHM = "HMAC-SHA256/U64-REJECTION-v1";
export const LIST_CANONICALIZATION = "EG-LIST-v1";
export const COMMITMENT_TYPE = "EG-DRAW-COMMITMENT-v1";
export const CERTIFICATE_TYPE = "EG-DRAW-CERTIFICATE-v1";
/** Prefijo de separación de dominio: una firma de El Ganador no sirve para otro tipo de documento. */
export const SIGNATURE_DOMAIN = "EG-SIG-v1\n";

export type DrawMode = "balotas" | "ruleta";
export const DRAW_MODES: readonly DrawMode[] = ["balotas", "ruleta"];
export const BALL_LIMITS = { minEntries: 2, maxEntries: 1000, maxNumber: 9999 } as const;
export const WHEEL_SIZES: readonly number[] = [10, 20, 30, 40, 50];

/** Red pública drand "quicknet" (League of Entropy). Verificado en /info el 3-nov-2026. */
export const DRAND_QUICKNET = {
  network: "quicknet",
  chainHash: "52db9ba70e0cc0f6eaf7803dd07447a1f5477735fd3f661792ba94600c84e971",
  genesisTime: 1692803367,
  period: 3,
  scheme: "bls-unchained-g1-rfc9380",
  relays: ["https://api.drand.sh", "https://drand.cloudflare.com"],
} as const;

/** Momento (segundos Unix) en que se publica la ronda `round`. */
export function drandRoundTime(round: number) {
  return DRAND_QUICKNET.genesisTime + (round - 1) * DRAND_QUICKNET.period;
}

/** Primera ronda publicada en o después del instante `unixSeconds`. */
export function drandFirstRoundAtOrAfter(unixSeconds: number) {
  return Math.max(1, Math.ceil((unixSeconds - DRAND_QUICKNET.genesisTime) / DRAND_QUICKNET.period) + 1);
}
