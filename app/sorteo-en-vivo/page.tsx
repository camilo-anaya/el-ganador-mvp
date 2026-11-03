"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import "./page.css";

type GameMode = "balotas" | "ruleta";
const eligibleSampleNumbers = [7, 24, 39, 56, 77, 103, 128, 154, 188, 207, 244, 278, 319, 366, 402, 451, 508, 577, 624, 711, 777, 804, 866, 921];
const initialWheelEntries = Array.from({ length: 50 }, (_, index) => `Participante ${String(index + 1).padStart(2, "0")}`).join("\n");
const padded = (number: number) => String(number).padStart(3, "0");

function secureDemoIndex(length: number) {
  const max = 0x1_0000_0000;
  const limit = Math.floor(max / length) * length;
  const buffer = new Uint32Array(1);
  do { window.crypto.getRandomValues(buffer); } while (buffer[0] >= limit);
  return buffer[0] % length;
}

export default function LiveDrawDemoPage() {
  const [mode, setMode] = useState<GameMode>("balotas");
  const [phase, setPhase] = useState<"ready" | "spinning" | "winner">("ready");
  const [ballNumber, setBallNumber] = useState(777);
  const [winner, setWinner] = useState("");
  const [spinCount, setSpinCount] = useState(0);
  const [showHow, setShowHow] = useState(false);
  const [wheelSize, setWheelSize] = useState(10);
  const [wheelDraft, setWheelDraft] = useState(initialWheelEntries);
  const [demoError, setDemoError] = useState("");
  const intervalRef = useRef<number | null>(null);
  const wheelPlayers = useMemo(() => wheelDraft.split(/\r?\n/).map((entry) => entry.trim()).filter(Boolean).slice(0, wheelSize), [wheelDraft, wheelSize]);
  const wheelGradient = useMemo(() => Array.from({ length: wheelSize }, (_, index) => {
    const start = index * 360 / wheelSize;
    const end = (index + 1) * 360 / wheelSize;
    return `hsl(${index * 47 + 8} 66% ${index % 2 ? "40%" : "47%"}) ${start}deg ${end}deg`;
  }).join(", "), [wheelSize]);

  useEffect(() => () => { if (intervalRef.current !== null) window.clearInterval(intervalRef.current); }, []);

  function resetDemo() {
    if (intervalRef.current !== null) window.clearInterval(intervalRef.current);
    intervalRef.current = null;
    setWinner("");
    setPhase("ready");
    setBallNumber(777);
    setSpinCount(0);
    setDemoError("");
  }

  function playDemo() {
    if (intervalRef.current !== null) window.clearInterval(intervalRef.current);
    const entries = mode === "balotas" ? eligibleSampleNumbers.map(padded) : wheelPlayers;
    if (entries.length < (mode === "ruleta" ? wheelSize : 2)) {
      setDemoError(`Completa los ${wheelSize} participantes antes de girar la ruleta.`);
      return;
    }
    setDemoError("");
    const selectedIndex = secureDemoIndex(entries.length);
    const selected = entries[selectedIndex];
    const revealNumber = mode === "balotas" ? Number(selected) : selectedIndex + 1;
    let tick = 0;
    setWinner("");
    setPhase("spinning");
    setSpinCount(0);
    intervalRef.current = window.setInterval(() => {
      tick += 1;
      setSpinCount(tick);
      const randomIndex = secureDemoIndex(entries.length);
      setBallNumber(tick > 42 ? revealNumber : mode === "balotas" ? Number(entries[randomIndex]) : randomIndex + 1);
      if (tick >= 54) {
        if (intervalRef.current !== null) window.clearInterval(intervalRef.current);
        intervalRef.current = null;
        setWinner(selected);
        setPhase("winner");
      }
    }, 88);
  }

  function updateWheelSize(value: number) {
    setWheelSize(value);
    resetDemo();
  }

  return (
    <main className="liveDemoPage">
      <header className="liveDemoHeader">
        <a className="liveDemoBrand" href="/" aria-label="El Ganador, ir al inicio"><span className="liveDemoBrandMark">EG</span><span>EL GANADOR<small>RIFAS ONLINE</small></span></a>
        <div className="liveDemoHeaderActions"><span className="demoLabel"><i /> DEMOSTRACIÓN INTERACTIVA</span><a href="/admin">Portal de negocios ↗</a></div>
      </header>

      <section className="liveDemoHero">
        <p className="liveDemoEyebrow">MICROJUEGOS PROPIOS · EL GANADOR</p>
        <h1>El sorteo se vive<br /><span>en El Ganador.</span></h1>
        <p>Dos experiencias creadas para nuestra plataforma: balotas digitales para rifas y una ruleta personalizable para dinámicas exclusivas de tu comunidad.</p>
      </section>

      <section className="liveDemoStage" aria-labelledby="liveDemoDrawTitle">
        <div className="liveDemoStageTop">
          <div><span className="liveDemoOnAir"><i /> SALA DE SORTEO</span><span className="liveDemoDemoTag">Solo demo · sin premio real</span></div>
          <span className="liveDemoDrawId">EG-DEMO-077</span>
        </div>
        <div className="liveGameModes" role="group" aria-label="Modo de sorteo">
          <button className={mode === "balotas" ? "isSelected" : ""} onClick={() => { setMode("balotas"); resetDemo(); }}><span>🎱</span><span><b>Balotas del Ganador</b><small>Rifa por números elegibles</small></span></button>
          <button className={mode === "ruleta" ? "isSelected" : ""} onClick={() => { setMode("ruleta"); resetDemo(); }}><span>🎡</span><span><b>Ruleta del local</b><small>Dinámicas de 10 a 50 personas</small></span></button>
        </div>
        <div className="liveDemoStageGrid">
          <div className={`liveDemoMachine ${mode === "ruleta" ? "modeWheel" : ""} ${phase === "spinning" ? "isSpinning" : ""} ${phase === "winner" ? "hasWinner" : ""}`}>
            <div className="machineHalo" />
            {mode === "balotas" ? <>
              <div className="machineStand"><span>EL GANADOR</span></div>
              <div className="ballCage">
                <span className="cageRing cageRingA" /><span className="cageRing cageRingB" /><span className="cageRing cageRingC" />
                <span className="cageSpoke spokeVertical" /><span className="cageSpoke spokeHorizontal" />
                <span className="miniBall miniBallOne">{phase === "spinning" ? padded(eligibleSampleNumbers[(spinCount + 3) % eligibleSampleNumbers.length]) : "024"}</span>
                <span className="miniBall miniBallTwo">{phase === "spinning" ? padded(eligibleSampleNumbers[(spinCount + 12) % eligibleSampleNumbers.length]) : "103"}</span>
                <span className="miniBall miniBallThree">{phase === "spinning" ? padded(eligibleSampleNumbers[(spinCount + 18) % eligibleSampleNumbers.length]) : "451"}</span>
                <div className="heroBall"><span>{padded(ballNumber)}</span></div>
              </div>
              <div className="machineNeck" />
              <div className="ballChute"><span>{phase === "winner" ? "¡GANADOR!" : phase === "spinning" ? "EXTRAYENDO" : "BALOTA"}</span></div>
            </> : <>
              <div className="wheelPointer">▼</div>
              <div className={`wheelBoard ${phase === "spinning" ? "wheelBoardSpinning" : ""} ${phase === "winner" ? "wheelBoardWinner" : ""}`} style={{ background: `conic-gradient(${wheelGradient})`, transform: `rotate(${phase === "spinning" ? spinCount * 46 : phase === "winner" ? 2484 : 0}deg)` }}>
                <div className="wheelNumberRing">{Array.from({ length: wheelSize }, (_, index) => <span key={index} style={{ transform: `translate(-50%, -50%) rotate(${index * 360 / wheelSize}deg) translateY(-111px) rotate(${-index * 360 / wheelSize}deg)` }}>{String(index + 1).padStart(2, "0")}</span>)}</div>
                <div className="wheelHub">777</div>
              </div>
              <div className="wheelBase"><span>EL GANADOR</span></div>
              {phase !== "ready" && <div className="wheelResultNumber">{String(ballNumber).padStart(2, "0")}</div>}
            </>}
          </div>

          <div className="liveDemoDetails">
            <div className="liveDemoPrizeIcon">{mode === "balotas" ? "🎱" : "🎡"}</div>
            <p className="liveDemoEyebrow">{mode === "balotas" ? "BALOTAS DIGITALES · MODO RIFA" : "RULETA PERSONALIZABLE · MODO EXCLUSIVO"}</p>
            <h2 id="liveDemoDrawTitle">{mode === "balotas" ? "Balotas del Ganador" : "La ruleta de tu comunidad"}</h2>
            <p className="liveDemoPrizeDesc">{mode === "balotas" ? "Una balota se extrae entre números elegibles de una rifa. La sala comparte el mismo resultado en todos los dispositivos." : "Organiza una dinámica propia: define el grupo de 10, 20, 30 o 50 participantes y personaliza los nombres de cada casilla."}</p>
            {mode === "ruleta" && <div className="wheelSetup">
              <label>Participantes en la dinámica<select value={wheelSize} onChange={(event) => updateWheelSize(Number(event.target.value))}>{[10, 20, 30, 50].map((size) => <option key={size} value={size}>{size} participantes</option>)}</select></label>
              <label>Personaliza los nombres<textarea value={wheelDraft.split(/\r?\n/).slice(0, wheelSize).join("\n")} rows={Math.min(6, Math.max(3, Math.ceil(wheelSize / 8)))} maxLength={1800} onChange={(event) => { setWheelDraft(`${event.target.value}\n${Array.from({ length: 50 }, (_, index) => `Participante ${String(index + 1).padStart(2, "0")}`).join("\n")}`); resetDemo(); }} /></label>
              <small>{wheelPlayers.length} de {wheelSize} casillas listas · un nombre por línea</small>
            </div>}
            <div className="liveDemoPrizeStats"><div><b>{mode === "balotas" ? eligibleSampleNumbers.length : wheelPlayers.length}</b><span>{mode === "balotas" ? <>números elegibles<br />de muestra</> : <>participantes<br />en la ruleta</>}</span></div><div><b>1</b><span>selección aleatoria<br />por demo</span></div></div>
            <div className="liveDemoProgress"><div><span>{mode === "balotas" ? "Números elegibles de muestra" : "Casillas ocupadas"}</span><b>{mode === "balotas" ? `${eligibleSampleNumbers.length} / 100` : `${wheelPlayers.length} / ${wheelSize}`}</b></div><span className="liveDemoProgressTrack"><i style={{ width: `${(mode === "balotas" ? eligibleSampleNumbers.length : wheelPlayers.length) / 100 * 100}%` }} /></span></div>
            <div className="liveDemoDrawActions">
              {phase !== "winner" ? <button className="liveDemoStart" onClick={playDemo} disabled={phase === "spinning"}>{phase === "spinning" ? "Sorteo en curso…" : mode === "balotas" ? "▶ Ver demo de balotas" : "▶ Girar ruleta de prueba"}</button> : <button className="liveDemoStart" onClick={resetDemo}>↻ Reiniciar demostración</button>}
              <a className="liveDemoMarketLink" href="/">Explorar rifas del marketplace →</a>
            </div>
            {demoError && <p className="wheelDemoError" role="alert">{demoError}</p>}
            {phase === "winner" && winner && <div className="liveDemoWinner" role="status"><span>🏆</span><div><small>{mode === "balotas" ? "NÚMERO GANADOR · SIMULADO" : "PARTICIPANTE · SIMULADO"}</small><strong>{mode === "balotas" ? padded(Number(winner)) : winner}</strong></div><em>Resultado de prueba</em></div>}
          </div>
        </div>
        <div className="liveDemoStageFoot"><span>Esta animación es una demo; un sorteo real solo usa pagos confirmados y un resultado fijado en servidor.</span><span>El Ganador · Sala de demostración</span></div>
      </section>

      <section className="liveDemoAudit" aria-labelledby="liveDemoAuditTitle">
        <div className="liveDemoAuditIntro"><span className="auditShield">✓</span><div><p className="liveDemoEyebrow">TRANSPARENCIA DESDE EL DISEÑO</p><h2 id="liveDemoAuditTitle">Cada sorteo debe poder comprobarse.</h2><p>El motor aleatorio será común; la ruleta y las balotas serán dos maneras de vivir la misma selección.</p></div></div>
        <div className="liveDemoAuditItems"><div><span>01</span><b>Participaciones congeladas</b><small>Solo pagos confirmados entran a la rifa.</small></div><div><span>02</span><b>Aleatoriedad pública</b><small>Una ronda futura se elige antes del sorteo.</small></div><div><span>03</span><b>Prueba verificable</b><small>Huella, algoritmo y resultado publicados.</small></div></div>
        <button className="auditHowButton" onClick={() => setShowHow((value) => !value)} aria-expanded={showHow}>{showHow ? "Ocultar cómo funcionaría" : "¿Cómo se comprueba?"} <span>{showHow ? "−" : "+"}</span></button>
        {showHow && <div className="liveDemoHow"><p>Antes de conocer el número aleatorio, el sistema cierra la actividad y guarda una huella digital de la lista elegible. Después obtiene una ronda previamente fijada de una fuente distribuida, deriva una única selección con una regla pública y publica la evidencia. La ruleta y la animación de balotas solo revelan ese resultado; nadie puede escogerlo desde el panel.</p><p><b>En esta pantalla ambas experiencias son simulaciones visuales.</b> La ronda pública, el cierre de pagos y el certificado todavía no están conectados.</p></div>}
      </section>

      <footer className="liveDemoFooter"><a href="/">EL GANADOR</a><span>Dos juegos propios para vivir el sorteo en comunidad.</span><span>Demo visual · no hay compras ni premios reales</span></footer>
    </main>
  );
}
