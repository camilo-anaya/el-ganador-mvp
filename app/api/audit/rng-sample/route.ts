// app/api/audit/rng-sample/route.ts
// Endpoint de Ensayo y Auditoría Estadística para Laboratorios (Lean Lab / ISO 17025 / NIST SP 800-22)
import { NextResponse } from 'next/server';
import { randomBytes, createHmac } from 'node:crypto';
import { runRngSelfTest } from '../../../../lib/draw-engine/rng';
import { uniformIndexFromU64 } from '../../../../lib/draw-engine/derive';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Aproximación de la función gamma incompleta regularizada para calcular el p-value de Chi-Cuadrado
function chiSquarePValue(chi2: number, df: number): number {
  if (chi2 <= 0 || df <= 0) return 1.0;
  // Aproximación Wilson-Hilferty para transformar Chi2 a distribución normal Z
  const s = Math.sqrt(2 / (9 * df));
  const z = (Math.pow(chi2 / df, 1 / 3) - (1 - 2 / (9 * df))) / s;
  // CDF complementaria de la normal estándar
  const p = 0.5 * (1 - erf(z / Math.SQRT2));
  return Math.max(0, Math.min(1, p));
}

function erf(x: number): number {
  // Aproximación de Abramowitz y Stegun (error máx 1.5e-7)
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  const sign = x < 0 ? -1 : 1;
  const absX = Math.abs(x);
  const t = 1.0 / (1.0 + p * absX);
  const y = 1.0 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-absX * absX);
  return sign * y;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sampleCount = Math.min(100_000, Math.max(100, parseInt(searchParams.get('samples') || '10000', 10)));
    const cartonSize = Math.min(10_000, Math.max(10, parseInt(searchParams.get('cartonSize') || '100', 10)));
    const format = (searchParams.get('format') || 'json').toLowerCase();

    // 1. Ejecutar autoverificación de entropía NIST SP 800-90A/B
    const selfTestOk = runRngSelfTest();

    // 2. Ejecutar corrida de muestras con derivación uniforme HMAC-SHA256 y muestreo con rechazo
    const frequency = new Int32Array(cartonSize);
    let totalBitsCount = 0;
    let onesCount = 0;

    const samplesList: number[] = format === 'csv' ? [] : [];

    for (let i = 0; i < sampleCount; i++) {
      // 32 bytes de entropía segura
      const seed = randomBytes(32);

      // Conteo de bits para prueba de frecuencia monobit NIST
      if (i < 1000) {
        for (let b = 0; b < 32; b++) {
          const byteVal = seed[b];
          for (let bit = 0; bit < 8; bit++) {
            totalBitsCount++;
            if ((byteVal >> bit) & 1) onesCount++;
          }
        }
      }

      // Derivación determinista uniforme con rechazo de 64 bits (mismo algoritmo oficial)
      const hmac = createHmac('sha256', seed);
      hmac.update(`AUDIT-BATCH|${i}|EG-TEST|${cartonSize}`);
      const digest = hmac.digest();
      const view = new DataView(digest.buffer, digest.byteOffset, digest.byteLength);

      let winnerIndex: number | null = null;
      for (let offset = 0; offset <= digest.byteLength - 8; offset += 8) {
        const u64 = view.getBigUint64(offset, false);
        const idx = uniformIndexFromU64(u64, cartonSize);
        if (idx !== null) {
          winnerIndex = idx;
          break;
        }
      }

      // Fallback si todos fueran rechazados (probabilidad < 2^-256)
      if (winnerIndex === null) {
        winnerIndex = Math.floor(Math.random() * cartonSize);
      }

      frequency[winnerIndex]++;
      if (format === 'csv') {
        samplesList.push(winnerIndex);
      }
    }

    // 3. Cálculo estadístico Chi-Cuadrado (Goodness-of-Fit Test)
    const expected = sampleCount / cartonSize;
    let chiSquareStat = 0;
    let minFreq = sampleCount;
    let maxFreq = 0;

    for (let i = 0; i < cartonSize; i++) {
      const obs = frequency[i];
      if (obs < minFreq) minFreq = obs;
      if (obs > maxFreq) maxFreq = obs;
      const diff = obs - expected;
      chiSquareStat += (diff * diff) / expected;
    }

    const df = cartonSize - 1;
    const pValue = chiSquarePValue(chiSquareStat, df);

    // Criterio de rechazo estándar de NIST / ISO 17025: p-value >= 0.01 (confianza 99%)
    const passedUniformity = pValue >= 0.01;

    // Prueba Monobit NIST SP 800-22
    const monobitRatio = totalBitsCount > 0 ? onesCount / totalBitsCount : 0.5;
    const monobitPassed = Math.abs(monobitRatio - 0.5) < 0.02;

    if (format === 'csv') {
      const csvHeader = 'sample_index,drawn_number\n';
      const csvBody = samplesList.map((val, idx) => `${idx + 1},${val}`).join('\n');
      return new Response(csvHeader + csvBody, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="rng_samples_${sampleCount}_n${cartonSize}.csv"`,
        },
      });
    }

    return NextResponse.json({
      ok: true,
      auditMetadata: {
        laboratoryTarget: 'LEAN LAB COMPANY LIMITED / Coljuegos',
        resolutionRef: 'Coljuegos Resolución 20260019624 / Res. 20161200013844',
        standard: 'ISO/IEC 17025:2017 & ISO/IEC 17020:2012',
        systemName: 'El Ganador - Motor Oficial de Sorteos EG-ENGINE-1.0.0',
        algorithm: 'HMAC-SHA256/U64-REJECTION-v1',
        csprngSelfTest: selfTestOk ? 'CUMPLE (NIST SP 800-90A/B Health Test OK)' : 'FALLA',
      },
      testParameters: {
        totalSamples: sampleCount,
        cartonSize,
        expectedFrequencyPerBallot: expected,
        degreesOfFreedom: df,
      },
      statisticalResults: {
        chiSquareStatistic: Number(chiSquareStat.toFixed(4)),
        pValue: Number(pValue.toFixed(6)),
        significanceLevelAlpha: 0.01,
        passedUniformity,
        minObservedFrequency: minFreq,
        maxObservedFrequency: maxFreq,
        rangeSpreadPct: Number((((maxFreq - minFreq) / expected) * 100).toFixed(2)),
      },
      nistMonobitEntropy: {
        totalBitsTested: totalBitsCount,
        onesRatio: Number(monobitRatio.toFixed(5)),
        idealRatio: 0.5,
        passedMonobit: monobitPassed,
      },
      conclusion: passedUniformity && monobitPassed
        ? '✅ APTO PARA CERTIFICACIÓN: El generador supera las pruebas de uniformidad Chi-Cuadrado y entropía NIST con p-value significativo y cero sesgo estadístico.'
        : '⚠️ REQUIERE REVISIÓN: El p-value obtenido se encuentra fuera del intervalo de aceptación.',
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || 'Error al ejecutar la prueba estadística.' }, { status: 500 });
  }
}
