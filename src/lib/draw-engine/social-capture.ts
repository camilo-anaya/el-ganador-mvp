// Generador Oficial de Captura Promocional HD de la Balotera / Ruleta para Redes Sociales
// Renderiza en Canvas 2D nativo de alta resolución (1080x1920 Historia/Estado 9:16 o 1080x1350 Post 4:5)
// sin dependencias externas ni errores de CORS/foreignObject en Safari iOS, Chrome iOS, Android o PC.

import { hasAmbiguityRisk, numberToSpanishWords } from "./format";
import { createQrMatrix } from "./qr";

export type SocialFormat = "story" | "post";

export interface SocialCaptureOptions {
  format: SocialFormat;
  mode: "balotas" | "ruleta";
  winner: string;
  cartonSize: number;
  rangeLabel: string;
  drawId: string;
  auditHash: string;
  timestampBogota: string;
  verifyUrl: string;
  livePhysicsCanvas?: HTMLCanvasElement | null;
}

export interface RenderedSocialCapture {
  dataUrl: string;
  jpgBlob: Blob;
  shareFile: File;
  filename: string;
  jpgFilename: string;
  caption: string;
  winner: string;
  verifyUrl: string;
  sourceCanvas: HTMLCanvasElement;
}

export type NativeShareOutcome =
  | "shared_file"
  | "shared_link"
  | "cancelled"
  | "unsupported";

function dataUrlToBlob(dataUrl: string, mimeType: string): Blob {
  const base64Part = dataUrl.split(",")[1] || "";
  const binStr = atob(base64Part);
  const bytes = new Uint8Array(binStr.length);
  for (let i = 0; i < binStr.length; i++) {
    bytes[i] = binStr.charCodeAt(i);
  }
  return new Blob([bytes], { type: mimeType });
}

export function isMobileShareDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  if (/Android|iPhone|iPad|iPod|Mobile/i.test(ua)) return true;
  if (/Macintosh/i.test(ua) && (navigator.maxTouchPoints || 0) > 1) return true;
  return false;
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): void {
  const rad = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.arcTo(x + w, y, x + w, y + h, rad);
  ctx.arcTo(x + w, y + h, x, y + h, rad);
  ctx.arcTo(x, y + h, x, y, rad);
  ctx.arcTo(x, y, x + w, y, rad);
  ctx.closePath();
}

function drawProceduralChamberBalls(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  globeR: number
): void {
  const palette = [
    { bg: "#f0ce71", shade: "#7a5513", text: "#0d2014" },
    { bg: "#ffffff", shade: "#8a968d", text: "#0d2014" },
    { bg: "#1f6e4a", shade: "#0a3320", text: "#0d2014" },
    { bg: "#e5b338", shade: "#6e4e08", text: "#0d2014" },
    { bg: "#b82c2d", shade: "#521013", text: "#0d2014" },
    { bg: "#7c8e9b", shade: "#3a454d", text: "#0d2014" },
  ];

  let seed = 0x517cc1b7;
  const rand = () => {
    seed ^= seed << 13;
    seed ^= seed >>> 17;
    seed ^= seed << 5;
    return (seed >>> 0) / 4294967296;
  };

  const ballR = globeR * 0.082;
  for (let i = 0; i < 64; i++) {
    const col = palette[i % palette.length];
    const angle = Math.PI * 0.12 + rand() * Math.PI * 0.76;
    const dist = globeR * (0.42 + rand() * 0.48);
    const bx = cx + Math.cos(angle) * dist * (rand() > 0.5 ? 1 : -1) * 0.92;
    const by = cy + globeR * 0.22 + rand() * (globeR * 0.64);
    const dx = bx - cx;
    const dy = by - cy;
    if (Math.sqrt(dx * dx + dy * dy) > globeR - ballR - 6) continue;

    const g = ctx.createRadialGradient(
      bx - ballR * 0.3,
      by - ballR * 0.3,
      ballR * 0.1,
      bx,
      by,
      ballR
    );
    g.addColorStop(0, "#ffffff");
    g.addColorStop(0.35, col.bg);
    g.addColorStop(1, col.shade);

    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(bx, by, ballR, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "rgba(255,255,255,0.88)";
    ctx.beginPath();
    ctx.arc(bx, by, ballR * 0.52, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#0b2214";
    ctx.font = `900 ${Math.round(ballR * 0.66)}px "JetBrains Mono", monospace, Arial`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(String((i % 99) + 1).padStart(2, "0"), bx, by + 1);
  }
}

function drawPhotorealisticBalotera(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  globeR: number,
  opts: SocialCaptureOptions
): void {
  // 1. Halo dorado trasero de escenario
  const stageHalo = ctx.createRadialGradient(cx, cy, globeR * 0.2, cx, cy, globeR * 1.48);
  stageHalo.addColorStop(0, "rgba(244, 211, 108, 0.34)");
  stageHalo.addColorStop(0.55, "rgba(44, 168, 102, 0.18)");
  stageHalo.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = stageHalo;
  ctx.beginPath();
  ctx.arc(cx, cy, globeR * 1.48, 0, Math.PI * 2);
  ctx.fill();

  // 2. Tubo superior de succión neumática
  const tubeW = globeR * 0.28;
  const tubeH = globeR * 0.34;
  const tubeX = cx - tubeW / 2;
  const tubeY = cy - globeR - tubeH * 0.78;
  const tubeGrad = ctx.createLinearGradient(tubeX, tubeY, tubeX + tubeW, tubeY);
  tubeGrad.addColorStop(0, "rgba(255,255,255,0.28)");
  tubeGrad.addColorStop(0.25, "rgba(245, 215, 128, 0.32)");
  tubeGrad.addColorStop(0.5, "rgba(255,255,255,0.08)");
  tubeGrad.addColorStop(1, "rgba(255,255,255,0.26)");
  drawRoundedRect(ctx, tubeX, tubeY, tubeW, tubeH, 16);
  ctx.fillStyle = tubeGrad;
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = "rgba(244, 215, 120, 0.72)";
  ctx.stroke();

  // Anillo conector superior
  drawRoundedRect(ctx, tubeX - 10, tubeY - 10, tubeW + 20, 16, 8);
  ctx.fillStyle = "#d4a838";
  ctx.fill();

  // 3. Canalón digital oficial debajo de la esfera (ajustado dinámicamente al texto real en iOS/Android/PC)
  const chuteLabel =
    opts.mode === "balotas"
      ? `★ BALOTA GANADORA OFICIAL: ${opts.winner} ★`
      : `★ GANADOR OFICIAL: ${opts.winner.slice(0, 22)} ★`;
  ctx.font = '900 22px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif';
  const measuredChuteText = Math.ceil(ctx.measureText(chuteLabel).width);
  const chuteW = Math.min(920, Math.max(globeR * 1.72, measuredChuteText + 76));
  const chuteH = 56;
  const chuteY = cy + globeR * 1.09;
  drawRoundedRect(ctx, cx - chuteW / 2, chuteY, chuteW, chuteH, 28);
  ctx.fillStyle = "#071a10";
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = "#e5bf5c";
  ctx.stroke();

  ctx.fillStyle = "#ffe58f";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(chuteLabel, cx, chuteY + chuteH / 2 + 1, chuteW - 44);

  // Placa base (ajustada dinámicamente para que el texto quede 100% dentro del recuadro)
  const standLabel = "EL GANADOR · BALOTERA OFICIAL CERTIFICADA";
  ctx.font = '800 15px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif';
  const measuredStandText = Math.ceil(ctx.measureText(standLabel).width);
  const standW = Math.min(860, Math.max(globeR * 1.44, measuredStandText + 60));
  const standH = 38;
  const standY = chuteY + chuteH + 12;
  drawRoundedRect(ctx, cx - standW / 2, standY, standW, standH, 12);
  ctx.fillStyle = "rgba(12, 38, 23, 0.96)";
  ctx.fill();
  ctx.lineWidth = 1.8;
  ctx.strokeStyle = "rgba(229, 191, 92, 0.62)";
  ctx.stroke();
  ctx.fillStyle = "#cbe5d4";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(standLabel, cx, standY + standH / 2 + 1, standW - 36);

  // 4. Bisel CNC exterior de oro y acero con 12 pernos
  const outerR = globeR * 1.055;
  const bezelGrad = ctx.createLinearGradient(cx - outerR, cy - outerR, cx + outerR, cy + outerR);
  bezelGrad.addColorStop(0, "#875f1b");
  bezelGrad.addColorStop(0.25, "#e5bf5c");
  bezelGrad.addColorStop(0.45, "#fff6ce");
  bezelGrad.addColorStop(0.68, "#966d1f");
  bezelGrad.addColorStop(0.86, "#f3d47d");
  bezelGrad.addColorStop(1, "#5e4110");

  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.72)";
  ctx.shadowBlur = 36;
  ctx.shadowOffsetY = 16;
  ctx.beginPath();
  ctx.arc(cx, cy, outerR, 0, Math.PI * 2);
  ctx.fillStyle = bezelGrad;
  ctx.fill();
  ctx.restore();

  // Ranura oscura interior del bisel
  ctx.beginPath();
  ctx.arc(cx, cy, globeR * 1.01, 0, Math.PI * 2);
  ctx.fillStyle = "#101b14";
  ctx.fill();

  // 12 Pernos mecánicos CNC a 30°
  const boltOrbitR = globeR * 1.032;
  for (let i = 0; i < 12; i++) {
    const ang = (i * 30 * Math.PI) / 180;
    const bx = cx + Math.cos(ang) * boltOrbitR;
    const by = cy + Math.sin(ang) * boltOrbitR;
    ctx.beginPath();
    ctx.arc(bx, by, 7.5, 0, Math.PI * 2);
    ctx.fillStyle = "#fff2b8";
    ctx.fill();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = "#4d3306";
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(bx, by, 2.8, 0, Math.PI * 2);
    ctx.fillStyle = "#1f1503";
    ctx.fill();
  }

  // 5. Cámara interior de cristal (Esfera o Ruleta)
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, globeR, 0, Math.PI * 2);
  ctx.clip();

  const chamberGrad = ctx.createRadialGradient(cx, cy - globeR * 0.25, globeR * 0.08, cx, cy, globeR);
  chamberGrad.addColorStop(0, "#1c5436");
  chamberGrad.addColorStop(0.58, "#0c2b1a");
  chamberGrad.addColorStop(1, "#041109");
  ctx.fillStyle = chamberGrad;
  ctx.fillRect(cx - globeR, cy - globeR, globeR * 2, globeR * 2);

  if (opts.mode === "balotas") {
    // Rejilla difusora neumática inferior
    ctx.beginPath();
    ctx.ellipse(cx, cy + globeR * 0.88, globeR * 0.42, globeR * 0.1, 0, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(244, 215, 120, 0.22)";
    ctx.fill();

    // Captura en vivo del canvas físico de balotas (o respaldo procedural hiperrealista)
    if (opts.livePhysicsCanvas && opts.livePhysicsCanvas.width > 0) {
      ctx.drawImage(
        opts.livePhysicsCanvas,
        cx - globeR,
        cy - globeR,
        globeR * 2,
        globeR * 2
      );
    } else {
      drawProceduralChamberBalls(ctx, cx, cy, globeR);
    }
  } else {
    // Sectores cromáticos de la Ruleta Comunitaria
    const slices = Math.min(Math.max(opts.cartonSize || 12, 8), 24);
    for (let i = 0; i < slices; i++) {
      const a0 = (i * Math.PI * 2) / slices;
      const a1 = ((i + 1) * Math.PI * 2) / slices;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, globeR * 0.96, a0, a1);
      ctx.closePath();
      ctx.fillStyle = `hsl(${(i * 47 + 8) % 360} 66% ${i % 2 ? "38%" : "46%"})`;
      ctx.fill();
    }
  }

  // Anillos orbitales sutiles de bronce
  ctx.strokeStyle = "rgba(240, 206, 113, 0.22)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(cx, cy, globeR * 0.92, globeR * 0.38, -0.35, 0, Math.PI * 2);
  ctx.stroke();

  // Viñeta interna de espesor de cristal
  const glassRim = ctx.createRadialGradient(cx, cy, globeR * 0.72, cx, cy, globeR);
  glassRim.addColorStop(0, "rgba(0,0,0,0)");
  glassRim.addColorStop(0.86, "rgba(255,255,255,0.06)");
  glassRim.addColorStop(1, "rgba(255, 244, 204, 0.34)");
  ctx.fillStyle = glassRim;
  ctx.fillRect(cx - globeR, cy - globeR, globeR * 2, globeR * 2);

  // Brillo especular superior de estudio (Softbox)
  ctx.save();
  ctx.translate(cx - globeR * 0.34, cy - globeR * 0.46);
  ctx.rotate(-0.52);
  const gloss = ctx.createLinearGradient(0, -globeR * 0.16, 0, globeR * 0.16);
  gloss.addColorStop(0, "rgba(255,255,255,0.52)");
  gloss.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = gloss;
  ctx.beginPath();
  ctx.ellipse(0, 0, globeR * 0.44, globeR * 0.15, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // 6. Ondas expansivas doradas (Shockwave ripples) detrás de la balota ganadora
  for (const mult of [0.68, 0.54]) {
    ctx.beginPath();
    ctx.arc(cx, cy, globeR * mult, 0, Math.PI * 2);
    ctx.lineWidth = mult === 0.54 ? 5 : 3;
    ctx.strokeStyle =
      mult === 0.54 ? "rgba(255, 226, 130, 0.85)" : "rgba(240, 206, 113, 0.42)";
    ctx.stroke();
  }

  // 7. BALOTA DORADA 3D EXTRAÍDA EN EL CENTRO DE LA BALOTERA (MÁS GRANDE Y PROTAGONISTA)
  const heroR = globeR * 0.49;
  ctx.save();
  ctx.shadowColor = "rgba(0, 0, 0, 0.88)";
  ctx.shadowBlur = 42;
  ctx.shadowOffsetY = 16;

  const ballSphere = ctx.createRadialGradient(
    cx - heroR * 0.34,
    cy - heroR * 0.38,
    heroR * 0.08,
    cx,
    cy,
    heroR
  );
  ballSphere.addColorStop(0, "#ffffff");
  ballSphere.addColorStop(0.24, "#fdeba8");
  ballSphere.addColorStop(0.55, "#e0b33b");
  ballSphere.addColorStop(0.84, "#9a6c12");
  ballSphere.addColorStop(1, "#4a3004");

  ctx.beginPath();
  ctx.arc(cx, cy, heroR, 0, Math.PI * 2);
  ctx.fillStyle = ballSphere;
  ctx.fill();
  ctx.lineWidth = 6;
  ctx.strokeStyle = "#fff6cf";
  ctx.stroke();
  ctx.restore();

  // Disco central blanco nácar oficial
  const discR = heroR * 0.66;
  const discGrad = ctx.createRadialGradient(
    cx - discR * 0.25,
    cy - discR * 0.25,
    discR * 0.1,
    cx,
    cy,
    discR
  );
  discGrad.addColorStop(0, "#ffffff");
  discGrad.addColorStop(0.7, "#f9fbf9");
  discGrad.addColorStop(1, "#dde7e1");

  ctx.beginPath();
  ctx.arc(cx, cy, discR, 0, Math.PI * 2);
  ctx.fillStyle = discGrad;
  ctx.fill();
  ctx.lineWidth = 4;
  ctx.strokeStyle = "#d4af37";
  ctx.stroke();

  // Número ganador impreso en el centro de la balota
  const winText = opts.winner.length > 6 ? opts.winner.slice(0, 6) : opts.winner;
  const fontSize =
    winText.length <= 2
      ? Math.round(heroR * 0.68)
      : winText.length === 3
        ? Math.round(heroR * 0.54)
        : Math.round(heroR * 0.42);
  ctx.fillStyle = "#0a1f13";
  ctx.font = `900 ${fontSize}px "JetBrains Mono", monospace, Arial`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(winText, cx, cy - heroR * 0.04);

  // Línea legal de orientación (6 / 9)
  if (opts.mode === "balotas" && hasAmbiguityRisk(opts.winner)) {
    const barW = heroR * 0.36;
    drawRoundedRect(ctx, cx - barW / 2, cy + heroR * 0.28, barW, 6, 3);
    ctx.fillStyle = "#0a1f13";
    ctx.fill();
  }

  // Marca de agua inferior en el disco
  ctx.fillStyle = "#7a5b17";
  ctx.font = `800 ${Math.round(heroR * 0.11)}px system-ui, -apple-system, sans-serif`;
  ctx.fillText("EL GANADOR", cx, cy + heroR * 0.44);

  // Brillo especular superior de la balota
  ctx.save();
  ctx.translate(cx - heroR * 0.34, cy - heroR * 0.52);
  ctx.rotate(-0.55);
  ctx.fillStyle = "rgba(255,255,255,0.78)";
  ctx.beginPath();
  ctx.ellipse(0, 0, heroR * 0.26, heroR * 0.12, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.restore(); // Fin de clip de la esfera
}

function drawConfetti(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  const colors = ["#d8a224", "#1b7a4a", "#f5af19", "#c82d31", "#20a862"];
  let s = 0x13579bdf;
  const rnd = () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return (s >>> 0) / 4294967296;
  };
  for (let i = 0; i < 58; i++) {
    const x = rnd() * w;
    const y = rnd() * (h * 0.78);
    const cw = 8 + rnd() * 12;
    const ch = 5 + rnd() * 7;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rnd() * Math.PI);
    ctx.globalAlpha = 0.28 + rnd() * 0.42;
    ctx.fillStyle = colors[i % colors.length];
    ctx.fillRect(-cw / 2, -ch / 2, cw, ch);
    ctx.restore();
  }
}

function drawQrOnCanvas(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  boxSize: number
): void {
  drawRoundedRect(ctx, x, y, boxSize, boxSize, 14);
  ctx.fillStyle = "#ffffff";
  ctx.fill();

  const matrix = createQrMatrix(text);
  const pad = boxSize * 0.08;
  const inner = boxSize - pad * 2;
  const cell = inner / matrix.length;
  ctx.fillStyle = "#0b2416";
  for (let r = 0; r < matrix.length; r++) {
    for (let c = 0; c < matrix.length; c++) {
      if (matrix[r][c]) {
        ctx.fillRect(x + pad + c * cell, y + pad + r * cell, cell + 0.35, cell + 0.35);
      }
    }
  }
}

export function renderSocialPromoCapture(
  opts: SocialCaptureOptions
): RenderedSocialCapture {
  const width = 1080;
  const height = opts.format === "story" ? 1920 : 1350;
  const isStory = opts.format === "story";

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No se pudo inicializar el lienzo HD.");

  // 1. Fondo Verde Esmeralda de Lujo (alta elegancia, cero deslumbramiento y contraste premium)
  const bg = ctx.createRadialGradient(
    width / 2,
    height * 0.4,
    80,
    width / 2,
    height * 0.5,
    height * 0.88
  );
  bg.addColorStop(0, "#0e3321");
  bg.addColorStop(0.55, "#082115");
  bg.addColorStop(1, "#020d07");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);

  // Marco doble dorado de lujo sobre esmeralda
  drawRoundedRect(ctx, 26, 26, width - 52, height - 52, 34);
  ctx.lineWidth = 4;
  ctx.strokeStyle = "rgba(212, 166, 52, 0.72)";
  ctx.stroke();

  drawConfetti(ctx, width, height);

  // 2. Encabezado oficial (ancho medido dinámicamente para margen perfecto)
  const topY = isStory ? 92 : 68;
  const headerText = "EL GANADOR · SORTEO OFICIAL EN VIVO";
  ctx.font = '900 20px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif';
  const headerPillW = Math.min(920, Math.max(520, Math.ceil(ctx.measureText(headerText).width) + 96));
  const headerPillX = width / 2 - headerPillW / 2;
  drawRoundedRect(ctx, headerPillX, topY, headerPillW, 50, 25);
  ctx.fillStyle = "#0b2e1c";
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = "#e0b544";
  ctx.stroke();

  ctx.fillStyle = "#38ef7d";
  ctx.beginPath();
  ctx.arc(headerPillX + 32, topY + 25, 7, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#ffe89e";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(headerText, width / 2 + 12, topY + 26, headerPillW - 76);

  // Título ¡TENEMOS GANADOR! en oro y blanco luminiscente sobre esmeralda
  const titleY = topY + (isStory ? 116 : 86);
  const titleGrad = ctx.createLinearGradient(width * 0.2, titleY - 40, width * 0.8, titleY + 40);
  titleGrad.addColorStop(0, "#ffe89e");
  titleGrad.addColorStop(0.5, "#ffffff");
  titleGrad.addColorStop(1, "#f3d47d");
  ctx.fillStyle = titleGrad;
  ctx.font = `900 ${isStory ? 74 : 64}px system-ui, -apple-system, sans-serif`;
  ctx.fillText("★ ¡TENEMOS GANADOR! ★", width / 2, titleY, width - 120);

  ctx.fillStyle = "#8ee3b0";
  ctx.font = `800 ${isStory ? 26 : 22}px system-ui, -apple-system, sans-serif`;
  ctx.fillText(
    opts.mode === "balotas"
      ? `CAPTURA OFICIAL DE BALOTERA · CARTÓN DE ${opts.cartonSize} NÚMEROS (${opts.rangeLabel})`
      : `CAPTURA OFICIAL DE RULETA COMUNITARIA · ${opts.cartonSize} PARTICIPANTES`,
    width / 2,
    titleY + (isStory ? 60 : 46),
    width - 120
  );

  // 3. Balotera central de lujo con la balota ganadora adentro
  const globeR = isStory ? 348 : 242;
  const globeCy = isStory ? 792 : 548;
  drawPhotorealisticBalotera(ctx, width / 2, globeCy, globeR, opts);

  // 4. Tarjeta inferior promocional y sello SHA-256 con QR
  const cardX = 64;
  const cardW = width - 128;
  const cardH = isStory ? 430 : 300;
  const cardY = height - cardH - (isStory ? 84 : 56);

  drawRoundedRect(ctx, cardX, cardY, cardW, cardH, 28);
  const cardBg = ctx.createLinearGradient(cardX, cardY, cardX, cardY + cardH);
  cardBg.addColorStop(0, "#0f3621");
  cardBg.addColorStop(1, "#071d11");
  ctx.fillStyle = cardBg;
  ctx.fill();
  ctx.lineWidth = 3.5;
  ctx.strokeStyle = "#e0b648";
  ctx.stroke();

  // Código QR escaneable a la derecha
  const qrSize = isStory ? 186 : 154;
  const qrX = cardX + cardW - qrSize - 34;
  const qrY = cardY + (cardH - qrSize) / 2 - 12;

  const leftAreaX = cardX + 28;
  const leftAreaW = qrX - 24 - leftAreaX;
  const leftCenter = leftAreaX + leftAreaW / 2;

  ctx.fillStyle = "#8ee3b0";
  ctx.font = "900 21px system-ui, -apple-system, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(
    opts.mode === "balotas" ? "NÚMERO GANADOR CERTIFICADO" : "PARTICIPANTE GANADOR OFICIAL",
    leftCenter,
    cardY + (isStory ? 54 : 40),
    leftAreaW
  );

  ctx.fillStyle = "#ffe484";
  const bigWinSize =
    opts.winner.length <= 4 ? (isStory ? 124 : 90) : isStory ? 56 : 44;
  ctx.font = `900 ${bigWinSize}px "JetBrains Mono", monospace, Arial`;
  ctx.fillText(
    opts.mode === "balotas" ? `#${opts.winner}` : opts.winner.slice(0, 20),
    leftCenter,
    cardY + (isStory ? 162 : 116),
    leftAreaW
  );

  if (opts.mode === "balotas") {
    ctx.fillStyle = "#ffffff";
    ctx.font = `800 ${isStory ? 29 : 22}px system-ui, -apple-system, sans-serif`;
    ctx.fillText(
      `“${numberToSpanishWords(opts.winner).toUpperCase()}”`,
      leftCenter,
      cardY + (isStory ? 245 : 178),
      leftAreaW
    );
  }

  // Metadatos de auditoría
  ctx.fillStyle = "#b7d3c1";
  ctx.font = `700 ${isStory ? 20 : 17}px system-ui, -apple-system, sans-serif`;
  ctx.fillText(
    `ID: ${opts.drawId} · ${opts.timestampBogota}`,
    leftCenter,
    cardY + cardH - (isStory ? 96 : 66),
    leftAreaW
  );

  ctx.fillStyle = "#38ef7d";
  ctx.font = `800 ${isStory ? 19 : 16}px system-ui, -apple-system, sans-serif`;
  ctx.fillText(
    `✓ AUDITADO SHA-256 (${opts.auditHash.slice(0, 12)}…) · 0% SESGO`,
    leftCenter,
    cardY + cardH - (isStory ? 48 : 30),
    leftAreaW
  );

  drawQrOnCanvas(ctx, opts.verifyUrl, qrX, qrY, qrSize);

  ctx.fillStyle = "#e8d396";
  ctx.font = "800 15px system-ui, -apple-system, sans-serif";
  ctx.fillText("VERIFICAR QR", qrX + qrSize / 2, qrY + qrSize + 20, qrSize);

  // Codificación ultrarrápida JPEG (~30ms) para conservar 100% la activación táctil en iOS/Android
  const jpgDataUrl = canvas.toDataURL("image/jpeg", 0.94);
  const jpgBlob = dataUrlToBlob(jpgDataUrl, "image/jpeg");

  const safeWin = opts.winner.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 18) || "ganador";
  const jpgFilename = `balota-ganadora-${safeWin}-${opts.format}.jpg`;
  const filename = `balota-ganadora-${safeWin}-${opts.format}.png`;

  const shareFile = new File([jpgBlob], jpgFilename, {
    type: "image/jpeg",
    lastModified: Date.now(),
  });

  const phonetic = opts.mode === "balotas" ? ` (${numberToSpanishWords(opts.winner)})` : "";
  const caption =
    `🎉 ¡TENEMOS GANADOR OFICIAL EN EL GANADOR! 🏆\n` +
    `✨ ${opts.mode === "balotas" ? "Balota ganadora" : "Ganador"}: #${opts.winner}${phonetic}\n` +
    `📋 Sorteo: ${opts.drawId} · Rango ${opts.rangeLabel}\n` +
    `🛡️ Verifica en 0 pasos: ${opts.verifyUrl}`;

  return {
    dataUrl: jpgDataUrl,
    jpgBlob,
    shareFile,
    filename,
    jpgFilename,
    caption,
    winner: opts.winner,
    verifyUrl: opts.verifyUrl,
    sourceCanvas: canvas,
  };
}

function safeCanShare(
  nav: Navigator & { canShare?: (data: ShareData) => boolean },
  data: ShareData
): boolean {
  if (typeof nav.canShare !== "function") return true;
  try {
    return Boolean(nav.canShare(data));
  } catch {
    return false;
  }
}

function isGenuineHumanCancel(err: unknown, startedAtMs: number): boolean {
  const errName = err instanceof Error ? err.name : "";
  const elapsedMs = Date.now() - startedAtMs;
  // En WebViews internos (WhatsApp/Instagram/CriOS) un bloqueo automático rechaza con AbortError en < 250ms
  // sin mostrar jamás el menú del sistema. Un humano real tarda >= 320ms en ver el menú y pulsar Cancelar.
  return errName === "AbortError" && elapsedMs >= 320;
}

/**
 * Cascada nativa universal para celulares (Safari iOS, Chrome Android, Samsung Internet, Chrome iOS, Google App y WebViews):
 * 1. Intenta compartir el archivo `.jpg` HD puro (`{ files: [shareFile] }`) para WhatsApp, Estados e Historias.
 * 2. Si el navegador OEM exige `title`, reintenta `{ files: [shareFile], title }`.
 * 3. Si el navegador móvil soporta menú nativo solo para enlaces (`CriOS` / `GSA` / WebViews), abre el menú con `{ title, text, url }`.
 * 4. Si el navegador interno bloquea Web Share por completo, retorna `"unsupported"` para activar el envío directo de respaldo.
 */
export async function shareCaptureFileNatively(
  capture: RenderedSocialCapture
): Promise<NativeShareOutcome> {
  if (typeof navigator === "undefined" || typeof navigator.share !== "function") {
    return "unsupported";
  }

  const nav = navigator as Navigator & {
    canShare?: (data: ShareData) => boolean;
  };

  if (safeCanShare(nav, { files: [capture.shareFile] })) {
    const t0 = Date.now();
    try {
      await navigator.share({ files: [capture.shareFile] });
      return "shared_file";
    } catch (err) {
      if (isGenuineHumanCancel(err, t0)) return "cancelled";

      const t1 = Date.now();
      try {
        await navigator.share({
          files: [capture.shareFile],
          title: `Balota Ganadora #${capture.winner}`,
        });
        return "shared_file";
      } catch (err2) {
        if (isGenuineHumanCancel(err2, t1)) return "cancelled";
      }
    }
  }

  if (
    safeCanShare(nav, {
      title: `🏆 Balota Ganadora #${capture.winner}`,
      text: capture.caption,
      url: capture.verifyUrl,
    })
  ) {
    const t2 = Date.now();
    try {
      await navigator.share({
        title: `🏆 Balota Ganadora #${capture.winner} · El Ganador`,
        text: capture.caption,
        url: capture.verifyUrl,
      });
      return "shared_link";
    } catch (err3) {
      if (isGenuineHumanCancel(err3, t2)) return "cancelled";
    }
  }

  return "unsupported";
}

/**
 * Copia la imagen PNG HD real al portapapeles del sistema (PC / Mac / iOS / Android)
 * codificando el PNG de forma perezosa solo cuando el usuario solicita copiar.
 */
export async function copyCaptureImageToClipboard(
  capture: RenderedSocialCapture
): Promise<boolean> {
  if (
    typeof navigator === "undefined" ||
    !navigator.clipboard ||
    typeof navigator.clipboard.write !== "function" ||
    typeof ClipboardItem === "undefined"
  ) {
    return false;
  }

  try {
    const pngBlob = await new Promise<Blob | null>((resolve) => {
      capture.sourceCanvas.toBlob((b) => resolve(b), "image/png");
    });
    if (!pngBlob) return false;
    const item = new ClipboardItem({ "image/png": pngBlob });
    await navigator.clipboard.write([item]);
    return true;
  } catch {
    return false;
  }
}
