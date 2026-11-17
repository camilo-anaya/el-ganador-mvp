// Batería de pruebas automatizadas del Motor El Ganador v1.
// Ejecutar con: npx tsx scripts/engine-tests.ts

import {
  runRngSelfTest,
  generateSecureSeed,
  canonicalJson,
  canonicalListBytes,
  sha256Hex,
  deriveWinnerIndex,
  prepareDrawCommitment,
  executeCommittedDraw,
  verifySignedCertificate,
} from "../lib/draw-engine";

async function main() {
  console.log("=================================================");
  console.log("  MOTOR EL GANADOR v1 — SUITE DE PRUEBAS TÉCNICAS");
  console.log("=================================================\n");

  let passed = 0;
  let total = 0;

  function assert(condition: boolean, testName: string) {
    total += 1;
    if (condition) {
      console.log(`  ✓ [PASS] ${testName}`);
      passed += 1;
    } else {
      console.error(`  ✗ [FAIL] ${testName}`);
      process.exitCode = 1;
    }
  }

  // 1. CSPRNG Health Check
  console.log("1. Entropía y Generador Criptográfico (CSPRNG):");
  assert(runRngSelfTest() === true, "Autoverificación de salud (Health Check / Self-Test)");
  const seed1 = generateSecureSeed();
  const seed2 = generateSecureSeed();
  assert(seed1.seedBytes.length === 32, "Longitud de semilla de 256 bits (32 bytes)");
  assert(seed1.seedHex !== seed2.seedHex, "Muestras consecutivas son independientes y no repetitivas");

  // 2. Canonicalización y Huellas SHA-256
  console.log("\n2. Canonicalización Determinista y Huellas:");
  const docA = { z: 1, a: "hola", m: [3, 2, 1] };
  const docB = { a: "hola", m: [3, 2, 1], z: 1 };
  assert(canonicalJson(docA) === canonicalJson(docB), "Canonicalización JSON independiente del orden de claves");
  const listBytes = canonicalListBytes(["05", "10", "25", "99"]);
  const listHash = await sha256Hex(listBytes);
  assert(typeof listHash === "string" && listHash.length === 64, "Cálculo de hash canónico SHA-256");

  // 3. Derivación Determinista del Ganador
  console.log("\n3. Derivación Determinista y Reproducibilidad:");
  const testInput = {
    drawId: "EG-TEST-001",
    listHash,
    entryCount: 4,
    seedHex: "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
    publicRandomness: null,
  };
  const res1 = await deriveWinnerIndex(testInput);
  const res2 = await deriveWinnerIndex(testInput);
  assert(res1.index === res2.index, "Mismos parámetros producen exactamente el mismo ganador (reproducible)");
  assert(res1.index >= 0 && res1.index < 4, "Índice dentro del rango de participantes");

  // 4. Ciclo de Vida Completo y Firma Ed25519
  console.log("\n4. Ciclo Completo: Compromiso -> Ejecución -> Verificación Ed25519:");
  const sampleEntries = Array.from({ length: 100 }, (_, i) => String(i).padStart(2, "0"));
  const prep = await prepareDrawCommitment({
    drawId: "EG-AUDIT-2026",
    mode: "balotas",
    rawEntries: sampleEntries,
    demo: true,
  });

  assert(prep.commitment.entryCount === 100, "Compromiso registra 100 participaciones");
  assert(prep.signedCommitment.signature.alg === "Ed25519", "Firma digital del compromiso en Ed25519");

  const exec = await executeCommittedDraw({ preparation: prep });
  assert(exec.winner.position >= 1 && exec.winner.position <= 100, "Ganador derivado en rango");

  // 5. Verificación de la Constancia Firmada
  const report = await verifySignedCertificate(exec.signedCertificate);
  assert(report.valid === true, "Verificación matemática de la constancia completa es VÁLIDA");
  assert(report.winner !== null && report.winner.value === exec.winner.value, "Ganador verificado coincide exactamente");

  // 6. Prueba Anti-Alteración (Tamper Proof)
  console.log("\n5. Resistencia a Alteraciones (Tamper Resistance):");
  const tamperedCert = JSON.parse(JSON.stringify(exec.signedCertificate));
  // Alterar un carácter en el valor del ganador
  tamperedCert.certificate.result.value = "99";
  tamperedCert.certificate.result.index = 99;
  const tamperedReport = await verifySignedCertificate(tamperedCert);
  assert(tamperedReport.valid === false, "Cualquier intento de alteración invalida la firma y el reporte");

  console.log("\n=================================================");
  console.log(`  RESULTADO: ${passed}/${total} PRUEBAS EXITOSAS`);
  console.log("=================================================\n");
}

main().catch(console.error);
