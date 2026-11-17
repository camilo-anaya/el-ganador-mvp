// Motor Matemático Propio de Física de Ruleta (v7.0 — El Ganador)
// Cinemática rotacional de 3 etapas (Impulso suave S-curve -> Giro sostenido de alta inercia ->
// Desaceleración viscosa progresiva de 9.5s con llegada suave a velocidad y aceleración cero),
// más deflexión elástica armónica del puntero sobre las clavijas perimetrales (pegs).

export const CASINO_WHEEL_COLORS_10: readonly string[] = [
  "#e81b23", // 01: Rojo Vivo
  "#1eb854", // 02: Verde Esmeralda
  "#e6007e", // 03: Magenta Intenso
  "#18181f", // 04: Ónix Profundo
  "#6d28d9", // 05: Púrpura Real
  "#5cb82e", // 06: Verde Lima
  "#026aa7", // 07: Azul Cobalto
  "#d91656", // 08: Fucsia Rubí
  "#2b3990", // 09: Azul Zafiro
  "#f59e0b", // 10: Mandarina Dorada
] as const;

export const CASINO_WHEEL_COLORS_16: readonly string[] = [
  "#e81b23",
  "#24b459",
  "#e6007e",
  "#16161a",
  "#68259b",
  "#6bb733",
  "#0071bc",
  "#d71458",
  "#f8fafc",
  "#ed1c24",
  "#f7931e",
  "#00a651",
  "#2b3990",
  "#c1272d",
  "#92278f",
  "#fba919",
] as const;

export const JEWEL_BEZEL_COLORS: readonly string[] = [
  "#00e5ff", // Cian
  "#ff1744", // Rubí
  "#ffd600", // Topacio
  "#00e676", // Esmeralda
  "#d500f9", // Amatista
  "#2979ff", // Zafiro
] as const;

export interface WheelPhysicsFrame {
  angleDeg: number;
  flapperTiltDeg: number;
  angularVelocityDegPerSec: number;
  currentPegIndex: number;
  isComplete: boolean;
}

// Parámetros analíticos exactos de la curva de velocidad de 3 fases (tau en [0, 1])
// 20 segundos andando a pleno giro + 20 segundos para irse deteniendo progresivamente (40.0s total)
const TAU_ACCEL_END = 0.015; // 0.6s de arranque suave sin tirón brusco
const TAU_CRUISE_END = 0.50;  // 20.0s de giro vivo sostenido (andando); luego 20.0s de frenado progresivo
const CRUISE_DROP = 0.20;     // Pérdida gradual por inercia durante el crucero (1.00 -> 0.80)
const CRUISE_EXP = 1.2;
const BRAKE_EXP = 1.70;       // Cola de frenado suave de 20s que llega a v=0 y a=0 en tau=1

const I0 = TAU_ACCEL_END * (2 / Math.PI);
const I1 = (TAU_CRUISE_END - TAU_ACCEL_END) * (1 - CRUISE_DROP / (CRUISE_EXP + 1));
const I2 = (1 - TAU_CRUISE_END) * ((1 - CRUISE_DROP) / (BRAKE_EXP + 1));
const I_TOTAL = I0 + I1 + I2;

/**
 * Devuelve progreso normalizado exacto p(tau) en [0, 1] y factor de velocidad instantánea dp/dtau.
 * Garantiza p(0) = 0, p(1) = 1 exacto, continuidad C1 en uniones y parada ultra-suave (v=0, a=0) en tau=1.
 */
export function computeNormalizedWheelKinematics(rawTau: number): {
  progress: number;
  velocityNorm: number;
} {
  if (rawTau <= 0) return { progress: 0, velocityNorm: 0 };
  if (rawTau >= 1) return { progress: 1, velocityNorm: 0 };

  const tau = rawTau;
  let integral = 0;
  let vRaw = 0;

  if (tau <= TAU_ACCEL_END) {
    const phase = (Math.PI * tau) / (2 * TAU_ACCEL_END);
    integral = TAU_ACCEL_END * (2 / Math.PI) * (1 - Math.cos(phase));
    vRaw = Math.sin(phase);
  } else if (tau <= TAU_CRUISE_END) {
    const span = TAU_CRUISE_END - TAU_ACCEL_END;
    const u = (tau - TAU_ACCEL_END) / span;
    integral = I0 + span * (u - (CRUISE_DROP / (CRUISE_EXP + 1)) * Math.pow(u, CRUISE_EXP + 1));
    vRaw = 1 - CRUISE_DROP * Math.pow(u, CRUISE_EXP);
  } else {
    const span = 1 - TAU_CRUISE_END;
    const w = (tau - TAU_CRUISE_END) / span;
    const rem = Math.max(0, 1 - w);
    integral =
      I0 +
      I1 +
      span * ((1 - CRUISE_DROP) / (BRAKE_EXP + 1)) * (1 - Math.pow(rem, BRAKE_EXP + 1));
    vRaw = (1 - CRUISE_DROP) * Math.pow(rem, BRAKE_EXP);
  }

  return {
    progress: Math.min(1, Math.max(0, integral / I_TOTAL)),
    velocityNorm: vRaw / I_TOTAL,
  };
}

/**
 * Calcula el estado físico instantáneo de la ruleta para un tiempo `elapsedSec` de `totalDurationSec` (17.0s).
 */
export function computeWheelTrajectory(
  elapsedSec: number,
  totalDurationSec: number,
  startAngleDeg: number,
  totalTurns: number,
  targetSectorIndex: number,
  totalSectors: number
): WheelPhysicsFrame {
  const step = 360 / Math.max(1, totalSectors);
  // El puntero superior está fijo a las 12 en punto (0 grados).
  const sectorCenter = (targetSectorIndex + 0.5) * step;
  const targetLanding = (360 - (sectorCenter % 360)) % 360;

  const currentBase = ((startAngleDeg % 360) + 360) % 360;
  let forwardDistance = targetLanding - currentBase;
  if (forwardDistance <= 0) {
    forwardDistance += 360;
  }
  const totalRotationDegrees = totalTurns * 360 + forwardDistance;

  const safeDur = Math.max(0.05, totalDurationSec);
  const tau = Math.min(1, Math.max(0, elapsedSec / safeDur));
  const { progress, velocityNorm } = computeNormalizedWheelKinematics(tau);

  const currentAngle = startAngleDeg + progress * totalRotationDegrees;
  const angularVelocity = (velocityNorm * totalRotationDegrees) / safeDur;

  // Deflexión física del puntero/flipper superior contra las clavijas perimetrales (pegs en k * step)
  const modInSector = ((currentAngle % step) + step) % step;
  let flapperTilt = 0;
  const pushArc = Math.min(7.5, step * 0.42);
  const snapArc = Math.min(4.5, step * 0.32);

  if (modInSector > step - pushArc) {
    const pushNorm = (modInSector - (step - pushArc)) / pushArc;
    flapperTilt = -19 * Math.sin((pushNorm * Math.PI) / 2);
  } else if (modInSector < snapArc) {
    const snapNorm = modInSector / snapArc;
    const decay = Math.exp(-snapNorm * 3.5);
    flapperTilt = -19 * decay * Math.cos(snapNorm * Math.PI * 3);
  }

  // Amortiguamiento progresivo a velocidades bajas para que el puntero descanse suave en el centro de la casilla
  const speedScale = Math.min(1.0, Math.max(0.0, angularVelocity / 45));
  flapperTilt *= speedScale;
  if (tau >= 1) flapperTilt = 0;

  const currentPegIndex = Math.floor(currentAngle / step);

  return {
    angleDeg: currentAngle,
    flapperTiltDeg: flapperTilt,
    angularVelocityDegPerSec: angularVelocity,
    currentPegIndex,
    isComplete: tau >= 1,
  };
}

/**
 * Genera el gradiente cónico exacto según el número de casillas configuradas (10, 20, 30, 40, 50)
 */
export function buildCasinoWheelConicGradient(totalSectors: number): string {
  const palette = totalSectors % 10 === 0 ? CASINO_WHEEL_COLORS_10 : CASINO_WHEEL_COLORS_16;
  const parts: string[] = [];
  const step = 360 / totalSectors;
  for (let i = 0; i < totalSectors; i++) {
    const color = palette[i % palette.length];
    const s = (i * step).toFixed(2);
    const e = ((i + 1) * step).toFixed(2);
    parts.push(`${color} ${s}deg ${e}deg`);
  }
  return parts.join(", ");
}
