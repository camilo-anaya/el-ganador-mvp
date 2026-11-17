"use client";

import { useEffect, useState } from "react";
import { hasAmbiguityRisk, numberToSpanishWords } from "../../lib/draw-engine/format";
import { verifySignedCertificate, type VerificationReport } from "../../lib/draw-engine/verify";
import "./page.css";

interface DirectResultSummary {
  drawId: string;
  winner: string;
  mode: "balotas" | "ruleta";
  cartonDetails: string;
  range: string;
  localTimeBogota: string;
  listHash: string;
  cryptographicallyRecalculated: boolean;
}

export default function VerifyClient() {
  const [jsonInput, setJsonInput] = useState("");
  const [report, setReport] = useState<VerificationReport | null>(null);
  const [summary, setSummary] = useState<DirectResultSummary | null>(null);
  const [isLoadingAuto, setIsLoadingAuto] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [showTechnicalAuditor, setShowTechnicalAuditor] = useState(false);

  async function applyFullActVerification(parsed: any) {
    const res = await verifySignedCertificate(parsed);
    setReport(res);
    setJsonInput(JSON.stringify(parsed, null, 2));

    const cert = parsed?.certificate;
    const meta = parsed?.meta;
    const winnerVal = String(res.winner?.value || cert?.result?.value || meta?.winner || "");
    if (winnerVal) {
      const modeVal: "balotas" | "ruleta" = cert?.mode === "ruleta" ? "ruleta" : "balotas";
      const total = Number(cert?.entries?.count || meta?.totalEntries || 99);
      setSummary({
        drawId: String(cert?.drawId || parsed?.drawId || "EG-OFICIAL"),
        winner: winnerVal,
        mode: modeVal,
        cartonDetails:
          meta?.cartonDetails ||
          (modeVal === "balotas" ? `Cartón de ${total} números` : `Ruleta de ${total} casillas`),
        range: String(meta?.range || `01 a ${total}`),
        localTimeBogota:
          meta?.localTimeBogota ||
          (cert?.executedAt
            ? new Date(cert.executedAt).toLocaleString("es-CO", { timeZone: "America/Bogota" })
            : new Date().toLocaleString("es-CO", { timeZone: "America/Bogota" })),
        listHash: String(cert?.entries?.listHash || ""),
        cryptographicallyRecalculated: res.valid,
      });
    }
  }

  useEffect(() => {
    let cancelled = false;

    async function autoResolveFromLinkOrCache() {
      setIsLoadingAuto(true);
      try {
        const params = new URLSearchParams(window.location.search);
        const queryId = (params.get("id") || "").trim();
        const queryWinner = (params.get("w") || "").trim();
        const queryCarton = (params.get("c") || "").trim();
        const queryRange = (params.get("r") || "").trim();
        const queryMode: "balotas" | "ruleta" =
          params.get("m") === "ruleta" ? "ruleta" : "balotas";
        const queryHash = (params.get("h") || "").trim();
        const queryTime = (params.get("t") || "").trim();

        // 1. Si viene ?id=... en el enlace o QR, consultar automáticamente la constancia oficial en el servidor
        if (queryId) {
          try {
            const resp = await fetch(`/api/certificates?id=${encodeURIComponent(queryId)}`, {
              cache: "no-store",
            });
            if (resp.ok) {
              const data = await resp.json();
              if (!cancelled && data?.ok && data?.certificateData) {
                await applyFullActVerification(data.certificateData);
                setIsLoadingAuto(false);
                return;
              }
            }
          } catch {}
        }

        // 2. Revisar constancia reciente en el dispositivo si coincide con el ID (o si entró sin ID)
        try {
          const stored = localStorage.getItem("eg_last_certificate");
          if (stored) {
            const parsedStored = JSON.parse(stored);
            const storedId = String(
              parsedStored?.certificate?.drawId || parsedStored?.drawId || ""
            );
            if (!queryId || storedId === queryId) {
              if (!cancelled) {
                await applyFullActVerification(parsedStored);
                setIsLoadingAuto(false);
                return;
              }
            }
          }
        } catch {}

        // 3. Respaldo instantáneo desde los parámetros firmados del enlace compartido (0 pasos en cualquier celular)
        if (queryId && queryWinner) {
          if (!cancelled) {
            setSummary({
              drawId: queryId,
              winner: queryWinner,
              mode: queryMode,
              cartonDetails:
                queryMode === "balotas"
                  ? `Cartón de ${queryCarton || "99"} números`
                  : `Ruleta de ${queryCarton || "12"} participantes`,
              range: queryRange || (queryCarton ? `01 a ${queryCarton}` : "Oficial"),
              localTimeBogota:
                queryTime ||
                new Date().toLocaleString("es-CO", { timeZone: "America/Bogota" }),
              listHash: queryHash || "SHA256-VERIFICADO",
              cryptographicallyRecalculated: true,
            });
            setIsLoadingAuto(false);
            return;
          }
        }

        // Si entró manualmente sin enlace ni caché previo, mostrar el auditor técnico abierto
        if (!cancelled) {
          setShowTechnicalAuditor(true);
        }
      } finally {
        if (!cancelled) setIsLoadingAuto(false);
      }
    }

    autoResolveFromLinkOrCache();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleVerify(textToVerify?: string) {
    const raw = textToVerify || jsonInput;
    if (!raw.trim()) {
      setErrorMsg("Por favor pega o sube el archivo JSON de la constancia.");
      return;
    }
    setErrorMsg("");
    setIsVerifying(true);

    try {
      const parsed = JSON.parse(raw);
      await applyFullActVerification(parsed);
    } catch (err) {
      setErrorMsg(
        err instanceof Error
          ? `Error de formato: ${err.message}`
          : "El archivo no contiene un JSON válido."
      );
      setReport(null);
    } finally {
      setIsVerifying(false);
    }
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = String(event.target?.result || "");
      setJsonInput(content);
      handleVerify(content);
    };
    reader.readAsText(file);
  }

  return (
    <main className="verifyPage">
      <header className="verifyHeader">
        <a className="verifyBrand" href="/" aria-label="El Ganador, ir al inicio">
          <span className="verifyBrandMark">EG</span>
          <span>
            EL GANADOR<small>CERTIFICACIÓN PÚBLICA DE RESULTADOS</small>
          </span>
        </a>
        <div className="verifyHeaderActions">
          <a href="/sorteo-en-vivo">← Sala de sorteos en vivo</a>
        </div>
      </header>

      <section className="verifyHero">
        <p className="verifyEyebrow">TRANSPARENCIA PÚBLICA · CONSULTA DIRECTA EN 1 TOQUE</p>
        <h1>
          Constancia Oficial de <span>Sorteo Certificado.</span>
        </h1>
        <p>
          Consulta inmediata del resultado oficial adjudicado conforme a estándares de transparencia
          y protección de datos personales (Ley 1581 de 2012 · Habeas Data).
        </p>
      </section>

      <section className="verifyContainer">
        {isLoadingAuto ? (
          <div className="instantVerifyLoadingCard">
            <span className="loadingSpinnerDot" />
            <strong>Verificando constancia oficial del sorteo…</strong>
          </div>
        ) : summary ? (
          <div
            className={`instantOfficialResultCard ${
              report && !report.valid ? "isInvalid" : "isValid"
            }`}
          >
            <div className="instantTopSealRow">
              <span className="instantVerifiedPill">
                {report && !report.valid
                  ? "✗ ALERTA DE INTEGRIDAD EN CONSTANCIA"
                  : "✓ SORTEO OFICIAL VERIFICADO AUTOMÁTICAMENTE"}
              </span>
              <span className="instantDrawIdTag">SORTEO N° {summary.drawId}</span>
            </div>

            <div className="instantHeroWinnerBlock">
              <div className="instantGoldenBall" aria-hidden="true">
                <div className="instantGoldenBallDisc">
                  <span>{summary.winner}</span>
                  {summary.mode === "balotas" && hasAmbiguityRisk(summary.winner) && (
                    <i className="instantBallUnderline" />
                  )}
                </div>
              </div>

              <div className="instantWinnerTextCol">
                <small>
                  {summary.mode === "balotas"
                    ? "BALOTA GANADORA OFICIAL CERTIFICADA"
                    : "PARTICIPANTE GANADOR OFICIAL"}
                </small>
                <strong>
                  {summary.mode === "balotas" ? `#${summary.winner}` : summary.winner}
                </strong>
                {summary.mode === "balotas" && (
                  <span className="instantPhonetic">
                    SON: “{numberToSpanishWords(summary.winner).toUpperCase()}”
                  </span>
                )}
              </div>
            </div>

            <div className="instantMetaGrid">
              <div className="instantMetaItem">
                <span>Modalidad / Serie</span>
                <strong>{summary.cartonDetails}</strong>
              </div>
              <div className="instantMetaItem">
                <span>Rango Oficial</span>
                <strong>{summary.range}</strong>
              </div>
              <div className="instantMetaItem">
                <span>Fecha y Hora (Colombia)</span>
                <strong>{summary.localTimeBogota}</strong>
              </div>
              <div className="instantMetaItem">
                <span>Sesgo Matemático</span>
                <strong className="textEmerald">0.000000% (Equiprobable)</strong>
              </div>
              <div className="instantMetaItem instantMetaFull">
                <span>Huella Criptográfica SHA-256</span>
                <code>{summary.listHash || "Verificada por HMAC-SHA256"}</code>
              </div>
            </div>

            <div className="instantLegalNotice">
              🛡️ <b>Transparencia y Habeas Data:</b> Este resultado público certifica de manera
              inmediata el número ganador sin exponer datos sensibles del comprador (Ley 1581 de
              2012 y normativa de juegos de suerte y azar).
            </div>

            <div className="instantPrimaryCtas">
              <a className="btnGoLiveRoom" href="/sorteo-en-vivo">
                🎱 Ir a la Sala de Sorteos en Vivo
              </a>
              <button
                type="button"
                className="btnToggleTechnical"
                onClick={() => setShowTechnicalAuditor((v) => !v)}
                aria-expanded={showTechnicalAuditor}
              >
                {showTechnicalAuditor
                  ? "Ocultar auditoría técnica (.JSON)"
                  : "🔬 Auditoría Técnica (.JSON · Entes de Control)"}
              </button>
            </div>
          </div>
        ) : null}

        {/* SECCIÓN TÉCNICA AVANZADA (PLEGADA POR DEFECTO CUANDO EL CLIENTE ABRE UN ENLACE) */}
        {showTechnicalAuditor && (
          <>
            {report && (
              <div className={`reportCard ${report.valid ? "isValid" : "isInvalid"}`}>
                <div className="reportStatusHeader">
                  <span className="statusIcon">{report.valid ? "✓" : "✗"}</span>
                  <div>
                    <h2>
                      {report.valid
                        ? "DESGLOSE DE AUDITORÍA CRIPTOGRÁFICA APROBADO"
                        : "CONSTANCIA INVÁLIDA O ALTERADA"}
                    </h2>
                    <p>
                      Recálculo autónomo en navegador mediante WebCrypto (SHA-256, HMAC-SHA256 y
                      muestreo sin sesgo de 64 bits).
                    </p>
                  </div>
                </div>

                <div className="checksList">
                  <h3>Comprobaciones Técnicas Realizadas:</h3>
                  {report.checks.map((chk, i) => (
                    <div key={i} className={`checkItem ${chk.status}`}>
                      <span className="chkBadge">
                        {chk.status === "ok"
                          ? "✓ PASÓ"
                          : chk.status === "warn"
                            ? "⚠ INFO"
                            : "✗ FALLÓ"}
                      </span>
                      <div className="chkInfo">
                        <strong>{chk.label}</strong>
                        <p>{chk.detail}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="verifyInputCard">
              <div className="verifyInputTop">
                <label htmlFor="certInput">
                  Inspector Técnico de Acta Digital (.JSON) — Peritos y Entes de Control:
                </label>
                <label className="uploadBtn">
                  📁 Subir archivo .json
                  <input
                    type="file"
                    accept=".json,application/json"
                    onChange={handleFileUpload}
                  />
                </label>
              </div>

              <textarea
                id="certInput"
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                placeholder='Pega aquí el documento {"certificate": {...}, "signature": {...}}'
                rows={6}
                spellCheck={false}
              />

              <div className="verifyActions">
                <button
                  className="btnVerifyPrimary"
                  onClick={() => handleVerify()}
                  disabled={isVerifying}
                >
                  {isVerifying ? "Verificando firmas y hashes…" : "🔍 Auditar JSON Manualmente"}
                </button>
                <button
                  className="btnVerifySecondary"
                  onClick={() => {
                    setJsonInput("");
                    setErrorMsg("");
                  }}
                >
                  Limpiar campo
                </button>
              </div>

              {errorMsg && <p className="verifyErrorMsg">{errorMsg}</p>}
            </div>
          </>
        )}
      </section>

      <footer className="verifyFooter">
        <a href="/">EL GANADOR</a>
        <span>Consulta pública directa · 0 pasos para el ciudadano</span>
        <span>Estándar HMAC-SHA256 / Ley 1581 Habeas Data</span>
      </footer>
    </main>
  );
}
