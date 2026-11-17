// Verificación pública de constancias. Funciona en el navegador sin confiar en el servidor:
// recalcula huellas, compromiso, aleatoriedad pública, ganador y firmas.

import {
  CERTIFICATE_TYPE, COMMITMENT_TYPE, DERIVATION_ALGORITHM, DRAND_QUICKNET, ENGINE_VERSION,
  LIST_CANONICALIZATION, SIGNATURE_DOMAIN, drandRoundTime, type DrawMode,
} from "./constants";
import { constantTimeEqual, fromBase64, fromHex, sha256Hex, utf8 } from "./bytes";
import { canonicalJson, canonicalListBytes } from "./canonical";
import { deriveWinnerIndex } from "./derive";

export type SignatureBlock = { alg: "Ed25519"; keyId: string; publicKey: string; value: string; devKey: boolean };

export type CommitmentDocument = {
  type: typeof COMMITMENT_TYPE;
  engineVersion: string;
  drawId: string;
  drawRef: string;
  mode: DrawMode;
  demo: boolean;
  entryCount: number;
  listHash: string;
  listCanonicalization: string;
  seedCommitment: string;
  publicRandomness: { source: "drand"; network: string; chainHash: string; round: number; expectedAt: string } | null;
  committedAt: string;
};

export type CertificateDocument = {
  type: typeof CERTIFICATE_TYPE;
  engineVersion: string;
  algorithm: string;
  drawId: string;
  drawRef: string;
  mode: DrawMode;
  demo: boolean;
  commitment: CommitmentDocument;
  commitmentSignature: SignatureBlock;
  entries: { count: number; listHash: string; values: string[] };
  publicRandomness: { source: "drand"; network: string; chainHash: string; round: number; randomness: string; signature: string; relays: string[] } | null;
  reveal: { seed: string };
  result: { index: number; position: number; value: string; attempts: number };
  commitAuditHash: string;
  executedAt: string;
};

export type SignedCertificate = { certificate: CertificateDocument; signature: SignatureBlock };

export type CheckStatus = "ok" | "fail" | "warn";
export type VerificationCheck = { id: string; label: string; status: CheckStatus; detail: string };
export type VerificationReport = {
  valid: boolean;
  signatureVerified: boolean;
  checks: VerificationCheck[];
  winner: { position: number; value: string } | null;
};

/** Devuelve true/false, o null si el entorno no soporta Ed25519. */
export type SignatureVerifier = (publicKeyB64: string, message: Uint8Array, signatureB64: string) => Promise<boolean | null>;

export function signedMessage(document: unknown) {
  return utf8(SIGNATURE_DOMAIN + canonicalJson(document));
}

export const webCryptoEd25519Verify: SignatureVerifier = async (publicKeyB64, message, signatureB64) => {
  const api = globalThis.crypto?.subtle;
  if (!api) return null;
  let key: CryptoKey;
  try {
    key = await api.importKey("spki", fromBase64(publicKeyB64) as BufferSource, { name: "Ed25519" }, false, ["verify"]);
  } catch {
    return null; // Navegador sin soporte Ed25519.
  }
  try {
    return await api.verify({ name: "Ed25519" }, key, fromBase64(signatureB64) as BufferSource, message as BufferSource);
  } catch {
    return false;
  }
};

export async function verifySignedCertificate(
  signed: SignedCertificate,
  options: { verifySignature?: SignatureVerifier; officialKeyId?: string | null } = {},
): Promise<VerificationReport> {
  const checks: VerificationCheck[] = [];
  const add = (id: string, label: string, status: CheckStatus, detail: string) => checks.push({ id, label, status, detail });
  const verifySignature = options.verifySignature ?? webCryptoEd25519Verify;
  let signatureVerified = false;

  const cert = signed?.certificate;
  if (!cert || typeof cert !== "object" || !signed.signature) {
    add("format", "Formato de la constancia", "fail", "El archivo no tiene la estructura de una constancia de El Ganador.");
    return { valid: false, signatureVerified, checks, winner: null };
  }

  try {
    // 1. Formato y versión.
    const formatOk = cert.type === CERTIFICATE_TYPE && cert.engineVersion === ENGINE_VERSION && cert.algorithm === DERIVATION_ALGORITHM
      && cert.commitment?.type === COMMITMENT_TYPE && cert.commitment.listCanonicalization === LIST_CANONICALIZATION;
    add("format", "Formato y versión del motor", formatOk ? "ok" : "fail",
      formatOk ? `${cert.engineVersion} · ${cert.algorithm}` : "Versión o tipo de documento no reconocidos por este verificador.");

    // 2. Lista elegible congelada.
    const values = Array.isArray(cert.entries?.values) ? cert.entries.values.map(String) : [];
    const listHash = await sha256Hex(canonicalListBytes(values));
    const listOk = values.length === cert.entries.count && constantTimeEqual(listHash, cert.entries.listHash)
      && constantTimeEqual(listHash, cert.commitment.listHash) && cert.commitment.entryCount === values.length;
    add("list", "Lista elegible sin cambios", listOk ? "ok" : "fail",
      listOk ? `${values.length} participaciones · huella ${listHash.slice(0, 16)}…` : "La lista no coincide con la huella comprometida antes del sorteo.");

    // 3. Semilla revelada = compromiso previo.
    const seedHash = await sha256Hex(fromHex(cert.reveal.seed, 32));
    const seedOk = constantTimeEqual(seedHash, cert.commitment.seedCommitment);
    add("seed", "Semilla coincide con el compromiso", seedOk ? "ok" : "fail",
      seedOk ? "SHA-256(semilla revelada) = compromiso publicado antes del sorteo." : "La semilla revelada no corresponde al compromiso.");

    // 4. Coherencia de identificadores.
    const idsOk = cert.commitment.drawId === cert.drawId && cert.commitment.mode === cert.mode
      && cert.commitment.demo === cert.demo && cert.commitment.drawRef === cert.drawRef;
    add("ids", "Identificadores coherentes", idsOk ? "ok" : "fail", idsOk ? `Sorteo ${cert.drawId}` : "El compromiso pertenece a otro sorteo.");

    // 5. Aleatoriedad pública.
    const committedRound = cert.commitment.publicRandomness;
    const beacon = cert.publicRandomness;
    if (!committedRound && !beacon) {
      add("public", "Aleatoriedad pública", "warn", "Este sorteo no usó ronda pública; depende solo de la semilla comprometida.");
    } else if (!committedRound || !beacon || committedRound.round !== beacon.round || committedRound.chainHash !== beacon.chainHash || beacon.chainHash !== DRAND_QUICKNET.chainHash) {
      add("public", "Aleatoriedad pública", "fail", "La ronda usada no es la comprometida o no pertenece a drand quicknet.");
    } else {
      const randomnessOk = constantTimeEqual(await sha256Hex(fromHex(beacon.signature)), beacon.randomness.toLowerCase());
      const roundTimeMs = drandRoundTime(beacon.round) * 1000;
      const afterCommit = roundTimeMs > Date.parse(cert.commitment.committedAt);
      add("public", "Ronda pública drand", randomnessOk && afterCommit ? "ok" : "fail",
        !randomnessOk ? "La aleatoriedad no corresponde a la firma de la ronda."
          : !afterCommit ? "La ronda se publicó antes del compromiso: no garantiza imprevisibilidad."
            : `Ronda #${beacon.round}, publicada ${new Date(roundTimeMs).toISOString()} (después del compromiso). Firma BLS verificable con herramientas oficiales de drand.`);
    }

    // 6. Recalcular el ganador.
    const derived = await deriveWinnerIndex({
      drawId: cert.drawId, listHash: cert.entries.listHash, entryCount: values.length, seedHex: cert.reveal.seed,
      publicRandomness: beacon ? { round: beacon.round, randomness: beacon.randomness.toLowerCase() } : null,
    });
    const resultOk = derived.index === cert.result.index && values[derived.index] === cert.result.value && cert.result.position === derived.index + 1;
    add("result", "Ganador recalculado", resultOk ? "ok" : "fail",
      resultOk ? `Posición ${derived.index + 1} de ${values.length} → ${values[derived.index]}` : "El ganador declarado no coincide con el cálculo público.");

    // 7. Firmas Ed25519.
    const certSig = await verifySignature(signed.signature.publicKey, signedMessage(cert), signed.signature.value);
    const commitSig = await verifySignature(cert.commitmentSignature.publicKey, signedMessage(cert.commitment), cert.commitmentSignature.value);
    const sameKey = cert.commitmentSignature.keyId === signed.signature.keyId && cert.commitmentSignature.publicKey === signed.signature.publicKey;
    if (certSig === null || commitSig === null) {
      add("signature", "Firmas digitales", "warn", "Este entorno no permite verificar Ed25519.");
    } else if (signed.signature.devKey && (!certSig || !commitSig)) {
      add("signature", "Firmas digitales Ed25519", "warn", "Firma generada en modo local/desarrollo.");
    } else {
      signatureVerified = certSig && commitSig && sameKey;
      add("signature", "Firmas digitales Ed25519", signatureVerified ? "ok" : "fail",
        signatureVerified ? `Constancia y compromiso firmados por la clave ${signed.signature.keyId}.` : "Alguna firma no es válida o la constancia fue alterada.");
    }

    // 8. Clave oficial.
    if (signed.signature.devKey) {
      add("key", "Clave de firma", "warn", "Firmada con una clave de desarrollo: válida para pruebas, no es una constancia oficial.");
    } else if (options.officialKeyId) {
      const official = options.officialKeyId === signed.signature.keyId;
      add("key", "Clave oficial de El Ganador", official ? "ok" : "fail", official ? `Coincide con la clave publicada ${options.officialKeyId}.` : "La firma no corresponde a la clave publicada por El Ganador.");
    }

    if (cert.demo) add("demo", "Tipo de sorteo", "warn", "Sorteo de demostración: no hay premio ni pagos reales.");

    const valid = checks.every((check) => check.status !== "fail");
    return { valid, signatureVerified, checks, winner: resultOk ? { position: cert.result.position, value: cert.result.value } : null };
  } catch (error) {
    add("error", "Lectura de la constancia", "fail", error instanceof Error ? error.message : "Error inesperado al verificar.");
    return { valid: false, signatureVerified, checks, winner: null };
  }
}
