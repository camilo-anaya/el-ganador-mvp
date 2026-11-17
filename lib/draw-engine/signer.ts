// Módulo de firma digital Ed25519 para las constancias de sorteo de El Ganador.
// En producción, utiliza la clave privada especificada en la variable de entorno DRAW_ENGINE_PRIVATE_KEY.
// En desarrollo, si no existe la variable, genera un par de claves efímero de prueba (marcado con devKey: true).

import { generateKeyPairSync, sign } from "node:crypto";
import { SIGNATURE_DOMAIN } from "./constants";
import { canonicalJson } from "./canonical";
import { toBase64, utf8 } from "./bytes";
import type { SignatureBlock } from "./verify";

type KeyPairState = {
  keyId: string;
  publicKeyB64: string;
  privateKey: any;
  isDevKey: boolean;
};

let cachedKeys: KeyPairState | null = null;

function getKeyPair(): KeyPairState {
  if (cachedKeys) return cachedKeys;

  // Clave en variable de entorno (si existe)
  const envPrivateKey = process.env.DRAW_ENGINE_PRIVATE_KEY;
  const envKeyId = process.env.DRAW_ENGINE_KEY_ID || "eg-key-prod-01";

  if (envPrivateKey) {
    try {
      // Clave privada provista por el administrador
      // Soporta formato PEM PKCS#8
      cachedKeys = {
        keyId: envKeyId,
        publicKeyB64: process.env.DRAW_ENGINE_PUBLIC_KEY || "",
        privateKey: envPrivateKey,
        isDevKey: false,
      };
      return cachedKeys;
    } catch {
      console.warn("No se pudo cargar DRAW_ENGINE_PRIVATE_KEY, generando par temporal...");
    }
  }

  // Generación de par Ed25519 nativo de Node.js
  const { publicKey, privateKey } = generateKeyPairSync("ed25519", {
    publicKeyEncoding: { type: "spki", format: "der" },
    privateKeyEncoding: { type: "pkcs8", format: "der" },
  });

  const publicKeyB64 = toBase64(new Uint8Array(publicKey));

  cachedKeys = {
    keyId: "eg-key-dev-ephemeral",
    publicKeyB64,
    privateKey: { key: privateKey, format: "der", type: "pkcs8" },
    isDevKey: true,
  };

  return cachedKeys;
}

/**
 * Firma digitalmente un documento canónico usando Ed25519 y separación de dominio.
 */
export function signDocument(document: unknown): SignatureBlock {
  const keys = getKeyPair();
  const canonicalStr = canonicalJson(document);
  const payloadToSign = Buffer.from(utf8(SIGNATURE_DOMAIN + canonicalStr));

  const signatureBytes = sign(null, payloadToSign, keys.privateKey);
  const signatureB64 = toBase64(new Uint8Array(signatureBytes));

  return {
    alg: "Ed25519",
    keyId: keys.keyId,
    publicKey: keys.publicKeyB64,
    value: signatureB64,
    devKey: keys.isDevKey,
  };
}

/**
 * Obtiene la información pública de la clave activa para que clientes o verificadores la descarguen.
 */
export function getActiveEnginePublicKey() {
  const keys = getKeyPair();
  return {
    keyId: keys.keyId,
    publicKey: keys.publicKeyB64,
    alg: "Ed25519",
    devKey: keys.isDevKey,
  };
}
