// Locución Oficial del Ganador (v5.0 — Apple Native M4A/MP3 en AVPlayer Hardware Playback)
// Reproduce la grabación MP3/M4A original del usuario ("¡Felicidades! ¡Eres el ganador! ¡Disfruta tu premio!")
// directamente a través del elemento `<audio playsInline>` del DOM (ignora Modo Silencio físico en iPhone).

import { drawAudio } from "./audio";

export function preloadWinnerVoice(): void {
  if (typeof window === "undefined") return;
}

export function stopWinnerVoice(): void {
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    try {
      window.speechSynthesis.cancel();
    } catch {}
  }
}

export function playWinnerVoice(winner: string = "", isMuted: boolean = false): void {
  if (typeof window === "undefined" || isMuted) return;

  // Disparo síncrono en Línea 1 sobre el `<audio>` nativo del DOM (AVAudioSessionCategoryPlayback en iOS)
  if (drawAudio.playStudioVoiceDirect(true)) {
    return;
  }

  // Respaldo final de síntesis si el archivo aún no estuviera disponible
  if ("speechSynthesis" in window) {
    try {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(
        winner
          ? `¡Felicidades! ¡Eres el ganador con el número ${winner}! ¡Disfruta tu premio!`
          : "¡Felicidades! ¡Eres el ganador! ¡Disfruta tu premio!"
      );
      u.lang = "es-CO";
      window.speechSynthesis.speak(u);
    } catch {}
  }
}
