// Formateador y desambiguador oficial de balotas para El Ganador
// Provee nombres fonéticos legales en español (ej: "71" -> "Setenta y Uno")
// y detección de ambigüedad de rotación (6 vs 9) con subrayado legal.

const UNIDADES = ["Cero", "Uno", "Dos", "Tres", "Cuatro", "Cinco", "Seis", "Siete", "Ocho", "Nueve"];
const DIEZ_A_DIECINUEVE = [
  "Diez", "Once", "Doce", "Trece", "Catorce", "Quince",
  "Dieciséis", "Diecisiete", "Dieciocho", "Diecinueve",
];
const DECENAS = [
  "", "", "Veinte", "Treinta", "Cuarenta", "Cincuenta",
  "Sesenta", "Setenta", "Ochenta", "Noventa",
];
const CENTENAS = [
  "", "Ciento", "Doscientos", "Trescientos", "Cuatrocientos", "Quinientos",
  "Seiscientos", "Setecientos", "Ochocientos", "Novecientos",
];

export function numberToSpanishWords(numStr: string): string {
  const clean = numStr.trim();
  const val = parseInt(clean, 10);
  if (isNaN(val)) return numStr;

  // Casos especiales de dos ceros o tres ceros
  if (clean === "00") return "Cero Cero";
  if (clean === "000") return "Triple Cero";
  if (val === 0) return "Cero";
  if (val === 100) return "Cien";
  if (val === 1000) return "Mil";

  let out = "";
  let n = val;

  // Centenas
  if (n >= 100) {
    const c = Math.floor(n / 100);
    out += CENTENAS[c] + " ";
    n = n % 100;
  }

  // Decenas y unidades
  if (n >= 10 && n <= 19) {
    out += DIEZ_A_DIECINUEVE[n - 10];
    return out.trim();
  }

  if (n >= 21 && n <= 29) {
    out += "Veinti" + UNIDADES[n - 20].toLowerCase();
    return out.trim();
  }

  if (n >= 20) {
    const d = Math.floor(n / 10);
    const u = n % 10;
    out += DECENAS[d];
    if (u > 0) out += " y " + UNIDADES[u];
    return out.trim();
  }

  if (n > 0) {
    out += UNIDADES[n];
  }

  return out.trim();
}

/**
 * Detecta si el número presenta riesgo de confusión por rotación (6 vs 9, 68 vs 89, 06 vs 90).
 * En loterías y baloteras oficiales, estos números exigen subrayado legal inferior.
 */
export function hasAmbiguityRisk(numStr: string): boolean {
  return /^[0689]+$/.test(numStr) && /[69]/.test(numStr);
}
