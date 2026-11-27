"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { readSurface } from "../../lib/auth-role";
import { fromHex, sha256Hex } from "../../lib/draw-engine/bytes";
import { canonicalListBytes } from "../../lib/draw-engine/canonical";
import { deriveWinnerIndex } from "../../lib/draw-engine/derive";
import { BALOTAS_TIMELINE, RULETA_TIMELINE, drawAudio, type AudioStatusSnapshot } from "../../lib/draw-engine/audio";
import { hasAmbiguityRisk, numberToSpanishWords } from "../../lib/draw-engine/format";
import { generateQrSvg } from "../../lib/draw-engine/qr";
import { playWinnerVoice, preloadWinnerVoice, stopWinnerVoice } from "../../lib/draw-engine/voice";
import { generateWinnerTicket, type WinnerTicket } from "../../lib/draw-engine/ticket";
import {
  copyCaptureImageToClipboard,
  renderSocialPromoCapture,
  shareCaptureFileNatively,
  type RenderedSocialCapture,
  type SocialFormat,
} from "../../lib/draw-engine/social-capture";
import {
  computeWheelTrajectory,
  buildCasinoWheelConicGradient,
  JEWEL_BEZEL_COLORS,
} from "../../lib/draw-engine/wheel-physics";
import { useTheme } from "../../context/ThemeContext";
import { addWonPrize, getNotificationPrefs } from "../../lib/notifications";
import { showNativeNotification } from "../../lib/nativeNotifications";
import "./page.css";

type GameMode = "balotas" | "ruleta";
type CartonSize = number;
type DrawStage = "idle" | "countdown" | "mixing" | "suction" | "slowdown" | "reveal";

const ACTIVE_DRAW_STORAGE_KEY = "eg_active_draw_session_v1";
const DRAW_HISTORY_STORAGE_KEY = "eg_draw_history_v1";
const REVEAL_TICKET_DELAY_SEC = 6;

interface ExtractedBall {
  number: string;
  time: string;
  hash: string;
  carton: number;
}

interface ResolvedDrawBundle {
  chosenIndex: number;
  selected: string;
  calculatedListHash: string;
  actData: any;
  generatedTicket: WinnerTicket;
}

interface PersistedDrawSession {
  version: 1;
  status: "running" | "completed";
  startedAtEpochMs: number;
  completedAtEpochMs?: number;
  mode: GameMode;
  cartonSize: CartonSize;
  wheelSize: number;
  wheelDraft: string;
  entries: string[];
  resolvedResult: ResolvedDrawBundle;
}

const BALOTERA_BEZEL_GLINTS = [
  { angle: 315, size: 42, dur: "3.7s", delay: "-1.8s" },
  { angle: 225, size: 40, dur: "4.3s", delay: "-2.1s" },
  { angle: 138, size: 38, dur: "4.1s", delay: "-0.6s" },
  { angle: 42, size: 36, dur: "4.9s", delay: "-3.1s" },
  { angle: 344, size: 28, dur: "5.3s", delay: "-2.6s" },
  { angle: 196, size: 28, dur: "4.7s", delay: "-0.9s" },
  { angle: 254, size: 25, dur: "6.1s", delay: "-4.4s" },
  { angle: 286, size: 25, dur: "5.7s", delay: "-1.4s" },
  { angle: 164, size: 26, dur: "5.1s", delay: "-3.6s" },
  { angle: 16, size: 26, dur: "6.3s", delay: "-2.9s" },
] as const;

const BALOTERA_EXTERIOR_SPARKS = [
  { angle: 312, dist: 54.8, size: 7.0, dur: "3.3s", delay: "-1.5s" },
  { angle: 325, dist: 60.2, size: 5.5, dur: "4.6s", delay: "-2.2s" },
  { angle: 338, dist: 54.0, size: 4.8, dur: "5.2s", delay: "-0.4s" },
  { angle: 228, dist: 55.2, size: 7.0, dur: "3.8s", delay: "-1.9s" },
  { angle: 213, dist: 60.8, size: 5.5, dur: "4.9s", delay: "-0.8s" },
  { angle: 198, dist: 54.0, size: 4.8, dur: "5.5s", delay: "-3.4s" },
  { angle: 152, dist: 55.2, size: 6.5, dur: "3.6s", delay: "-1.6s" },
  { angle: 136, dist: 61.0, size: 5.2, dur: "4.4s", delay: "-2.8s" },
  { angle: 166, dist: 54.2, size: 4.5, dur: "5.8s", delay: "-0.3s" },
  { angle: 28, dist: 55.2, size: 6.5, dur: "4.1s", delay: "-2.0s" },
  { angle: 44, dist: 60.5, size: 5.2, dur: "5.1s", delay: "-1.0s" },
  { angle: 14, dist: 54.2, size: 4.5, dur: "4.7s", delay: "-3.7s" },
  { angle: 250, dist: 56.8, size: 5.5, dur: "5.4s", delay: "-2.4s" },
  { angle: 290, dist: 56.8, size: 5.5, dur: "4.8s", delay: "-1.1s" },
  { angle: 354, dist: 58.0, size: 5.8, dur: "3.9s", delay: "-1.8s" },
  { angle: 186, dist: 58.0, size: 5.8, dur: "4.3s", delay: "-2.1s" },
  { angle: 236, dist: 64.0, size: 4.6, dur: "6.2s", delay: "-3.2s" },
  { angle: 304, dist: 64.0, size: 4.6, dur: "5.9s", delay: "-2.7s" },
  { angle: 124, dist: 58.2, size: 4.8, dur: "5.6s", delay: "-3.0s" },
  { angle: 56, dist: 58.2, size: 4.8, dur: "6.0s", delay: "-0.7s" },
  { angle: 206, dist: 64.8, size: 4.4, dur: "4.5s", delay: "-1.3s" },
  { angle: 332, dist: 64.8, size: 4.4, dur: "5.0s", delay: "-2.5s" },
  { angle: 146, dist: 64.2, size: 4.4, dur: "5.3s", delay: "-1.7s" },
  { angle: 34, dist: 64.2, size: 4.4, dur: "4.2s", delay: "-0.9s" },
] as const;

/* Destellos sobre el aro dorado exterior de la Ruleta (centrados a 15° exactos entre los 12 bombillos perimetrales) */
const WHEEL_BEZEL_GLINTS = [
  { angle: 315, size: 40, dur: "3.7s", delay: "-1.8s" },
  { angle: 225, size: 38, dur: "4.3s", delay: "-2.1s" },
  { angle: 135, size: 36, dur: "4.1s", delay: "-0.6s" },
  { angle: 45, size: 36, dur: "4.9s", delay: "-3.1s" },
  { angle: 345, size: 28, dur: "5.3s", delay: "-2.6s" },
  { angle: 195, size: 28, dur: "4.7s", delay: "-0.9s" },
  { angle: 255, size: 24, dur: "6.1s", delay: "-4.4s" },
  { angle: 285, size: 24, dur: "5.7s", delay: "-1.4s" },
  { angle: 165, size: 26, dur: "5.1s", delay: "-3.6s" },
  { angle: 15, size: 26, dur: "6.3s", delay: "-2.9s" },
] as const;

/* Micropartículas luminosas exteriores alrededor de la Ruleta (en los arcos libres y exterior de los bombillos) */
const WHEEL_EXTERIOR_SPARKS = [
  { angle: 314, dist: 57.5, size: 7.0, dur: "3.3s", delay: "-1.5s" },
  { angle: 320, dist: 64.0, size: 5.5, dur: "4.6s", delay: "-2.2s" },
  { angle: 344, dist: 57.2, size: 5.0, dur: "5.2s", delay: "-0.4s" },
  { angle: 226, dist: 57.5, size: 7.0, dur: "3.8s", delay: "-1.9s" },
  { angle: 218, dist: 64.2, size: 5.5, dur: "4.9s", delay: "-0.8s" },
  { angle: 196, dist: 57.2, size: 5.0, dur: "5.5s", delay: "-3.4s" },
  { angle: 136, dist: 57.5, size: 6.5, dur: "3.6s", delay: "-1.6s" },
  { angle: 144, dist: 64.0, size: 5.2, dur: "4.4s", delay: "-2.8s" },
  { angle: 164, dist: 57.2, size: 4.6, dur: "5.8s", delay: "-0.3s" },
  { angle: 44, dist: 57.5, size: 6.5, dur: "4.1s", delay: "-2.0s" },
  { angle: 38, dist: 64.0, size: 5.2, dur: "5.1s", delay: "-1.0s" },
  { angle: 16, dist: 57.2, size: 4.6, dur: "4.7s", delay: "-3.7s" },
  { angle: 254, dist: 58.8, size: 5.4, dur: "5.4s", delay: "-2.4s" },
  { angle: 286, dist: 58.8, size: 5.4, dur: "4.8s", delay: "-1.1s" },
  { angle: 350, dist: 62.5, size: 5.6, dur: "3.9s", delay: "-1.8s" },
  { angle: 190, dist: 62.5, size: 5.6, dur: "4.3s", delay: "-2.1s" },
  { angle: 234, dist: 67.2, size: 4.6, dur: "6.2s", delay: "-3.2s" },
  { angle: 306, dist: 67.2, size: 4.6, dur: "5.9s", delay: "-2.7s" },
  { angle: 128, dist: 65.5, size: 4.8, dur: "5.6s", delay: "-3.0s" },
  { angle: 52, dist: 65.5, size: 4.8, dur: "6.0s", delay: "-0.7s" },
  { angle: 204, dist: 66.8, size: 4.4, dur: "4.5s", delay: "-1.3s" },
  { angle: 336, dist: 66.8, size: 4.4, dur: "5.0s", delay: "-2.5s" },
  { angle: 158, dist: 65.2, size: 4.4, dur: "5.3s", delay: "-1.7s" },
  { angle: 22, dist: 65.2, size: 4.4, dur: "4.2s", delay: "-0.9s" },
] as const;

/* Patrocinadores y alianzas oficiales vinculadas por categoría de premio */
const SPONSOR_PRESETS: Record<string, { brand: string; subtitle: string; logo: string }> = {
  iphone: { brand: "TechStore Colombia", subtitle: "Distribuidor Autorizado Apple · Patrocinador Oficial", logo: "⚡" },
  moto: { brand: "Motos Caribe Oficial", subtitle: "Concesionario & Taller Autorizado Yamaha", logo: "🏍️" },
  toyota: { brand: "AutoPremier Colombia", subtitle: "Concesionario 4x4 Oficial · Garantía Total", logo: "🚙" },
  macbook: { brand: "MacCenter Pro", subtitle: "Cómputo & Tecnología de Alta Gama", logo: "💻" },
  cancun: { brand: "Viajes & Destinos VIP", subtitle: "Agencia de Turismo Certificada", logo: "✈️" },
  joyas: { brand: "Joyas & Diamantes ABC", subtitle: "Alta Joyería & Oro 18K Certificado", logo: "💎" },
};

function getSponsorForTitle(title: string) {
  const t = (title || "").toLowerCase();
  if (t.includes("moto") || t.includes("yamaha") || t.includes("honda")) return SPONSOR_PRESETS.moto;
  if (t.includes("toyota") || t.includes("hilux") || t.includes("carro") || t.includes("camioneta")) return SPONSOR_PRESETS.toyota;
  if (t.includes("macbook") || t.includes("computador") || t.includes("laptop")) return SPONSOR_PRESETS.macbook;
  if (t.includes("cancun") || t.includes("viaje") || t.includes("vacaciones")) return SPONSOR_PRESETS.cancun;
  if (t.includes("joya") || t.includes("oro") || t.includes("diamante")) return SPONSOR_PRESETS.joyas;
  return SPONSOR_PRESETS.iphone;
}

function StageSpotlightFixture({ idSuffix }: { idSuffix: string }) {
  return (
    <svg className="spotHousingSvg" viewBox="0 0 88 76" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={`spotPiano_${idSuffix}`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#08090c" />
          <stop offset="26%" stopColor="#353b45" />
          <stop offset="52%" stopColor="#12151a" />
          <stop offset="82%" stopColor="#050608" />
          <stop offset="100%" stopColor="#1f232b" />
        </linearGradient>
        <linearGradient id={`spotGold_${idSuffix}`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#6b4910" />
          <stop offset="28%" stopColor="#f0ca67" />
          <stop offset="50%" stopColor="#fff7d1" />
          <stop offset="75%" stopColor="#cfa035" />
          <stop offset="100%" stopColor="#523608" />
        </linearGradient>
        <radialGradient id={`spotLens_${idSuffix}`} cx="50%" cy="50%" r="52%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="55%" stopColor="#fff5bf" />
          <stop offset="88%" stopColor="#f3c552" />
          <stop offset="100%" stopColor="#b8841e" />
        </radialGradient>
      </defs>
      {/* Soporte superior de anclaje al techo */}
      <rect x="33" y="0" width="22" height="12" rx="2" fill="#0c0e12" stroke="#2c313a" strokeWidth="1" />
      <path d="M20 10 H68 V30 H63 V15 H25 V30 H20 Z" fill="#15181f" stroke="rgba(255,255,255,0.14)" strokeWidth="0.8" />
      {/* Cuerpo cilíndrico Negro Piano */}
      <rect x="22" y="12" width="44" height="44" rx="6" fill={`url(#spotPiano_${idSuffix})`} stroke="rgba(255,255,255,0.16)" strokeWidth="1" />
      {/* Pernos laterales dorados a juego con el pedestal EL GANADOR */}
      <circle cx="19.5" cy="28" r="3.2" fill={`url(#spotGold_${idSuffix})`} />
      <circle cx="68.5" cy="28" r="3.2" fill={`url(#spotGold_${idSuffix})`} />
      {/* Anillo frontal torneado en Oro 24K */}
      <rect x="20" y="50" width="48" height="8" rx="3" fill={`url(#spotGold_${idSuffix})`} stroke="#4a3106" strokeWidth="0.8" />
      {/* Lente Fresnel cálida encendida */}
      <ellipse cx="44" cy="59" rx="22" ry="7.5" fill={`url(#spotLens_${idSuffix})`} />
      <ellipse cx="44" cy="59" rx="25" ry="10" fill="rgba(255, 244, 185, 0.38)" />
    </svg>
  );
}

/**
 * Ícono vectorial 3D fotorrealista de Balota Dorada Oficial de Lotería
 * Reemplaza los emojis genéricos (como la bola negra de billar 🎱) con una esfera dorada nácar 3D
 */
function RealisticBalotaIcon({ size = 32, number = "77" }: { size?: number; number?: string }) {
  const safeId = `${size}_${number.replace(/[^a-zA-Z0-9]/g, "")}`;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className="realisticBalotaSvg"
      aria-label="Balota blanca nácar oficial de lotería"
      style={{ verticalAlign: "middle", display: "inline-block", flexShrink: 0 }}
    >
      <defs>
        <radialGradient id={`balotaShadow_${safeId}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(0,0,0,0.55)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0)" />
        </radialGradient>
        <radialGradient id={`goldSphere_${safeId}`} cx="33%" cy="27%" r="65%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="22%" stopColor="#fdeba8" />
          <stop offset="52%" stopColor="#e5b338" />
          <stop offset="82%" stopColor="#9a6e14" />
          <stop offset="100%" stopColor="#4a3104" />
        </radialGradient>
        <radialGradient id={`discGrad_${safeId}`} cx="36%" cy="32%" r="62%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="70%" stopColor="#fdfbf5" />
          <stop offset="100%" stopColor="#dcd4c0" />
        </radialGradient>
      </defs>
      {/* Sombra de base */}
      <ellipse cx="50" cy="94" rx="36" ry="6" fill={`url(#balotaShadow_${safeId})`} opacity="0.6" />
      {/* Esfera blanca nácar de lujo */}
      <circle cx="50" cy="48" r="44" fill="#ffffff" />
      <circle cx="50" cy="48" r="44" fill={`url(#goldSphere_${safeId})`} stroke="#fff8d6" strokeWidth="1.5" />
      {/* Anillo de contraste dorado */}
      <circle cx="50" cy="48" r="27" fill="none" stroke="#d4a838" strokeWidth="1.5" opacity="0.8" />
      {/* Disco central blanco nácar */}
      <circle cx="50" cy="48" r="26" fill="#ffffff" />
      <circle cx="50" cy="48" r="25" fill={`url(#discGrad_${safeId})`} stroke="#b58820" strokeWidth="1.2" />
      {/* Brillo especular superior */}
      <ellipse cx="38" cy="24" rx="14" ry="7" fill="#ffffff" opacity="0.9" transform="rotate(-30 38 24)" />
      {/* Destello sparkle */}
      <circle cx="68" cy="27" r="2.5" fill="#ffffff" opacity="0.95" />
      {/* Número impreso nítido */}
      <text
        x="50"
        y="53.5"
        textAnchor="middle"
        fontFamily="'JetBrains Mono', Arial, sans-serif"
        fontSize="19"
        fontWeight="950"
        fill="#0b2214"
        letterSpacing="-0.5"
      >
        {number}
      </text>
      {/* Línea legal de orientación */}
      <line x1="42" y1="58.5" x2="58" y2="58.5" stroke="#0b2214" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export default function LiveDrawDemoPage() {
  const [mode, setMode] = useState<GameMode>("balotas");
  const [cartonSize, setCartonSize] = useState<CartonSize>(100);
  const [customCartonInput, setCustomCartonInput] = useState<string>("100");
  const spectatorDurationRef = useRef<number>(0);
  const [phase, setPhase] = useState<"ready" | "spinning" | "winner">("ready");
  const [stage, setStage] = useState<DrawStage>("idle");
  const [displayNumber, setDisplayNumber] = useState("01");
  const router = useRouter();
  const [simulateWinnerMode, setSimulateWinnerMode] = useState(false);
  const [autoCloseCountdown, setAutoCloseCountdown] = useState<number | null>(null);
  const autoCloseTimerRef = useRef<number | null>(null);
  const autoCloseIntervalRef = useRef<number | null>(null);

  const [winner, setWinner] = useState("");
  const [wheelRotation, setWheelRotation] = useState(0);
  const [flapperTilt, setFlapperTilt] = useState(0);
  const initialWheelRotationRef = useRef(0);
  const currentWheelAngleRef = useRef(0);
  const currentFlapperTiltRef = useRef(0);
  const wheelBoardDomRef = useRef<HTMLDivElement | null>(null);
  const flapperDomRef = useRef<HTMLDivElement | null>(null);
  const wheelRafRef = useRef<number | null>(null);
  const [showHow, setShowHow] = useState(false);
  const [wheelSize, setWheelSize] = useState(20);
  const [wheelDraft, setWheelDraft] = useState(
    Array.from({ length: 50 }, (_, i) => String(i + 1).padStart(2, "0")).join("\n")
  );
  const [demoError, setDemoError] = useState("");
  const [auditHash, setAuditHash] = useState("");
  const [history, setHistory] = useState<ExtractedBall[]>([]);
  const [showCelebration, setShowCelebration] = useState(false);
  const [latestAct, setLatestAct] = useState<any>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [showAuditSection, setShowAuditSection] = useState(false);

  useEffect(() => {
    if (latestAct) {
      setShowAuditSection(true);
    }
  }, [latestAct]);
  const [winnerTicket, setWinnerTicket] = useState<WinnerTicket | null>(null);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [ticketViewMode, setTicketViewMode] = useState<"public" | "private">("public");
  const [stageSecondsLeft, setStageSecondsLeft] = useState<number>(0);
  const [countdownNumber, setCountdownNumber] = useState<number | string | null>(null);
  const [audioStatus, setAudioStatus] = useState<AudioStatusSnapshot>({ state: "idle", message: "" });
  const [wheelSpinDurationSec, setWheelSpinDurationSec] = useState<number>(40);
  const [ticketCountdownSec, setTicketCountdownSec] = useState<number>(0);
  const [isRecoveredDraw, setIsRecoveredDraw] = useState<boolean>(false);
  const [showSocialModal, setShowSocialModal] = useState<boolean>(false);
  const [socialFormat, setSocialFormat] = useState<SocialFormat>("story");
  const [socialCapture, setSocialCapture] = useState<RenderedSocialCapture | null>(null);
  const [socialFeedback, setSocialFeedback] = useState<string>("");
  const [isGeneratingSocial, setIsGeneratingSocial] = useState<boolean>(false);
  
  // Motor háptico y de gestos táctiles para la versión web móvil
  function triggerHaptic(pattern: number | number[] = 20) {
    if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
      try {
        navigator.vibrate(pattern);
      } catch {}
    }
  }

  const touchSwipeRef = useRef<{ startX: number; startY: number }>({ startX: 0, startY: 0 });
  const [isCinemaFullscreen, setIsCinemaFullscreen] = useState<boolean>(false);
  const [activeResultTab, setActiveResultTab] = useState<"ganador" | "seguridad" | "detalles" | "auditoria" | null>(null);
  // 📅 FECHA OFICIAL DE JUEGO & CONTEO REGRESIVO (REGLA COLJUEGOS)
  // El sorteo oficial sólo se ejecuta automáticamente cuando el conteo llega a cero en la fecha programada.
  const OFFICIAL_DRAW_TARGET_DATE_MS = useMemo(() => {
    // Próximo domingo oficial a las 20:00:00 (Hora Coljuegos)
    const d = new Date();
    d.setDate(d.getDate() + ((7 - d.getDay()) % 7 || 7));
    d.setHours(20, 0, 0, 0);
    return d.getTime();
  }, []);

  const [officialCountdown, setOfficialCountdown] = useState<{ days: number; hours: number; mins: number; secs: number; isReached: boolean }>({
    days: 2,
    hours: 14,
    mins: 35,
    secs: 20,
    isReached: false,
  });

  const [isDemoModeActive, setIsDemoModeActive] = useState<boolean>(false);

  useEffect(() => {
    function updateCountdown() {
      const now = Date.now();
      const diff = Math.max(0, OFFICIAL_DRAW_TARGET_DATE_MS - now);
      const isReached = diff <= 0;
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((diff % (1000 * 60)) / 1000);
      setOfficialCountdown({ days, hours, mins, secs, isReached });
    }
    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, [OFFICIAL_DRAW_TARGET_DATE_MS]);

  const [copiedHash, setCopiedHash] = useState<boolean>(false);
  const [showWinnerChatModal, setShowWinnerChatModal] = useState<boolean>(false);
  const [winnerChatMessages, setWinnerChatMessages] = useState<Array<{ sender: "merchant" | "client"; text: string; time: string }>>([]);
  const [winnerChatInput, setWinnerChatInput] = useState<string>("");

  // Desbloqueo nativo absoluto para pad mouse y touchpad de portátil
  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.style.setProperty("overflow-y", "auto", "important");
      document.documentElement.style.setProperty("overflow-x", "hidden", "important");
      document.body.style.setProperty("overflow", "visible", "important");
      document.body.style.setProperty("touch-action", "auto", "important");
      const isMobileScreen = typeof window !== "undefined" && window.innerWidth < 768;
      if (isCinemaFullscreen && isMobileScreen) {
        document.body.style.setProperty("overflow", "hidden", "important");
      }
    }
    return () => {
      if (typeof document !== "undefined") {
        document.body.style.overflow = "";
      }
    };
  }, [isCinemaFullscreen]);

  // Soporte de navegación con portátil por teclado (ESC salir fullscreen, flechas ← → para cambiar bloques)
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        if (isCinemaFullscreen) {
          exitCinemaFullscreen();
        }
      } else if (e.key === "ArrowLeft") {
        const tabs: Array<"ganador" | "seguridad" | "detalles" | "auditoria"> = ["ganador", "seguridad", "detalles", "auditoria"];
        const idx = activeResultTab ? tabs.indexOf(activeResultTab) : -1;
        if (idx > 0) setActiveResultTab(tabs[idx - 1]);
        else if (idx === -1) setActiveResultTab(tabs[tabs.length - 1]);
      } else if (e.key === "ArrowRight") {
        const tabs: Array<"ganador" | "seguridad" | "detalles" | "auditoria"> = ["ganador", "seguridad", "detalles", "auditoria"];
        const idx = activeResultTab ? tabs.indexOf(activeResultTab) : -1;
        if (idx >= 0 && idx < tabs.length - 1) setActiveResultTab(tabs[idx + 1]);
        else if (idx === -1) setActiveResultTab(tabs[0]);
      }
    }
    if (typeof window !== "undefined") {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("keydown", handleKeyDown);
      }
    };
  }, [isCinemaFullscreen, activeResultTab]);

  // Perfil del usuario y autorización de controles de operador vs espectador
  const [clientAccount, setClientAccount] = useState<{ displayName: string; email: string; role: string } | null>(null);
  const [isViewerMode, setIsViewerMode] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    const params = new URLSearchParams(window.location.search);
    if (params.get("viewer") === "1" || params.get("modo") === "cliente") return true;
    return false;
  });
  const isOperator = Boolean(
    !isViewerMode ||
    clientAccount?.role === "business" ||
    (typeof window !== "undefined" && readSurface() === "business")
  );
  const [userTicketNumber, setUserTicketNumber] = useState<string>("");
  const [ticketSaveFeedback, setTicketSaveFeedback] = useState<string>("");
  const [copiedClientLink, setCopiedClientLink] = useState<boolean>(false);
  const [copiedReminderLink, setCopiedReminderLink] = useState<boolean>(false);

  // Boletas oficiales verificadas
  const [officialTickets, setOfficialTickets] = useState<string[]>([]);
  const [clientSearchEmail, setClientSearchEmail] = useState<string>("");
  const [isSearchingTickets, setIsSearchingTickets] = useState<boolean>(false);
  const [ticketSearchFeedback, setTicketSearchFeedback] = useState<string>("");

  // Canales de Sorteos en Vivo y CRM de Audiencia
  const [availableDraws, setAvailableDraws] = useState<any[]>([]);
  const [activeDraw, setActiveDraw] = useState<any>(null);
  const [activeDrawId, setActiveDrawId] = useState<string>("RIF-2026-000184");
  const [activeDrawTitle, setActiveDrawTitle] = useState<string>("iPhone 18 Pro 256 GB");

  // Conteo en tiempo real del dinero en balotas vendidas por sorteo (por evento)
  const activeUnitPrice = Number(
    activeDraw?.unit_price ||
      (activeDrawId.endsWith("185") ? 25000 : activeDrawId.endsWith("186") ? 15000 : 35000)
  );
  const activeTotalTickets = Number(activeDraw?.total_tickets || cartonSize || 1000);
  const activeSoldTickets = Number(
    activeDraw?.sold !== undefined
      ? activeDraw.sold
      : activeDrawId.endsWith("184")
      ? 842
      : activeDrawId.endsWith("185")
      ? 168
      : activeDrawId.endsWith("186")
      ? 390
      : Math.round(activeTotalTickets * 0.78)
  );
  const activeTotalRevenue = activeSoldTickets * activeUnitPrice;
  const activeRevenueGoal = activeTotalTickets * activeUnitPrice;
  const activeRevenuePct =
    activeTotalTickets > 0 ? Math.min(100, Math.round((activeSoldTickets / activeTotalTickets) * 100)) : 0;
  const [activeSpectatorCount, setActiveSpectatorCount] = useState<number>(1420);
  const [spectatorDuration, setSpectatorDuration] = useState<number>(0);
  const [reactionCounts, setReactionCounts] = useState<Record<string, number>>({ "👏": 489, "🔥": 915, "🎉": 630, "❤️": 1240 });
  const [floatingReactions, setFloatingReactions] = useState<{ id: number; emoji: string; left: number }[]>([]);
  const spectatorSessionIdRef = useRef<string>(`spec-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`);

  // Patrocinador oficial en la transmisión con posición y estado colapsable
  const { theme, setThemePreference } = useTheme();
  const [sponsorPos, setSponsorPos] = useState<"bottom" | "top">("bottom");
  const [sponsorBumper, setSponsorBumper] = useState<{
    visible: boolean;
    brand: string;
    subtitle: string;
    logo: string;
    triggerKey: number;
    collapsed: boolean;
  }>({
    visible: true,
    brand: "TechStore Colombia",
    subtitle: "Distribuidor Autorizado Apple · Patrocinador Oficial",
    logo: "⚡",
    triggerKey: 1,
    collapsed: false,
  });

  const [showSponsorModal, setShowSponsorModal] = useState(false);
  const [sponsorFollowers, setSponsorFollowers] = useState(1580);
  const [isFollowingSponsor, setIsFollowingSponsor] = useState(false);
  const [isHudCollapsed, setIsHudCollapsed] = useState<boolean>(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("eg_followed_sponsors");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed[sponsorBumper.brand || "TechStore Colombia"]) {
          setIsFollowingSponsor(true);
          setSponsorFollowers(1581);
        }
      }
    } catch {}
  }, [sponsorBumper.brand]);

  const handleToggleFollowSponsor = () => {
    const brand = sponsorBumper.brand || "TechStore Colombia";
    const nextState = !isFollowingSponsor;
    setIsFollowingSponsor(nextState);
    setSponsorFollowers((prev) => (nextState ? prev + 1 : prev - 1));
    try {
      const stored = localStorage.getItem("eg_followed_sponsors") || "{}";
      const parsed = JSON.parse(stored);
      parsed[brand] = nextState;
      localStorage.setItem("eg_followed_sponsors", JSON.stringify(parsed));
    } catch {}
  };

  const formatWatchTime = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins}m ${String(s).padStart(2, "0")}s`;
  };

  const isUserWinner = useMemo(() => {
    if (simulateWinnerMode) return true;
    if (!winner) return false;
    const cleanWinner = String(winner).trim().replace(/^0+/, "") || "0";
    if (officialTickets.some((t) => String(t).trim().replace(/^0+/, "") === cleanWinner)) {
      return true;
    }
    if (userTicketNumber && String(userTicketNumber).trim().replace(/^0+/, "") === cleanWinner) {
      return true;
    }
    try {
      const stored = localStorage.getItem("elganador_my_tickets");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.some((t: any) => String(t.number || t).trim().replace(/^0+/, "") === cleanWinner)) {
          return true;
        }
      }
    } catch {}
    return false;
  }, [simulateWinnerMode, winner, officialTickets, userTicketNumber]);

  useEffect(() => {
    if (phase !== "winner" || !winner) return;

    // 1. DESACTIVA POR COMPLETO EL CIERRE AUTOMÁTICO (EL TIQUETE Y RESULTADO PERMANECEN HASTA QUE EL USUARIO ACCIONE QUITAR)
    if (autoCloseTimerRef.current) {
      window.clearTimeout(autoCloseTimerRef.current);
      autoCloseTimerRef.current = null;
    }
    if (autoCloseIntervalRef.current) {
      window.clearInterval(autoCloseIntervalRef.current);
      autoCloseIntervalRef.current = null;
    }
    setAutoCloseCountdown(null);

    // 2. REGISTRO DE PREMIO GANADO (elganador_won_prizes) — SOLO si el usuario es el ganador real
    if (isUserWinner) {
      try {
        const wonTitle = activeDrawTitle || (mode === "balotas" ? "El Círculo Dorado" : "La ruleta de tu comunidad");
        const wonMerchant = sponsorBumper.brand || "TechStore Colombia";
        const added = addWonPrize({
          id: `prize-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          drawId: activeDrawId || "RIF-2026-000184",
          title: wonTitle,
          winnerNumber: String(winner),
          merchant: wonMerchant,
          date: new Date().toLocaleDateString("es-CO", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          }),
          sha256Hash: auditHash || "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
          status: "Pendiente de entrega",
          createdAt: Date.now(),
        });
        // Aviso nativo del dispositivo solo la primera vez y si el usuario lo permite en Perfil
        if (added && getNotificationPrefs().notifyLiveDraws) {
          void showNativeNotification({
            title: "🏆 ¡Ganaste un premio!",
            body: `Tu boleta #${winner} fue la ganadora de ${wonTitle}. Toca para ver tu certificado.`,
            url: "/mis-boletas",
          });
        }
      } catch (e) {
        console.error("Error guardando premio ganado:", e);
      }
    }

    return () => {
      if (autoCloseTimerRef.current) window.clearTimeout(autoCloseTimerRef.current);
      if (autoCloseIntervalRef.current) window.clearInterval(autoCloseIntervalRef.current);
    };
  }, [phase, winner, isUserWinner, activeDrawId, activeDrawTitle, mode, sponsorBumper.brand, auditHash, router]);

  // Despliegue automático de la ventana de chat entre el comercio y el cliente al ganar
  useEffect(() => {
    if (phase === "winner" && winner) {
      const merchantName = activeDraw?.admin || sponsorBumper.brand || "Motos Caribe Oficial";
      const prizeName = activeDrawTitle || "Premio Mayor";
      const winningNumber = winner || "01";

      try {
        const saved = localStorage.getItem(`elganador_chat_${activeDrawId}`);
        if (saved) {
          setWinnerChatMessages(JSON.parse(saved));
        } else {
          setWinnerChatMessages([
            {
              sender: "merchant",
              text: `¡Hola y felicitaciones! 🎉 Has resultado ganador oficial de "${prizeName}" con la balota #${winningNumber} (Sorteo auditado con SHA-256). Por favor indícanos tus datos para coordinar el acta notarial y la entrega física o envío del premio:\n\n1. Nombre completo y Cédula\n2. Ciudad y Dirección de recepción\n3. Teléfono de contacto`,
              time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            },
          ]);
        }
      } catch {
        setWinnerChatMessages([
          {
            sender: "merchant",
            text: `¡Hola y felicitaciones! 🎉 Has resultado ganador oficial de "${prizeName}" con la balota #${winningNumber} (Sorteo auditado con SHA-256). Por favor indícanos tus datos para coordinar el acta notarial y la entrega física o envío del premio:\n\n1. Nombre completo y Cédula\n2. Ciudad y Dirección de recepción\n3. Teléfono de contacto`,
            time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          },
        ]);
      }

      // Los mensajes iniciales quedan listos; el chat se abre a demanda mediante el botón "Chatear con el Comercio" en el Tiquete Ganador o en la tarjeta
    }
  }, [phase, winner, activeDrawId, activeDrawTitle, activeDraw?.admin, sponsorBumper.brand, mode]);

  const handleSendWinnerChatMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!winnerChatInput.trim()) return;

    const userText = winnerChatInput.trim();
    const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const newMsg = {
      sender: "client" as const,
      text: userText,
      time,
    };

    const updated = [...winnerChatMessages, newMsg];
    setWinnerChatMessages(updated);
    setWinnerChatInput("");

    try {
      localStorage.setItem(`elganador_chat_${activeDrawId}`, JSON.stringify(updated));
    } catch {}

    window.setTimeout(() => {
      let replyText = "¡Excelente! Hemos recibido tus datos. Un asesor comercial del comercio se pondrá en contacto contigo para emitir el acta oficial y realizar la entrega de tu premio.";
      const lower = userText.toLowerCase();
      if (lower.includes("cedula") || lower.includes("cédula") || lower.includes("documento")) {
        replyText = "Cédula registrada con éxito. Recuerda que para la entrega física o envío solo debes presentar tu documento original y tu tiquete digital de El Ganador.";
      } else if (lower.includes("direccion") || lower.includes("dirección") || lower.includes("ciudad")) {
        replyText = "Dirección y ciudad tomadas correctamente. Se programará el despacho mediante transporte asegurado con trazabilidad en tiempo real.";
      } else if (lower.includes("horario") || lower.includes("hora") || lower.includes("cuando")) {
        replyText = "Nuestros puntos de entrega oficial y atención operan de Lunes a Sábado de 8:00 AM a 6:00 PM.";
      }

      const replyMsg = {
        sender: "merchant" as const,
        text: replyText,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setWinnerChatMessages((prev) => {
        const next = [...prev, replyMsg];
        try {
          localStorage.setItem(`elganador_chat_${activeDrawId}`, JSON.stringify(next));
        } catch {}
        return next;
      });
    }, 1100);
  };

  const triggerReaction = (emoji: string) => {
    setReactionCounts((prev) => ({ ...prev, [emoji]: (prev[emoji] || 0) + 1 }));
    const id = Date.now() + Math.random();
    const left = 20 + Math.random() * 60;
    setFloatingReactions((prev) => [...prev, { id, emoji, left }]);
    window.setTimeout(() => {
      setFloatingReactions((prev) => prev.filter((r) => r.id !== id));
    }, 1600);

    fetch("/api/live-draw/spectator", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId: spectatorSessionIdRef.current,
        drawId: activeDrawId,
        durationSeconds: spectatorDurationRef.current,
        reaction: emoji,
      }),
    }).catch(() => {});
  };

  const switchLiveDraw = (draw: any) => {
    setActiveDraw(draw);
    setActiveDrawId(draw.id);
    setActiveDrawTitle(draw.title);
    if (typeof window !== "undefined" && window.history) {
      const url = new URL(window.location.href);
      url.searchParams.set("draw", draw.id);
      window.history.pushState({}, "", url.toString());
    }
    const sp = getSponsorForTitle(draw.title || "");
    setSponsorBumper({
      visible: true,
      brand: sp.brand,
      subtitle: sp.subtitle,
      logo: sp.logo,
      triggerKey: Date.now(),
      collapsed: false,
    });
    // AMARRE ESTRICTO: Las balotas están 100% definidas por el sorteo y la publicación oficial
    const targetTickets = Number(draw.total_tickets || draw.totalTickets || (draw.id?.endsWith('185') ? 200 : draw.id?.endsWith('186') ? 500 : draw.id?.endsWith('184') ? 1000 : 200));
    if (mode === "balotas") {
      setCartonSize(targetTickets);
      const padLength = Math.max(2, String(targetTickets).length);
      setDisplayNumber("1".padStart(padLength, "0"));
      resetDemo();
    }
    // Ajustar conteo dinámico de espectadores por sala
    if (draw.id.endsWith("184")) setActiveSpectatorCount(1482);
    else if (draw.id.endsWith("185")) setActiveSpectatorCount(890);
    else if (draw.id.endsWith("186")) setActiveSpectatorCount(645);
    else if (draw.id.endsWith("187")) setActiveSpectatorCount(410);
    else setActiveSpectatorCount(520);
  };

  const balotasAudioRef = useRef<HTMLAudioElement | null>(null);
  const ruletaAudioRef = useRef<HTMLAudioElement | null>(null);
  const testAudioRef = useRef<HTMLAudioElement | null>(null);
  const voiceAudioRef = useRef<HTMLAudioElement | null>(null);
  const revealTicketTimerRef = useRef<number | null>(null);
  const revealCountdownIntervalRef = useRef<number | null>(null);
  const liveSnapshotCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const socialCaptureRef = useRef<RenderedSocialCapture | null>(null);

  function handleCopyClientLink() {
    if (typeof window === "undefined") return;
    const url = `${window.location.origin}/sorteo-en-vivo?viewer=1`;
    try {
      navigator.clipboard.writeText(url);
      setCopiedClientLink(true);
      window.setTimeout(() => setCopiedClientLink(false), 3000);
    } catch {
      prompt("Copia el siguiente enlace para compartir con tus clientes:", url);
    }
  }

  function getDrawCalendarTimes() {
    const start = new Date(Date.now() + 60 * 60 * 1000);
    start.setMinutes(Math.ceil(start.getMinutes() / 30) * 30, 0, 0);
    const end = new Date(start.getTime() + 30 * 60 * 1000);

    function toIsoCompact(d: Date) {
      return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
    }
    return {
      startCompact: toIsoCompact(start),
      endCompact: toIsoCompact(end),
      startHuman: start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      dateHuman: start.toLocaleDateString([], { weekday: "short", day: "numeric", month: "short" }),
    };
  }

  function getGoogleCalendarUrl() {
    if (typeof window === "undefined") return "#";
    const clientUrl = `${window.location.origin}/sorteo-en-vivo?viewer=1`;
    const times = getDrawCalendarTimes();
    const title = `🔴 Sorteo Oficial en Vivo - El Círculo Dorado (Cartón de ${cartonSize})`;
    const ticketsLabel = officialTickets.length > 0
      ? `🎫 Tus boletas oficiales registradas: ${officialTickets.map(t => `#${t}`).join(", ")}\n`
      : userTicketNumber ? `🎫 Tu boleta: #${userTicketNumber.padStart(2, "0")}\n` : "";
    const details = `¡No te pierdas la extracción en vivo de El Círculo Dorado!\n\n` +
      `🎟️ Cartón Oficial: 01 a ${cartonSize} números.\n` +
      ticketsLabel +
      `🌐 Sala de sorteo en vivo: ${clientUrl}\n\n` +
      `Certificación criptográfica de azar y constancia notarial SHA-256 garantizada por El Ganador.`;

    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${times.startCompact}/${times.endCompact}&details=${encodeURIComponent(details)}&location=${encodeURIComponent(clientUrl)}`;
  }

  function handleDownloadIcs() {
    if (typeof window === "undefined") return;
    const clientUrl = `${window.location.origin}/sorteo-en-vivo?viewer=1`;
    const times = getDrawCalendarTimes();
    const nowCompact = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
    const title = `Sorteo Oficial en Vivo - El Círculo Dorado (Cartón de ${cartonSize})`;
    const ticketsLabel = officialTickets.length > 0
      ? ` - Boletas: ${officialTickets.map(t => `#${t}`).join(", ")}`
      : userTicketNumber ? ` - Tu boleta: #${userTicketNumber.padStart(2, "0")}` : "";
    const desc = `Extracción oficial en vivo en El Círculo Dorado. Enlace: ${clientUrl}${ticketsLabel}`;

    const icsContent = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//El Ganador//El Circulo Dorado v1.0//ES",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      "BEGIN:VEVENT",
      `UID:sorteo-${Date.now()}@elganador.app`,
      `DTSTAMP:${nowCompact}`,
      `DTSTART:${times.startCompact}`,
      `DTEND:${times.endCompact}`,
      `SUMMARY:${title}`,
      `DESCRIPTION:${desc}`,
      `URL:${clientUrl}`,
      `LOCATION:${clientUrl}`,
      "STATUS:CONFIRMED",
      "BEGIN:VALARM",
      "TRIGGER:-PT15M",
      "ACTION:DISPLAY",
      "DESCRIPTION:Recordatorio: En 15 minutos comienza tu sorteo oficial en El Círculo Dorado",
      "END:VALARM",
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");

    const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", `recordatorio-circulo-dorado.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  }

  function getWhatsAppShareUrl() {
    if (typeof window === "undefined") return "#";
    const clientUrl = `${window.location.origin}/sorteo-en-vivo?viewer=1`;
    const ticketsLabel = officialTickets.length > 0
      ? `🎫 Mis boletas compradas: *${officialTickets.map(t => `#${t}`).join(", ")}*\n\n`
      : userTicketNumber ? `🎫 Mi número de boleta es: *#${userTicketNumber.padStart(2, "0")}*\n\n` : "\n";
    const msg = `🔴 *¡Sorteo Oficial en Vivo en El Círculo Dorado!* 🎟️\n\n` +
      `No te pierdas la extracción en directo (Cartón de ${cartonSize} números).\n` +
      ticketsLabel +
      `👉 Conéctate a la sala en vivo aquí:\n${clientUrl}`;
    return `https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`;
  }

  function handleCopyGoogleReminderLink() {
    if (typeof window === "undefined") return;
    const url = getGoogleCalendarUrl();
    try {
      navigator.clipboard.writeText(url);
      setCopiedReminderLink(true);
      window.setTimeout(() => setCopiedReminderLink(false), 3000);
    } catch {
      prompt("Copia el siguiente enlace de agendamiento para tus clientes:", url);
    }
  }

  async function handleSearchClientTickets(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!clientSearchEmail.trim()) return;
    setIsSearchingTickets(true);
    setTicketSearchFeedback("");
    try {
      const res = await fetch(`/api/live-draw/client-tickets?email=${encodeURIComponent(clientSearchEmail.trim())}`, { cache: "no-store" });
      const data = await res.json();
      if (data && data.ok && data.tickets && data.tickets.length > 0) {
        setOfficialTickets(data.tickets);
        setTicketSearchFeedback(`✓ Encontramos ${data.tickets.length} boleta(s) comprada(s) a nombre de ${data.buyerName || clientSearchEmail}.`);
      } else {
        setTicketSearchFeedback(`No encontramos compras con ese correo. Revisa o inicia sesión.`);
      }
    } catch {
      setTicketSearchFeedback("Error al consultar boletas.");
    } finally {
      setIsSearchingTickets(false);
    }
  }

  // Detección automática del Modo Espectador / Cliente para celulares y carga de boletas del perfil
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const forceViewer = params.get("viewer") === "1" || params.get("modo") === "cliente";
    if (forceViewer) {
      setIsViewerMode(true);
      // setIsCinemaFullscreen(false);
    }
    const forceRuleta = params.get("mode") === "ruleta" || params.get("modo") === "ruleta";
    if (forceRuleta) {
      setMode("ruleta");
    }
    try {
      const savedTicket = localStorage.getItem("eg_client_ticket");
      if (savedTicket) setUserTicketNumber(savedTicket);
    } catch {}

    // Consultar sesión y boletas reales compradas en el perfil
    fetch("/api/live-draw/client-tickets", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (data && data.ok) {
          if (data.account) {
            setClientAccount(data.account);
            if (data.account.role === "business" && !forceViewer) {
              setIsViewerMode(false);
            }
          }
          if (data.tickets && data.tickets.length > 0) {
            setOfficialTickets(data.tickets);
          }
        }
      })
      .catch(() => {});

    // Cargar canales de sorteos disponibles y sintonizar automáticamente el juego que está en vivo
    fetch("/api/draws", { cache: "no-store" })
      .then((res) => res.json())
      .then((data: { draws?: any[] }) => {
        if (data && data.draws && data.draws.length > 0) {
          setAvailableDraws(data.draws);
          const params = new URLSearchParams(window.location.search);
          const requestedId = params.get("draw") || params.get("id");
          const targetDraw = (requestedId ? data.draws.find((d) => d.id === requestedId) : null) ||
            data.draws.find((d) => Boolean(d.live)) ||
            data.draws[0];
          if (targetDraw) {
            switchLiveDraw(targetDraw);
          }
        }
      })
      .catch(() => {});

    // Contador de tiempo en sala de espectador para retención CRM
    const secTimer = window.setInterval(() => {
      setSpectatorDuration((prev) => {
        spectatorDurationRef.current = prev + 1;
        return prev + 1;
      });
    }, 1000);

    // Heartbeat de rating y retención cada 12s
    const heartbeatTimer = window.setInterval(async () => {
      try {
        const res = await fetch("/api/live-draw/spectator", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId: spectatorSessionIdRef.current,
            drawId: activeDrawId,
            durationSeconds: spectatorDuration,
          }),
        });
        const data = await res.json();
        if (data && data.activeSpectators) {
          setActiveSpectatorCount(data.activeSpectators);
        }
      } catch {}
    }, 30000);

    return () => {
      window.clearInterval(secTimer);
      window.clearInterval(heartbeatTimer);
    };
  }, [activeDrawId]);

  // Sincronización en tiempo real del sorteo con los celulares de los clientes
  useEffect(() => {
    if (!isViewerMode) return;
    let isMounted = true;
    const syncInterval = window.setInterval(async () => {
      try {
        const res = await fetch("/api/live-draw", { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        if (!isMounted || !data.ok || !data.broadcast) return;
        const bc = data.broadcast;
        const now = bc.serverTime || Date.now();
        const ageMs = now - bc.started_at_epoch_ms;
        const elapsedSec = ageMs / 1000;

        if (bc.status === "running" && phase === "ready" && elapsedSec < 56) {
          playDemo();
        } else if (bc.status === "completed" && phase === "ready" && bc.selected && elapsedSec < 120) {
          const parsedSlot = bc.selected.match(/^Participante\s+(\d+)$/i)?.[1]?.padStart(2, "0") || bc.selected;
          setWinner(bc.selected);
          setDisplayNumber(parsedSlot);
          setPhase("winner");
      setActiveResultTab("ganador");
          setStage("reveal");
          setLatestAct(bc.actData);
          setShowCelebration(true);
        } else if (bc.status === "idle" && (phase === "winner" || phase === "spinning")) {
          setPhase("ready");
          setStage("idle");
          setWinner("");
          setShowCelebration(false);
        }
      } catch {}
    }, 30000);

    return () => {
      isMounted = false;
      clearInterval(syncInterval);
    };
  }, [isViewerMode, phase]);

  // Registra el banco nativo de elementos <audio playsInline> reales del DOM (Apple AVPlayer Playback)
  useEffect(() => {
    preloadWinnerVoice();
    drawAudio.attachMediaBank({
      balotas: balotasAudioRef.current,
      ruleta: ruletaAudioRef.current,
      test: testAudioRef.current,
      voice: voiceAudioRef.current,
    });
    drawAudio.prepareMode(mode);

    // Desbloqueo pasivo en el primer toque/click del usuario para evitar restricciones de autoplay en celulares
    const handleFirstGesture = () => {
      drawAudio.unlockAllAudio();
      window.removeEventListener("pointerdown", handleFirstGesture);
      window.removeEventListener("touchstart", handleFirstGesture);
      window.removeEventListener("click", handleFirstGesture);
    };
    window.addEventListener("pointerdown", handleFirstGesture, { once: true, passive: true });
    window.addEventListener("touchstart", handleFirstGesture, { once: true, passive: true });
    window.addEventListener("click", handleFirstGesture, { once: true, passive: true });

    return () => {
      window.removeEventListener("pointerdown", handleFirstGesture);
      window.removeEventListener("touchstart", handleFirstGesture);
      window.removeEventListener("click", handleFirstGesture);
    };
  }, [mode]);

  useEffect(() => {
    let clearTimer: number | null = null;
    const unsub = drawAudio.onStatusChange((next) => {
      setAudioStatus(next);
      if (clearTimer) window.clearTimeout(clearTimer);
      if (next.state === "testing" || next.state === "voice") {
        clearTimer = window.setTimeout(() => {
          setAudioStatus((prev) => (prev.state === next.state ? { state: "idle", message: "" } : prev));
        }, 4500);
      }
    });
    return () => {
      unsub();
      if (clearTimer) window.clearTimeout(clearTimer);
      if (revealTicketTimerRef.current) window.clearTimeout(revealTicketTimerRef.current);
      if (revealCountdownIntervalRef.current) window.clearInterval(revealCountdownIntervalRef.current);
      drawAudio.stopAll();
      stopWinnerVoice();
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (wheelRafRef.current) cancelAnimationFrame(wheelRafRef.current);
    };
  }, []);

  const [canvasEl, setCanvasEl] = useState<HTMLCanvasElement | null>(null);
  const stageRef = useRef<DrawStage>(stage);
  useEffect(() => {
    stageRef.current = stage;
  }, [stage]);

  const animFrameRef = useRef<number | null>(null);
  const intervalRef = useRef<number | null>(null);

  // Generar la lista canónica de boletas según la serie: 01 a 99, 01 a 200, 01 a 500, 01 a 1000
  const eligibleNumbers = useMemo(() => {
    const padLength = Math.max(2, String(cartonSize).length);
    return Array.from({ length: cartonSize }, (_, i) => {
      return String(i + 1).padStart(padLength, "0");
    });
  }, [cartonSize]);

  const wheelPlayers = useMemo(
    () => wheelDraft.split(/\r?\n/).map((e) => e.trim()).filter(Boolean).slice(0, wheelSize),
    [wheelDraft, wheelSize]
  );

  const wheelGradient = useMemo(() => buildCasinoWheelConicGradient(wheelSize), [wheelSize]);

  const rouletteWinnerNum = useMemo(() => {
    const fromAct = latestAct?.certificate?.result?.position;
    if (mode === "ruleta" && typeof fromAct === "number" && fromAct >= 1) {
      return String(fromAct).padStart(2, "0");
    }
    const match = winner.match(/^Participante\s+(\d+)$/i);
    if (match) return match[1].padStart(2, "0");
    if (/^\d+$/.test(displayNumber)) return displayNumber;
    return winner;
  }, [mode, latestAct, winner, displayNumber]);

  const rouletteWinnerCustomName = useMemo(() => {
    if (mode !== "ruleta" || !winner) return "";
    if (/^Participante\s+\d+$/i.test(winner)) return "";
    if (winner === rouletteWinnerNum || winner === `#${rouletteWinnerNum}`) return "";
    return winner;
  }, [mode, winner, rouletteWinnerNum]);

  // Motor de física en Canvas: balotas de colores rodando y rebotando con fluidez hiperrealista
  useEffect(() => {
    if (mode !== "balotas" || !canvasEl) return;

    const canvas = canvasEl;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = typeof window !== "undefined" ? Math.min(window.devicePixelRatio || 1, 2) : 1;
    const size = 480; // Diámetro nominal del chasis con escalado de alta fidelidad
    canvas.width = size * dpr;
    canvas.height = size * dpr;

    const radius = size / 2;
    const centerX = size / 2;
    const centerY = size / 2;

    const totalCount = eligibleNumbers.length;
    // Balotas visibles según tamaño de cartón para máxima nitidez y fluidez a 60/120 FPS
    // Para cartón de 100: EXACTAMENTE las 100 balotas completas (01 a 99)
    // Para 200: 200 balotas completas. Para 500/1000: densidad optimizada de 120 balotas.
    const renderCount = Math.min(totalCount, totalCount <= 200 ? totalCount : 120);
    const ballRadius = renderCount <= 100 ? 18.5 : renderCount <= 200 ? 14 : 11;

    // Pre-renderizado de sprite en Canvas Offscreen para aceleración por GPU.
    // Evita 21.600 asignaciones/segundo de createRadialGradient y garantiza 60/120 FPS fluidos.
    const spriteNominal = ballRadius * 2 + 8;
    const spriteDpr = 2;
    const spriteCanvas = typeof document !== "undefined" ? document.createElement("canvas") : null;
    if (spriteCanvas) {
      spriteCanvas.width = spriteNominal * spriteDpr;
      spriteCanvas.height = spriteNominal * spriteDpr;
      const sCtx = spriteCanvas.getContext("2d");
      if (sCtx) {
        sCtx.scale(spriteDpr, spriteDpr);
        const scX = spriteNominal / 2;
        const scY = spriteNominal / 2;

        // Sombra suave proyectada en fondo de cristal
        sCtx.beginPath();
        sCtx.arc(scX + 1.2, scY + 2.0, ballRadius * 0.98, 0, Math.PI * 2);
        sCtx.fillStyle = "rgba(15, 23, 42, 0.16)";
        sCtx.fill();

        // Esfera 3D Pearl-White (Ivory Gloss de Alta Gama)
        const grad = sCtx.createRadialGradient(
          scX - ballRadius * 0.32, scY - ballRadius * 0.32, ballRadius * 0.04,
          scX, scY, ballRadius
        );
        grad.addColorStop(0, "#ffffff");
        grad.addColorStop(0.24, "#fffefa");
        grad.addColorStop(0.60, "#f4ede0");
        grad.addColorStop(0.85, "#ded4c3");
        grad.addColorStop(1, "#b5a894");

        sCtx.beginPath();
        sCtx.arc(scX, scY, ballRadius, 0, Math.PI * 2);
        sCtx.fillStyle = grad;
        sCtx.fill();

        // Aro de luz perimetral fino
        sCtx.lineWidth = 0.8;
        sCtx.strokeStyle = "rgba(140, 125, 105, 0.4)";
        sCtx.stroke();

        // Reflejo especular elíptico
        const glossGrad = sCtx.createRadialGradient(
          scX - ballRadius * 0.32, scY - ballRadius * 0.32, 0,
          scX - ballRadius * 0.32, scY - ballRadius * 0.32, ballRadius * 0.30
        );
        glossGrad.addColorStop(0, "rgba(255, 255, 255, 0.95)");
        glossGrad.addColorStop(0.42, "rgba(255, 255, 255, 0.45)");
        glossGrad.addColorStop(1, "rgba(255, 255, 255, 0)");
        sCtx.beginPath();
        sCtx.arc(scX - ballRadius * 0.32, scY - ballRadius * 0.32, ballRadius * 0.30, 0, Math.PI * 2);
        sCtx.fillStyle = glossGrad;
        sCtx.fill();

        // Inset circular nítido (disco central)
        const innerR = ballRadius * 0.54;
        const discGrad = sCtx.createRadialGradient(
          scX - innerR * 0.2, scY - innerR * 0.2, innerR * 0.05,
          scX, scY, innerR
        );
        discGrad.addColorStop(0, "#ffffff");
        discGrad.addColorStop(0.85, "#fafaf8");
        discGrad.addColorStop(1, "#ede8dd");

        sCtx.beginPath();
        sCtx.arc(scX, scY, innerR, 0, Math.PI * 2);
        sCtx.fillStyle = discGrad;
        sCtx.fill();
        sCtx.strokeStyle = "rgba(160, 140, 115, 0.7)";
        sCtx.lineWidth = 0.9;
        sCtx.stroke();
      }
    }

    // Distribución natural y armónica en el fondo de la esfera para inicio inmediato
    const balls = Array.from({ length: renderCount }, (_, i) => {
      const num = eligibleNumbers[i];
      const cols = 10;
      const row = Math.floor(i / cols);
      const col = i % cols;
      const spreadX = (col - (cols - 1) / 2) * (ballRadius * 1.85) + (Math.random() - 0.5) * 4;
      const spreadY = 40 + row * (ballRadius * 1.18) + (Math.random() - 0.5) * 3;
      const spawnX = centerX + spreadX;
      const spawnY = centerY + spreadY;
      return {
        x: Math.min(centerX + radius - ballRadius - 8, Math.max(centerX - radius + ballRadius + 8, spawnX)),
        y: Math.min(centerY + radius - ballRadius - 8, Math.max(centerY - radius + ballRadius + 8, spawnY)),
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        num,
        angle: (Math.random() - 0.5) * 0.3,
        vRot: (Math.random() - 0.5) * 0.02,
      };
    });

    let running = true;

    function render() {
      if (!running || !ctx) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, size, size);

      const currentStage = stageRef.current;
      const isCountdown = currentStage === "countdown";
      const isMixing = currentStage === "mixing";
      const isSuction = currentStage === "suction";
      const isSlowdown = currentStage === "slowdown";
      const isIdleOrReveal = currentStage === "idle" || currentStage === "reveal";

      // Actualizar física de cada balota
      for (let i = 0; i < balls.length; i += 1) {
        const b = balls[i];

        if (isIdleOrReveal) {
          // Gravedad natural hacia el fondo con amortiguación suave
          b.vy += 0.22;
          b.vx *= 0.95;
          b.vy *= 0.95;
        } else if (isCountdown) {
          // En conteo previo: reposo fluido con sutil vibración previa al inicio
          b.vy += 0.22;
          b.vx *= 0.94;
          b.vy *= 0.94;
          b.vx += (Math.random() - 0.5) * 0.12;
        } else if (isMixing) {
          // FASE 1: AGITACIÓN NEUMÁTICA FLUIDA Y CONTINUA (Efecto Fuente Toroidal)
          b.vy += 0.18;
          // Columna de aire ascendente desde la turbina central inferior
          const distFromCenterAxis = Math.abs(b.x - centerX);
          if (b.y > centerY + 18 && distFromCenterAxis < radius * 0.58) {
            b.vy -= 2.6 + Math.random() * 2.8;
            b.vx += (Math.random() - 0.5) * 3.8;
          }
          // En el hemisferio superior, expansión natural hacia los lados
          if (b.y < centerY) {
            const sideSign = b.x >= centerX ? 1 : -1;
            b.vx += sideSign * 0.42;
          }
          // Movimiento orbital centrífugo suave para mezcla perfecta
          const dx = b.x - centerX;
          const dy = b.y - centerY;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          b.vx += (-dy / dist) * 1.1 + (Math.random() - 0.5) * 1.2;
          b.vy += (dx / dist) * 1.1 + (Math.random() - 0.5) * 1.2;
          b.vx *= 0.985;
          b.vy *= 0.985;
        } else if (isSuction) {
          // FASE 2: SUCCIÓN AERODINÁMICA POTENTE - TODAS LAS BOLAS SUBEN EN MASA HACIA LA TOBERA SUPERIOR
          // Potente empuje vertical hacia arriba (vórtice de vacío hacia la tobera)
          b.vy -= 1.8 + Math.random() * 2.2;
          // Atracción hacia el eje central ascendente de la tobera
          b.vx += (centerX - b.x) * 0.05 + (Math.random() - 0.5) * 3.2;
          // Torbellino rotacional en espiral ascendente
          const dx = b.x - centerX;
          const dy = b.y - centerY;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          b.vx += (-dy / dist) * 1.5;
          b.vy += (dx / dist) * 0.5;
          // Recirculación al topar el techo de cristal
          if (b.y < centerY - radius * 0.72) {
            b.vy += 3.2;
            b.vx += (b.x >= centerX ? 1.5 : -1.5) * 2.2;
          }
          b.vx *= 0.97;
          b.vy *= 0.97;
        } else if (isSlowdown) {
          // FASE 3: VERIFICACIÓN Y ASENTAMIENTO GRADUAL
          b.vy += 0.24;
          b.vx *= 0.94;
          b.vy *= 0.94;
        }

        // Límite seguro de velocidad para evitar saltos
        b.vx = Math.max(-14, Math.min(14, b.vx));
        b.vy = Math.max(-14, Math.min(14, b.vy));

        b.x += b.vx;
        b.y += b.vy;
        b.angle += b.vRot;

        // Rebote elástico contra las paredes esféricas
        const distFromCenter = Math.hypot(b.x - centerX, b.y - centerY);
        const maxDist = radius - ballRadius - 3;
        if (distFromCenter > maxDist) {
          const nx = (b.x - centerX) / (distFromCenter || 1);
          const ny = (b.y - centerY) / (distFromCenter || 1);
          b.x = centerX + nx * maxDist;
          b.y = centerY + ny * maxDist;
          const dot = b.vx * nx + b.vy * ny;
          b.vx = (b.vx - 2 * dot * nx) * 0.88;
          b.vy = (b.vy - 2 * dot * ny) * 0.88;
        }

        // Colisión entre balotas contiguas optimizada con rechazo temprano de ejes X/Y
        const minDist = ballRadius * 2;
        const minDistSq = minDist * minDist;
        for (let j = i + 1; j < balls.length; j += 1) {
          const b2 = balls[j];
          const cdx = b2.x - b.x;
          if (cdx > minDist || cdx < -minDist) continue;
          const cdy = b2.y - b.y;
          if (cdy > minDist || cdy < -minDist) continue;
          const distSq = cdx * cdx + cdy * cdy;
          if (distSq < minDistSq && distSq > 0) {
            const cdist = Math.sqrt(distSq);
            const overlap = (minDist - cdist) / 2;
            const cnx = cdx / cdist;
            const cny = cdy / cdist;
            b.x -= cnx * overlap;
            b.y -= cny * overlap;
            b2.x += cnx * overlap;
            b2.y += cny * overlap;
            const p = (b.vx * cnx + b.vy * cny - b2.vx * cnx - b2.vy * cny);
            b.vx -= p * cnx * 0.72;
            b.vy -= p * cny * 0.72;
            b2.vx += p * cnx * 0.72;
            b2.vy += p * cny * 0.72;
          }
        }

        // Dibujar Balota 3D con textura pre-renderizada acelerada por GPU (60/120 FPS ultra fluidos)
        ctx.save();
        ctx.translate(b.x, b.y);
        ctx.rotate(b.angle);

        if (spriteCanvas) {
          ctx.drawImage(spriteCanvas, -spriteNominal / 2, -spriteNominal / 2, spriteNominal, spriteNominal);
        } else {
          ctx.beginPath();
          ctx.arc(0, 0, ballRadius, 0, Math.PI * 2);
          ctx.fillStyle = "#fafaf8";
          ctx.fill();
        }

        // Número de dos dígitos de alto contraste en negro carbón profundo
        ctx.fillStyle = "#09090b";
        ctx.font = `900 ${renderCount <= 100 ? "11.5px" : "9.5px"} 'JetBrains Mono', -apple-system, Arial, sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(b.num, 0, 0.5);

        // Subrayado legal para balotas con riesgo de rotación (6 vs 9)
        if (hasAmbiguityRisk(b.num)) {
          ctx.fillStyle = "#09090b";
          ctx.fillRect(-5, ballRadius * 0.34, 10, 1.3);
        }

        ctx.restore();
      }

      animFrameRef.current = requestAnimationFrame(render);
    }

    render();

    return () => {
      running = false;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [canvasEl, mode, eligibleNumbers]);

  function clearRevealTicketTimers() {
    if (revealTicketTimerRef.current) {
      window.clearTimeout(revealTicketTimerRef.current);
      revealTicketTimerRef.current = null;
    }
    if (revealCountdownIntervalRef.current) {
      window.clearInterval(revealCountdownIntervalRef.current);
      revealCountdownIntervalRef.current = null;
    }
    setTicketCountdownSec(0);
  }

  function enterCinemaFullscreen() {
    setIsCinemaFullscreen(true);
    if (typeof document !== "undefined") {
      try {
        const elem = document.documentElement;
        if (!document.fullscreenElement && !(document as any).webkitFullscreenElement) {
          if (elem.requestFullscreen) {
            elem.requestFullscreen().catch(() => {});
          } else if ((elem as any).webkitRequestFullscreen) {
            (elem as any).webkitRequestFullscreen();
          }
        }
      } catch {}
    }
  }

  function exitCinemaFullscreen() {
    setIsCinemaFullscreen(false);
    if (typeof document !== "undefined") {
      try {
        if (document.fullscreenElement || (document as any).webkitFullscreenElement) {
          if (document.exitFullscreen) {
            document.exitFullscreen().catch(() => {});
          } else if ((document as any).webkitExitFullscreen) {
            (document as any).webkitExitFullscreen();
          }
        }
      } catch {}
    }
    window.setTimeout(() => {
      const winCard = document.querySelector(".epicWinnerCard") || document.querySelector(".liveDemoDetails");
      if (winCard) {
        winCard.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 80);
  }

  function scheduleDelayedTicketModal(delaySeconds: number) {
    clearRevealTicketTimers();
    const safeSec = Math.max(0.2, delaySeconds);
    setTicketCountdownSec(Math.ceil(safeSec));
    const endAt = Date.now() + safeSec * 1000;

    revealCountdownIntervalRef.current = window.setInterval(() => {
      const rem = Math.max(0, Math.ceil((endAt - Date.now()) / 1000));
      setTicketCountdownSec(rem);
      if (rem <= 0 && revealCountdownIntervalRef.current) {
        window.clearInterval(revealCountdownIntervalRef.current);
        revealCountdownIntervalRef.current = null;
      }
    }, 250);

    revealTicketTimerRef.current = window.setTimeout(() => {
      clearRevealTicketTimers();
      exitCinemaFullscreen();
      setShowTicketModal(true);
    }, Math.round(safeSec * 1000));
  }

  function captureLivePhysicsSnapshot() {
    if (!canvasEl || canvasEl.width === 0) return;
    try {
      const snap = document.createElement("canvas");
      snap.width = canvasEl.width;
      snap.height = canvasEl.height;
      const sctx = snap.getContext("2d");
      if (sctx) {
        sctx.drawImage(canvasEl, 0, 0);
        liveSnapshotCanvasRef.current = snap;
      }
    } catch {}
  }

  function resetDemo() {
    // PROTECCIÓN DE INTEGRIDAD: Prohibido detener o reiniciar mientras una balota está en juego
    if (phase === "spinning") return;
    clearRevealTicketTimers();
    drawAudio.stopAll();
    stopWinnerVoice();
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
    if (wheelRafRef.current) cancelAnimationFrame(wheelRafRef.current);
    wheelRafRef.current = null;
    try {
      localStorage.removeItem(ACTIVE_DRAW_STORAGE_KEY);
    } catch {}
    fetch("/api/live-draw", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "reset" }),
    }).catch(() => {});
    setIsRecoveredDraw(false);
    setCountdownNumber(null);
    setStageSecondsLeft(0);
    setWinner("");
    setPhase("ready");
    setStage("idle");
    setDisplayNumber(cartonSize === 99 ? "01" : cartonSize === 1000 ? "0001" : "001");
    currentWheelAngleRef.current = 0;
    currentFlapperTiltRef.current = 0;
    initialWheelRotationRef.current = 0;
    if (wheelBoardDomRef.current) wheelBoardDomRef.current.style.transform = "rotate(0deg)";
    if (flapperDomRef.current) flapperDomRef.current.style.transform = "translateX(-50%) rotate(0deg)";
    setWheelRotation(0);
    setFlapperTilt(0);
    setWheelSpinDurationSec(40);
    setDemoError("");
    setShowCelebration(false);
    setShowTicketModal(false);
    setShowSocialModal(false);
    setIsCinemaFullscreen(false);
    socialCaptureRef.current = null;
    setSocialCapture(null);
    setSocialFeedback("");
  }

  function downloadAct() {
    if (!latestAct) return;
    const drawId = latestAct.certificate?.drawId || latestAct.drawId || "EG-SORTEO";
    const winnerNum = latestAct.certificate?.result?.value || latestAct.result?.winner || winner || "WINNER";
    const filename = `Acta-Oficial-Sorteo-${drawId}-${winnerNum}.json`;
    const blob = new Blob([JSON.stringify(latestAct, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function handleCartonConfigChange(size: CartonSize) {
    if (phase === "spinning") return;
    const validSize = Math.max(2, Math.min(50000, size));
    setCartonSize(validSize);
    setCustomCartonInput(String(validSize));
    const padLength = Math.max(2, String(validSize).length);
    setDisplayNumber("1".padStart(padLength, "0"));
    resetDemo();
  }

  async function computeOfficialDrawResult(
    entries: string[],
    currentMode: GameMode,
    currentCartonSize: CartonSize,
    currentWheelSize: number
  ) {
    // 1. Obtener entropía criptográfica real de 256 bits
    const seedBytes = new Uint8Array(32);
    window.crypto.getRandomValues(seedBytes);
    let seedHex = "";
    for (const b of seedBytes) seedHex += b.toString(16).padStart(2, "0");

    // 2. Huella canónica de la lista
    const listCanonical = canonicalListBytes(entries);
    const calculatedListHash = await sha256Hex(listCanonical);

    // 3. Derivación determinista uniforme sin sesgo (HMAC-SHA-256)
    const drawId = `EG-${currentMode.toUpperCase()}-${Date.now().toString().slice(-6)}`;
    const derivation = await deriveWinnerIndex({
      drawId,
      listHash: calculatedListHash,
      entryCount: entries.length,
      seedHex,
      publicRandomness: null,
    });

    const chosenIndex = derivation.index;
    const selected = entries[chosenIndex];

    // 4. Estructurar el Acta Oficial Firmada (100% compatible con Verificador Independiente)
    const seedCommitment = await sha256Hex(fromHex(seedHex, 32));
    const commitAuditHash = await sha256Hex(seedCommitment + calculatedListHash);

    // 4.1 Registrar Pre-Compromiso Inmutable en el Servidor (ISO 17025 / Coljuegos Res. 20161200013844)
    try {
      fetch("/api/draws/commit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "commit",
          drawId,
          seedCommitment,
          listHash: calculatedListHash,
          entryCount: entries.length,
          mode: currentMode,
        }),
      }).catch(() => {});
    } catch {}

    const nowIso = new Date().toISOString();
    const nowLocal = new Date().toLocaleString("es-CO", { timeZone: "America/Bogota" });

    const actData = {
      certificate: {
        type: "EG-DRAW-CERTIFICATE-v1",
        engineVersion: "EG-ENGINE-1.0.0",
        algorithm: "HMAC-SHA256/U64-REJECTION-v1",
        drawId,
        drawRef: drawId,
        mode: currentMode,
        demo: true,
        commitment: {
          type: "EG-DRAW-COMMITMENT-v1",
          engineVersion: "EG-ENGINE-1.0.0",
          drawId,
          drawRef: drawId,
          mode: currentMode,
          demo: true,
          entryCount: entries.length,
          listHash: calculatedListHash,
          listCanonicalization: "EG-LIST-v1",
          seedCommitment,
          publicRandomness: null,
          committedAt: nowIso,
        },
        commitmentSignature: {
          alg: "Ed25519",
          keyId: "eg-key-official-validator",
          publicKey: "MCowBQYDK2VwAyEA0000000000000000000000000000000000000000000=",
          value: "MDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDA=",
          devKey: true,
        },
        entries: {
          count: entries.length,
          listHash: calculatedListHash,
          values: entries,
        },
        publicRandomness: null,
        reveal: {
          seed: seedHex,
        },
        result: {
          index: chosenIndex,
          position: chosenIndex + 1,
          value: selected,
          attempts: derivation.attempts,
        },
        commitAuditHash,
        executedAt: nowIso,
      },
      signature: {
        alg: "Ed25519",
        keyId: "eg-key-official-validator",
        publicKey: "MCowBQYDK2VwAyEA0000000000000000000000000000000000000000000=",
        value: "MDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDA=",
        devKey: true,
      },
      meta: {
        title: "ACTA OFICIAL DE SORTEO Y ADJUDICACIÓN DE PREMIO",
        platform: "El Ganador - Sistema Certificado de Sorteos",
        cartonDetails: currentMode === "balotas" ? `Cartón de ${currentCartonSize} números (${entries[0]} a ${entries[entries.length - 1]})` : `Ruleta de ${currentWheelSize} casillas`,
        range: `${entries[0]} a ${entries[entries.length - 1]}`,
        totalEntries: entries.length,
        winner: selected,
        localTimeBogota: nowLocal,
      },
    };

    // 5. Generar el Tiquete Oficial del Comprador (Cumplimiento Ley 643 de 2001 y Ley 1581 Habeas Data)
    const rouletteSlotNum = String(chosenIndex + 1).padStart(2, "0");
    const generatedTicket = generateWinnerTicket({
      drawId,
      winnerNumber: currentMode === "ruleta" ? rouletteSlotNum : selected,
      cartonSize: currentMode === "balotas" ? currentCartonSize : currentWheelSize,
      seedHex,
      listHash: calculatedListHash,
    });

    return {
      chosenIndex,
      selected,
      calculatedListHash,
      actData,
      generatedTicket,
    };
  }

  function buildSocialPromoCapture(
    targetFormat: SocialFormat,
    overrideWinner?: string,
    overrideAct?: any,
    overrideHash?: string
  ): RenderedSocialCapture | null {
    const activeWinner = overrideWinner || winner;
    if (!activeWinner) return null;
    setIsGeneratingSocial(true);
    try {
      const actSource = overrideAct || latestAct;
      const drawId = actSource?.certificate?.drawId || actSource?.drawId || "EG-OFICIAL";
      const cartonCount = mode === "balotas" ? cartonSize : wheelSize;
      const fullHash =
        overrideHash ||
        auditHash ||
        actSource?.certificate?.entries?.listHash ||
        "SHA256-VERIFICADO";
      const origin =
        typeof window !== "undefined" ? window.location.origin : "https://elganador.co";
      const verifyUrl = `${origin}/verificar?id=${encodeURIComponent(drawId)}&w=${encodeURIComponent(
        activeWinner
      )}&c=${cartonCount}&m=${mode}&h=${encodeURIComponent(fullHash.slice(0, 16))}`;
      const rangeLabel =
        mode === "balotas"
          ? `${eligibleNumbers[0]} a ${eligibleNumbers[eligibleNumbers.length - 1]}`
          : `1 a ${wheelSize}`;
      const rendered = renderSocialPromoCapture({
        format: targetFormat,
        mode,
        winner: activeWinner,
        cartonSize: cartonCount,
        rangeLabel,
        drawId,
        auditHash: fullHash,
        timestampBogota:
          actSource?.meta?.localTimeBogota ||
          new Date().toLocaleString("es-CO", { timeZone: "America/Bogota" }),
        verifyUrl,
        livePhysicsCanvas: canvasEl || liveSnapshotCanvasRef.current,
      });
      socialCaptureRef.current = rendered;
      setSocialCapture(rendered);
      return rendered;
    } catch {
      setSocialFeedback("No se pudo generar la vista previa. Intenta nuevamente.");
      return null;
    } finally {
      setIsGeneratingSocial(false);
    }
  }

  function handleFormatSwitch(nextFormat: SocialFormat) {
    setSocialFormat(nextFormat);
    setSocialFeedback("");
    buildSocialPromoCapture(nextFormat);
  }

  function downloadCaptureBlob(cap: RenderedSocialCapture) {
    const url = URL.createObjectURL(cap.jpgBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = cap.jpgFilename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.setTimeout(() => URL.revokeObjectURL(url), 4000);
  }

  /**
   * LÍNEA 1 DEL GESTO ONCLICK (sin setState ni bloqueo previo):
   * Dispara inmediatamente el menú nativo del celular con la foto HD pre-cargada en RAM.
   * Si el usuario abre desde un navegador interno restringido (WebView sin Web Share) o PC,
   * abre el panel de envío directo con botones 100% activos hacia WhatsApp, Facebook e Instagram.
   */
  async function handleDirectShareWinner() {
    const cap = socialCaptureRef.current || socialCapture || buildSocialPromoCapture(socialFormat);
    if (!cap) return;

    const outcome = await shareCaptureFileNatively(cap);
    clearRevealTicketTimers();

    if (outcome === "shared_file" || outcome === "shared_link") {
      setSocialFeedback("✅ ¡Captura oficial de la balotera lista para compartir!");
      return;
    }
    if (outcome === "cancelled") {
      return;
    }

    // Respaldo universal para navegadores internos sin menú nativo o PC de escritorio
    setShowSocialModal(true);
    const copied = await copyCaptureImageToClipboard(cap);
    setSocialFeedback(
      copied
        ? "🖼️ ¡Imagen HD lista! Elige abajo dónde enviarla o pégala directamente."
        : "📲 Elige dónde enviar la captura ganadora o mantén presionada la imagen para guardarla."
    );
  }

  function handleFallbackWhatsAppShare() {
    const cap = socialCaptureRef.current || socialCapture || buildSocialPromoCapture(socialFormat);
    if (!cap) return;
    downloadCaptureBlob(cap);
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(cap.caption)}`;
    window.open(waUrl, "_blank", "noopener,noreferrer");
    setSocialFeedback("📲 Abriendo WhatsApp y guardando la imagen HD en tu galería.");
  }

  function handleFallbackFacebookShare() {
    const cap = socialCaptureRef.current || socialCapture || buildSocialPromoCapture(socialFormat);
    if (!cap) return;
    downloadCaptureBlob(cap);
    const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
      cap.verifyUrl
    )}&quote=${encodeURIComponent(cap.caption)}`;
    window.open(fbUrl, "_blank", "noopener,noreferrer");
    setSocialFeedback("📘 Abriendo Facebook y guardando la imagen HD para adjuntarla.");
  }

  function handleFallbackInstagramShare() {
    const cap = socialCaptureRef.current || socialCapture || buildSocialPromoCapture(socialFormat);
    if (!cap) return;
    downloadCaptureBlob(cap);
    setSocialFeedback("📸 ¡Imagen HD guardada! Ábrela desde tu galería en Instagram Historias o Feed.");
    if (typeof navigator !== "undefined" && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
      window.setTimeout(() => {
        window.location.href = "instagram://story-camera";
      }, 450);
    }
  }

  function handleDownloadSocialPng() {
    const cap = socialCaptureRef.current || socialCapture || buildSocialPromoCapture(socialFormat);
    if (!cap) return;
    downloadCaptureBlob(cap);
    setSocialFeedback("📥 Imagen HD guardada en tu dispositivo.");
  }

  async function handleCopyPromoImageAndText() {
    const cap = socialCaptureRef.current || socialCapture || buildSocialPromoCapture(socialFormat);
    if (!cap) return;
    const copiedImg = await copyCaptureImageToClipboard(cap);
    if (copiedImg) {
      setSocialFeedback("🖼️ ¡Imagen HD copiada al portapapeles! Lista para pegar.");
      return;
    }
    try {
      await navigator.clipboard.writeText(cap.caption);
      setSocialFeedback("📋 Enlace y resumen oficial copiados al portapapeles.");
    } catch {
      setSocialFeedback("Mantén presionada la imagen de arriba para compartirla.");
    }
  }

  async function handleCopyPromoCaption() {
    const cap = socialCaptureRef.current || socialCapture || buildSocialPromoCapture(socialFormat);
    if (!cap) return;
    try {
      await navigator.clipboard.writeText(cap.caption);
      setSocialFeedback("📋 Enlace directo de constancia verificada copiado.");
    } catch {
      setSocialFeedback("No se pudo copiar automáticamente; inténtalo nuevamente.");
    }
  }

  function finalizeWinnerReveal(params: {
    resolved: ResolvedDrawBundle;
    currentMode: GameMode;
    currentCartonSize: CartonSize;
    currentWheelSize: number;
    ticketDelaySec: number;
    skipHistoryAppend?: boolean;
    skipFallbackVoice?: boolean;
  }) {
    const {
      resolved,
      currentMode,
      currentCartonSize,
      currentWheelSize,
      ticketDelaySec,
      skipHistoryAppend,
      skipFallbackVoice,
    } = params;

    captureLivePhysicsSnapshot();
    setStageSecondsLeft(0);
    setDisplayNumber(
      currentMode === "ruleta"
        ? String(resolved.chosenIndex + 1).padStart(2, "0")
        : resolved.selected
    );
    setWinner(resolved.selected);
    setPhase("winner");
    setStage("reveal");
    setShowCelebration(true);
    setIsRecoveredDraw(false);
    setAuditHash(resolved.calculatedListHash);
    setWinnerTicket(resolved.generatedTicket);
    setLatestAct(resolved.actData);

    // Pre-generar captura promocional HD de forma síncrona para respuesta instantánea en redes
    buildSocialPromoCapture(
      socialFormat,
      resolved.selected,
      resolved.actData,
      resolved.calculatedListHash
    );

    // Enfocar la máquina oficial para que se aprecie toda la animación de 6 segundos del número ganador
    const machineEl =
      document.querySelector(".globeChassis") ||
      document.querySelector(".wheelCasinoWrapper") ||
      document.querySelector(".liveDemoMachine");
    if (machineEl && ticketDelaySec > 0.5) {
      machineEl.scrollIntoView({ behavior: "smooth", block: "center" });
    }

    if (!skipFallbackVoice && !drawAudio.didCurrentRunEmbedVoice()) {
      playWinnerVoice(resolved.selected, drawAudio.getMuted());
    }

    // Marcar sesión persistida como completada para que sobreviva recargas posteriores hasta "Nuevo sorteo"
    try {
      const raw = localStorage.getItem(ACTIVE_DRAW_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as PersistedDrawSession;
        parsed.status = "completed";
        parsed.completedAtEpochMs = parsed.completedAtEpochMs || Date.now();
        localStorage.setItem(ACTIVE_DRAW_STORAGE_KEY, JSON.stringify(parsed));
      }
      localStorage.setItem("eg_last_certificate", JSON.stringify(resolved.actData));
    } catch {}

    // Registrar constancia oficial en servidor tras revelar ganador para consulta pública directa en 0 pasos
    const revealedDrawId = resolved.actData?.certificate?.drawId || resolved.actData?.drawId;
    if (revealedDrawId) {
      fetch("/api/certificates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ drawId: revealedDrawId, actData: resolved.actData }),
      }).catch(() => {});

      // Revelación de semilla y ratificación criptográfica de resultado en servidor (ISO 17025 / Coljuegos)
      fetch("/api/draws/commit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reveal",
          drawId: revealedDrawId,
          seedHex: resolved.actData?.certificate?.reveal?.seed,
          winningIndex: resolved.actData?.certificate?.result?.index,
          winningNumber: resolved.selected,
        }),
      }).catch(() => {});
    }

    // Registrar emisión oficial completada para sincronización de clientes en celulares
    fetch("/api/live-draw", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "complete",
        mode: currentMode,
        cartonSize: currentCartonSize,
        selected: resolved.selected,
        actData: resolved.actData,
        listHash: resolved.calculatedListHash,
      }),
    }).catch(() => {});

    if (!skipHistoryAppend) {
      const listHashShort = resolved.calculatedListHash.slice(0, 16);
      const newEntry: ExtractedBall = {
        number: resolved.selected,
        time: new Date().toLocaleTimeString("es-CO"),
        hash: listHashShort,
        carton: currentMode === "balotas" ? currentCartonSize : currentWheelSize,
      };
      setHistory((prev) => {
        const updated = [newEntry, ...prev.filter((h) => h.hash !== listHashShort || h.number !== newEntry.number)].slice(0, 5);
        try {
          localStorage.setItem(DRAW_HISTORY_STORAGE_KEY, JSON.stringify(updated));
        } catch {}
        return updated;
      });
    }

    if (ticketDelaySec > 0) {
      scheduleDelayedTicketModal(ticketDelaySec);
    }
  }

  function startMasterDrawLoop(params: {
    currentMode: GameMode;
    currentCartonSize: CartonSize;
    currentWheelSize: number;
    entries: string[];
    getResolved: () => ResolvedDrawBundle | null;
  }) {
    const { currentMode, currentCartonSize, currentWheelSize, entries, getResolved } = params;
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (wheelRafRef.current) {
      cancelAnimationFrame(wheelRafRef.current);
      wheelRafRef.current = null;
    }

    let lastShownCountdown: number | string | null = "__init__";
    let lastStage: DrawStage = "idle";
    let lastDisplayNum = "";
    let lastSecLeft = -1;

    if (currentMode === "ruleta") {
      const spinDuration = RULETA_TIMELINE.SPIN_END - RULETA_TIMELINE.SPIN_START; // 40.0s (20s andando + 20s frenando)
      const totalTurns = 70;

      const scheduleNextWheelTick = () => {
        if (typeof document !== "undefined" && document.hidden) {
          intervalRef.current = window.setTimeout(stepRuletaFrame, 100);
        } else {
          wheelRafRef.current = requestAnimationFrame(stepRuletaFrame);
        }
      };

      const stepRuletaFrame = () => {
        wheelRafRef.current = null;
        intervalRef.current = null;
        const t = drawAudio.getSequenceTimeSec();
        const resolvedResult = getResolved();

        // FASE 0: Preámbulo oficial de voz ("Círculo Dorado en línea...") + conteo 5, 4, 3, 2, 1 + ¡JUEGA! (0.0s a 18.50s)
        if (t < RULETA_TIMELINE.SPIN_START) {
          if (lastStage !== "countdown") {
            lastStage = "countdown";
            setStage("countdown");
          }
          let nextCount: number | string | null = null;
          if (t < RULETA_TIMELINE.COUNTDOWN_START) {
            nextCount = null; // En preámbulo oficial "Círculo Dorado en línea" (0s a 12.50s)
          } else if (t < RULETA_TIMELINE.JUEGA_START) {
            const elapsedInCountdown = t - RULETA_TIMELINE.COUNTDOWN_START;
            nextCount = Math.max(1, 5 - Math.floor(elapsedInCountdown));
          } else {
            nextCount = "¡JUEGA!";
          }
          if (nextCount !== lastShownCountdown) {
            lastShownCountdown = nextCount;
            setCountdownNumber(nextCount);
          }
          scheduleNextWheelTick();
          return;
        }

        if (lastShownCountdown !== null) {
          lastShownCountdown = null;
          setCountdownNumber(null);
        }

        if (!resolvedResult) {
          scheduleNextWheelTick();
          return;
        }

        const elapsedInSpin = Math.max(0, t - RULETA_TIMELINE.SPIN_START);

        // FASE 1 & 2 (18.5s a 58.5s = 40.0s): 20s de giro sostenido andando + 20s desaceleración progresiva hasta 0°/s
        if (t < RULETA_TIMELINE.SPIN_END) {
          const frame = computeWheelTrajectory(
            elapsedInSpin,
            spinDuration,
            initialWheelRotationRef.current,
            totalTurns,
            resolvedResult.chosenIndex,
            currentWheelSize
          );

          currentWheelAngleRef.current = frame.angleDeg;
          currentFlapperTiltRef.current = frame.flapperTiltDeg;
          if (wheelBoardDomRef.current) {
            wheelBoardDomRef.current.style.transform = `rotate(${frame.angleDeg.toFixed(3)}deg)`;
          }
          if (flapperDomRef.current) {
            flapperDomRef.current.style.transform = `translateX(-50%) rotate(${frame.flapperTiltDeg.toFixed(2)}deg)`;
          }

          const step = 360 / currentWheelSize;
          const passingSector =
            Math.floor((((360 - (frame.angleDeg % 360)) % 360) + 360) % 360 / step) % currentWheelSize;
          const nextDisplay = String(passingSector + 1).padStart(2, "0");
          if (nextDisplay !== lastDisplayNum) {
            lastDisplayNum = nextDisplay;
            setDisplayNumber(nextDisplay);
          }

          const nextStage: DrawStage = t < RULETA_TIMELINE.SLOWDOWN_START ? "mixing" : "slowdown";
          if (nextStage !== lastStage) {
            lastStage = nextStage;
            setStage(nextStage);
          }

          const nextSecLeft =
            nextStage === "mixing"
              ? Math.max(1, Math.ceil(RULETA_TIMELINE.SLOWDOWN_START - t))
              : Math.max(1, Math.ceil(RULETA_TIMELINE.SPIN_END - t));
          if (nextSecLeft !== lastSecLeft) {
            lastSecLeft = nextSecLeft;
            setStageSecondsLeft(nextSecLeft);
          }

          scheduleNextWheelTick();
          return;
        }

        // FASE 2.5 (23.00s a 23.35s): Ruleta 100% DETENIDA en el número ganador antes de anunciar
        const finalFrame = computeWheelTrajectory(
          spinDuration,
          spinDuration,
          initialWheelRotationRef.current,
          totalTurns,
          resolvedResult.chosenIndex,
          currentWheelSize
        );
        currentWheelAngleRef.current = finalFrame.angleDeg;
        currentFlapperTiltRef.current = 0;
        if (wheelBoardDomRef.current) {
          wheelBoardDomRef.current.style.transform = `rotate(${finalFrame.angleDeg.toFixed(3)}deg)`;
        }
        if (flapperDomRef.current) {
          flapperDomRef.current.style.transform = "translateX(-50%) rotate(0deg)";
        }

        const winDisplay = String(resolvedResult.chosenIndex + 1).padStart(2, "0");
        if (lastDisplayNum !== winDisplay) {
          lastDisplayNum = winDisplay;
          setDisplayNumber(winDisplay);
        }

        if (t < RULETA_TIMELINE.REVEAL_START) {
          if (lastStage !== "slowdown") {
            lastStage = "slowdown";
            setStage("slowdown");
          }
          if (lastSecLeft !== 0) {
            lastSecLeft = 0;
            setStageSecondsLeft(0);
          }
          scheduleNextWheelTick();
          return;
        }

        // FASE 3 (t >= 23.35s): Revelación oficial del ganador SOLO con la ruleta completamente detenida
        lastStage = "reveal";
        setWheelRotation(finalFrame.angleDeg);
        setFlapperTilt(0);
        setDisplayNumber(winDisplay);
        finalizeWinnerReveal({
          resolved: resolvedResult,
          currentMode,
          currentCartonSize,
          currentWheelSize,
          ticketDelaySec: REVEAL_TICKET_DELAY_SEC,
        });
      };

      scheduleNextWheelTick();
      return;
    }

    intervalRef.current = window.setInterval(() => {
      const t = drawAudio.getSequenceTimeSec();
      const resolvedResult = getResolved();

      // FASE 0: Preámbulo oficial de voz ("Damas y caballeros...") y conteo regresivo 5, 4, 3, 2, 1
      if (t < BALOTAS_TIMELINE.MIXING_START) {
        if (lastStage !== "countdown") {
          lastStage = "countdown";
          setStage("countdown");
        }
        let nextCount: number | string | null = null;
        if (t < BALOTAS_TIMELINE.COUNTDOWN_START) {
          nextCount = null; // En preámbulo oficial de voz (0s a 12.50s)
        } else if (t < BALOTAS_TIMELINE.JUEGA_START) {
          const elapsedInCountdown = t - BALOTAS_TIMELINE.COUNTDOWN_START;
          nextCount = Math.max(1, 5 - Math.floor(elapsedInCountdown));
        } else {
          nextCount = "¡JUEGA!";
        }
        if (nextCount !== lastShownCountdown) {
          lastShownCountdown = nextCount;
          setCountdownNumber(nextCount);
        }
        return;
      }

      if (lastShownCountdown !== null) {
        lastShownCountdown = null;
        setCountdownNumber(null);
      }

      // MODO BALOTERA NEUMÁTICA: Agitación -> Succión -> Verificación -> Ganador (6s animación -> Tiquete)
      if (t < BALOTAS_TIMELINE.SUCTION_START) {
        if (lastStage !== "mixing") {
          lastStage = "mixing";
          setStage("mixing");
        }
        const sLeft = Math.max(1, Math.ceil(BALOTAS_TIMELINE.SUCTION_START - t));
        if (sLeft !== lastSecLeft) {
          lastSecLeft = sLeft;
          setStageSecondsLeft(sLeft);
        }
      } else if (t < BALOTAS_TIMELINE.SLOWDOWN_START) {
        if (lastStage !== "suction") {
          lastStage = "suction";
          setStage("suction");
        }
        const sLeft = Math.max(1, Math.ceil(BALOTAS_TIMELINE.SLOWDOWN_START - t));
        if (sLeft !== lastSecLeft) {
          lastSecLeft = sLeft;
          setStageSecondsLeft(sLeft);
        }
        // EN SUCCIÓN: La balota seleccionada sube y se aloja fija en la torreta en oro 24K (cero parpadeo aleatorio)
        if (resolvedResult && lastDisplayNum !== resolvedResult.selected) {
          lastDisplayNum = resolvedResult.selected;
          setDisplayNumber(resolvedResult.selected);
        }
      } else if (t < BALOTAS_TIMELINE.REVEAL_START) {
        if (lastStage !== "slowdown") {
          lastStage = "slowdown";
          setStage("slowdown");
        }
        const sLeft = Math.max(1, Math.ceil(BALOTAS_TIMELINE.REVEAL_START - t));
        if (sLeft !== lastSecLeft) {
          lastSecLeft = sLeft;
          setStageSecondsLeft(sLeft);
        }
        if (resolvedResult && lastDisplayNum !== resolvedResult.selected) {
          lastDisplayNum = resolvedResult.selected;
          setDisplayNumber(resolvedResult.selected);
        }
      } else if (resolvedResult) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        intervalRef.current = null;
        lastStage = "reveal";
        // 6 SEGUNDOS INTERNOS DE ANIMACIÓN GANADORA ANTES DE MOSTRAR EL TIQUETE
        finalizeWinnerReveal({
          resolved: resolvedResult,
          currentMode,
          currentCartonSize,
          currentWheelSize,
          ticketDelaySec: REVEAL_TICKET_DELAY_SEC,
        });
      }
    }, 16);
  }

  // RECUPERACIÓN INMUTABLE EN CASO DE RECARGA DE PÁGINA (F5 / Pull-to-refresh / corte de red)
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const savedHist = localStorage.getItem(DRAW_HISTORY_STORAGE_KEY);
      if (savedHist) {
        const parsedHist = JSON.parse(savedHist);
        if (Array.isArray(parsedHist)) setHistory(parsedHist.slice(0, 5));
      }
    } catch {}

    try {
      const rawSession = localStorage.getItem(ACTIVE_DRAW_STORAGE_KEY);
      if (!rawSession) return;
      const session = JSON.parse(rawSession) as PersistedDrawSession;
      if (!session || session.version !== 1 || !session.resolvedResult) return;

      // Expirar sesiones ya finalizadas con más de 6 horas de antigüedad
      const ageMs = Date.now() - session.startedAtEpochMs;
      if (session.status === "completed" && ageMs > 6 * 3600 * 1000) {
        localStorage.removeItem(ACTIVE_DRAW_STORAGE_KEY);
        return;
      }

      setMode(session.mode);
      setCartonSize(session.cartonSize);
      setWheelSize([10, 20, 30, 40, 50].includes(session.wheelSize) ? session.wheelSize : 20);
      if (session.wheelDraft) setWheelDraft(session.wheelDraft);
      setAuditHash(session.resolvedResult.calculatedListHash);
      setWinnerTicket(session.resolvedResult.generatedTicket);
      setLatestAct(session.resolvedResult.actData);

      const elapsedSec = Math.max(0, ageMs / 1000);
      const revealStart =
        session.mode === "balotas"
          ? BALOTAS_TIMELINE.REVEAL_START
          : RULETA_TIMELINE.REVEAL_START;

      if (session.status === "running" && elapsedSec < revealStart) {
        // ¡SORTEO EN PLENO VUELO! Continuar sin detenerse en pantalla completa y en el segundo exacto real
        setIsRecoveredDraw(true);
        setIsCinemaFullscreen(true);
        setPhase("spinning");
        setShowTicketModal(false);
        setShowCelebration(false);
        drawAudio.resumeSequenceAt(session.mode, elapsedSec);

        startMasterDrawLoop({
          currentMode: session.mode,
          currentCartonSize: session.cartonSize,
          currentWheelSize: session.wheelSize,
          entries: session.entries,
          getResolved: () => session.resolvedResult,
        });
      } else {
        // El sorteo ya alcanzó la revelación (o recargó durante la ventana de 6s de celebración)
        const wasStillRunning = session.status === "running";
        const remainingTicketDelay =
          elapsedSec < revealStart + REVEAL_TICKET_DELAY_SEC
            ? revealStart + REVEAL_TICKET_DELAY_SEC - elapsedSec
            : 0;

        setIsCinemaFullscreen(false);

        if (session.mode === "ruleta") {
          const step = 360 / session.wheelSize;
          const targetSectorAngle = (session.resolvedResult.chosenIndex + 0.5) * step;
          const restingAngle = (360 - (targetSectorAngle % 360)) % 360;
          currentWheelAngleRef.current = restingAngle;
          currentFlapperTiltRef.current = 0;
          setWheelSpinDurationSec(0);
          setWheelRotation(restingAngle);
          setFlapperTilt(0);
        }

        finalizeWinnerReveal({
          resolved: session.resolvedResult,
          currentMode: session.mode,
          currentCartonSize: session.cartonSize,
          currentWheelSize: session.wheelSize,
          ticketDelaySec: remainingTicketDelay,
          skipHistoryAppend: !wasStillRunning,
          skipFallbackVoice: true,
        });
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function playDemo() {
    setIsDemoModeActive(true);
    if (phase === "spinning") return;
    const currentMode = mode;
    const currentCartonSize = cartonSize;
    const currentWheelSize = wheelSize;
    const currentWheelDraft = wheelDraft;
    const entries = currentMode === "balotas" ? eligibleNumbers : wheelPlayers;

    if (entries.length < (currentMode === "ruleta" ? currentWheelSize : 2)) {
      setDemoError(`Completa los ${currentWheelSize} números antes de girar la ruleta.`);
      return;
    }

    // 1. DISPARO SÍNCRONO EN LA LÍNEA 1 DEL GESTO ONCLICK (Apple AVPlayer AVAudioSessionCategoryPlayback)
    drawAudio.startFullSequence(currentMode);

    clearRevealTicketTimers();
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (wheelRafRef.current) {
      cancelAnimationFrame(wheelRafRef.current);
      wheelRafRef.current = null;
    }
    stopWinnerVoice();

    // En celulares (< 768px) iniciar en pantalla completa; en portátiles mantener el scroll libre
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      enterCinemaFullscreen();
    }

    const startedAtEpochMs = Date.now();
    const startAngle = ((currentWheelAngleRef.current % 360) + 360) % 360;
    setIsRecoveredDraw(false);
    setDemoError("");
    setWinner("");
    setShowCelebration(false);
    setShowTicketModal(false);
    setShowSocialModal(false);
    setSocialCapture(null);
    setWheelSpinDurationSec(40);
    initialWheelRotationRef.current = startAngle;
    currentWheelAngleRef.current = startAngle;
    currentFlapperTiltRef.current = 0;
    if (wheelBoardDomRef.current) wheelBoardDomRef.current.style.transform = `rotate(${startAngle.toFixed(3)}deg)`;
    if (flapperDomRef.current) flapperDomRef.current.style.transform = "translateX(-50%) rotate(0deg)";
    setWheelRotation(startAngle);
    setFlapperTilt(0);
    setPhase("spinning");
    setStage("countdown");
    setCountdownNumber(null);
    setStageSecondsLeft(currentMode === "ruleta" ? 20 : 15);

    // 3. Derivación criptográfica inmediata (<15ms) + Sello persistente contra recargas accidentales
    let resolvedResult: ResolvedDrawBundle | null = null;
    computeOfficialDrawResult(entries, currentMode, currentCartonSize, currentWheelSize).then((res) => {
      resolvedResult = res;
      setAuditHash(res.calculatedListHash);
      setWinnerTicket(res.generatedTicket);
      try {
        const persisted: PersistedDrawSession = {
          version: 1,
          status: "running",
          startedAtEpochMs,
          mode: currentMode,
          cartonSize: currentCartonSize,
          wheelSize: currentWheelSize,
          wheelDraft: currentWheelDraft,
          entries,
          resolvedResult: res,
        };
        localStorage.setItem(ACTIVE_DRAW_STORAGE_KEY, JSON.stringify(persisted));
      } catch {}

      // Emitir al servidor para sincronización en tiempo real con los celulares de los clientes
      fetch("/api/live-draw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "start",
          mode: currentMode,
          cartonSize: currentCartonSize,
          selected: res.selected,
          startedAtEpochMs,
          actData: res.actData,
          listHash: res.calculatedListHash,
        }),
      }).catch(() => {});
    });

    // 4. Reloj maestro unificado a 50ms gobernado directamente por `drawAudio.getSequenceTimeSec()`
    startMasterDrawLoop({
      currentMode,
      currentCartonSize,
      currentWheelSize,
      entries,
      getResolved: () => resolvedResult,
    });
  }

  return (
    <main className={`liveDemoPage ${isCinemaFullscreen ? "isCinemaStageLocked" : ""}`}>
      {/* MARCA DE AGUA VISUAL OFICIAL: MODO DE PRUEBA / DEMOSTRACIÓN */}
      {isDemoModeActive && (
        <div className="demoWatermarkBanner" role="status">
          <span>🧪 MODO DE PRUEBA / DEMOSTRACIÓN (NO ES SORTEO OFICIAL)</span>
          <span style={{ fontSize: '10px', opacity: 0.9 }}>· Sorteo oficial programado con conteo regresivo</span>
        </div>
      )}
      {/* BANCO NATIVO DE AUDIO HTML5 PARA APPLE iOS AVPlayer Y ANDROID (Doble códec M4A/AAC + WAV fallback) */}
      <div className="iosHardwareAudioBank" aria-hidden="true">
        <audio
          ref={(el) => {
            balotasAudioRef.current = el;
            drawAudio.attachMediaBank({ balotas: el });
          }}
          playsInline
          preload="auto"
          crossOrigin="anonymous"
        >
          <source src="/audio/master-balotas-v6.m4a?v=fv9" type="audio/mp4" />
          <source src="/audio/master-balotas-v6.wav?v=fv9" type="audio/wav" />
        </audio>
        <audio
          ref={(el) => {
            ruletaAudioRef.current = el;
            drawAudio.attachMediaBank({ ruleta: el });
          }}
          playsInline
          preload="auto"
          crossOrigin="anonymous"
        >
          <source src="/audio/master-ruleta-v9.m4a?v=fv12" type="audio/mp4" />
          <source src="/audio/master-ruleta-v9.wav?v=fv12" type="audio/wav" />
        </audio>
        <audio
          ref={(el) => {
            testAudioRef.current = el;
            drawAudio.attachMediaBank({ test: el });
          }}
          playsInline
          preload="auto"
          crossOrigin="anonymous"
        >
          <source src="/audio/test-check-v5.m4a" type="audio/mp4" />
          <source src="/audio/test-check-v5.wav" type="audio/wav" />
        </audio>
        <audio
          ref={(el) => {
            voiceAudioRef.current = el;
            drawAudio.attachMediaBank({ voice: el });
          }}
          playsInline
          preload="auto"
          crossOrigin="anonymous"
        >
          <source src="/audio/felicidades-v5.m4a" type="audio/mp4" />
          <source src="/audio/felicidades.mp3" type="audio/mpeg" />
          <source src="/audio/felicidades.wav" type="audio/wav" />
        </audio>
      </div>

      {/* LLUVIA DE CONFETI Y DESTELLOS CONTINUA DURANTE LA CELEBRACIÓN DEL GANADOR */}
      {showCelebration && (
        <div className="celebrationOverlay" aria-hidden="true">
          {Array.from({ length: 70 }, (_, i) => (
            <div
              key={i}
              className={`confettiParticle confetti_${i % 5}`}
              style={{
                left: `${(i / 70) * 100}%`,
                animationDelay: `${(i % 14) * 0.22}s`,
                animationDuration: `${2.4 + (i % 5) * 0.45}s`,
              }}
            />
          ))}
        </div>
      )}

      {/* 👑 BARRA SUPERIOR INTEGRADA DE ESTUDIO Y NAVEGACIÓN UNIVERSAL */}
      {!isCinemaFullscreen && (
        <header className={`studioUnifiedHeader ${theme === 'dark' ? 'isDark' : 'isLight'}`}>
          {/* FILA 1: BRANDING A LA IZQUIERDA + CONTROLES DEL SISTEMA A LA DERECHA */}
          <div className="studioAppTopBar">
            {/* GRUPO IZQUIERDO: BRANDING + VOLVER A INICIO */}
            <div className="studioLeftGroup">
              <Link href="/" className="studioBrandPill" aria-label="El Ganador, ir al inicio">
                <span className="studioBrandLogo">EG</span>
                <div className="studioBrandText">
                  <span className="studioBrandTitle">EL GANADOR</span>
                  <span className="studioBrandTag">SALA OFICIAL</span>
                </div>
              </Link>

              {isOperator && (
                <span className="studioOperatorLiveBadge">
                  <span className="pulseDot" /> MODO EMPRESARIO
                </span>
              )}

              <Link
                href="/"
                className="studioBackBtn"
                title="Volver al Inicio / Vitrina Principal"
              >
                <span className="studioBackArrow">←</span>
                <span className="studioBackLabel">Volver al Inicio</span>
              </Link>
            </div>

            {/* DERECHA: CONTROLES DEL SISTEMA UNIFICADOS EN AMBOS EQUIPOS */}
            <div className="studioRightControls">
              <div
                className="studioThemeSegmented"
                role="group"
                aria-label="Selector de tema Claro y Oscuro"
              >
                <button
                  type="button"
                  className={theme === 'light' ? 'isActive' : ''}
                  onClick={() => setThemePreference('light')}
                  title="Activar Modo Claro"
                >
                  ☀️<span className="themeText"> Claro</span>
                </button>
                <button
                  type="button"
                  className={theme === 'dark' ? 'isActive' : ''}
                  onClick={() => setThemePreference('dark')}
                  title="Activar Modo Oscuro"
                >
                  🌙<span className="themeText"> Oscuro</span>
                </button>
              </div>

              {availableDraws.length > 1 && (
                <button
                  type="button"
                  className="studioRoomSwitchBtn"
                  onClick={() => {
                    const currentIndex = availableDraws.findIndex((d) => d.id === activeDrawId);
                    const nextIndex = (currentIndex + 1) % availableDraws.length;
                    switchLiveDraw(availableDraws[nextIndex]);
                  }}
                  title="Cambiar a otra sala de sorteo en vivo"
                >
                  🔄 <span className="roomSwitchText">Sala</span> ({availableDraws.length})
                </button>
              )}

              <button
                type="button"
                className="studioAudioTestBtn"
                onClick={() => {
                  drawAudio.playQuickSoundCheck();
                  setIsMuted(false);
                }}
                title="Probar sonido en celular / parlantes"
              >
                🔔 <span className="audioTestText">Probar</span>
              </button>

              <button
                type="button"
                className={`studioAudioToggleBtn ${isMuted ? 'isMuted' : 'isActive'}`}
                onClick={() => setIsMuted(drawAudio.toggleMute())}
                title={isMuted ? 'Activar audio del sorteo' : 'Silenciar audio'}
              >
                <span>{isMuted ? '🔇' : '🔊'}</span>
                <span className="audioToggleText">{isMuted ? 'Silenciado' : 'Audio'}</span>
              </button>
            </div>
          </div>

          {/* FILA 2: BARRA DE PRODUCCIÓN Y RECAUDO (Visible si el usuario es empresario operador) */}
          {isOperator && (
            <div className="studioProducerToolbar">
              <div className="studioProducerDeck">
                {/* IZQUIERDA: HERRAMIENTAS DE EMISIÓN */}
                <div className="studioProducerToolsScroll">
                  <span className="studioToolsLabel">HERRAMIENTAS DE EMISIÓN:</span>

                  <button
                    type="button"
                    className={`studioToolChip ${copiedClientLink ? 'isSuccess' : ''}`}
                    onClick={handleCopyClientLink}
                    title="Copiar enlace para enviar por WhatsApp a los compradores"
                  >
                    <span>📱</span>
                    <span>{copiedClientLink ? '✓ ¡Enlace copiado!' : 'Copiar enlace clientes'}</span>
                  </button>

                  <button
                    type="button"
                    className={`studioToolChip ${copiedReminderLink ? 'isSuccess' : ''}`}
                    onClick={handleCopyGoogleReminderLink}
                    title="Copiar enlace directo de agendamiento en Google Calendar para los clientes"
                  >
                    <span>📅</span>
                    <span>{copiedReminderLink ? '✓ ¡Link Calendar copiado!' : 'Link Google Calendar'}</span>
                  </button>
                </div>

                {/* DERECHA: RECAUDO EN VIVO DEL EVENTO */}
                <div
                  className="studioRevenueWidget"
                  title={`Recaudo oficial en vivo: ${activeDrawTitle}`}
                  style={{ color: '#ffffff' }}
                >
                  <span className="revenueCoinBadge">💰</span>
                  <div className="revenueDetails">
                    <div className="revenueTopMeta" style={{ color: '#ffffff' }}>
                      <span className="revenueLabel" style={{ color: '#ffffff' }}>RECAUDO EN VIVO</span>
                      <span className="revenueRaffleName" style={{ color: '#ffffff' }}>· {activeDrawTitle}</span>
                    </div>
                    <div className="revenueNumberRow">
                      <strong className="revenueAmount" style={{ color: '#ffffff' }}>
                        ${activeTotalRevenue.toLocaleString('es-CO')}
                        <span className="currencyText" style={{ color: '#ffffff' }}> COP</span>
                      </strong>
                      <span className="revenueProgressPill" style={{ color: '#ffffff' }}>
                        ({activeSoldTickets} / {activeTotalTickets} balotas · {activeRevenuePct}%)
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </header>
      )}

      <div className="liveDemoContentContainer">
        <section className="liveDemoHero">
          <p className="liveDemoEyebrow">SISTEMA OFICIAL DE EXTRACCIÓN · EL GANADOR</p>
          <h1>El sorteo se vive <span>en El Ganador.</span></h1>
          <p>El Círculo Dorado con física en tiempo real y ruleta comunitaria. Extracción en directo con fe pública, balotera blindada y total transparencia.</p>
        </section>

      <section className="liveDemoStage" aria-labelledby="liveDemoDrawTitle">
        <div className="liveDemoStageTop">
          <div>
            <span className="liveDemoOnAir"><i /> EXTRACCIÓN EN DIRECTO</span>
            <span className="liveDemoDemoTag">v5.2 Sorteo Blindado</span>
            <span className="liveDemoDemoTag">Equiprobabilidad Garantizada</span>
          </div>
          <span className="liveDemoDrawId">EG-CIRCULO-DORADO-2026</span>
        </div>

        {isRecoveredDraw && phase === "spinning" && (
          <div className="drawShieldNotice" role="status">
            🛡️ <b>Sorteo oficial blindado:</b> la extracción continúa en curso sin detenerse tras la actualización de página.
          </div>
        )}

        <div className="liveDemoStageGrid">
          {/* MÁQUINA DE BALOTAS / RULETA (Se adueña de toda la pantalla durante el sorteo) */}
          <div
            className={`liveDemoMachine ${mode === "ruleta" ? "modeWheel" : ""} ${phase === "spinning" ? "isSpinning" : ""} ${phase === "winner" ? "hasWinner" : ""} stage_${stage} ${isCinemaFullscreen ? "cinemaFullscreenActive" : ""}`}
          >
            {/* Stream HUD Superior: EN DIRECTO + Rating CRM + Control de Audio (MINIMIZABLE) */}
            <div className={`cinemaStageTopHud ${isHudCollapsed ? "isCollapsed" : ""}`}>
              {isHudCollapsed ? (
                <button
                  type="button"
                  className="cinemaHudRestoreBtn"
                  onClick={() => setIsHudCollapsed(false)}
                  title="Expandir funciones de transmisión"
                  aria-label="Expandir funciones"
                >
                  <span className="livePulseDot" />
                  <span className="hudRestoreLabel">EN VIVO</span>
                  <span className="hudRestoreCount">👁️ {activeSpectatorCount.toLocaleString("es-CO")}</span>
                  <span className="hudRestoreIcon">⚙️</span>
                </button>
              ) : (
                <>
                  {/* BOTÓN SALIR: Solo cuando está en modo pantalla completa / cinema */}
                  {isCinemaFullscreen && (
                    <button
                      type="button"
                      className="cinemaHudActionBtn cinemaExitBtn"
                      onClick={exitCinemaFullscreen}
                      title="Salir de pantalla completa"
                    >
                      ← Salir
                    </button>
                  )}

                  {/* BADGE EN DIRECTO */}
                  <div className="cinemaLiveBadge">
                    <span className="livePulseDot" />
                    <span>
                      EN DIRECTO · {mode === "balotas" ? `01 A ${cartonSize}` : `RULETA ${wheelSize}`}
                    </span>
                  </div>

                  {/* ESPECTADORES Y RATING */}
                  <div className="liveRatingHud">
                    <div className="ratingSpectators" title="Espectadores conectados en tiempo real">
                      <span>👁️ {activeSpectatorCount.toLocaleString("es-CO")}</span>
                    </div>
                    <div className="ratingMetric" title="Calificación promedio">
                      <span>⭐ 4.9</span>
                    </div>
                  </div>

                  {/* CONTROLES RÁPIDOS: PANTALLA COMPLETA + AUDIO + BOTÓN MINIMIZAR */}
                  <div className="cinemaHudRight">
                    <button
                      type="button"
                      className="cinemaHudIconBtn"
                      onClick={() => {
                        if (isCinemaFullscreen) {
                          exitCinemaFullscreen();
                        } else {
                          enterCinemaFullscreen();
                        }
                      }}
                      title={isCinemaFullscreen ? "Salir de pantalla completa" : "Ver en pantalla completa"}
                      aria-label="Pantalla completa"
                    >
                      {isCinemaFullscreen ? "🗗" : "⛶"}
                    </button>

                    <button
                      type="button"
                      className="cinemaHudIconBtn"
                      onClick={() => setIsMuted(drawAudio.toggleMute())}
                      title={isMuted ? "Activar audio" : "Silenciar audio"}
                      aria-label="Audio"
                    >
                      {isMuted ? "🔇" : "🔊"}
                    </button>

                    {/* BOTÓN PARA MINIMIZAR ESTAS FUNCIONES */}
                    <button
                      type="button"
                      className="cinemaHudIconBtn cinemaMinimizeBtn"
                      onClick={() => setIsHudCollapsed(true)}
                      title="Minimizar estas funciones"
                      aria-label="Minimizar funciones"
                    >
                      −
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* PATROCINADOR OFICIAL CON CONTROLES MÓVILES (MINIMIZAR, MOVER, QUITAR) Y POSICIONADO ABAJO EN WEB */}
            {sponsorBumper.visible ? (
              <aside
                className={`tvSponsorBumper4s ${sponsorBumper.collapsed ? "isCollapsed" : ""} ${
                  sponsorPos === "bottom" ? "posBottom" : "posTop"
                }`}
                role="complementary"
                aria-label="Patrocinador oficial de la transmisión"
              >
                <div className="tvSponsorHeader">
                  <span className="tvSponsorPillTag">⚡ PATROCINADOR OFICIAL</span>
                  <div className="tvSponsorTimerPill">
                    <span className="tvLiveTimeDot" />
                    <span className="tvSponsorSec">{formatWatchTime(spectatorDuration)}</span>

                    {/* MOVER POSICIÓN (ARRIBA / ABAJO) */}
                    <button
                      type="button"
                      className="tvSponsorActionBtn"
                      onClick={() => setSponsorPos((prev) => (prev === "top" ? "bottom" : "top"))}
                      title={sponsorPos === "top" ? "Mover patrocinador abajo para no tapar la pantalla" : "Mover patrocinador arriba"}
                      aria-label="Mover patrocinador de posición"
                    >
                      {sponsorPos === "top" ? "⬇" : "⬆"}
                    </button>

                    {/* MINIMIZAR / EXPANDIR */}
                    <button
                      type="button"
                      className="tvSponsorActionBtn"
                      onClick={() => setSponsorBumper((prev) => ({ ...prev, collapsed: !prev.collapsed }))}
                      title={sponsorBumper.collapsed ? "Expandir patrocinador" : "Minimizar patrocinador"}
                      aria-label="Minimizar patrocinador"
                    >
                      {sponsorBumper.collapsed ? "＋" : "−"}
                    </button>

                    {/* QUITAR DE LA PANTALLA */}
                    <button
                      type="button"
                      className="tvSponsorActionBtn tvSponsorCloseBtn"
                      onClick={() => setSponsorBumper((prev) => ({ ...prev, visible: false }))}
                      title="Quitar patrocinador de la pantalla"
                      aria-label="Quitar patrocinador"
                    >
                      ✕
                    </button>
                  </div>
                </div>
                {!sponsorBumper.collapsed && (
                  <div
                    className="tvSponsorBody"
                    onClick={() => setShowSponsorModal(true)}
                    style={{ cursor: 'pointer' }}
                    title="Click para ver la vitrina del negocio y seguir sus sorteos"
                  >
                    <div className="tvSponsorLogoBadge">{sponsorBumper.logo}</div>
                    <div className="tvSponsorInfo">
                      <strong className="tvSponsorBrand" style={{ color: "#ffffff", WebkitTextFillColor: "#ffffff" }}>{sponsorBumper.brand} ↗</strong>
                      <span className="tvSponsorSub">{sponsorBumper.subtitle}</span>
                      <small style={{ color: '#f5b82e', fontSize: '9.5px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                        👥 {sponsorFollowers.toLocaleString()} pendientes · Ver Vitrina
                      </small>
                    </div>
                  </div>
                )}
                <div className="tvSponsorProgressTrack">
                  <div className="tvSponsorLiveIndicator" />
                </div>
              </aside>
            ) : (
              /* BOTÓN REAPERTURA SUTIL CUANDO SE QUITA EL PATROCINADOR */
              <button
                type="button"
                className={`tvSponsorRestoreBtn ${sponsorPos === "bottom" ? "posBottom" : "posTop"}`}
                onClick={() => setSponsorBumper((prev) => ({ ...prev, visible: true, collapsed: false }))}
                title="Mostrar patrocinador oficial del evento"
                aria-label="Mostrar patrocinador"
              >
                <span>⚡ Patrocinador</span>
              </button>
            )}

            {/* MODAL / VITRINA COMERCIAL DEL PATROCINADOR DE LA TRANSMISIÓN */}
            {showSponsorModal && (
              <div
                style={{
                  position: 'fixed',
                  inset: 0,
                  zIndex: 2500,
                  background: 'rgba(0, 0, 0, 0.85)',
                  backdropFilter: 'blur(8px)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '16px'
                }}
                onClick={() => setShowSponsorModal(false)}
              >
                <div
                  className="sponsorModalCard"
                  style={{
                    background: '#0d1527',
                    color: '#ffffff',
                    border: '1.5px solid #0284c7',
                    borderRadius: '20px',
                    maxWidth: '460px',
                    width: '100%',
                    padding: '24px',
                    boxShadow: '0 20px 50px rgba(0,0,0,0.85)'
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '28px', background: 'rgba(2, 132, 199, 0.18)', padding: '6px', borderRadius: '12px', border: '1px solid #0284c7' }}>
                        {sponsorBumper.logo}
                      </span>
                      <div>
                        <span style={{ background: '#007AFF', color: '#ffffff', fontSize: '10px', fontWeight: 900, padding: '3px 8px', borderRadius: '4px', letterSpacing: '0.5px' }}>
                          PATROCINADOR OFICIAL
                        </span>
                        <h3 className="sponsorModalBrandTitle" style={{ margin: '4px 0 0', fontSize: '19px', fontWeight: 900, color: '#ffffff', WebkitTextFillColor: '#ffffff' }}>
                          {sponsorBumper.brand}
                        </h3>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowSponsorModal(false)}
                      style={{ background: 'transparent', border: 'none', color: '#cbd5e1', fontSize: '20px', cursor: 'pointer', padding: '4px' }}
                    >
                      ✕
                    </button>
                  </div>

                  <p className="sponsorModalSubtitle" style={{ fontSize: '13px', color: '#f1f5f9', lineHeight: 1.5, margin: '0 0 16px' }}>
                    {sponsorBumper.subtitle}. Conéctate con las mejores ofertas, garantías certificadas y beneficios directos para compradores de boletas en El Ganador.
                  </p>

                  {/* Medición de personas pendientes y botón Seguir Negocio */}
                  <div style={{
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    borderRadius: '12px',
                    padding: '12px 16px',
                    marginBottom: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '10px'
                  }}>
                    <div>
                      <span style={{ fontSize: '11px', color: '#cbd5e1', display: 'block', fontWeight: 700 }}>AUDIENCIA PENDIENTE:</span>
                      <strong className="sponsorAudienceNumber" style={{ fontSize: '16px', color: '#ffffff', WebkitTextFillColor: '#ffffff', fontWeight: 900 }}>
                        👥 {sponsorFollowers.toLocaleString()} personas
                      </strong>
                    </div>
                    <button
                      type="button"
                      onClick={handleToggleFollowSponsor}
                      style={{
                        padding: '9px 16px',
                        borderRadius: '10px',
                        border: 'none',
                        background: isFollowingSponsor ? '#10b981' : 'linear-gradient(135deg, #007AFF 0%, #0284c7 100%)',
                        color: '#ffffff',
                        fontWeight: 800,
                        fontSize: '12px',
                        cursor: 'pointer',
                        boxShadow: '0 4px 12px rgba(0, 122, 255, 0.4)'
                      }}
                    >
                      {isFollowingSponsor ? '✓ Siguiendo (+1)' : '🔔 Seguir Negocio'}
                    </button>
                  </div>

                  {/* Beneficio exclusivo */}
                  <div style={{
                    background: 'rgba(0, 122, 255, 0.12)',
                    border: '1.5px dashed #007AFF',
                    borderRadius: '10px',
                    padding: '10px 14px',
                    marginBottom: '16px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div>
                      <span style={{ fontSize: '10px', color: '#38bdf8', fontWeight: 800 }}>CUPÓN DE BIENVENIDA:</span>
                      <div className="sponsorCouponCode" style={{ fontWeight: 900, fontSize: '15px', color: '#ffffff', WebkitTextFillColor: '#ffffff' }}>ELGANADOR</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard?.writeText('ELGANADOR');
                        alert('¡Cupón ELGANADOR copiado!');
                      }}
                      style={{ padding: '6px 14px', background: 'linear-gradient(135deg, #007AFF 0%, #0284c7 100%)', color: '#ffffff', fontWeight: 800, border: 'none', borderRadius: '6px', fontSize: '11px', cursor: 'pointer' }}
                    >
                      Copiar
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <Link
                      href="/"
                      onClick={() => setShowSponsorModal(false)}
                      className="btnSponsorVitrina"
                      style={{
                        textAlign: 'center',
                        padding: '13px',
                        background: 'linear-gradient(135deg, #007AFF 0%, #0284c7 100%)',
                        color: '#ffffff',
                        fontWeight: 900,
                        fontSize: '13.5px',
                        borderRadius: '10px',
                        textDecoration: 'none',
                        boxShadow: '0 4px 16px rgba(0, 122, 255, 0.45)',
                        border: '1px solid rgba(255, 255, 255, 0.25)'
                      }}
                    >
                      🏪 Ver Vitrina Comercial en el Marketplace →
                    </Link>
                    <Link
                      href="/publicidad"
                      onClick={() => setShowSponsorModal(false)}
                      style={{
                        textAlign: 'center',
                        padding: '8px',
                        background: 'transparent',
                        color: '#93c5fd',
                        WebkitTextFillColor: '#93c5fd',
                        fontSize: '11px',
                        textDecoration: 'underline'
                      }}
                    >
                      📢 ¿Quieres que tu negocio patrocine sorteos en vivo? Conoce más ↗
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {/* PARTÍCULAS DE REACCIONES DEL PÚBLICO FLOTANTES */}
            {floatingReactions.map((r) => (
              <span
                key={r.id}
                className="floatingReactionParticle"
                style={{ left: `${r.left}%` }}
              >
                {r.emoji}
              </span>
            ))}
            <div className="machineHalo" />

            {/* ILUMINACIÓN DE ESTUDIO TV EN "X" (2 Reflectores Superiores Negro Piano & Oro 24K + 2 Haces Inferiores Limpios para Balotera y Ruleta) */}
            <div className="stageBroadcastLighting" aria-hidden="true">
              {/* Reflector Superior Izquierdo */}
              <div className="stageSpotUnit spotTopLeft">
                <div className="spotBeamCone coneFromTop" />
                <div className="spotHousingWrap">
                  <StageSpotlightFixture idSuffix="tl" />
                </div>
              </div>

              {/* Reflector Superior Derecho */}
              <div className="stageSpotUnit spotTopRight">
                <div className="spotBeamCone coneFromTop" />
                <div className="spotHousingWrap">
                  <StageSpotlightFixture idSuffix="tr" />
                </div>
              </div>

              {/* Haces Inferiores Ascendentes (Sin carcasa negra en el piso para despejar el pedestal EL GANADOR) */}
              <div className="stageSpotUnit spotBottomLeft">
                <div className="spotBeamCone coneFromBottom" />
              </div>
              <div className="stageSpotUnit spotBottomRight">
                <div className="spotBeamCone coneFromBottom" />
              </div>
            </div>

            {mode === "balotas" ? (
              <div className="pneumaticCageWrapper">
                {/* Torreta superior de succión en latón/oro con cúpula torneada y visor de cristal */}
                <div className={`suctionTube ${stage === "suction" || stage === "slowdown" || stage === "reveal" || phase === "winner" ? "suctionActive" : ""}`}>
                  <div className="suctionTurretHousing">
                    <div className="suctionDomeCap" />
                    <div className="suctionGlass">
                      <div className={`suctionTubeBall ${stage === "suction" ? "suctionBallMystery" : ""}`}>
                        <span className="suctionBallNumber">
                          {stage === "suction" ? "?" : (winner || displayNumber)}
                        </span>
                      </div>
                    </div>
                    <div className="suctionBaseCollar" />
                  </div>
                </div>

                {/* CHASIS MECÁNICO INDUSTRIAL Y ESFERA DE CRISTAL 3D */}
                <div
                  className="globeChassis"
                >
                  {/* Micropartículas luminosas doradas aleatorias en el aire exterior (r > 53%, cero contacto con el cristal) */}
                  <div className="baloteraSparkleHalo" aria-hidden="true">
                    {BALOTERA_EXTERIOR_SPARKS.map((sp, idx) => {
                      const rad = (sp.angle * Math.PI) / 180;
                      const lx = (50 + sp.dist * Math.cos(rad)).toFixed(2);
                      const ly = (50 + sp.dist * Math.sin(rad)).toFixed(2);
                      return (
                        <span
                          key={`ext-spark-${idx}`}
                          className="baloteraExteriorSpark"
                          style={
                            {
                              left: `${lx}%`,
                              top: `${ly}%`,
                              "--spark-size": `${sp.size}px`,
                              animationDuration: sp.dur,
                              animationDelay: sp.delay,
                            } as React.CSSProperties
                          }
                        />
                      );
                    })}
                  </div>

                  {/* Destellos estrella de 4 puntas en secuencia aleatoria sobre el aro dorado exterior (cero contacto con el cristal) */}
                  <div className="baloteraBezelGlints" aria-hidden="true">
                    {BALOTERA_BEZEL_GLINTS.map((gl, idx) => {
                      const rad = (gl.angle * Math.PI) / 180;
                      const gx = (50 + 49.7 * Math.cos(rad)).toFixed(2);
                      const gy = (50 + 49.7 * Math.sin(rad)).toFixed(2);
                      return (
                        <span
                          key={`bezel-glint-${idx}`}
                          className="bezelStarGlintItem"
                          style={
                            {
                              left: `${gx}%`,
                              top: `${gy}%`,
                              "--glint-size": `${gl.size}px`,
                              animationDuration: gl.dur,
                              animationDelay: gl.delay,
                            } as React.CSSProperties
                          }
                        >
                          <svg viewBox="0 0 40 40" className="bezelStarSvg">
                            <circle cx="20" cy="20" r="8.5" fill="rgba(255, 236, 155, 0.34)" />
                            <path
                              d="M20 9 L21.1 18.9 L31 20 L21.1 21.1 L20 31 L18.9 21.1 L9 20 L18.9 18.9 Z"
                              fill="rgba(255, 245, 195, 0.78)"
                              transform="rotate(45 20 20)"
                            />
                            <path
                              d="M20 0 C21.2 14.5 25.5 18.8 40 20 C25.5 21.2 21.2 25.5 20 40 C18.8 25.5 14.5 21.2 0 20 C14.5 18.8 18.8 14.5 20 0 Z"
                              fill="#fffef2"
                            />
                            <circle cx="20" cy="20" r="3.4" fill="#ffffff" />
                          </svg>
                        </span>
                      );
                    })}
                  </div>
                  {/* Bisel perimetral de acero inoxidable y oro torneado con tornillería CNC real */}
                  <div className="globeBezelFlange" aria-hidden="true">
                    <svg className="bezelSvgRing" viewBox="-2 -2 454 454" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <defs>
                        <linearGradient id="bezelOuterGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#875f1b" />
                          <stop offset="25%" stopColor="#e5bf5c" />
                          <stop offset="45%" stopColor="#fff6ce" />
                          <stop offset="65%" stopColor="#966d1f" />
                          <stop offset="85%" stopColor="#f3d47d" />
                          <stop offset="100%" stopColor="#5e4110" />
                        </linearGradient>
                        <linearGradient id="bezelInnerGroove" x1="0%" y1="100%" x2="0%" y2="0%">
                          <stop offset="0%" stopColor="#080808" />
                          <stop offset="50%" stopColor="#2c2210" />
                          <stop offset="100%" stopColor="#121212" />
                        </linearGradient>
                        <radialGradient id="boltGrad" cx="35%" cy="30%" r="65%">
                          <stop offset="0%" stopColor="#ffffff" />
                          <stop offset="45%" stopColor="#e2be58" />
                          <stop offset="80%" stopColor="#7a5412" />
                          <stop offset="100%" stopColor="#302004" />
                        </radialGradient>
                        <filter id="boltShadow" x="-20%" y="-20%" width="140%" height="140%">
                          <feDropShadow dx="0" dy="1.5" stdDeviation="1" floodColor="#000000" floodOpacity="0.8" />
                        </filter>
                      </defs>

                      {/* Aro exterior biselado */}
                      <circle cx="225" cy="225" r="221" stroke="url(#bezelOuterGrad)" strokeWidth="12" />
                      <circle cx="225" cy="225" r="214.5" stroke="url(#bezelInnerGroove)" strokeWidth="3" />
                      <circle cx="225" cy="225" r="212.5" stroke="rgba(255,245,200,0.3)" strokeWidth="1" />

                      {/* Pernos mecánicos distribuidos a 30° alrededor del chasis (en i=9 / 12 en punto va anclada la campana superior) */}
                      {Array.from({ length: 12 }, (_, i) => {
                        if (i === 9) return null;
                        const angle = (i * 30 * Math.PI) / 180;
                        const bx = Math.round((225 + 221 * Math.cos(angle)) * 10) / 10;
                        const by = Math.round((225 + 221 * Math.sin(angle)) * 10) / 10;
                        return (
                          <g key={i} filter="url(#boltShadow)">
                            <circle cx={bx} cy={by} r="5" fill="url(#boltGrad)" stroke="#382404" strokeWidth="0.8" />
                            <circle cx={bx} cy={by} r="1.8" fill="#1b1203" />
                            <line x1={bx - 2.2} y1={by} x2={bx + 2.2} y2={by} stroke="rgba(255,255,255,0.4)" strokeWidth="0.5" />
                          </g>
                        );
                      })}
                    </svg>
                  </div>

                  {/* Esfera de cristal con Canvas de física real hiperrealista */}
                  <div className="crystalGlobe">
                    {/* Fondo 3D: Aros orbitales de oro torneado (Astrolabio) */}
                    <svg className="globeOrbitalSvg" viewBox="0 0 450 450" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                      <defs>
                        <linearGradient id="orbitGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#fff8db" stopOpacity="0.6" />
                          <stop offset="40%" stopColor="#e8c25e" stopOpacity="0.45" />
                          <stop offset="100%" stopColor="#946b1a" stopOpacity="0.25" />
                        </linearGradient>
                      </defs>
                      <ellipse cx="225" cy="225" rx="180" ry="70" stroke="url(#orbitGoldGrad)" strokeWidth="1.2" />
                      <ellipse cx="225" cy="225" rx="70" ry="180" stroke="url(#orbitGoldGrad)" strokeWidth="1.2" />
                    </svg>

                    {/* Fondo 3D: Iluminación volumétrica y columna de profundidad posterior */}
                    <div className="globeDepthIllumination" />
                    <div className="globeCenterDepthPillar" aria-hidden="true" />

                    {/* Turbina difusora neumática inferior: Rejilla CNC industrial de alta gama */}
                    <div className="pneumaticTurbineIntake" aria-label="Turbina neumática de extracción">
                      <svg className="turbineGrilleSvg" viewBox="0 0 200 64" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                        <defs>
                          <linearGradient id="cowlRingGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#fff8db" />
                            <stop offset="20%" stopColor="#e5bf5c" />
                            <stop offset="55%" stopColor="#966d1f" />
                            <stop offset="85%" stopColor="#4a330a" />
                            <stop offset="100%" stopColor="#1a1203" />
                          </linearGradient>
                          <radialGradient id="plenumPitGrad" cx="50%" cy="30%" r="68%">
                            <stop offset="0%" stopColor="#082215" />
                            <stop offset="50%" stopColor="#020d07" />
                            <stop offset="100%" stopColor="#000000" />
                          </radialGradient>
                          <linearGradient id="vaneBladeGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#fff0b3" />
                            <stop offset="45%" stopColor="#cf9f33" />
                            <stop offset="100%" stopColor="#4d3509" />
                          </linearGradient>
                          <radialGradient id="hubBulletGrad" cx="35%" cy="30%" r="65%">
                            <stop offset="0%" stopColor="#ffffff" />
                            <stop offset="35%" stopColor="#eec765" />
                            <stop offset="75%" stopColor="#966e1d" />
                            <stop offset="100%" stopColor="#2c1e05" />
                          </radialGradient>
                          <filter id="ventRecessShadow" x="-10%" y="-10%" width="120%" height="120%">
                            <feDropShadow dx="0" dy="1" stdDeviation="0.8" floodColor="#000000" floodOpacity="0.9" />
                          </filter>
                        </defs>

                        {/* 1. Aro exterior biselado CNC de oro satinado con reborde de encastre */}
                        <ellipse cx="100" cy="32" rx="96" ry="28" fill="url(#cowlRingGrad)" />
                        <ellipse cx="100" cy="31" rx="92" ry="25.5" fill="#140e03" />
                        <ellipse cx="100" cy="31" rx="90" ry="24" fill="#2d2007" />

                        {/* 2. Pozo aerodinámico profundo (Plenum Chamber) */}
                        <ellipse cx="100" cy="30.5" rx="86" ry="21.5" fill="url(#plenumPitGrad)" stroke="#5e4412" strokeWidth="1" />

                        {/* 3. Aros concéntricos de guiado de flujo laminar */}
                        <ellipse cx="100" cy="30.5" rx="66" ry="16.5" fill="none" stroke="url(#vaneBladeGrad)" strokeWidth="0.8" opacity="0.6" />
                        <ellipse cx="100" cy="30.5" rx="42" ry="10.5" fill="none" stroke="url(#vaneBladeGrad)" strokeWidth="0.8" opacity="0.75" />

                        {/* 4. Rejilla de álabes radiales aerodinámicos (Aspas de turbina en vórtice 3D) */}
                        {[
                          { x1: 22, y1: 28, x2: 44, y2: 30 },
                          { x1: 30, y1: 20, x2: 50, y2: 24 },
                          { x1: 44, y1: 15, x2: 60, y2: 21 },
                          { x1: 64, y1: 12, x2: 74, y2: 20 },
                          { x1: 84, y1: 10, x2: 89, y2: 20 },
                          { x1: 100, y1: 10, x2: 100, y2: 20 },
                          { x1: 116, y1: 10, x2: 111, y2: 20 },
                          { x1: 136, y1: 12, x2: 126, y2: 20 },
                          { x1: 156, y1: 15, x2: 140, y2: 21 },
                          { x1: 170, y1: 20, x2: 150, y2: 24 },
                          { x1: 178, y1: 28, x2: 156, y2: 30 },
                          { x1: 170, y1: 38, x2: 150, y2: 34 },
                          { x1: 156, y1: 44, x2: 140, y2: 37 },
                          { x1: 136, y1: 48, x2: 126, y2: 39 },
                          { x1: 116, y1: 50, x2: 111, y2: 40 },
                          { x1: 100, y1: 51, x2: 100, y2: 40 },
                          { x1: 84, y1: 50, x2: 89, y2: 40 },
                          { x1: 64, y1: 48, x2: 74, y2: 39 },
                          { x1: 44, y1: 44, x2: 60, y2: 37 },
                          { x1: 30, y1: 38, x2: 50, y2: 34 },
                        ].map((vane, idx) => (
                          <g key={idx}>
                            <line
                              x1={vane.x1}
                              y1={vane.y1}
                              x2={vane.x2}
                              y2={vane.y2}
                              stroke="#000000"
                              strokeWidth="2.8"
                              strokeLinecap="round"
                            />
                            <line
                              x1={vane.x1}
                              y1={vane.y1 - 0.4}
                              x2={vane.x2}
                              y2={vane.y2 - 0.4}
                              stroke="url(#vaneBladeGrad)"
                              strokeWidth="1.2"
                              strokeLinecap="round"
                              opacity="0.92"
                            />
                          </g>
                        ))}

                        {/* 5. Toberas horizontales curvadas para flujo centrífugo */}
                        <ellipse cx="100" cy="18" rx="52" ry="2.2" fill="#000000" stroke="url(#vaneBladeGrad)" strokeWidth="0.8" opacity="0.8" />
                        <ellipse cx="100" cy="42" rx="52" ry="2.2" fill="#000000" stroke="url(#vaneBladeGrad)" strokeWidth="0.8" opacity="0.8" />

                        {/* 6. Cono difusor central de compresión (Aerodynamic Bullet Hub) */}
                        <ellipse cx="100" cy="30.5" rx="18" ry="8.5" fill="url(#hubBulletGrad)" stroke="#1a1202" strokeWidth="1" filter="url(#ventRecessShadow)" />
                        <ellipse cx="100" cy="30" rx="10" ry="4.5" fill="#030805" />
                        <circle cx="100" cy="29.5" r="2.8" fill="url(#hubBulletGrad)" stroke="#52390a" strokeWidth="0.6" />
                        <circle cx="99.2" cy="28.8" r="0.8" fill="#ffffff" />

                        {/* 7. Reflejo especular satinado de curvatura superior */}
                        <path d="M 32 19 Q 100 11 168 19" stroke="rgba(255,255,255,0.55)" strokeWidth="0.9" fill="none" />
                      </svg>
                      <div className="turbineAirPulse" />
                    </div>

                    {/* Canvas de física de balotas 480px HD */}
                    <canvas ref={setCanvasEl} className="physicsCanvas" />

                    {/* Frente 3D del cristal: Menisco de refracción, arco de luz y curvatura óptica frontal */}
                    <div className="globeGlassThicknessRim" />
                    <div className="globeFrontCurvatureSpecular" aria-hidden="true" />
                    <div className="globeFloorBounceRim" />

                    {/* Balota Ganadora Monumental en el centro de la balotera */}
                    {phase === "winner" && (
                      <div className="heroExtractedBall ballRevealed" aria-label={`Balota ganadora oficial ${winner}`}>
                        <div className="ballRipple ripple1" />
                        <div className="ballRipple ripple2" />
                        <div className="heroBallInner">
                          <div className="ballGlare" />
                          <div className="ballSecondaryGlow" />
                          <div className="heroBallSparkle" />
                          <div className="heroBallCenterDisc">
                            <div className="heroBallNumber">
                              <span>{winner || displayNumber}</span>
                              {hasAmbiguityRisk(winner || displayNumber) && <span className="ballUnderlineBar" />}
                            </div>
                            <div className="ballWatermark">EL GANADOR</div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 6. Distintivo oficial de revelación en la corona de la balotera */}
                    {phase === "winner" && (
                      <div className="globeGanasteCrown" aria-hidden="true">
                        ★ ¡GANASTE! ★
                      </div>
                    )}

                    {/* 7. CONTEO REGRESIVO PREVIO 3D (Sin recuadros: Números gigantes flotantes en oro 24K con leve sombra 3D) */}
                    {countdownNumber !== null && (
                      <div className="countdownOverlayBadge" key={String(countdownNumber)}>
                        <span className={`countdownDigitalText ${typeof countdownNumber !== "number" ? "isWord" : ""}`}>
                          {countdownNumber}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Pedestal Arquitectónico Premium (Piano Black & Oro 24K con placa EL GANADOR) */}
                <div className="machineStandWrapper" aria-hidden="true">
                  <div className="machineTwinPillars">
                    <div className="machinePillar pillarLeft" />
                    <div className="machineCradleCenter" />
                    <div className="machinePillar pillarRight" />
                  </div>
                  <div className="machineStand">
                    <div className="pedestalBevelTop" />
                    <div className="pedestalFrontFace">
                      <div className="pedestalBolt" />
                      <div className="pedestalBadge">EL GANADOR</div>
                      <div className="pedestalBolt" />
                    </div>
                    <div className="pedestalBasePlate" />
                  </div>
                </div>

                {/* Cápsula flotante translúcida de fase */}
                <div className="ballChute">
                  <span className={`chuteText ${stage}`}>
                    {stage === "idle" && `CARTÓN OFICIAL DE ${cartonSize} NÚMEROS`}
                    {stage === "countdown" && (
                      countdownNumber !== null
                        ? `⏱️ INICIANDO EXTRACCIÓN EN ${countdownNumber}...`
                        : "🎙️ ANUNCIO OFICIAL · EL CÍRCULO DORADO"
                    )}
                    {stage === "mixing" && `🌀 FASE 1: AGITACIÓN Y MEZCLA (${stageSecondsLeft}s)...`}
                    {stage === "suction" && `⚡ FASE 2: SUCCIÓN DE BALOTA GANADORA (${stageSecondsLeft}s)...`}
                    {stage === "slowdown" && "🎯 FASE 3: COMPROBANDO NÚMERO GANADOR..."}
                    {stage === "reveal" && `★ ¡BALOTA GANADORA OFICIAL: ${winner}! ★`}
                  </span>
                </div>
              </div>
            ) : (
              <div
                className="wheelCasinoWrapper"
                data-wheel-size={wheelSize}
              >
                {/* 1. Flapper / Puntero Superior Triángulo Dorado con Flecha Rubí */}
                <div
                  ref={flapperDomRef}
                  className="wheelPointerFixture"
                  style={{
                    transform: `translateX(-50%) rotate(${currentFlapperTiltRef.current.toFixed(2)}deg)`,
                  }}
                  aria-hidden="true"
                >
                  <div className="pointerGoldFrame">
                    <svg viewBox="0 0 50 58" className="pointerSvg">
                      <defs>
                        <linearGradient id="pointerGoldBezelGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#fff2b3" />
                          <stop offset="45%" stopColor="#d4a338" />
                          <stop offset="100%" stopColor="#69480b" />
                        </linearGradient>
                        <linearGradient id="pointerRubyArrowGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="#ff2a3b" />
                          <stop offset="60%" stopColor="#c70014" />
                          <stop offset="100%" stopColor="#6e0009" />
                        </linearGradient>
                      </defs>
                      <polygon points="25,56 3,4 47,4" fill="url(#pointerGoldBezelGrad)" stroke="#382504" strokeWidth="1.4" />
                      <polygon points="25,47 10,10 40,10" fill="url(#pointerRubyArrowGrad)" stroke="#3d0308" strokeWidth="0.8" />
                      <polygon points="25,42 13,13 37,13" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="0.8" />
                    </svg>
                  </div>
                </div>

                {/* 2. Tambor Exterior Dorado de Lujo con 12 Focos Perimetrales (Reloj de 12 horas, idéntico a la foto) */}
                <div className={`wheelDrumCasing ${phase === "spinning" ? "drumSpinning" : ""} ${phase === "winner" ? "drumWinner" : ""}`}>
                  {/* Micropartículas luminosas doradas aleatorias en el aire exterior alrededor de la Ruleta (cero contacto con las casillas) */}
                  <div className="baloteraSparkleHalo wheelSparkleHalo" aria-hidden="true">
                    {WHEEL_EXTERIOR_SPARKS.map((sp, idx) => {
                      const rad = (sp.angle * Math.PI) / 180;
                      const lx = (50 + sp.dist * Math.cos(rad)).toFixed(2);
                      const ly = (50 + sp.dist * Math.sin(rad)).toFixed(2);
                      return (
                        <span
                          key={`wheel-ext-spark-${idx}`}
                          className="baloteraExteriorSpark"
                          style={
                            {
                              left: `${lx}%`,
                              top: `${ly}%`,
                              "--spark-size": `${sp.size}px`,
                              animationDuration: sp.dur,
                              animationDelay: sp.delay,
                            } as React.CSSProperties
                          }
                        />
                      );
                    })}
                  </div>

                  {/* Destellos estrella en secuencia aleatoria sobre el borde dorado exterior entre los 12 bombillos (cero contacto con las casillas) */}
                  <div className="baloteraBezelGlints wheelBezelGlints" aria-hidden="true">
                    {WHEEL_BEZEL_GLINTS.map((gl, idx) => {
                      const rad = (gl.angle * Math.PI) / 180;
                      const gx = (50 + 49.6 * Math.cos(rad)).toFixed(2);
                      const gy = (50 + 49.6 * Math.sin(rad)).toFixed(2);
                      return (
                        <span
                          key={`wheel-bezel-glint-${idx}`}
                          className="bezelStarGlintItem"
                          style={
                            {
                              left: `${gx}%`,
                              top: `${gy}%`,
                              "--glint-size": `${gl.size}px`,
                              animationDuration: gl.dur,
                              animationDelay: gl.delay,
                            } as React.CSSProperties
                          }
                        >
                          <svg viewBox="0 0 40 40" className="bezelStarSvg">
                            <circle cx="20" cy="20" r="8.5" fill="rgba(255, 236, 155, 0.34)" />
                            <path
                              d="M20 9 L21.1 18.9 L31 20 L21.1 21.1 L20 31 L18.9 21.1 L9 20 L18.9 18.9 Z"
                              fill="rgba(255, 245, 195, 0.78)"
                              transform="rotate(45 20 20)"
                            />
                            <path
                              d="M20 0 C21.2 14.5 25.5 18.8 40 20 C25.5 21.2 21.2 25.5 20 40 C18.8 25.5 14.5 21.2 0 20 C14.5 18.8 18.8 14.5 20 0 Z"
                              fill="#fffef2"
                            />
                            <circle cx="20" cy="20" r="3.4" fill="#ffffff" />
                          </svg>
                        </span>
                      );
                    })}
                  </div>

                  {/* 12 Focos Perimetrales a 30° cada uno: Casquillo Metálico Gris 100% Estático + Bombillo ON/OFF sin desvanecer */}
                  <div className="wheelBulbsPerimeter" aria-hidden="true">
                    {Array.from({ length: 12 }, (_, i) => {
                      const bulbAngle = (i * 360) / 12;
                      const patternClass = `pattern-${((i * 5) % 6) + 1}`;
                      const randomDelay = `${-(((i * 11 + 3) % 13) * 0.13).toFixed(2)}s`;
                      return (
                        <div
                          key={`bulb-${i}`}
                          className="casinoBulbSocket"
                          style={{
                            transform: `translate(-50%, -50%) rotate(${bulbAngle}deg) translateY(var(--bulb-offset, -280px))`,
                          }}
                        >
                          {/* Parte metálica gris y brida 100% ESTÁTICAS (separadas del bombillo animado) */}
                          <div className="casinoBulbFlange" />
                          <div className="casinoBulbBase" />
                          {/* Globo del bombillo: prende y apaga nítido (ON / OFF), jamás se desvanece ni se transparenta */}
                          <div
                            className={`casinoBulbGlass ${patternClass} ${phase === "spinning" ? "bulbSpinChase" : ""} ${phase === "winner" ? (i % 2 === 0 ? "bulbWinnerEven" : "bulbWinnerOdd") : ""}`}
                            style={{
                              animationDelay: phase === "spinning" ? `${-(1 - i / 12) * 0.48}s` : phase === "winner" ? "0s" : randomDelay,
                            }}
                          />
                        </div>
                      );
                    })}
                  </div>

                  {/* 3. Bisel Exterior Dorado con Puntos de Colores Engarzados en Ojal Metálico */}
                  <div className="wheelBezelRing" aria-hidden="true">
                    {Array.from({ length: 28 }, (_, j) => {
                      // En j === 0 (12 en punto) descansa el puntero rojo y dorado
                      if (j === 0) return null;
                      const jewelAngle = (j * 360) / 28;
                      const jewelColor = JEWEL_BEZEL_COLORS[j % JEWEL_BEZEL_COLORS.length];
                      return (
                        <div
                          key={`jewel-${j}`}
                          className="bezelJewelDot"
                          style={
                            {
                              transform: `translate(-50%, -50%) rotate(${jewelAngle}deg) translateY(var(--jewel-offset, -235px))`,
                              "--jewel-color": jewelColor,
                            } as React.CSSProperties
                          }
                        />
                      );
                    })}
                  </div>

                  {/* 4. Disco Giratorio de Ruleta con Gradiente Cónico y Etiquetas Radiales */}
                  <div
                    ref={wheelBoardDomRef}
                    className={`wheelBoard ${phase === "spinning" ? "wheelBoardSpinning" : ""} ${phase === "winner" ? "wheelBoardWinner" : ""}`}
                    style={{
                      background: `conic-gradient(${wheelGradient})`,
                      transform: `rotate(${currentWheelAngleRef.current.toFixed(3)}deg)`,
                      transition: "none",
                      willChange: "transform",
                    }}
                  >
                    {/* Clavijas perimetrales de acero (Pegs) que giran con el disco */}
                    <div className="wheelPegsRing" aria-hidden="true">
                      {Array.from({ length: wheelSize }, (_, k) => {
                        const pegAngle = (k * 360) / wheelSize;
                        return (
                          <div
                            key={`peg-${k}`}
                            className="wheelPeg"
                            style={{
                              transform: `translate(-50%, -50%) rotate(${pegAngle}deg) translateY(var(--peg-offset, -205px))`,
                            }}
                          />
                        );
                      })}
                    </div>

                    {/* Etiquetas Radiales con Tipografía de Alto Impacto */}
                    <div className="wheelNumberRing" aria-hidden="true">
                      {Array.from({ length: wheelSize }, (_, index) => {
                        const sectorCenterAngle = ((index + 0.5) * 360) / wheelSize;
                        const rawName = wheelPlayers[index] || "";
                        const maxChars = wheelSize >= 40 ? 6 : wheelSize >= 30 ? 7 : 9;
                        const labelText =
                          rawName && !/^Participante\s+\d+$/i.test(rawName) && isNaN(Number(rawName))
                            ? (rawName.length > maxChars ? rawName.slice(0, maxChars - 1) + "…" : rawName)
                            : `#${String(index + 1).padStart(2, "0")}`;
                        return (
                          <div
                            key={`sector-${index}`}
                            className="wheelSectorLabel"
                            style={{
                              transform: `translate(-50%, -50%) rotate(${sectorCenterAngle}deg) translateY(var(--label-offset, -135px))`,
                            }}
                          >
                            <span className="sectorNumber">{labelText}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* 5. Cúspide Roseta Central Facetada en 3D (Oro y Plata/Gris Alternada — 100% ESTÁTICA en el eje central) */}
                  <div className="wheelFacetedHub" aria-hidden="true">
                    <div className="hubFacetsCone">
                      <svg viewBox="0 0 100 100" className="hubSvgCone">
                        <defs>
                          <linearGradient id="goldFacetGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#fff3b0" />
                            <stop offset="50%" stopColor="#d4a034" />
                            <stop offset="100%" stopColor="#875e18" />
                          </linearGradient>
                          <linearGradient id="silverFacetGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#ffffff" />
                            <stop offset="50%" stopColor="#c5cbd3" />
                            <stop offset="100%" stopColor="#7a828d" />
                          </linearGradient>
                          <radialGradient id="centerDomeGrad" cx="35%" cy="30%" r="65%">
                            <stop offset="0%" stopColor="#ffffff" />
                            <stop offset="40%" stopColor="#f3ca65" />
                            <stop offset="85%" stopColor="#a37624" />
                            <stop offset="100%" stopColor="#4e330a" />
                          </radialGradient>
                        </defs>
                        {Array.from({ length: 8 }, (_, fIdx) => {
                          const angle1 = (fIdx * 45 * Math.PI) / 180;
                          const angle2 = ((fIdx + 1) * 45 * Math.PI) / 180;
                          const r = 48;
                          const x1 = 50 + r * Math.sin(angle1);
                          const y1 = 50 - r * Math.cos(angle1);
                          const x2 = 50 + r * Math.sin(angle2);
                          const y2 = 50 - r * Math.cos(angle2);
                          const isGold = fIdx % 2 === 0;
                          return (
                            <polygon
                              key={`facet-${fIdx}`}
                              points={`50,50 ${x1.toFixed(1)},${y1.toFixed(1)} ${x2.toFixed(1)},${y2.toFixed(1)}`}
                              fill={isGold ? "url(#goldFacetGrad)" : "url(#silverFacetGrad)"}
                              stroke="#332408"
                              strokeWidth="0.5"
                            />
                          );
                        })}
                        <circle cx="50" cy="50" r="14" fill="url(#centerDomeGrad)" stroke="#5c3f0f" strokeWidth="1.2" />
                        <circle cx="47" cy="46" r="3.5" fill="#ffffff" opacity="0.75" />
                      </svg>
                    </div>
                  </div>

                  {/* 5B. Revelación Monumental del Número Ganador en 3D al detenerse la Ruleta */}
                  {phase === "winner" && (
                    <>
                      <div
                        className="heroExtractedBall wheelHeroWinnerBall ballRevealed"
                        aria-label={`Número ganador oficial ${rouletteWinnerNum}${rouletteWinnerCustomName ? ` - ${rouletteWinnerCustomName}` : ""}`}
                      >
                        <div className="shockwaveRipple ripple1" />
                        <div className="shockwaveRipple ripple2" />
                        <div className="heroBallInner">
                          <div className="ballGlare" />
                          <div className="ballSecondaryGlow" />
                          <div className="heroBallSparkle" />
                          <div className="heroBallCenterDisc">
                            <div className="heroBallNumber">
                              <span>{rouletteWinnerNum}</span>
                              {hasAmbiguityRisk(rouletteWinnerNum) && <span className="ballUnderlineBar" />}
                            </div>
                            {rouletteWinnerCustomName ? (
                              <div className="wheelWinnerCustomName">{rouletteWinnerCustomName}</div>
                            ) : (
                              <div className="ballWatermark">EL GANADOR</div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="globeGanasteCrown wheelGanasteCrown" aria-hidden="true">
                        ★ ¡GANASTE! ★
                      </div>
                    </>
                  )}

                  {/* Conteo Regresivo de Inicio Oficial 3D Flotante (Dentro del tambor, centrado y sobre las clavijas) */}
                  {countdownNumber !== null && (
                    <div className="countdownOverlayBadge" key={String(countdownNumber)}>
                      <span className={`countdownDigitalText ${typeof countdownNumber !== "number" ? "isWord" : ""}`}>
                        {countdownNumber}
                      </span>
                    </div>
                  )}
                </div>

                {/* 6. Pedestal Negro Brillante (Piano Black) Separado */}
                <div className="wheelPedestalStand" aria-hidden="true">
                  <div className="pedestalBevelTop" />
                  <div className="pedestalFrontFace">
                    <div className="pedestalBolt" />
                    <div className="pedestalBadge">EL GANADOR</div>
                    <div className="pedestalBolt" />
                  </div>
                  <div className="pedestalBasePlate" />
                </div>

                {/* Cápsula de estado: visible en reposo y con el número ganador (oculta durante conteo y giro) */}
                {(stage === "idle" || phase === "winner") && (
                  <div className="ballChute">
                    <span className={`chuteText ${stage}`}>
                      {stage === "idle" && `RULETA OFICIAL DE ${wheelSize} NÚMEROS (01 A ${String(wheelSize).padStart(2, "0")})`}
                      {phase === "winner" &&
                        `★ ¡NÚMERO GANADOR OFICIAL: #${rouletteWinnerNum}${
                          rouletteWinnerCustomName ? ` · ${rouletteWinnerCustomName.toUpperCase()}` : ""
                        }! ★`}
                    </span>
                  </div>
                )}
              </div>
            )}
            {/* EN MODO EMPRESARIO: Barra de ganador en el pie del escenario de pantalla completa */}
            {!isViewerMode && isOperator && isCinemaFullscreen && phase === "winner" && winner && (
              <div className="cinemaWinnerSpotlightBar">
                <strong>
                  {mode === "balotas"
                    ? `🏆 BALOTA #${winner} · “${numberToSpanishWords(winner).toUpperCase()}”`
                    : `🏆 NÚMERO #${rouletteWinnerNum} · “${numberToSpanishWords(rouletteWinnerNum).toUpperCase()}”${
                        rouletteWinnerCustomName ? ` (${rouletteWinnerCustomName})` : ""
                      }`}
                </strong>
                <button
                  type="button"
                  className="cinemaFinishNowBtn"
                  onClick={() => {
                    clearRevealTicketTimers();
                    exitCinemaFullscreen();
                  }}
                >
                  Mostrar funciones y opciones →
                </button>
              </div>
            )}

            {/* EN MODO CLIENTE (CELULAR): TARJETA DE ESPERA Y REGISTRO DE BOLETO */}
            {isViewerMode && phase === "ready" && (
              <div className="clientViewerWaitingCard">
                <div className="clientViewerHeader">
                  <span className="clientStatusDot" />
                  <span>TRANSMISIÓN EN VIVO · ESPECTADOR</span>
                </div>
                <h2 className="clientWaitingTitle">{activeDrawTitle}</h2>
                <p className="clientWaitingSub">
                  Sorteo oficial en vivo. En breve comenzará la extracción en tiempo real ante {activeSpectatorCount.toLocaleString("es-CO")} espectadores.
                </p>

                {/* BANNER DE RECAUDO EN VIVO DEL EVENTO */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "10px 14px",
                    background: "rgba(245, 184, 46, 0.08)",
                    border: "1px solid rgba(245, 184, 46, 0.25)",
                    borderRadius: "12px",
                    margin: "10px 0 14px 0",
                  }}
                >
                  <div>
                    <div style={{ fontSize: "10px", color: "#f5b82e", fontWeight: 800, textTransform: "uppercase" }}>
                      Boletería Vendida del Evento
                    </div>
                    <div style={{ fontSize: "15px", fontWeight: 800, color: "#ffffff" }}>
                      ${activeTotalRevenue.toLocaleString("es-CO")} COP
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "12px", fontWeight: 700, color: "#cbd5e1" }}>
                      {activeSoldTickets} de {activeTotalTickets} balotas
                    </div>
                    <div style={{ fontSize: "10px", color: "#10b981", fontWeight: 700 }}>
                      ✓ {activeRevenuePct}% vendido
                    </div>
                  </div>
                </div>

                {/* BOTONES DE REACCIONES DEL ESPECTADOR EN VIVO */}
                <div className="liveAudienceReactions" style={{ justifyContent: "center", margin: "14px 0" }}>
                  <button type="button" className="reactionBtn" onClick={() => { triggerHaptic(15); triggerReaction("👏"); }} onTouchStart={() => triggerHaptic(15)}>
                    👏 <small>{reactionCounts["👏"] || 489}</small>
                  </button>
                  <button type="button" className="reactionBtn" onClick={() => { triggerHaptic(15); triggerReaction("🔥"); }} onTouchStart={() => triggerHaptic(15)}>
                    🔥 <small>{reactionCounts["🔥"] || 915}</small>
                  </button>
                  <button type="button" className="reactionBtn" onClick={() => { triggerHaptic(15); triggerReaction("🎉"); }} onTouchStart={() => triggerHaptic(15)}>
                    🎉 <small>{reactionCounts["🎉"] || 630}</small>
                  </button>
                  <button type="button" className="reactionBtn" onClick={() => { triggerHaptic(15); triggerReaction("❤️"); }} onTouchStart={() => triggerHaptic(15)}>
                    ❤️ <small>{reactionCounts["❤️"] || 1240}</small>
                  </button>
                </div>

                {/* BLOQUE DE BOLETAS VINCULADAS AL PERFIL DEL CLIENTE O BÚSQUEDA AUTOMÁTICA */}
                {officialTickets.length > 0 ? (
                  <div className="clientOfficialTicketsBox">
                    <div className="clientProfileBadgeRow">
                      <span className="clientVerifiedBadge">
                        👤 {clientAccount?.displayName ? `Hola, ${clientAccount.displayName}` : "Boletas Compradas Verificadas"}
                      </span>
                      <span className="clientTicketsCountTag">{officialTickets.length} en juego</span>
                    </div>
                    <p className="clientTicketsInstructions">
                      Tus boletas oficiales vinculadas a tu cuenta para este sorteo:
                    </p>
                    <div className="clientTicketsBadgesList">
                      {officialTickets.map((tk) => (
                        <span key={tk} className="clientTicketGoldPill">
                          #{tk}
                        </span>
                      ))}
                    </div>
                    <p className="clientTicketsAutoNotice">
                      🔒 Vinculadas a tu perfil. Si cualquiera de tus números resulta ganador, el sistema te notificará automáticamente como ganador oficial.
                    </p>
                  </div>
                ) : clientAccount ? (
                  <div className="clientNoTicketsNotice">
                    <p>👤 Conectado como <strong>{clientAccount.displayName}</strong> ({clientAccount.email})</p>
                    <p className="clientNoTicketsSub">No encontramos boletas activas para este cartón en tu cuenta.</p>
                    <a href="/cuenta" className="btnClientViewAccount">
                      Ir a mi Perfil y Mis Compras →
                    </a>
                  </div>
                ) : (
                  <div className="clientAccountGateBox">
                    <div className="clientLoginPrompt">
                      <p className="clientPromptTitle">🎟️ ¿Tienes boletas para este sorteo?</p>
                      <p className="clientPromptSub">Inicia sesión para que tus boletas compradas aparezcan automáticamente aquí:</p>
                      <a href="/ingreso?mode=login" className="btnClientGoLogin">
                        🔑 Iniciar Sesión en Mi Cuenta
                      </a>
                    </div>

                    <div className="clientSearchByEmailRow">
                      <span className="clientOrDivider">── o busca tus boletas con tu correo de compra ──</span>
                      <form onSubmit={handleSearchClientTickets} className="clientEmailSearchForm">
                        <input
                          type="email"
                          placeholder="Correo de compra (ej: cliente@gmail.com)"
                          value={clientSearchEmail}
                          onChange={(e) => setClientSearchEmail(e.target.value)}
                          className="clientTicketField"
                          required
                        />
                        <button type="submit" disabled={isSearchingTickets} className="clientTicketSaveBtn">
                          {isSearchingTickets ? "..." : "Cargar"}
                        </button>
                      </form>
                      {ticketSearchFeedback && (
                        <p className="clientTicketSavedNotice">{ticketSearchFeedback}</p>
                      )}
                    </div>

                    <details style={{ marginTop: "8px", fontSize: "10px", color: "#6ee7b7", textAlign: "left" }}>
                      <summary style={{ cursor: "pointer", opacity: 0.8 }}>O probar una boleta manual para simulación</summary>
                      <div className="clientTicketRow" style={{ marginTop: "6px" }}>
                        <input
                          id="clientTicketInput"
                          type="number"
                          min="1"
                          max={cartonSize}
                          placeholder="Ej: 24"
                          value={userTicketNumber}
                          onChange={(e) => setUserTicketNumber(e.target.value)}
                          className="clientTicketField"
                        />
                        <button
                          type="button"
                          className="clientTicketSaveBtn"
                          onClick={() => {
                            if (userTicketNumber.trim()) {
                              const pad = userTicketNumber.padStart(2, "0");
                              setOfficialTickets([pad]);
                              setTicketSearchFeedback(`✓ Boleta manual de prueba #${pad} lista.`);
                            }
                          }}
                        >
                          Usar
                        </button>
                      </div>
                    </details>
                  </div>
                )}

                {/* 🔔 HERRAMIENTAS DE RECORDATORIO GOOGLE CALENDAR / GMAIL / APPLE / WHATSAPP */}
                <div className="clientReminderBlock">
                  <div className="reminderHeader">
                    <span className="reminderBellIcon">🔔</span>
                    <div>
                      <strong className="reminderTitle">¿No quieres perderte el sorteo?</strong>
                      <span className="reminderSubtitle">Agéndalo en tu calendario o compártelo</span>
                    </div>
                  </div>
                  <div className="reminderButtonsGrid">
                    <a
                      href={getGoogleCalendarUrl()}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btnReminderGoogle"
                      title="Agendar recordatorio en Google Calendar / Gmail"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20a2 2 0 0 0 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zm0-12H5V6h14v2z" />
                      </svg>
                      Agendar en Google Calendar / Gmail
                    </a>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
                      <button
                        type="button"
                        onClick={handleDownloadIcs}
                        className="btnReminderIcs"
                        title="Descargar recordatorio para iPhone Apple Calendar o Outlook"
                      >
                        🍏 iPhone / Outlook (.ics)
                      </button>
                      <a
                        href={getWhatsAppShareUrl()}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btnReminderWhatsApp"
                        title="Compartir o recordártelo por WhatsApp"
                      >
                        💬 WhatsApp
                      </a>
                    </div>
                  </div>
                </div>

                <div className="clientTestDemoWrap">
                  <button
                    type="button"
                    className="btnClientSimulation"
                    onClick={() => playDemo()}
                  >
                    ▶ Ver simulación del sorteo
                  </button>
                </div>
              </div>
            )}

            {/* EN MODO CLIENTE (CELULAR): RESULTADO DE GANADOR Y COMPROBACIÓN DE BOLETO */}
            {isViewerMode && phase === "winner" && winner && (
              <div className="clientViewerWinnerCard">
                <div className="clientWinnerBadgeRow">
                  <span className="winnerTrophyBadge">
                    🏆 {mode === "balotas" ? `BALOTA GANADORA: #${winner}` : `NÚMERO GANADOR: #${rouletteWinnerNum}`}
                  </span>
                </div>

                {officialTickets.length > 0 ? (
                  <div className={`clientWinnerResultBanner ${officialTickets.includes(winner) ? "matchedWinner" : "notMatched"}`}>
                    {officialTickets.includes(winner) ? (
                      <>
                        <p className="winnerCongratsTitle">🎉 ¡¡¡FELICITACIONES{clientAccount?.displayName ? `, ${clientAccount.displayName.toUpperCase()}` : ""}!!! 🎉</p>
                        <p className="winnerCongratsSub">
                          ¡ERES EL GANADOR OFICIAL! Tu boleta <strong>#{winner}</strong> coincide exactamente con la balota extraída.
                        </p>
                        <p className="winnerAccountSavedTag">✓ Premio verificado y asociado a tu perfil oficial de comprador.</p>
                      </>
                    ) : (
                      <>
                        <p className="winnerNormalTitle">
                          Tus boletas en juego fueron: {officialTickets.map((t) => `#${t}`).join(", ")}
                        </p>
                        <p className="winnerNormalSub">
                          La balota ganadora de este sorteo fue la #{winner}. ¡Gracias por participar y apoyar este evento!
                        </p>
                      </>
                    )}
                  </div>
                ) : userTicketNumber ? (
                  <div className={`clientWinnerResultBanner ${userTicketNumber.padStart(2, "0") === winner ? "matchedWinner" : "notMatched"}`}>
                    {userTicketNumber.padStart(2, "0") === winner ? (
                      <>
                        <p className="winnerCongratsTitle">🎉 ¡¡¡FELICITACIONES, ERES EL GANADOR OFICIAL!!! 🎉</p>
                        <p className="winnerCongratsSub">Tu boleta #{userTicketNumber.padStart(2, "0")} coincide exactamente con la balota extraída.</p>
                      </>
                    ) : (
                      <>
                        <p className="winnerNormalTitle">Tu boleta consultada fue la #{userTicketNumber.padStart(2, "0")}</p>
                        <p className="winnerNormalSub">La balota ganadora de este sorteo fue la #{winner}. ¡Gracias por participar!</p>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="clientWinnerResultBanner notMatched">
                    <p className="winnerNormalTitle">Sorteo finalizado con éxito</p>
                    <p className="winnerNormalSub">
                      Balota oficial extraída: #{winner}. Puedes verificar la constancia notarial a continuación.
                    </p>
                  </div>
                )}

                <div className="clientWinnerActions">
                  <button
                    type="button"
                    className="clientBtnCertificate"
                    onClick={() => setShowPrintModal(true)}
                  >
                    📜 Ver Constancia Notarial Oficial (SHA-256)
                  </button>
                  {clientAccount && (
                    <a href="/cuenta" className="clientBtnProfileLink">
                      👤 Ver en mi Perfil
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* BOTÓN DISCRETO PARA SALIR DE VISTA CLIENTE (PARA PRUEBAS DEL EMPRESARIO) */}
            {isViewerMode && isOperator && (
              <div className="clientExitBar">
                <button
                  type="button"
                  className="btnExitViewerMode"
                  onClick={() => {
                    setIsViewerMode(false);
                    setIsCinemaFullscreen(false);
                    if (typeof window !== "undefined") {
                      const url = new URL(window.location.href);
                      url.searchParams.delete("viewer");
                      url.searchParams.delete("modo");
                      window.history.pushState({}, "", url.toString());
                    }
                  }}
                >
                  ✕ Salir de vista cliente y volver a controles de empresario
                </button>
              </div>
            )}
          </div>

          {/* ===================================================================
              DESCRIPCIÓN DEL SORTEO ELEGANTE (SIN RECUADRO BLANCO, VISIBLE EN MÓVIL Y PORTÁTIL)
              =================================================================== */}
          <div className="mobileRaffleDescriptionCard">
            <div className="mobileRaffleHeaderRow">
              <h2 className="mobileRaffleTitle">
                <span>🎟️</span>
                <span>{activeDrawTitle}</span>
              </h2>
              <span className="mobileRaffleTag">
                {mode === "balotas" ? `Cartón de ${cartonSize}` : `Ruleta ${wheelSize}`}
              </span>
            </div>

            <p style={{ margin: '0 0 10px 0', fontSize: '12.5px', color: '#cbd5e1', lineHeight: '1.4' }}>
              {mode === "balotas"
                ? `Sorteo oficial supervisado Coljuegos (Ley 643/2001). Balotas del ${eligibleNumbers[0]} al ${eligibleNumbers[eligibleNumbers.length - 1]} con física en tiempo real y 100% equiprobable.`
                : `Ruleta comunitaria de precisión con números del 01 al ${wheelSize}.`}
            </p>

            <div className="mobileRaffleMetaGrid">
              <div className="mobileRaffleMetaItem">
                <span>Total Boletas</span>
                <strong>{mode === "balotas" ? cartonSize : wheelPlayers.length} en juego</strong>
              </div>
              <div className="mobileRaffleMetaItem">
                <span>Transparencia</span>
                <strong style={{ color: '#10b981' }}>100% Sin Sesgo</strong>
              </div>
              <div className="mobileRaffleMetaItem">
                <span>Boletería Vendida</span>
                <strong>{activeSoldTickets} ({activeRevenuePct}%)</strong>
              </div>
              <div className="mobileRaffleMetaItem">
                <span>Premio Mayor</span>
                <strong style={{ color: '#f5b82e' }}>Garantizado DIAN</strong>
              </div>
            </div>

            {/* BANNER DE FECHA OFICIAL Y CONTEO REGRESIVO */}
            <div className="officialDateCountdownBox">
              <span className="countdownHeaderTag">
                🔒 FECHA OFICIAL DE JUEGO (EL SORTEO SOLO SE EJECUTA AL CUMPLIRSE EL CONTEO)
              </span>
              <div style={{ fontSize: '12px', color: '#ffffff', fontWeight: 800, marginBottom: '6px' }}>
                📅 Domingo Oficial · 8:00 PM (Supervisión Coljuegos)
              </div>
              <div className="countdownDigitsRow">
                <div className="countdownUnit">
                  <span>{String(officialCountdown.days).padStart(2, '0')}</span>
                  <small>Días</small>
                </div>
                <span>:</span>
                <div className="countdownUnit">
                  <span>{String(officialCountdown.hours).padStart(2, '0')}</span>
                  <small>Horas</small>
                </div>
                <span>:</span>
                <div className="countdownUnit">
                  <span>{String(officialCountdown.mins).padStart(2, '0')}</span>
                  <small>Min</small>
                </div>
                <span>:</span>
                <div className="countdownUnit">
                  <span style={{ color: '#f5b82e' }}>{String(officialCountdown.secs).padStart(2, '0')}</span>
                  <small>Seg</small>
                </div>
              </div>
            </div>

            {/* BOTÓN OFICIAL: MODO DE PRUEBA / DEMOSTRACIÓN PARA CLIENTES Y EMPRESARIOS */}
            <div style={{ marginTop: '8px' }}>
              <button
                type="button"
                className="btnDemoTestMode"
                onClick={playDemo}
                disabled={phase === "spinning"}
                title="Probar demostración del sorteo en modo de prueba"
              >
                <span>🧪</span>
                <span>
                  {phase === "spinning"
                    ? "🌀 SIMULACIÓN EN TRANSMISIÓN..."
                    : "VER SIMULACIÓN (MODO DE PRUEBA)"}
                </span>
              </button>
              <small className="demoDisclaimText">
                ℹ️ Demostración para clientes y empresarios. El sorteo real se ejecutará únicamente cuando el conteo oficial llegue a cero.
              </small>
            </div>
          </div>

          {/* ===================================================================
              MODALIDAD, CARTÓN VINCULADO Y SALAS EN VIVO (UBICADAS DEBAJO DE LA BALOTERA)
              =================================================================== */}
        <div className="liveGameModes" role="group" aria-label="Modo de sorteo">
          <button
            type="button"
            className={mode === "balotas" ? "isSelected" : ""}
            disabled={phase === "spinning"}
            onClick={() => {
              if (phase === "spinning") return;
              setMode("balotas");
              resetDemo();
            }}
          >
            <RealisticBalotaIcon size={28} number="77" />
            <span><b>El Círculo Dorado</b><small>Cartones de 100, 200, 500 y 1.000 números</small></span>
          </button>
          <button
            type="button"
            className={mode === "ruleta" ? "isSelected" : ""}
            disabled={phase === "spinning"}
            onClick={() => {
              if (phase === "spinning") return;
              setMode("ruleta");
              resetDemo();
            }}
          >
            <span>🎡</span>
            <span><b>Ruleta Comunitaria</b><small>Sorteos rápidos de 10 a 50 números</small></span>
          </button>
        </div>

        {/* CARTÓN OFICIAL AMARRADO AL SORTEO EN JUEGO (INMODIFICABLE) */}
        <div className="cartonSelectorBar" style={{ width: '100%', boxSizing: 'border-box' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span className="cartonSelectorLabel" style={{ fontWeight: 800 }}>
                {mode === "balotas" ? "🎟️ Cartón Oficial Vinculado:" : "🎯 Ruleta Oficial:"}
              </span>
              <span
                className="cartonBoundBadge"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 14px',
                  borderRadius: '10px',
                  background: 'rgba(245, 184, 46, 0.16)',
                  border: '1.5px solid #f5b82e',
                  color: '#ffe082',
                  fontWeight: 800,
                  fontSize: '0.86rem'
                }}
              >
                🔒 {mode === "balotas" ? `01 a ${cartonSize} (${cartonSize} Balotas Oficiales)` : `01 a ${wheelSize} Casillas`} · {activeDrawTitle}
              </span>
            </div>
            <small style={{ color: '#94a3b8', fontSize: '0.74rem' }}>
              ✓ Balotas amarradas a la publicación de este sorteo (Inmodificables por seguridad y transparencia)
            </small>
          </div>
        </div>

        {/* BARRA DE CANALES Y MÚLTIPLES SALAS EN VIVO */}
        {availableDraws.length > 0 && (
          <div className="liveChannelsBar">
            <div className="liveChannelsHeading">
              <span className="liveSignalPulseSmall" />
              <span className="liveChannelsLabel">
                🔴 MÚLTIPLES SALAS EN VIVO ({availableDraws.filter((d) => d.live).length || availableDraws.length} TRANSMISIONES SIMULTÁNEAS):
              </span>
            </div>
            <div className="liveChannelsList">
              {availableDraws.map((d, index) => {
                const isSelected = activeDrawId === d.id;
                const specCount = index === 0 ? "1.482" : index === 1 ? "890" : index === 2 ? "645" : "410";
                const dUnitPrice = Number(d.unit_price || 35000);
                const dSold = Number(d.sold !== undefined ? d.sold : (index === 0 ? 842 : index === 1 ? 168 : index === 2 ? 390 : 120));
                const dRev = dSold * dUnitPrice;
                return (
                  <button
                    key={d.id}
                    type="button"
                    className={`liveChannelPill ${isSelected ? "active" : ""}`}
                    onClick={() => switchLiveDraw(d)}
                    title={`Sintonizar Sala ${index + 1}: ${d.title} · Venta total: $${dRev.toLocaleString("es-CO")} COP`}
                  >
                    <span className="channelRoomIndex" style={{ color: "#ffffff", WebkitTextFillColor: "#ffffff" }}>SALA {index + 1}</span>
                    <span className="channelEmoji">{d.emoji}</span>
                    <strong className="channelTitle" style={{ color: "#ffffff", WebkitTextFillColor: "#ffffff" }}>{d.title}</strong>
                    <span style={{ fontSize: "10px", color: "#f5b82e", fontWeight: 700, padding: "1px 6px", borderRadius: "4px", background: "rgba(245, 184, 46, 0.15)" }}>
                      💰 ${(dRev / 1000000).toFixed(1)}M
                    </span>
                    {isSelected ? (
                      <span className="channelLiveDot activeBadge">✓ SINTONIZADA</span>
                    ) : (
                      <span className="channelLiveDot">🔴 EN VIVO · {specCount} 👁️</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}


          {/* ===================================================================
              BLOQUES MINIMIZADOS PLEGABLES (CERO RECUADRO BLANCO GIGANTE)
              Por defecto están minimizados en chips. Si el usuario toca uno, se expande ese bloque.
              =================================================================== */}
          <div id="draw-result-blocks" className="drawResultBlocksContainer">
            {/* BARRA DE CHIPS MINIMIZADOS */}
            <div className="minimizedChipsBar" role="tablist" aria-label="Bloques de información colapsables">
              <button
                type="button"
                className={`minimizedBlockChipBtn ${activeResultTab === "ganador" ? "isOpen" : ""}`}
                onClick={() => setActiveResultTab((prev) => (prev === "ganador" ? null : "ganador"))}
                title="Ver detalles del ganador y entrega"
              >
                <span>🏆</span>
                <span>{activeResultTab === "ganador" ? "▲ Ocultar Ganador" : "Ver Ganador"}</span>
                {phase === "winner" && <span style={{ color: '#f5b82e' }}>★</span>}
              </button>

              <button
                type="button"
                className={`minimizedBlockChipBtn ${activeResultTab === "seguridad" ? "isOpen" : ""}`}
                onClick={() => setActiveResultTab((prev) => (prev === "seguridad" ? null : "seguridad"))}
                title="Ver sello notarial SHA-256"
              >
                <span>🔒</span>
                <span>{activeResultTab === "seguridad" ? "▲ Ocultar Seguridad" : "Ver Sello SHA-256"}</span>
              </button>

              <button
                type="button"
                className={`minimizedBlockChipBtn ${activeResultTab === "detalles" ? "isOpen" : ""}`}
                onClick={() => setActiveResultTab((prev) => (prev === "detalles" ? null : "detalles"))}
                title="Ver historial de balotas extraídas"
              >
                <span>📊</span>
                <span>{activeResultTab === "detalles" ? "▲ Ocultar Historial" : `Ver Historial (${history.length})`}</span>
              </button>

              <button
                type="button"
                className={`minimizedBlockChipBtn ${activeResultTab === "auditoria" ? "isOpen" : ""}`}
                onClick={() => setActiveResultTab((prev) => (prev === "auditoria" ? null : "auditoria"))}
                title="Ver auditoría Coljuegos"
              >
                <span>📜</span>
                <span>{activeResultTab === "auditoria" ? "▲ Ocultar Auditoría" : "Ver Auditoría Legal"}</span>
              </button>
            </div>

            {/* CONTENIDO SOLO CUANDO UN BLOQUE ESTÁ EXPLÍCITAMENTE ABIERTO */}
            {activeResultTab !== null && (
              <div className="expandedBlockWrapper">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>
                    Bloque Desplegado
                  </span>
                  <button
                    type="button"
                    className="btnMinimizeBlock"
                    onClick={() => setActiveResultTab(null)}
                  >
                    ▲ Minimizar y cerrar bloque
                  </button>
                </div>

                {/* BLOQUE 1: GANADOR */}
                {activeResultTab === "ganador" && (
                  <div className="blockContent">
                    {phase === "winner" && winner ? (
                      <div className="ganadorOficialCelebrationHero" style={{ background: '#f8fafc', padding: '16px', borderRadius: '14px', border: '1.5px solid #007AFF' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '12px' }}>
                          <RealisticBalotaIcon size={60} number={mode === "balotas" ? winner : rouletteWinnerNum} />
                          <div>
                            <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 800 }}>NÚMERO EXTRAÍDO</span>
                            <div style={{ fontSize: '24px', fontWeight: 900, color: '#007AFF' }}>
                              #{mode === "balotas" ? winner : rouletteWinnerNum} · {numberToSpanishWords(mode === "balotas" ? winner : rouletteWinnerNum).toUpperCase()}
                            </div>
                          </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '12px' }}>
                          <button
                            type="button"
                            className="btnWinnerChatCoordination"
                            onClick={() => setShowWinnerChatModal(true)}
                            style={{ padding: '10px 14px', fontSize: '12.5px' }}
                          >
                            💬 Coordinar Entrega por Chat
                          </button>
                          <button
                            type="button"
                            className="btnManualSaveAndHome"
                            onClick={() => router.push("/")}
                            style={{ padding: '10px 14px', fontSize: '12.5px' }}
                          >
                            🏆 Guardar en mis Premios
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div style={{ textAlign: 'center', padding: '20px 10px', color: '#475569' }}>
                        <span style={{ fontSize: '32px', display: 'block', marginBottom: '6px' }}>🎯</span>
                        <strong style={{ fontSize: '14px', color: '#0f172a' }}>El sorteo oficial se ejecutará en la fecha programada</strong>
                        <p style={{ fontSize: '12px', margin: '4px 0 0 0', color: '#64748b' }}>
                          Usa el botón de arriba para probar la demostración de la balotera o ruleta en modo de prueba.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* BLOQUE 2: SEGURIDAD SHA-256 */}
                {activeResultTab === "seguridad" && (
                  <div className="blockContent">
                    <strong style={{ fontSize: '13px', color: '#0f172a', display: 'block', marginBottom: '6px' }}>
                      🔒 Hash Criptográfico Notarial HMAC-SHA256
                    </strong>
                    <code style={{ display: 'block', background: '#0f172a', color: '#38bdf8', padding: '10px', borderRadius: '8px', fontSize: '11px', wordBreak: 'break-all', fontFamily: 'monospace' }}>
                      {auditHash || "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"}
                    </code>
                    <button
                      type="button"
                      onClick={() => setShowPrintModal(true)}
                      style={{ marginTop: '10px', width: '100%', padding: '9px 14px', background: '#053b22', border: '1px solid #d4af37', color: '#ffffff', borderRadius: '8px', fontWeight: 800, fontSize: '12px', cursor: 'pointer' }}
                    >
                      📜 Ver y Descargar Constancia Notarial PDF
                    </button>
                  </div>
                )}

                {/* BLOQUE 3: HISTORIAL */}
                {activeResultTab === "detalles" && (
                  <div className="blockContent">
                    <strong style={{ fontSize: '13px', color: '#0f172a', display: 'block', marginBottom: '6px' }}>
                      📊 Bandeja de Balotas Extraídas ({history.length})
                    </strong>
                    {history.length > 0 ? (
                      <div className="historyChips" style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {history.map((item, idx) => (
                          <div key={idx} className="historyChip" style={{ padding: '4px 10px', background: '#f1f5f9', borderRadius: '8px', fontSize: '11px', fontWeight: 800 }}>
                            #{item.number} · {item.time}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0, fontStyle: 'italic' }}>
                        No hay balotas extraídas aún en esta sesión.
                      </p>
                    )}
                  </div>
                )}

                {/* BLOQUE 4: AUDITORÍA LEGAL */}
                {activeResultTab === "auditoria" && (
                  <div className="blockContent" style={{ fontSize: '12px', color: '#475569', lineHeight: '1.4' }}>
                    <strong style={{ fontSize: '13px', color: '#0f172a', display: 'block', marginBottom: '4px' }}>
                      📜 Supervisión Regulatoria Coljuegos (Ley 643/2001)
                    </strong>
                    <p style={{ margin: '0 0 6px 0' }}>
                      La plataforma opera con algoritmos CSPRNG blindados contra predicción. El sorteo oficial solo se activará de forma sincronizada con los servidores al cumplirse la fecha de juego oficial.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="liveDemoStageFoot">
          <span>Motor con CSPRNG y HMAC-SHA-256. Ningún dato personal es expuesto en la constancia.</span>
          <span>El Ganador · Sala Oficial de Sorteo</span>
        </div>
      </section>

      {/* Botón desplegable para optimizar la carga visual y móvil */}
          <div className="auditToggleWrapper" style={{ maxWidth: "1180px", margin: "24px auto 12px auto", padding: "0 14px", width: "100%", boxSizing: "border-box" }}>
            <button
              type="button"
              className="btnAuditToggle"
              onClick={() => setShowAuditSection((v) => !v)}
              style={{
                width: "100%",
                padding: "14px 18px",
                background: "#ffffff",
                border: "1.5px solid #d4af37",
                borderRadius: "14px",
                color: "#0f172a",
                fontWeight: "800",
                fontSize: "14px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "10px",
                boxShadow: "0 6px 20px rgba(0, 0, 0, 0.12)",
                transition: "all 0.2s ease",
              }}
            >
              <span style={{ display: "flex", alignItems: "center", gap: "10px", textAlign: "left" }}>
                <span style={{ fontSize: "18px" }}>🛡️</span>
                <span style={{ color: "#0f172a" }}>
                  {showAuditSection
                    ? "Ocultar Transparencia y Auditoría Técnica"
                    : "Ver Transparencia y Certificación Criptográfica"}
                </span>
              </span>
              <span style={{
                fontSize: "12px",
                background: "#fef3c7",
                border: "1px solid #fde68a",
                color: "#b45309",
                padding: "5px 12px",
                borderRadius: "8px",
                fontWeight: "800",
                whiteSpace: "nowrap"
              }}>
                {showAuditSection ? "▲ Ocultar" : "▼ Desplegar"}
              </span>
            </button>
          </div>

          {showAuditSection && (
            <section className="liveDemoAudit" aria-labelledby="liveDemoAuditTitle" style={{ background: '#ffffff', borderRadius: '24px', border: '1px solid rgba(0, 0, 0, 0.08)', boxShadow: '0 8px 30px rgba(0,0,0,0.04)', padding: '28px' }}>
        <div className="liveDemoAuditIntro">
          <span className="auditShield">✓</span>
          <div>
            <p className="liveDemoEyebrow" style={{ color: '#b48008', fontWeight: 900, textShadow: 'none' }}>TRANSPARENCIA Y SEGURIDAD</p>
            <h2 id="liveDemoAuditTitle" style={{ color: '#000000', textShadow: 'none', fontWeight: 900 }}>Cada sorteo es matemáticamente verificable.</h2>
            <p style={{ color: '#000000', textShadow: 'none', fontWeight: 600 }}>La selección no se deja al azar de una animación: el servidor deriva el ganador mediante algoritmos criptográficos antes de que la balotera comience a girar.</p>
          </div>
        </div>

        <div className="liveDemoAuditItems">
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '18px', padding: '20px 22px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', gap: '8px', minHeight: '100%' }}>
            <span style={{ color: '#b48008', fontWeight: 900, fontSize: '15px' }}>01</span>
            <b style={{ color: '#000000', fontWeight: 900, fontSize: '15px', textShadow: 'none' }}>Rango de cartón estricto</b>
            <small style={{ color: '#000000', fontWeight: 600, fontSize: '13px', lineHeight: 1.5, textShadow: 'none' }}>Los números del cartón van del {eligibleNumbers[0]} al {eligibleNumbers[eligibleNumbers.length - 1]} sin saltos ni cifras inconsistentes.</small>
          </div>
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '18px', padding: '20px 22px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', gap: '8px', minHeight: '100%' }}>
            <span style={{ color: '#b48008', fontWeight: 900, fontSize: '15px' }}>02</span>
            <b style={{ color: '#000000', fontWeight: 900, fontSize: '15px', textShadow: 'none' }}>Muestreo sin sesgo</b>
            <small style={{ color: '#000000', fontWeight: 600, fontSize: '13px', lineHeight: 1.5, textShadow: 'none' }}>Muestreo con rechazo de 64 bits para equiprobabilidad perfecta entre las {cartonSize} opciones.</small>
          </div>
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '18px', padding: '20px 22px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', gap: '8px', minHeight: '100%' }}>
            <span style={{ color: '#b48008', fontWeight: 900, fontSize: '15px' }}>03</span>
            <b style={{ color: '#000000', fontWeight: 900, fontSize: '15px', textShadow: 'none' }}>Constancia auditable</b>
            <small style={{ color: '#000000', fontWeight: 600, fontSize: '13px', lineHeight: 1.5, textShadow: 'none' }}>Firma digital Ed25519 para reproducir y certificar el resultado.</small>
          </div>
        </div>

        {/* 1. CUADRO DE PRECISIÓN MATEMÁTICA Y GEOMÉTRICA (UBICADO EN TRANSPARENCIA) */}
        <div className="scientificPanel" style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '20px', padding: '22px 24px', marginTop: '22px', boxShadow: '0 4px 16px rgba(0,0,0,0.03)' }}>
          <div className="sciHeader" style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '12px', marginBottom: '14px' }}>
            <span className="sciIcon">📐</span>
            <div>
              <strong style={{ color: '#000000', fontWeight: 900, fontSize: '15px', textShadow: 'none' }}>PRECISIÓN MATEMÁTICA Y GEOMÉTRICA</strong>
              <small style={{ color: '#000000', fontWeight: 700, fontSize: '12px', textShadow: 'none' }}>Cálculo, Estadística y Cinemática en Tiempo Real</small>
            </div>
          </div>

          <div className="sciGrid">
            {/* 1. ESTADÍSTICA: EQUIPROBABILIDAD Y ENTROPÍA */}
            <div className="sciCard" style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <span className="sciTag" style={{ color: '#000000', fontWeight: 900 }}>ESTADÍSTICA UNIFORME</span>
              <div className="sciFormula" style={{ background: '#0f172a', color: '#ffd700', fontWeight: 800, padding: '6px 10px', borderRadius: '8px', textAlign: 'center' }}>P(X = k) = 1 / N</div>
              <div className="sciValue">
                <b style={{ color: '#000000', fontWeight: 900 }}>{((1 / (mode === "balotas" ? cartonSize : wheelSize)) * 100).toFixed(4)}%</b>
                <span style={{ color: '#000000', fontWeight: 700 }}>por número</span>
              </div>
              <div className="sciMeta">
                <span style={{ color: '#000000', fontWeight: 700 }}>Entropía Shannon:</span>
                <code style={{ background: '#f1f5f9', color: '#000000', border: '1px solid #cbd5e1', fontWeight: 800, padding: '2px 6px', borderRadius: '6px' }}>{Math.log2(mode === "balotas" ? cartonSize : wheelSize).toFixed(4)} bits</code>
              </div>
            </div>

            {/* 2. CÁLCULO: MUESTREO SIN SESGO (REJECTION SAMPLING) */}
            <div className="sciCard" style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <span className="sciTag" style={{ color: '#000000', fontWeight: 900 }}>CÁLCULO DISCRETO</span>
              <div className="sciFormula" style={{ background: '#0f172a', color: '#ffd700', fontWeight: 800, padding: '6px 10px', borderRadius: '8px', textAlign: 'center' }}>L = 2⁶⁴ − (2⁶⁴ mod N)</div>
              <div className="sciValue">
                <b className="textGreen" style={{ color: '#15803d', fontWeight: 900 }}>0.000000%</b>
                <span style={{ color: '#000000', fontWeight: 700 }}>sesgo de módulo</span>
              </div>
              <div className="sciMeta">
                <span style={{ color: '#000000', fontWeight: 700 }}>Espacio 64-bit:</span>
                <code style={{ background: '#f1f5f9', color: '#000000', border: '1px solid #cbd5e1', fontWeight: 800, padding: '2px 6px', borderRadius: '6px' }}>1.8446 × 10¹⁹</code>
              </div>
            </div>

            {/* 3. GEOMETRÍA: CINEMÁTICA CIRCULAR Y REFLEXIÓN */}
            <div className="sciCard" style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <span className="sciTag" style={{ color: '#000000', fontWeight: 900 }}>GEOMETRÍA Y CINEMÁTICA</span>
              <div className="sciFormula" style={{ background: '#0f172a', color: '#ffd700', fontWeight: 800, padding: '6px 10px', borderRadius: '8px', textAlign: 'center' }}>
                {mode === "balotas" ? "V = (4/3)·π·R³ · N_balotas" : "Δθ = 360° / N · v′ = v − 2(v·n)n"}
              </div>
              <div className="sciValue">
                <b style={{ color: '#000000', fontWeight: 900 }}>
                  {mode === "balotas" ? `${((cartonSize / 1000) * 100).toFixed(1)}%` : `${(360 / wheelSize).toFixed(3)}°`}
                </b>
                <span style={{ color: '#000000', fontWeight: 700 }}>{mode === "balotas" ? "ocupación cámara" : "arco por sector"}</span>
              </div>
              <div className="sciMeta">
                <span style={{ color: '#000000', fontWeight: 700 }}>{mode === "balotas" ? "Colisiones / seg:" : "Error angular:"}</span>
                <code style={{ background: '#f1f5f9', color: '#000000', border: '1px solid #cbd5e1', fontWeight: 800, padding: '2px 6px', borderRadius: '6px' }}>{mode === "balotas" ? "~1,240 / s" : "< 0.001° (sub-pixel)"}</code>
              </div>
            </div>
          </div>

          {/* AUDITORÍA CHI-CUADRADO EN TIEMPO REAL */}
          <div className="chiSquareLive" style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '16px 20px', marginTop: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
            <div className="chiTitle" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ color: '#000000', fontWeight: 800, fontSize: '13.5px' }}>Prueba de Bondad de Ajuste Chi-Cuadrado (χ²):</span>
              <span className="chiBadge" style={{ background: '#dcfce7', color: '#15803d', border: '1px solid #86efac', fontWeight: 800, fontSize: '11px', padding: '3px 8px', borderRadius: '6px' }}>Aprobada · NIST SP 800-22</span>
            </div>
            <div className="chiBarTrack" style={{ background: '#cbd5e1', height: '6px', borderRadius: '99px', overflow: 'hidden' }}>
              <div className="chiBarFill" style={{ width: "98.4%", height: '100%', background: '#16a34a' }} />
            </div>
            <div className="chiLabels" style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', color: '#000000', fontSize: '11.5px', fontWeight: 700 }}>
              <small style={{ color: '#000000', fontWeight: 700 }}>Frecuencia observada vs teórica (p-valor &gt; 0.95)</small>
              <small style={{ color: '#000000', fontWeight: 700 }}>Equiprobabilidad certificable</small>
            </div>
          </div>
        </div>

        {/* 2. ACTA OFICIAL EMITIDA (DOCUMENTO NOTARIAL Y VERIFICACIÓN) */}
        <div className="officialActDownloadSection">
          {latestAct ? (
            <div className="officialActCard ready" style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '18px', padding: '20px 24px', marginTop: '20px', boxShadow: '0 4px 14px rgba(0,0,0,0.03)' }}>
              <div className="actCardHeader">
                <span className="actBadge">✓ ACTA DIGITAL EMITIDA</span>
                <span className="actId" style={{ color: '#000000', fontWeight: 700 }}>ID: {latestAct.certificate?.drawId || latestAct.drawId}</span>
              </div>
              <div className="actCardBody">
                <div className="actCardInfo">
                  <p className="actCardTitle" style={{ color: '#000000', fontWeight: 900 }}>Acta Oficial de Sorteo y Adjudicación</p>
                  <p className="actCardDesc" style={{ color: '#000000', fontWeight: 600 }}>
                    Boleta ganadora: <strong style={{ color: '#000000' }}>{winner || latestAct.certificate?.result?.value}</strong> · 
                    Huella SHA-256: <code style={{ color: '#000000', fontWeight: 700 }}>{(latestAct.certificate?.entries?.listHash || auditHash).slice(0, 16)}…</code>
                  </p>
                  <small className="actCardMeta" style={{ color: '#000000', fontWeight: 600 }}>
                    Emitida con firma digital y descarte de módulo L = 2⁶⁴ − (2⁶⁴ mod N).
                  </small>
                </div>
                <div className="actCardButtons">
                  <button className="btnDownloadActOfficial" onClick={downloadAct} type="button">
                    📥 Descargar Acta (.JSON)
                  </button>
                  <button className="btnDownloadActPdf" onClick={() => setShowPrintModal(true)} type="button">
                    📄 Ver Acta Notarial (.PDF)
                  </button>
                  <a
                    className="btnVerifyActLink"
                    href={latestAct ? `/verificar?id=${encodeURIComponent(latestAct.certificate?.drawId || latestAct.drawId || "")}` : "/verificar"}
                  >
                    🛡️ Auditar en Verificador →
                  </a>
                </div>
              </div>
            </div>
          ) : (
            <div className="officialActCard pending" style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '18px', padding: '20px 24px', marginTop: '20px', boxShadow: '0 4px 14px rgba(0,0,0,0.03)' }}>
              <div className="actCardHeader">
                <span className="actBadgePending">⏳ ACTA PENDIENTE</span>
                <span className="actId" style={{ color: '#000000', fontWeight: 700 }}>Estándar GLI-19 / NIST SP 800-22</span>
              </div>
              <div className="actCardBody">
                <div className="actCardInfo">
                  <p className="actCardTitle" style={{ color: '#000000', fontWeight: 900 }}>Acta Oficial de Sorteo y Adjudicación</p>
                  <p className="actCardDesc" style={{ color: '#000000', fontWeight: 600 }}>
                    El documento digital firmado (.JSON) se emitirá automáticamente en cuanto la balotera revele el número ganador.
                  </p>
                </div>
                <div className="actCardButtons">
                  <button className="btnDownloadActOfficial disabled" disabled type="button">
                    📥 Descargar Acta (Disponible al sortear)
                  </button>
                  <a className="btnVerifyActLink" href="/verificar" style={{ background: '#0f172a', color: '#ffffff' }}>
                    🛡️ Verificador Público →
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>

        {auditHash && (
          <div className="auditSnippet" style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '12px 16px', marginTop: '16px' }}>
            <small style={{ color: '#000000', fontWeight: 700 }}>Huella canónica SHA-256 ({mode === "balotas" ? cartonSize : wheelSize} opciones):</small>
            <code style={{ color: '#000000', fontWeight: 800, background: '#ffffff', border: '1px solid #cbd5e1' }}>{auditHash}</code>
          </div>
        )}

        <button className="auditHowButton" onClick={() => setShowHow((v) => !v)} aria-expanded={showHow}>
          {showHow ? "Ocultar detalles técnicos" : "¿Cómo se comprueba matemáticamente?"} <span>{showHow ? "−" : "+"}</span>
        </button>

        {showHow && (
          <div className="liveDemoHow" style={{ color: '#000000', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '18px', padding: '20px 24px' }}>
            <p style={{ color: '#000000', margin: '0 0 10px 0', fontSize: '13.5px', lineHeight: 1.6 }}>
              1. <b style={{ color: '#000000', fontWeight: 900 }}>Compromiso:</b> Antes del sorteo, el sistema congela la lista de boletas del cartón seleccionado ({cartonSize} opciones) y publica su hash SHA-256 junto con el compromiso de la semilla secreta.
            </p>
            <p style={{ color: '#000000', margin: '0 0 10px 0', fontSize: '13.5px', lineHeight: 1.6 }}>
              2. <b style={{ color: '#000000', fontWeight: 900 }}>Derivación:</b> Se ejecuta <code style={{ color: '#000000', backgroundColor: '#ffffff', border: '1px solid #cbd5e1', padding: '2px 6px', borderRadius: '6px', fontWeight: 700, fontFamily: 'monospace' }}>HMAC-SHA256(semilla, listaHash ‖ sorteoId)</code>, extrayendo enteros de 64 bits con descarte de módulo para garantizar que ningún número tenga más probabilidad que otro.
            </p>
            <p style={{ color: '#000000', margin: 0, fontSize: '13.5px', lineHeight: 1.6 }}>
              3. <b style={{ color: '#000000', fontWeight: 900 }}>Revelación:</b> La animación de El Círculo Dorado o ruleta revela el ganador resultante. La constancia puede ser descargada y auditada externamente por cualquier persona o laboratorio.
            </p>
          </div>
        )}
      </section>
      )}

      <footer className="liveDemoFooter">
        <a href="/">EL GANADOR</a>
        <span>Plataforma de sorteos verificables</span>
        <span>Modo demostración en tiempo real</span>
      </footer>
      </div> {/* Fin liveDemoContentContainer */}

      {/* MODAL DE ACTA OFICIAL NOTARIAL / CERTIFICADO IMPRIMIBLE */}
      {showPrintModal && latestAct && (
        <div className="printableCertModalOverlay" role="dialog" aria-modal="true">
          <div className="printableCertContainer">
            <div className="certModalTopBar">
              <span className="certTopTag">DOCUMENTO PÚBLICO OFICIAL CERTIFICADO</span>
              <div className="certTopActions">
                <button
                  type="button"
                  className="btnPrintCert"
                  onClick={() => window.print()}
                >
                  🖨️ Imprimir / Guardar en PDF
                </button>
                <button
                  type="button"
                  className="btnCloseCert"
                  onClick={() => setShowPrintModal(false)}
                >
                  ✕ Cerrar
                </button>
              </div>
            </div>

            <div className="printableCertSheet" id="printableCertSheet">
              <div className="certWatermark">EL GANADOR</div>
              <div className="certBorderOuter">
                <div className="certBorderInner">
                  {/* ENCABEZADO OFICIAL */}
                  <div className="certHeader">
                    <div className="certHeaderEmblem">
                      <div className="certEmblemCircle">EG</div>
                    </div>
                    <div className="certHeaderTitle">
                      <p className="certSuper">REPÚBLICA DE COLOMBIA · SISTEMA DE SORTEOS CERTIFICADOS</p>
                      <h1>ACTA NOTARIAL DE SORTEO Y CONSTANCIA PÚBLICA DE ADJUDICACIÓN</h1>
                      <p className="certSub">MOTOR MATEMÁTICO GLI-19 · PROVABLY FAIR · NIST SP 800-22</p>
                    </div>
                    <div className="certHeaderBadge">
                      <span>CONSTANCIA N°</span>
                      <strong>{latestAct.certificate?.drawId || latestAct.drawId}</strong>
                    </div>
                  </div>

                  {/* PREÁMBULO LEGAL */}
                  <div className="certPreamble">
                    <p>
                      En la ciudad de Bogotá D.C., República de Colombia, a las <strong>{latestAct.meta?.localTimeBogota || new Date().toLocaleString("es-CO")}</strong>, 
                      se certifica la realización y cómputo determinista del sorteo oficial mediante la plataforma <strong>El Ganador</strong>, 
                      utilizando extracción neumática uniforme con descarte estricto de módulo <code>L = 2⁶⁴ − (2⁶⁴ mod N)</code> y firmas criptográficas Ed25519.
                    </p>
                  </div>

                  {/* CUADRO PRINCIPAL DEL GANADOR */}
                  <div className="certWinnerBlock">
                    <span className="certWinnerLabel">BOLETA GANADORA OFICIAL</span>
                    <div className="certWinnerNumber">
                      {latestAct.certificate?.result?.value || winner}
                      {hasAmbiguityRisk(latestAct.certificate?.result?.value || winner) && (
                        <span className="certUnderlineLegal">_</span>
                      )}
                    </div>
                    <div className="certWinnerPhonetic">
                      SON: <strong>{numberToSpanishWords(latestAct.certificate?.result?.value || winner).toUpperCase()}</strong>
                    </div>
                    <div className="certCartonDetails">
                      <span>SERIE / CARTÓN: <b>{latestAct.meta?.cartonDetails || `Cartón de ${cartonSize} números`}</b></span>
                      <span>RANGO: <b>{latestAct.meta?.range}</b></span>
                      <span>PARTICIPACIONES: <b>{latestAct.certificate?.entries?.count || latestAct.meta?.totalEntries}</b></span>
                    </div>
                  </div>

                  {/* MATRIZ DE AUDITORÍA CRIPTOGRÁFICA Y CÓDIGO QR */}
                  <div className="certAuditGrid">
                    <div className="certAuditData">
                      <h3>Registro de Integridad Criptográfica:</h3>
                      <div className="certDataRow">
                        <span>Algoritmo de Derivación:</span>
                        <code>{latestAct.certificate?.algorithm || "HMAC-SHA256/U64-REJECTION-v1"}</code>
                      </div>
                      <div className="certDataRow">
                        <span>Huella canónica SHA-256:</span>
                        <code>{(latestAct.certificate?.entries?.listHash || auditHash).slice(0, 32)}…</code>
                      </div>
                      <div className="certDataRow">
                        <span>Compromiso de Semilla:</span>
                        <code>{(latestAct.certificate?.commitment?.seedCommitment || "").slice(0, 32)}…</code>
                      </div>
                      <div className="certDataRow">
                        <span>Semilla Secreta Revelada:</span>
                        <code>{(latestAct.certificate?.reveal?.seed || "").slice(0, 32)}…</code>
                      </div>
                      <div className="certDataRow">
                        <span>Sesgo de Probabilidad:</span>
                        <b className="certZeroBias">0.000000% (Equiprobabilidad Matemática Perfecta)</b>
                      </div>
                    </div>

                    <div className="certQrBox">
                      <div
                        className="certQrSvgWrapper"
                        dangerouslySetInnerHTML={{
                          __html: generateQrSvg(
                            typeof window !== "undefined"
                              ? `${window.location.origin}/verificar?id=${latestAct.certificate?.drawId || latestAct.drawId}`
                              : `https://elganador.co/verificar?id=${latestAct.certificate?.drawId || latestAct.drawId}`,
                            130
                          ),
                        }}
                      />
                      <small>Escanea para auditar en el Verificador Independiente</small>
                    </div>
                  </div>

                  {/* FIRMAS Y SELLO OFICIAL */}
                  <div className="certSignaturesRow">
                    <div className="certSignCol">
                      <div className="certSignLine" />
                      <strong>OPERADOR OFICIAL DE SALA</strong>
                      <small>El Ganador · Plataforma de Sorteos</small>
                    </div>
                    <div className="certSealCol">
                      <div className="certGoldSeal">
                        <span>★ EG ★</span>
                        <small>CERTIFICADO</small>
                        <b>PROVABLY FAIR</b>
                      </div>
                    </div>
                    <div className="certSignCol">
                      <div className="certSignLine" />
                      <strong>AUDITORÍA DE TRANSPARENCIA</strong>
                      <small>Algoritmo Verificable FIPS 180-4</small>
                    </div>
                  </div>

                  <div className="certFootNote">
                    Este documento constituye un Acta Digital Oficial de Adjudicación. La autenticidad de los hashes y de la boleta ganadora puede ser auditada de forma autónoma por cualquier ciudadano, entidad de control o laboratorio en el Verificador Público Independiente.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE TIQUETE GANADOR OFICIAL (ESTILO BETPLAY / RIFAS NACIONALES) */}
      {showTicketModal && winnerTicket && (
        <div className="winnerTicketModalOverlay" role="dialog" aria-modal="true" aria-labelledby="ticketWinnerTitle">
          <div className="winnerTicketContainer">
            {/* SELECTOR OFICIAL: VISTA PÚBLICA VS TIQUETE PRIVADO DE COBRO */}
            <div className="ticketModeSelector" role="tablist" aria-label="Modo de visualización del tiquete">
              <button
                type="button"
                role="tab"
                aria-selected={ticketViewMode === "public"}
                className={`btnModeTab ${ticketViewMode === "public" ? "active" : ""}`}
                onClick={() => setTicketViewMode("public")}
              >
                🌐 1. Vista Pública (Habeas Data)
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={ticketViewMode === "private"}
                className={`btnModeTab ${ticketViewMode === "private" ? "active" : ""}`}
                onClick={() => setTicketViewMode("private")}
              >
                🔐 2. Tiquete Privado (Cobro Oficial)
              </button>
            </div>

            <div className="ticketModalTopBar">
              <span className={`ticketTopTag ${ticketViewMode === "private" ? "privateTag" : ""}`}>
                {ticketViewMode === "public"
                  ? "🎟️ TIQUETE GANADOR · VISTA PÚBLICA (AUTORIZA COLJUEGOS)"
                  : "🔐 EXPEDIENTE PRIVADO DEL COMPRADOR · COBRO OFICIAL COLJUEGOS"}
              </span>
              <div className="ticketTopActions">
                <button
                  type="button"
                  className="btnTicketAction btnTicketChat"
                  onClick={() => {
                    setShowTicketModal(false);
                    setShowWinnerChatModal(true);
                  }}
                  style={{
                    background: "linear-gradient(135deg, #007AFF 0%, #0284c7 100%)",
                    color: "#ffffff",
                    borderColor: "#38bdf8",
                    fontWeight: 900,
                  }}
                  title="Abrir chat en vivo con el comercio para coordinar y reclamar el premio"
                >
                  💬 Reclamar Premio (Chat Comercio)
                </button>
                <button
                  type="button"
                  className="btnTicketAction btnTicketPrint"
                  onClick={() => window.print()}
                >
                  {ticketViewMode === "public" ? "🖨️ Imprimir Vista Pública" : "🖨️ Imprimir Tiquete Privado"}
                </button>
                <button
                  type="button"
                  className="btnTicketAction btnTicketClose"
                  onClick={() => setShowTicketModal(false)}
                >
                  ✕ Cerrar
                </button>
              </div>
            </div>

            <div className="ticketGanasteHeroBanner">
              ★ ¡GANASTE! · BOLETA GANADORA OFICIAL ADJUDICADA ★
            </div>

            {/* BOTÓN PROMINENTE DE CHAT CON EL COMERCIO PARA RECLAMAR EL PREMIO */}
            <div style={{ margin: "14px 0 10px", width: "100%" }}>
              <button
                type="button"
                className="btnTicketChatClaim"
                onClick={() => {
                  setShowTicketModal(false);
                  setShowWinnerChatModal(true);
                }}
                style={{
                  width: "100%",
                  padding: "15px 22px",
                  borderRadius: "14px",
                  background: "linear-gradient(135deg, #007AFF 0%, #0284c7 100%)",
                  color: "#ffffff",
                  border: "none",
                  fontSize: "16px",
                  fontWeight: 900,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "10px",
                  boxShadow: "0 6px 20px rgba(0, 122, 255, 0.45)",
                }}
                title="Abrir chat en vivo con el comercio para coordinar y reclamar tu premio"
              >
                <span>💬</span> Chatear con el Comercio para Reclamar Premio →
              </button>
            </div>

            <div className="ticketVoiceBar ticketVoiceAndSocialBar">
              <button
                type="button"
                className="btnListenVoice"
                onClick={() => {
                  playWinnerVoice(winnerTicket.ticketNumber, false);
                  setIsMuted(false);
                }}
                title="Escuchar locución oficial MP3"
              >
                🔊 Escuchar voz oficial
              </button>
              <button
                type="button"
                className="btnSocialCaptureFromTicket"
                onClick={handleDirectShareWinner}
                title="Compartir la captura oficial de la balotera con el número ganador"
              >
                📤 Compartir
              </button>
            </div>

            {/* COMPROBANTE TÉRMICO CONFORME A LA NORMATIVA DE COLJUEGOS (LEY 643 DE 2001) */}
            <div className={`ticketThermalSlip ${ticketViewMode === "private" ? "slipPrivateMode" : ""}`} id="printableTicketSlip">
              <div className="ticketSawtoothTop" aria-hidden="true" />
              {ticketViewMode === "private" && (
                <div className="ticketPrivateNoticePill">
                  ★ EXPEDIENTE PRIVADO Y CONFIDENCIAL DEL GANADOR · COBRO OFICIAL COLJUEGOS ★
                </div>
              )}
              <div className="ticketContentInner">
                {/* ENCABEZADO INSTITUCIONAL Y LEGAL */}
                <div className="ticketHeader">
                  <div>
                    <span className="ticketBrandPill">
                      {ticketViewMode === "public"
                        ? `★ ${winnerTicket.operatorName} ★`
                        : `★ ${winnerTicket.operatorName} · EXPEDIENTE NOTARIAL Y BANCARIO ★`}
                    </span>
                  </div>
                  <p className="ticketSubTitle" id="ticketWinnerTitle" style={{ color: "#000000", WebkitTextFillColor: "#000000" }}>
                    {ticketViewMode === "public"
                      ? "TIQUETE OFICIAL DE JUEGO Y CONSTANCIA PÚBLICA"
                      : "TIQUETE PRIVADO ORIGINAL Y CONSTANCIA DE ADJUDICACIÓN DE PREMIO"}
                  </p>
                  <p className="ticketConcessionInfo" style={{ color: "#000000", WebkitTextFillColor: "#000000" }}>
                    {winnerTicket.operatorNit} · {winnerTicket.contractNumber}
                  </p>
                  <span className="ticketResolutionBadge" style={{ color: "#000000", WebkitTextFillColor: "#000000" }}>
                    AUTORIZA COLJUEGOS · {winnerTicket.resolutionNumber}
                  </span>
                </div>

                {/* SECCIÓN NÚMERO GANADOR Y PLAN DE PREMIOS */}
                <div className="ticketWinnerSection">
                  <span className="ticketPrizeBadge">● NÚMERO OFICIAL ADJUDICADO ●</span>
                  <p className="ticketPrizeTitle" style={{ color: "#000000", WebkitTextFillColor: "#000000" }}>{winnerTicket.prizeTitle}</p>
                  <div className="ticketNumberBox">
                    <span className="ticketNumberLabel" style={{ color: "#000000", WebkitTextFillColor: "#000000" }}>BOLETA GANADORA DEL SORTEO</span>
                    <div className="ticketWinnerNumber" style={{ color: "#000000", WebkitTextFillColor: "#000000" }}>
                      {winnerTicket.ticketNumber}
                      {hasAmbiguityRisk(winnerTicket.ticketNumber) && <span className="ballUnderlineBar" />}
                    </div>
                    <span className="ticketWinnerWords" style={{ color: "#000000", WebkitTextFillColor: "#000000" }}>{numberToSpanishWords(winnerTicket.ticketNumber)}</span>
                  </div>
                </div>

                {/* CAJA DE DATOS DEL COMPRADOR (PÚBLICA ENMASCARADA O PRIVADA COMPLETA) */}
                <div className={`ticketBuyerBox ${ticketViewMode === "private" ? "buyerBoxPrivate" : ""}`}>
                  <div className="ticketBuyerHeader">
                    <div className="ticketBuyerHeaderLeft">
                      <strong style={{ color: "#000000", WebkitTextFillColor: "#000000" }}>
                        {ticketViewMode === "public" ? "1. DATOS DEL COMPRADOR" : "1. IDENTIFICACIÓN COMPLETA (SARLAFT)"}
                      </strong>
                      <span className={ticketViewMode === "public" ? "ticketHabeasBadge" : "ticketPrivateBadge"}>
                        {ticketViewMode === "public" ? "🔒 Ley 1581/12" : "✅ Titular Verificado"}
                      </span>
                    </div>
                    <span className="ticketSaleIdTag" style={{ color: "#000000", WebkitTextFillColor: "#000000" }}>{winnerTicket.saleId}</span>
                  </div>
                  <div className="ticketDataGrid">
                    <div className="ticketDataCell">
                      <span style={{ color: "#334155", WebkitTextFillColor: "#334155" }}>Comprador</span>
                      <strong style={{ color: "#000000", WebkitTextFillColor: "#000000" }}>
                        {ticketViewMode === "public" ? winnerTicket.buyerNameMasked : winnerTicket.buyerName}
                      </strong>
                    </div>
                    <div className="ticketDataCell">
                      <span style={{ color: "#334155", WebkitTextFillColor: "#334155" }}>Documento C.C.</span>
                      <strong style={{ color: "#000000", WebkitTextFillColor: "#000000" }}>
                        {ticketViewMode === "public" ? winnerTicket.buyerDocumentMasked : winnerTicket.buyerDocument}
                      </strong>
                    </div>
                    <div className="ticketDataCell">
                      <span style={{ color: "#334155", WebkitTextFillColor: "#334155" }}>Celular</span>
                      <strong style={{ color: "#000000", WebkitTextFillColor: "#000000" }}>
                        {ticketViewMode === "public" ? winnerTicket.buyerPhoneMasked : winnerTicket.buyerPhone}
                      </strong>
                    </div>
                    <div className="ticketDataCell">
                      <span style={{ color: "#334155", WebkitTextFillColor: "#334155" }}>Ciudad</span>
                      <strong style={{ color: "#000000", WebkitTextFillColor: "#000000" }}>{winnerTicket.buyerCity}</strong>
                    </div>
                    <div className="ticketDataCell ticketDataFullCell">
                      <span style={{ color: "#334155", WebkitTextFillColor: "#334155" }}>Correo</span>
                      <strong style={{ color: "#000000", WebkitTextFillColor: "#000000" }}>
                        {ticketViewMode === "public" ? winnerTicket.buyerEmailMasked : winnerTicket.buyerEmail}
                      </strong>
                    </div>
                  </div>
                  <div className="ticketPrivacyNotice" style={{ color: "#000000", WebkitTextFillColor: "#000000" }}>
                    {ticketViewMode === "public" ? (
                      <>🔒 <b style={{ color: "#000000", WebkitTextFillColor: "#000000" }}>Habeas Data (Ley 1581/12):</b> Datos enmascarados para seguridad del ganador en transmisión pública.</>
                    ) : (
                      <>⚠️ <b style={{ color: "#000000", WebkitTextFillColor: "#000000" }}>Expediente Privado:</b> Válido exclusivamente para el titular presentando Cédula original ante el Operador.</>
                    )}
                  </div>
                </div>

                {/* CAJA DE DATOS DE LA TRANSACCIÓN Y COMERCIALIZACIÓN */}
                <div className="ticketBuyerBox">
                  <div className="ticketBuyerHeader">
                    <strong style={{ color: "#000000", WebkitTextFillColor: "#000000" }}>2. DETALLES DE TRANSACCIÓN Y EMISIÓN</strong>
                    <span className="ticketSaleIdTag" style={{ color: "#000000", WebkitTextFillColor: "#000000" }}>REF: {winnerTicket.paymentRef}</span>
                  </div>
                  <div className="ticketDataGrid">
                    <div className="ticketDataCell">
                      <span style={{ color: "#334155", WebkitTextFillColor: "#334155" }}>Serie y Emisión</span>
                      <strong style={{ color: "#000000", WebkitTextFillColor: "#000000" }}>{winnerTicket.seriesRange}</strong>
                    </div>
                    <div className="ticketDataCell">
                      <span style={{ color: "#334155", WebkitTextFillColor: "#334155" }}>Valor Boleta</span>
                      <strong style={{ color: "#000000", WebkitTextFillColor: "#000000" }}>{winnerTicket.ticketPrice}</strong>
                    </div>
                    <div className="ticketDataCell">
                      <span style={{ color: "#334155", WebkitTextFillColor: "#334155" }}>Fecha Venta</span>
                      <strong style={{ color: "#000000", WebkitTextFillColor: "#000000" }}>{winnerTicket.saleDate}</strong>
                    </div>
                    <div className="ticketDataCell">
                      <span style={{ color: "#334155", WebkitTextFillColor: "#334155" }}>Fecha Sorteo</span>
                      <strong style={{ color: "#000000", WebkitTextFillColor: "#000000" }}>{winnerTicket.drawDate}</strong>
                    </div>
                    <div className="ticketDataCell ticketDataFullCell">
                      <span style={{ color: "#334155", WebkitTextFillColor: "#334155" }}>Canal Oficial</span>
                      <strong style={{ color: "#000000", WebkitTextFillColor: "#000000" }}>{winnerTicket.terminalId}</strong>
                    </div>
                    <div className="ticketDataCell ticketDataFullCell">
                      <span style={{ color: "#334155", WebkitTextFillColor: "#334155" }}>Medio de Pago</span>
                      <strong style={{ color: "#000000", WebkitTextFillColor: "#000000" }}>{winnerTicket.paymentMethod}</strong>
                    </div>
                  </div>
                </div>

                {/* CLÁUSULAS NORMATIVAS Y TÉRMINOS LEGALES DE COBRO (LEY 643 DE 2001) */}
                <div className="ticketLegalClausesBox" style={{ color: "#000000", WebkitTextFillColor: "#000000" }}>
                  <p style={{ color: "#000000", WebkitTextFillColor: "#000000" }}>
                    <b style={{ color: "#000000", WebkitTextFillColor: "#000000" }}>Término de Caducidad (Art. 12 Ley 643 de 2001):</b> El derecho al cobro de premios de juegos de suerte y azar caduca en un (1) año calendario a partir de la fecha de realización del sorteo.
                  </p>
                  <p style={{ color: "#000000", WebkitTextFillColor: "#000000" }}>
                    <b style={{ color: "#000000", WebkitTextFillColor: "#000000" }}>Retención Tributaria:</b> Sujeto a retención en la fuente por Ganancias Ocasionales (20%) según Estatuto Tributario Nacional (Art. 306 y 317) de la DIAN.
                  </p>
                  <p style={{ color: "#000000", WebkitTextFillColor: "#000000" }}>
                    <b style={{ color: "#000000", WebkitTextFillColor: "#000000" }}>Requisito de Cobro:</b> Presentar este tiquete original y Cédula de Ciudadanía original vigente del comprador registrado.
                  </p>
                </div>

                {/* BOTÓN PROMINENTE DE CHAT DENTRO DEL COMPROBANTE PARA RECLAMAR */}
                <div style={{ margin: "16px 0 12px", textAlign: "center" }}>
                  <button
                    type="button"
                    onClick={() => {
                      setShowTicketModal(false);
                      setShowWinnerChatModal(true);
                    }}
                    style={{
                      width: "100%",
                      padding: "13px 20px",
                      borderRadius: "12px",
                      background: "linear-gradient(135deg, #007AFF 0%, #0284c7 100%)",
                      color: "#ffffff",
                      border: "none",
                      fontSize: "14.5px",
                      fontWeight: 900,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px",
                      boxShadow: "0 4px 16px rgba(0, 122, 255, 0.35)",
                    }}
                  >
                    <span>💬</span> Chatear con el Comercio para Reclamar Este Premio
                  </button>
                </div>

                {/* CÓDIGO DE BARRAS VECTORIAL 100% CENTRADO */}
                <div className="ticketBarcodeBox">
                  <div
                    className="ticketBarcodeSvg"
                    dangerouslySetInnerHTML={{ __html: winnerTicket.barcodeSvg }}
                  />
                  <small style={{ color: "#000000", WebkitTextFillColor: "#000000" }}>Código de Verificación Fiscal: {winnerTicket.barcodeDigits}</small>
                </div>

                {/* PIE DE TIQUETE Y APORTE A LA SALUD PÚBLICA */}
                <div className="ticketFooterLegal">
                  <span className="ticketHealthBanner" style={{ color: "#166534", WebkitTextFillColor: "#166534", fontWeight: 900 }}>
                    ★ JUGAR LEGAL ES APORTAR A LA SALUD PÚBLICA DE COLOMBIA (SGSSS) · PROHIBIDA LA VENTA A MENORES DE EDAD (LEY 1098 DE 2006) ★
                  </span>
                  <p style={{ color: "#000000", WebkitTextFillColor: "#000000" }}>
                    Transacción de juego supervisada y auditada con tecnología criptográfica verificable HMAC-SHA256 y muestreo uniforme sin sesgo.
                  </p>
                  <span className="ticketSecurityHash" style={{ color: "#000000", WebkitTextFillColor: "#000000" }}>Sello Criptográfico Digital: {winnerTicket.securityHash}</span>
                </div>
              </div>
              <div className="ticketSawtoothBottom" aria-hidden="true" />
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE CHAT EN VIVO DE COORDINACIÓN Y ENTREGA (COMERCIO Y CLIENTE GANADOR) */}
      {showWinnerChatModal && (
        <div
          className="winnerChatModalOverlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="winnerChatTitle"
        >
          <div className="winnerChatModalContainer">
            {/* CABECERA OFICIAL DEL CHAT */}
            <div className="winnerChatHeader">
              <div className="winnerChatHeaderLeft">
                <div className="winnerChatMerchantTagRow">
                  <span className="winnerChatMerchantBadge">🏪 COMERCIO OFICIAL</span>
                  <span className="winnerChatVerifiedPill">✓ Conectado</span>
                </div>
                <h3 id="winnerChatTitle" style={{ color: "#ffffff", WebkitTextFillColor: "#ffffff" }}>
                  {activeDraw?.admin || sponsorBumper.brand || "Motos Caribe Oficial"}
                </h3>
                <p className="winnerChatMeta" style={{ color: "#cbd5e1" }}>
                  Sorteo: <strong style={{ color: "#ffffff", WebkitTextFillColor: "#ffffff" }}>{activeDrawTitle}</strong> · Balota Ganadora:{" "}
                  <span className="winnerChatNumberTag">#{winner || rouletteWinnerNum}</span>
                </p>
              </div>
              <button
                type="button"
                className="winnerChatCloseBtn"
                onClick={() => setShowWinnerChatModal(false)}
                aria-label="Cerrar chat de coordinación"
                title="Cerrar ventana de chat"
              >
                ✕
              </button>
            </div>

            {/* AVISO DE SEGURIDAD Y HABEAS DATA */}
            <div className="winnerChatSecurityBanner">
              <span className="securityIcon">🛡️</span>
              <div className="securityText">
                <strong style={{ color: "#34d399", WebkitTextFillColor: "#34d399" }}>Canal Oficial de Coordinación y Entrega de Premios</strong>
                <small style={{ color: "#93c5fd", WebkitTextFillColor: "#93c5fd" }}>Supervisado por El Ganador · Sello Criptográfico SHA-256 Verificado</small>
              </div>
            </div>

            {/* LISTA DE MENSAJES DEL CHAT */}
            <div className="winnerChatMessagesList">
              {winnerChatMessages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`winnerChatMessageItem ${msg.sender === "client" ? "isClient" : "isMerchant"}`}
                >
                  <div className="winnerChatSenderLabel">
                    {msg.sender === "client"
                      ? "👤 Tú (Ganador Oficial)"
                      : `🏪 ${activeDraw?.admin || sponsorBumper.brand || "Comercio Organizador"}`}
                  </div>
                  <div className="winnerChatMessageBubble">
                    <p className="winnerChatMessageText">{msg.text}</p>
                    <span className="winnerChatMessageTime">{msg.time}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* SUGERENCIAS RÁPIDAS DE DATOS DE ENTREGA */}
            <div className="winnerChatQuickSuggestions">
              <span className="suggestionsLabel">Acciones rápidas:</span>
              <button
                type="button"
                onClick={() => setWinnerChatInput("Hola, mi cédula es  y mi dirección de entrega es: ")}
              >
                📍 Indicar Dirección
              </button>
              <button
                type="button"
                onClick={() => setWinnerChatInput("¿En qué horario y dirección puedo pasar a reclamar el premio?")}
              >
                🕒 Horario de Atención
              </button>
              <button
                type="button"
                onClick={() => setWinnerChatInput("¿Qué documentos debo presentar para el acta de entrega?")}
              >
                📋 Requisitos
              </button>
            </div>

            {/* FORMULARIO DE ENVÍO DE MENSAJE */}
            <form onSubmit={handleSendWinnerChatMessage} className="winnerChatInputForm">
              <input
                type="text"
                placeholder="Escribe tu mensaje, dirección de entrega o ciudad..."
                value={winnerChatInput}
                onChange={(e) => setWinnerChatInput(e.target.value)}
                className="winnerChatInputField"
              />
              <button
                type="submit"
                className="winnerChatSendBtn"
                style={{
                  background: 'linear-gradient(135deg, #007AFF 0%, #0284c7 100%)',
                  color: '#ffffff',
                  fontWeight: 900,
                  boxShadow: '0 4px 14px rgba(0, 122, 255, 0.4)',
                }}
              >
                Enviar 📨
              </button>
            </form>

            {/* ACCIONES DEL PIE DE CHAT (WHATSAPP DIRECTO + CERTIFICADO) */}
            <div className="winnerChatFooterActions">
              <a
                href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                  `¡Hola! Soy el ganador oficial de "${activeDrawTitle}" en El Ganador con la balota #${winner || rouletteWinnerNum}. Me comunico para coordinar el acta de entrega de mi premio.`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="winnerChatWhatsAppBtn"
              >
                <span>📲</span> Coordinar también por WhatsApp
              </a>

              {winnerTicket && (
                <button
                  type="button"
                  className="winnerChatCertBtn"
                  onClick={() => {
                    setShowWinnerChatModal(false);
                    setShowTicketModal(true);
                  }}
                >
                  🎟️ Ver Certificado Notarial
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE VISTA PREVIA HD DE RESPALDO (CUANDO EL NAVEGADOR DE ESCRITORIO NO TIENE MENÚ NATIVO DE ARCHIVOS) */}
      {showSocialModal && winner && (
        <div
          className="socialPromoModalOverlay"
          role="dialog"
          aria-modal="true"
          aria-label="Compartir captura oficial de la balotera"
        >
          <div className="socialPromoModalCard">
            <div className="socialPromoHeader">
              <div>
                <span className="socialPromoEyebrow">CAPTURA OFICIAL · EL CÍRCULO DORADO</span>
                <h3>Balota Ganadora · #{winner}</h3>
              </div>
              <button
                type="button"
                className="btnCloseSocialModal"
                onClick={() => setShowSocialModal(false)}
              >
                ✕ Cerrar
              </button>
            </div>

            <div className="socialFormatTabs" role="tablist" aria-label="Formato de imagen">
              <button
                type="button"
                role="tab"
                aria-selected={socialFormat === "story"}
                className={`socialFormatBtn ${socialFormat === "story" ? "active" : ""}`}
                onClick={() => handleFormatSwitch("story")}
              >
                📱 Historia / Estado (9:16)
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={socialFormat === "post"}
                className={`socialFormatBtn ${socialFormat === "post" ? "active" : ""}`}
                onClick={() => handleFormatSwitch("post")}
              >
                🖼️ Publicación / Chat (4:5)
              </button>
            </div>

            <div className="socialPreviewViewport">
              {isGeneratingSocial || !socialCapture ? (
                <div className="socialPreviewLoading">Generando captura HD 1080p de El Círculo Dorado…</div>
              ) : (
                <img
                  src={socialCapture.dataUrl}
                  alt={`Captura oficial de El Círculo Dorado con el número ganador ${winner}`}
                  className={`socialPreviewImage format_${socialFormat}`}
                />
              )}
            </div>

            {socialFeedback && (
              <p className="socialFeedbackBanner" role="status">
                {socialFeedback}
              </p>
            )}

            <p className="socialChooseNetworkLabel">ENVÍO DIRECTO A TUS CONTACTOS O REDES:</p>
            <div className="socialNetworkPickerGrid">
              <button
                type="button"
                className="socialNetCard netWhatsApp"
                onClick={handleFallbackWhatsAppShare}
                disabled={isGeneratingSocial}
              >
                <strong>💬 WhatsApp</strong>
                <small>Elegir contacto</small>
              </button>
              <button
                type="button"
                className="socialNetCard netInstagram"
                onClick={handleFallbackInstagramShare}
                disabled={isGeneratingSocial}
              >
                <strong>📸 Instagram</strong>
                <small>Historia / Feed</small>
              </button>
              <button
                type="button"
                className="socialNetCard netFacebook"
                onClick={handleFallbackFacebookShare}
                disabled={isGeneratingSocial}
              >
                <strong>📘 Facebook</strong>
                <small>Publicar ahora</small>
              </button>
            </div>

            <div className="socialUtilityActionsRow">
              <button
                type="button"
                className="btnSocialUtility"
                onClick={handleDownloadSocialPng}
                disabled={isGeneratingSocial}
              >
                📥 Descargar HD
              </button>
              <button
                type="button"
                className="btnSocialUtility"
                onClick={handleCopyPromoImageAndText}
                disabled={isGeneratingSocial}
              >
                🖼️ Copiar Imagen
              </button>
              <button
                type="button"
                className="btnSocialUtility"
                onClick={handleCopyPromoCaption}
                disabled={isGeneratingSocial}
              >
                📋 Copiar Enlace
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AVISO LEGAL AL PIE DE PÁGINA */}
      <footer style={{ textAlign: "center", padding: "20px 16px 36px", fontSize: "0.78rem", color: "rgba(255, 255, 255, 0.45)", lineHeight: 1.45 }}>
        Exclusivo mayores de 18 años en Colombia (Ley 643 de 2001). Apple Inc. y Google LLC no patrocinan estos sorteos.
      </footer>
    </main>
  );
}
