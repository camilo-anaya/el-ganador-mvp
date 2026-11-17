// Genera la locución "¡Felicidades, has ganado!" con Gemini TTS (voz femenina, tono alegre y natural).
//
// Uso (PowerShell):
//   $env:GEMINI_API_KEY = "tu-clave"
//   node scripts/generate-winner-voice.mjs            -> genera 4 voces candidatas en public/audio/preview/
//   node scripts/generate-winner-voice.mjs Leda       -> genera solo esa voz
//
// Luego copia la elegida a public/audio/felicidades.wav (la web la reproduce desde ahí).
// La clave se lee SOLO de la variable de entorno; nunca se guarda en el proyecto.

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
if (!apiKey) {
  console.error("Falta GEMINI_API_KEY en el entorno. Ej: $env:GEMINI_API_KEY = \"tu-clave\"");
  process.exit(1);
}

const PHRASE = "¡Felicidades, has ganado!";
const STYLE =
  "Dilo con una voz femenina joven, cálida y natural, con mucha alegría y entusiasmo de presentadora que anuncia un premio, sin sonar exagerada ni robótica";
const DEFAULT_VOICES = ["Leda", "Zephyr", "Aoede", "Kore"];
const MODELS = [process.env.GEMINI_TTS_MODEL, "gemini-3.8-flash-tts", "gemini-2.5-flash-preview-tts"].filter(Boolean);

const voices = process.argv.slice(2).length ? process.argv.slice(2) : DEFAULT_VOICES;
const outDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "public", "audio", "preview");

function pcmToWav(pcm, sampleRate) {
  const header = Buffer.alloc(44);
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + pcm.length, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20); // PCM
  header.writeUInt16LE(1, 22); // mono
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(sampleRate * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write("data", 36);
  header.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([header, pcm]);
}

async function synth(model, voiceName) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
    body: JSON.stringify({
      contents: [{ parts: [{ text: `${STYLE}: ${PHRASE}` }] }],
      generationConfig: {
        responseModalities: ["AUDIO"],
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName } } },
      },
    }),
  });
  if (!res.ok) {
    const err = new Error(`HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`);
    err.status = res.status;
    throw err;
  }
  const json = await res.json();
  const part = json.candidates?.[0]?.content?.parts?.find((p) => p.inlineData);
  if (!part) throw new Error("La respuesta no trajo audio: " + JSON.stringify(json).slice(0, 300));
  const rate = Number(/rate=(\d+)/.exec(part.inlineData.mimeType || "")?.[1] || 24000);
  return pcmToWav(Buffer.from(part.inlineData.data, "base64"), rate);
}

await mkdir(outDir, { recursive: true });

for (const voice of voices) {
  let done = false;
  for (const model of MODELS) {
    try {
      const wav = await synth(model, voice);
      const file = path.join(outDir, `felicidades-${voice}.wav`);
      await writeFile(file, wav);
      console.log(`OK  ${voice} (${model}) -> ${file} [${Math.round(wav.length / 1024)} KB]`);
      done = true;
      break;
    } catch (err) {
      console.error(`--  ${voice} con ${model}: ${err.message}`);
      if (err.status && err.status !== 404 && err.status !== 400) break; // clave/cuota: no tiene sentido probar otro modelo
    }
  }
  if (!done) console.error(`FALLÓ ${voice}`);
}
