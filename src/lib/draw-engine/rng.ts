// Envoltura CSPRNG de Node.js con autoverificación de salud (Health Check / Self-Test)
// según prácticas recomendadas por estándares como NIST SP 800-90A/B.

import { randomBytes } from "node:crypto";
import { toHex } from "./bytes";

let isHealthy = false;

/**
 * Autoverificación al arrancar el motor en el proceso:
 * Comprueba que el CSPRNG del sistema operativo esté operativo y devuelva entropía válida.
 */
export function runRngSelfTest(): boolean {
  try {
    const sample1 = randomBytes(32);
    const sample2 = randomBytes(32);

    if (sample1.length !== 32 || sample2.length !== 32) {
      throw new Error("Longitud de muestra del CSPRNG inválida.");
    }

    // Verificar que dos muestras consecutivas de 32 bytes no sean idénticas
    let identical = true;
    for (let i = 0; i < 32; i += 1) {
      if (sample1[i] !== sample2[i]) {
        identical = false;
        break;
      }
    }

    if (identical) {
      throw new Error("Falla catastrófica en el generador de entropía del sistema: muestras idénticas.");
    }

    isHealthy = true;
    return true;
  } catch (error) {
    isHealthy = false;
    throw error;
  }
}

/**
 * Genera una semilla criptográfica segura de 256 bits (32 bytes).
 */
export function generateSecureSeed(): { seedBytes: Uint8Array; seedHex: string } {
  if (!isHealthy) {
    runRngSelfTest();
  }

  const buf = randomBytes(32);
  const seedBytes = new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);
  return {
    seedBytes,
    seedHex: toHex(seedBytes),
  };
}
