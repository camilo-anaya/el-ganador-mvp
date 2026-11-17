// Canonicalización determinista: el mismo contenido produce siempre los mismos bytes,
// en el servidor y en el navegador. Es la base de las huellas y de las firmas.

import { BALL_LIMITS, LIST_CANONICALIZATION, WHEEL_SIZES, type DrawMode } from "./constants";
import { EngineInputError, utf8 } from "./bytes";

/** JSON con claves ordenadas, sin espacios. Rechaza valores no representables. */
export function canonicalJson(value: unknown): string {
  if (value === null) return "null";
  switch (typeof value) {
    case "string":
    case "boolean":
      return JSON.stringify(value);
    case "number":
      if (!Number.isFinite(value)) throw new EngineInputError("Número no finito en documento canónico.");
      return JSON.stringify(value);
    case "object": {
      if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
      const entries = Object.entries(value as Record<string, unknown>)
        .filter(([, item]) => item !== undefined)
        .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
      return `{${entries.map(([key, item]) => `${JSON.stringify(key)}:${canonicalJson(item)}`).join(",")}}`;
    }
    default:
      throw new EngineInputError(`Tipo no permitido en documento canónico: ${typeof value}.`);
  }
}

/**
 * Lista elegible de balotas: números enteros únicos, sin ceros a la izquierda, en orden ascendente.
 * No contiene datos personales: solo números de boleta.
 */
export function normalizeBallEntries(raw: unknown): string[] {
  if (!Array.isArray(raw)) throw new EngineInputError("La lista elegible debe ser un arreglo de números.");
  if (raw.length < BALL_LIMITS.minEntries || raw.length > BALL_LIMITS.maxEntries) {
    throw new EngineInputError(`La lista elegible debe tener entre ${BALL_LIMITS.minEntries} y ${BALL_LIMITS.maxEntries} números.`);
  }
  const numbers = raw.map((item) => {
    const text = String(item).trim();
    if (!/^\d{1,4}$/.test(text)) throw new EngineInputError(`Número de boleta inválido: "${text.slice(0, 12)}".`);
    const value = Number(text);
    if (value > BALL_LIMITS.maxNumber) throw new EngineInputError(`El número ${value} supera el máximo permitido.`);
    return value;
  });
  const unique = new Set(numbers);
  if (unique.size !== numbers.length) throw new EngineInputError("La lista elegible contiene números repetidos.");
  return [...unique].sort((a, b) => a - b).map(String);
}

/** Casillas de la ruleta: "1".."N". Los nombres de participantes nunca salen del navegador del local. */
export function wheelEntries(size: unknown): string[] {
  const value = Number(size);
  if (!WHEEL_SIZES.includes(value)) throw new EngineInputError(`La ruleta admite ${WHEEL_SIZES.join(", ")} casillas.`);
  return Array.from({ length: value }, (_, index) => String(index + 1));
}

export function normalizeEntriesForMode(mode: DrawMode, entries: unknown, size: unknown) {
  return mode === "balotas" ? normalizeBallEntries(entries) : wheelEntries(size);
}

/** Bytes canónicos de la lista: "EG-LIST-v1\n<cantidad>\n<e1>\n<e2>…". */
export function canonicalListBytes(entries: readonly string[]) {
  return utf8(`${LIST_CANONICALIZATION}\n${entries.length}\n${entries.join("\n")}`);
}
