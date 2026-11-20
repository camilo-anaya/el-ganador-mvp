// Motor Maestro de Audio Nativo para El Ganador (v5.0 — Apple iOS Native M4A/AAC + AVPlayer Hardware Playback)
//
// ¿POR QUÉ EN ANDROID SONABA v4.0 Y EN IPHONE NO SE ESCUCHABA?
// - Apple iOS clasifica `Web Audio API` (`AudioContext`) bajo `AVAudioSessionCategoryAmbient`: cuando el interruptor
//   físico lateral del iPhone (o el Botón de Acción) está en Modo Silencio, iOS silencia el `AudioContext` al 0%.
// - En cambio, un elemento HTML5 `<audio playsInline>` real en el DOM que reproduce un archivo multimedia estático
//   nativo de Apple (`.m4a` AAC-LC 44.1 kHz `faststart`, servido con HTTP 206 Partial Content) utiliza el motor de
//   hardware `AVPlayer` bajo `AVAudioSessionCategoryPlayback` — el mismo canal que usan YouTube, Instagram y las
//   notas de voz de WhatsApp, que IGNORA el interruptor de silencio del iPhone y suena por el altavoz principal.
// - Adicionalmente, en iOS 17/18 se activa explícitamente `navigator.audioSession.type = "playback"`.
// - CERO URLs `blob:` (100% compatible con Safari iOS, Chrome iOS `CriOS`, Google App `GSA`, WebViews y Android).

export type SequenceMode = "balotas" | "ruleta";

export const BALOTAS_TIMELINE = {
  PREAMBULO_START: 0.0,   // "Damas y caballeros, bienvenidos al sorteo oficial de El Ganador. Círculo Dorado en línea. El sorteo oficial comenzará..." (0s a 12.50s)
  COUNTDOWN_START: 12.50, // 5, 4, 3, 2, 1 (12.50s a 17.50s)
  JUEGA_START: 17.50,     // ¡JUEGA! (17.50s a 18.50s)
  MIXING_START: 18.50,    // Agitación en El Círculo Dorado (18.50s a 33.50s — 15 segundos)
  SUCTION_START: 33.50,   // Succión por tubo de vacío (33.50s a 43.50s — 10 segundos)
  SLOWDOWN_START: 43.50,  // Desaceleración y encaje mecánico (43.50s a 46.33s — 2.83 segundos)
  REVEAL_START: 46.33,    // Fanfarria + Voz oficial de ganador (46.33s a 52.33s)
  TOTAL_DURATION: 52.33,
} as const;

export const RULETA_TIMELINE = {
  PREAMBULO_START: 0.0,   // "Damas y caballeros, bienvenidos al sorteo oficial de El Ganador. Círculo Dorado en línea..." (0s a 12.50s)
  COUNTDOWN_START: 12.50, // 5, 4, 3, 2, 1 (12.50s a 17.50s)
  JUEGA_START: 17.50,     // ¡JUEGA! (17.50s a 18.50s)
  SPIN_START: 18.50,      // Giro a velocidad viva (crucero) de 20.0s (18.50s a 38.50s — andando)
  SLOWDOWN_START: 38.50,  // Desaceleración progresiva y suave de 20.0s (38.50s a 58.50s — deteniéndose)
  SPIN_END: 58.50,        // Parada suave total (0.00°/s) en el centro exacto del número ganador
  REVEAL_START: 58.85,    // Anuncio del ganador + fanfarria SOLO después de detenerse por completo
  TOTAL_DURATION: 64.70,
} as const;

export interface AudioMediaBank {
  balotas: HTMLAudioElement | null;
  ruleta: HTMLAudioElement | null;
  test: HTMLAudioElement | null;
  voice: HTMLAudioElement | null;
}

export type AudioStatusSnapshot = {
  state: "idle" | "playing" | "testing" | "voice" | "blocked";
  message: string;
};

type StatusListener = (status: AudioStatusSnapshot) => void;

function forceApplePlaybackAudioSession(): void {
  if (typeof navigator === "undefined") return;
  try {
    const nav = navigator as Navigator & {
      audioSession?: { type: string };
    };
    if (nav.audioSession && nav.audioSession.type !== "playback") {
      nav.audioSession.type = "playback";
    }
  } catch {}
}

function configureInlineAudioElement(el: HTMLAudioElement | null): void {
  if (!el) return;
  el.setAttribute("playsinline", "true");
  el.setAttribute("webkit-playsinline", "true");
  (el as HTMLAudioElement & { playsInline?: boolean }).playsInline = true;
}

class NativeDrawAudioEngine {
  private bank: AudioMediaBank = {
    balotas: null,
    ruleta: null,
    test: null,
    voice: null,
  };

  private isMuted = false;
  private isSequenceActive = false;
  private activeMasterEl: HTMLAudioElement | null = null;
  private wallStartMs = 0;
  private lastAudioTimeSec = 0;
  private lastAudioSampleWallMs = 0;
  private currentRunVoiceEmbedded = false;
  private listeners = new Set<StatusListener>();

  onStatusChange(fn: StatusListener): () => void {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  }

  private emitStatus(state: AudioStatusSnapshot["state"], message: string): void {
    for (const fn of this.listeners) {
      try {
        fn({ state, message });
      } catch {}
    }
  }

  attachMediaBank(next: Partial<AudioMediaBank>): void {
    if ("balotas" in next && next.balotas !== undefined) {
      this.bank.balotas = next.balotas;
      configureInlineAudioElement(this.bank.balotas);
    }
    if ("ruleta" in next && next.ruleta !== undefined) {
      this.bank.ruleta = next.ruleta;
      configureInlineAudioElement(this.bank.ruleta);
    }
    if ("test" in next && next.test !== undefined) {
      this.bank.test = next.test;
      configureInlineAudioElement(this.bank.test);
    }
    if ("voice" in next && next.voice !== undefined) {
      this.bank.voice = next.voice;
      configureInlineAudioElement(this.bank.voice);
    }
  }

  // Compatibilidad retroactiva en caso de llamadas legadas
  attachAudioElement(_el: HTMLAudioElement | null): void {}

  /**
   * Desbloquea y precarga todos los elementos de audio en el primer toque/gesto del usuario.
   * Evita bloqueos de autoplay en Safari iOS, Chrome Android y WebViews.
   */
  unlockAllAudio(): void {
    if (typeof window === "undefined") return;
    forceApplePlaybackAudioSession();
    const all = [this.bank.balotas, this.bank.ruleta, this.bank.test, this.bank.voice];
    for (const el of all) {
      if (el) {
        if (el.readyState === 0 || el.error) {
          try {
            el.load();
          } catch {}
        }
      }
    }
  }

  prepareMode(mode: SequenceMode): void {
    if (typeof window === "undefined") return;
    forceApplePlaybackAudioSession();
    const target = mode === "balotas" ? this.bank.balotas : this.bank.ruleta;
    if (target && target !== this.activeMasterEl) {
      try {
        if (target.readyState === 0 || target.error) {
          target.load();
        }
      } catch {}
    }
  }

  private pauseOthersExcept(keep: HTMLAudioElement | null): void {
    const all = [this.bank.balotas, this.bank.ruleta, this.bank.test, this.bank.voice];
    for (const el of all) {
      if (el && el !== keep) {
        try {
          if (!el.paused) el.pause();
        } catch {}
      }
    }
  }

  /**
   * Reanuda la pista maestra desde un segundo exacto `offsetSec` cuando la página se recarga
   * en medio de un sorteo oficial en curso, sin detener jamás el reloj del sorteo.
   */
  resumeSequenceAt(mode: SequenceMode, offsetSec: number): void {
    if (typeof window === "undefined") return;
    forceApplePlaybackAudioSession();

    const safeOffset = Math.max(0, offsetSec);
    const now = performance.now();
    this.isSequenceActive = true;
    this.wallStartMs = now - safeOffset * 1000;
    this.lastAudioTimeSec = safeOffset;
    this.lastAudioSampleWallMs = now;
    this.currentRunVoiceEmbedded = false;

    const totalDur =
      mode === "balotas" ? BALOTAS_TIMELINE.TOTAL_DURATION : RULETA_TIMELINE.TOTAL_DURATION;
    if (safeOffset >= totalDur - 0.25) {
      return;
    }

    const primarySrc =
      mode === "balotas" ? "/audio/master-balotas-v6.m4a?v=fv9" : "/audio/master-ruleta-v9.m4a?v=fv12";
    const el =
      (mode === "balotas" ? this.bank.balotas : this.bank.ruleta) ?? new Audio(primarySrc);
    configureInlineAudioElement(el);
    this.activeMasterEl = el;
    el.muted = this.isMuted;
    el.volume = 1.0;

    const seekAndPlay = () => {
      const targetSec = Math.max(0, (performance.now() - this.wallStartMs) / 1000);
      if (targetSec >= totalDur - 0.2) return;
      if (el.readyState >= 1) {
        try {
          el.currentTime = targetSec;
        } catch {}
      } else {
        el.addEventListener(
          "loadedmetadata",
          () => {
            const latestSec = Math.max(0, (performance.now() - this.wallStartMs) / 1000);
            if (latestSec < totalDur - 0.2) {
              try {
                el.currentTime = latestSec;
              } catch {}
            }
          },
          { once: true }
        );
      }

      try {
        const p = el.play();
        this.pauseOthersExcept(el);
        if (p && typeof p.then === "function") {
          p.then(() => {
            this.currentRunVoiceEmbedded = true;
            if (!this.isMuted) {
              this.emitStatus("playing", "🔊 Sorteo oficial reanudado con sonido sincronizado");
            }
          }).catch(() => {
            this.emitStatus(
              "testing",
              "🛡️ Sorteo en curso blindado tras recarga · Toca cualquier parte para reactivar el audio"
            );
            const unlockOnce = () => {
              window.removeEventListener("pointerdown", unlockOnce);
              window.removeEventListener("touchstart", unlockOnce);
              if (!this.isSequenceActive) return;
              const secNow = Math.max(0, (performance.now() - this.wallStartMs) / 1000);
              if (secNow >= totalDur - 0.2) return;
              forceApplePlaybackAudioSession();
              if (el.readyState >= 1) {
                try {
                  el.currentTime = secNow;
                } catch {}
              }
              el.muted = this.isMuted;
              el.play()
                .then(() => {
                  this.currentRunVoiceEmbedded = true;
                  this.emitStatus("playing", "🔊 Sonido oficial sincronizado");
                })
                .catch(() => {});
            };
            window.addEventListener("pointerdown", unlockOnce, { once: true });
            window.addEventListener("touchstart", unlockOnce, { once: true });
          });
        }
      } catch {}
    };

    seekAndPlay();
  }

  /**
   * Prueba rápida de sonido en LÍNEA 1 síncrona del gesto `onClick`
   * Reproduce `/audio/test-check-v5.m4a` directamente por `AVPlayer` (ignora Modo Silencio en iPhone).
   */
  playQuickSoundCheck(): void {
    if (typeof window === "undefined") return;
    forceApplePlaybackAudioSession();
    this.isMuted = false;

    const el = this.bank.test ?? new Audio("/audio/test-check-v5.m4a");
    configureInlineAudioElement(el);
    el.muted = false;
    el.volume = 1.0;

    if (el.readyState >= 1 && el.currentTime > 0.02) {
      try {
        el.currentTime = 0;
      } catch {}
    }

    try {
      const p = el.play();
      this.pauseOthersExcept(el);
      if (p && typeof p.then === "function") {
        p.then(() => {
          this.emitStatus(
            "testing",
            "🔊 Audio activo en tu dispositivo. Si se oye bajo, sube el volumen multimedia con el botón lateral."
          );
        }).catch((err) => {
          this.handleFallbackOrReportError(el, "/audio/test-check-v5.wav", "testing", err);
        });
      }
    } catch (err) {
      this.handleFallbackOrReportError(el, "/audio/test-check-v5.wav", "testing", err);
    }
  }

  /**
   * Inicia la pista maestra completa (39.2s Balotas o 18.4s Ruleta) en la LÍNEA 1 síncrona del `onClick`.
   * Incluye el conteo, turbina, choques de balotas, succión, fanfarria y el MP3 oficial del usuario.
   */
  startFullSequence(mode: SequenceMode): void {
    if (typeof window === "undefined") return;
    forceApplePlaybackAudioSession();

    const now = performance.now();
    this.isSequenceActive = true;
    this.wallStartMs = now;
    this.lastAudioTimeSec = 0;
    this.lastAudioSampleWallMs = now;
    this.currentRunVoiceEmbedded = true;

    const fallbackSrc =
      mode === "balotas" ? "/audio/master-balotas-v6.wav?v=fv9" : "/audio/master-ruleta-v9.wav?v=fv12";
    const primarySrc =
      mode === "balotas" ? "/audio/master-balotas-v6.m4a?v=fv9" : "/audio/master-ruleta-v9.m4a?v=fv12";

    const el =
      (mode === "balotas" ? this.bank.balotas : this.bank.ruleta) ?? new Audio(primarySrc);
    configureInlineAudioElement(el);
    this.activeMasterEl = el;

    el.muted = this.isMuted;
    el.volume = 1.0;

    // Resetear posición de audio SIEMPRE a 0 (vital tras repeticiones o estados "ended")
    try {
      el.currentTime = 0;
    } catch {}

    // Si el elemento está descargado o en error, forzar recarga
    if (el.readyState === 0 || el.error) {
      try {
        el.load();
      } catch {}
    }

    try {
      // LÍNEA CRÍTICA SÍNCRONA: invocar `el.play()` ANTES de pausar otros elementos o hacer cambios de estado
      const p = el.play();
      this.pauseOthersExcept(el);

      if (p && typeof p.then === "function") {
        p.then(() => {
          this.currentRunVoiceEmbedded = true;
          if (!this.isMuted) {
            this.emitStatus("playing", "🔊 Sonido oficial en vivo (compatible con Modo Silencio en iPhone)");
          }
        }).catch((err) => {
          this.currentRunVoiceEmbedded = false;
          this.handleFallbackOrReportError(el, fallbackSrc, "playing", err);
        });
      }
    } catch (err) {
      this.currentRunVoiceEmbedded = false;
      this.handleFallbackOrReportError(el, fallbackSrc, "playing", err);
    }
  }

  /**
   * Reproduce la locución oficial del ganador ("¡Felicidades! ¡Eres el ganador! ¡Disfruta tu premio!")
   * usando el archivo nativo `.m4a` / `.mp3` directamente en `AVPlayer`.
   */
  playStudioVoiceDirect(forceUnmute = false): boolean {
    if (typeof window === "undefined") return false;
    if (forceUnmute) {
      this.isMuted = false;
    } else if (this.isMuted) {
      return false;
    }
    forceApplePlaybackAudioSession();

    const el = this.bank.voice ?? new Audio("/audio/felicidades-v5.m4a");
    configureInlineAudioElement(el);
    el.muted = false;
    el.volume = 1.0;

    try {
      el.currentTime = 0;
    } catch {}

    if (el.readyState === 0 || el.error) {
      try {
        el.load();
      } catch {}
    }

    try {
      const p = el.play();
      this.pauseOthersExcept(el);
      this.activeMasterEl = null;

      if (p && typeof p.then === "function") {
        p.then(() => {
          this.emitStatus("voice", "🔊 Reproduciendo voz oficial: ¡Felicidades! ¡Eres el ganador!");
        }).catch((err) => {
          this.handleFallbackOrReportError(el, "/audio/felicidades.mp3", "voice", err);
        });
      }
      return true;
    } catch (err) {
      this.handleFallbackOrReportError(el, "/audio/felicidades.mp3", "voice", err);
      return false;
    }
  }

  private handleFallbackOrReportError(
    el: HTMLAudioElement,
    fallbackUrl: string,
    targetState: "playing" | "testing" | "voice",
    _err: unknown
  ): void {
    try {
      const cleanFallback = fallbackUrl.split('?')[0];
      if (!el.src || !el.src.includes(cleanFallback)) {
        el.src = fallbackUrl;
        el.muted = this.isMuted;
        el.volume = 1.0;
        try {
          el.load();
        } catch {}
        const retry = el.play();
        if (retry && typeof retry.then === "function") {
          retry
            .then(() => {
              if (targetState === "playing") this.currentRunVoiceEmbedded = true;
              this.emitStatus(targetState, "🔊 Audio oficial activo (vía códec alternativo)");
            })
            .catch(() => {
              this.emitStatus(
                "blocked",
                "Tu navegador pausó el inicio automático. Toca cualquier parte de la pantalla para activar el audio."
              );
            });
          return;
        }
      }
    } catch {}

    this.emitStatus(
      "blocked",
      "Tu navegador pausó el inicio automático. Toca cualquier parte de la pantalla para activar el audio."
    );
  }

  /**
   * Reloj maestro unificado en segundos (sincronizado al milisegundo con `AVPlayer.currentTime`
   * y respaldado por `performance.now()` si está silenciado o cargando por red).
   */
  getSequenceTimeSec(): number {
    if (!this.isSequenceActive) return 0;
    const now = performance.now();
    const wallElapsedSec = Math.max(0, (now - this.wallStartMs) / 1000);
    const el = this.activeMasterEl;

    if (el) {
      if (!el.paused && !el.ended && el.currentTime > 0.02) {
        // Si tras una recarga el elemento aún no ha hecho seek al segundo real, mantener el reloj maestro
        if (Math.abs(el.currentTime - wallElapsedSec) < 2.5) {
          this.lastAudioTimeSec = el.currentTime;
          this.lastAudioSampleWallMs = now;
          return el.currentTime;
        }
        if (el.readyState >= 1) {
          try {
            el.currentTime = wallElapsedSec;
          } catch {}
        }
      }
      if (el.ended && this.lastAudioTimeSec > 0 && wallElapsedSec >= this.lastAudioTimeSec - 1) {
        const base = Number.isFinite(el.duration) && el.duration > 0 ? el.duration : this.lastAudioTimeSec;
        return base + Math.max(0, (now - this.lastAudioSampleWallMs) / 1000);
      }
    }

    return wallElapsedSec;
  }

  didCurrentRunEmbedVoice(): boolean {
    const el = this.activeMasterEl;
    if (!el) return false;
    return this.currentRunVoiceEmbedded && (!el.paused || el.ended);
  }

  stopAll(): void {
    this.isSequenceActive = false;
    this.activeMasterEl = null;
    this.wallStartMs = 0;
    this.lastAudioTimeSec = 0;
    this.currentRunVoiceEmbedded = false;
    this.pauseOthersExcept(null);
    this.emitStatus("idle", "");
  }

  toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    const all = [this.bank.balotas, this.bank.ruleta, this.bank.test, this.bank.voice];
    for (const el of all) {
      if (el) {
        el.muted = this.isMuted;
      }
    }
    if (this.isMuted) {
      this.emitStatus("idle", "");
    } else if (this.activeMasterEl && !this.activeMasterEl.paused) {
      this.emitStatus("playing", "🔊 Sonido oficial en vivo");
    }
    return this.isMuted;
  }

  getMuted(): boolean {
    return this.isMuted;
  }
}

export const drawAudio = new NativeDrawAudioEngine();
