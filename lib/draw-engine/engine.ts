// Orquestador del Motor de Sorteos El Ganador (Lifecycle Manager).
// Garantiza el ciclo estricto: Lista congelada -> Compromiso previo -> Ejecución determinista -> Constancia firmada.

import {
  CERTIFICATE_TYPE, COMMITMENT_TYPE, DERIVATION_ALGORITHM, DRAND_QUICKNET, ENGINE_VERSION,
  LIST_CANONICALIZATION, drandFirstRoundAtOrAfter, drandRoundTime, type DrawMode,
} from "./constants";
import { sha256Hex } from "./bytes";
import { canonicalListBytes, normalizeEntriesForMode } from "./canonical";
import { deriveWinnerIndex, type PublicRandomnessInput } from "./derive";
import { generateSecureSeed } from "./rng";
import { signDocument } from "./signer";
import type { CertificateDocument, CommitmentDocument, SignedCertificate } from "./verify";

export type DrawPreparation = {
  drawId: string;
  drawRef: string;
  mode: DrawMode;
  demo: boolean;
  entries: string[];
  seedHex: string;
  commitment: CommitmentDocument;
  signedCommitment: { commitment: CommitmentDocument; signature: any };
};

/**
 * Fase 1: Prepara el sorteo, congela la lista de participaciones y genera el compromiso público.
 * La semilla se genera y se mantiene en secreto; solo se publica su hash SHA-256.
 */
export async function prepareDrawCommitment(params: {
  drawId: string;
  drawRef?: string;
  mode: DrawMode;
  rawEntries?: unknown;
  wheelSize?: number;
  demo?: boolean;
  useDrand?: boolean;
}): Promise<DrawPreparation> {
  const mode = params.mode;
  const demo = params.demo ?? true;
  const drawRef = params.drawRef ?? params.drawId;

  // 1. Normalizar participaciones (sin datos personales, solo números de boleta o casilla)
  const entries = normalizeEntriesForMode(mode, params.rawEntries, params.wheelSize);

  // 2. Calcular huella canónica de la lista
  const listBytes = canonicalListBytes(entries);
  const listHash = await sha256Hex(listBytes);

  // 3. Generar semilla segura de 256 bits y su compromiso público
  const { seedHex, seedBytes } = generateSecureSeed();
  const seedCommitment = await sha256Hex(seedBytes);

  // 4. Parámetros de ronda pública drand (si está habilitado)
  let publicRandomnessCommitment: CommitmentDocument["publicRandomness"] = null;
  if (params.useDrand) {
    const targetRoundTime = Math.floor(Date.now() / 1000) + 10; // 10 segundos en el futuro
    const targetRound = drandFirstRoundAtOrAfter(targetRoundTime);
    publicRandomnessCommitment = {
      source: "drand",
      network: DRAND_QUICKNET.network,
      chainHash: DRAND_QUICKNET.chainHash,
      round: targetRound,
      expectedAt: new Date(drandRoundTime(targetRound) * 1000).toISOString(),
    };
  }

  const commitment: CommitmentDocument = {
    type: COMMITMENT_TYPE,
    engineVersion: ENGINE_VERSION,
    drawId: params.drawId,
    drawRef,
    mode,
    demo,
    entryCount: entries.length,
    listHash,
    listCanonicalization: LIST_CANONICALIZATION,
    seedCommitment,
    publicRandomness: publicRandomnessCommitment,
    committedAt: new Date().toISOString(),
  };

  const signature = signDocument(commitment);

  return {
    drawId: params.drawId,
    drawRef,
    mode,
    demo,
    entries,
    seedHex,
    commitment,
    signedCommitment: { commitment, signature },
  };
}

/**
 * Fase 2: Ejecuta la selección del ganador a partir de la semilla revelada y la lista congelada.
 * Genera la constancia canónica y la firma con Ed25519.
 */
export async function executeCommittedDraw(params: {
  preparation: DrawPreparation;
  drandBeacon?: { round: number; randomness: string; signature: string } | null;
}): Promise<{
  signedCertificate: SignedCertificate;
  winner: { index: number; position: number; value: string };
}> {
  const { preparation, drandBeacon } = params;
  const { commitment, entries, seedHex } = preparation;

  const publicRandomnessInput: PublicRandomnessInput = drandBeacon
    ? { round: drandBeacon.round, randomness: drandBeacon.randomness }
    : null;

  // Derivación determinista uniforme
  const derivation = await deriveWinnerIndex({
    drawId: commitment.drawId,
    listHash: commitment.listHash,
    entryCount: entries.length,
    seedHex,
    publicRandomness: publicRandomnessInput,
  });

  const winnerValue = entries[derivation.index];
  const winnerPosition = derivation.index + 1;

  const certificate: CertificateDocument = {
    type: CERTIFICATE_TYPE,
    engineVersion: ENGINE_VERSION,
    algorithm: DERIVATION_ALGORITHM,
    drawId: commitment.drawId,
    drawRef: commitment.drawRef,
    mode: commitment.mode,
    demo: commitment.demo,
    commitment,
    commitmentSignature: preparation.signedCommitment.signature,
    entries: {
      count: entries.length,
      listHash: commitment.listHash,
      values: entries,
    },
    publicRandomness: drandBeacon
      ? {
          source: "drand",
          network: DRAND_QUICKNET.network,
          chainHash: DRAND_QUICKNET.chainHash,
          round: drandBeacon.round,
          randomness: drandBeacon.randomness,
          signature: drandBeacon.signature,
          relays: [...DRAND_QUICKNET.relays],
        }
      : null,
    reveal: {
      seed: seedHex,
    },
    result: {
      index: derivation.index,
      position: winnerPosition,
      value: winnerValue,
      attempts: derivation.attempts,
    },
    commitAuditHash: await sha256Hex(commitment.seedCommitment + commitment.listHash),
    executedAt: new Date().toISOString(),
  };

  const certificateSignature = signDocument(certificate);

  return {
    signedCertificate: {
      certificate,
      signature: certificateSignature,
    },
    winner: {
      index: derivation.index,
      position: winnerPosition,
      value: winnerValue,
    },
  };
}
