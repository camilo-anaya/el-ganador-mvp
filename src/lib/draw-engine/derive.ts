// Derivación del resultado: determinista, reproducible y sin sesgo.
//   mensaje = versión | algoritmo | sorteo | huellaLista | cantidad | aleatoriedadPública
//   bloque_k = HMAC-SHA256(semilla, mensaje | k)
//   cada bloque aporta 4 enteros de 64 bits; se aplica muestreo con rechazo para un índice uniforme.

import { DERIVATION_ALGORITHM, ENGINE_VERSION } from "./constants";
import { EngineInputError, fromHex, hmacSha256, utf8 } from "./bytes";

const TWO_POW_64 = BigInt("18446744073709551616");
const MAX_BLOCKS = 64;

export type PublicRandomnessInput = { round: number; randomness: string } | null;

export type DerivationInput = {
  drawId: string;
  listHash: string;
  entryCount: number;
  seedHex: string;
  publicRandomness: PublicRandomnessInput;
};

export type DerivationResult = { index: number; attempts: number };

export function derivationMessage(input: Omit<DerivationInput, "seedHex">) {
  const randomness = input.publicRandomness
    ? `drand-quicknet:${input.publicRandomness.round}:${input.publicRandomness.randomness}`
    : "none";
  return `${ENGINE_VERSION}|${DERIVATION_ALGORITHM}|${input.drawId}|${input.listHash}|${input.entryCount}|${randomness}`;
}

/** Límite de aceptación: el mayor múltiplo de n que cabe en 2^64. Valores ≥ límite se descartan. */
export function acceptanceLimit(entryCount: number) {
  const n = BigInt(entryCount);
  return TWO_POW_64 - (TWO_POW_64 % n);
}

/** Convierte un entero de 64 bits en índice uniforme o `null` si debe descartarse. */
export function uniformIndexFromU64(value: bigint, entryCount: number): number | null {
  return value < acceptanceLimit(entryCount) ? Number(value % BigInt(entryCount)) : null;
}

export async function deriveWinnerIndex(input: DerivationInput): Promise<DerivationResult> {
  const { entryCount } = input;
  if (!Number.isSafeInteger(entryCount) || entryCount < 1 || entryCount > 1_000_000) throw new EngineInputError("Cantidad de participaciones inválida.");
  const seed = fromHex(input.seedHex, 32);
  const message = derivationMessage(input);
  let attempts = 0;
  for (let counter = 0; counter < MAX_BLOCKS; counter += 1) {
    const block = await hmacSha256(seed, utf8(`${message}|${counter}`));
    const view = new DataView(block.buffer, block.byteOffset, block.byteLength);
    for (let offset = 0; offset < block.byteLength; offset += 8) {
      attempts += 1;
      const index = uniformIndexFromU64(view.getBigUint64(offset, false), entryCount);
      if (index !== null) return { index, attempts };
    }
  }
  // Probabilidad astronómicamente baja (< 2^-256 para n ≤ 1.000.000).
  throw new Error("La derivación no encontró un valor aceptable.");
}
