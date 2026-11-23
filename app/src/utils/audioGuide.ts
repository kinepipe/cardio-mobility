import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { TextToSpeech } from '@capacitor-community/text-to-speech';

let audioCtx: AudioContext | null = null;

function getAudioCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const Ctx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  if (!Ctx) return null;
  if (!audioCtx) audioCtx = new Ctx();
  if (audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

/** Desbloquea el contexto de audio tras el primer toque del usuario (clave en Android WebView) */
export function unlockAudio(): void {
  const ctx = getAudioCtx();
  if (ctx && ctx.state === 'suspended') {
    ctx.resume().catch(() => {});
  }
}

/** Tono cálido y suave (sin sobresaltos para pacientes cardíacos) */
export function playGentleChime(
  type: 'start' | 'rest' | 'breath' | 'finish',
  enabled: boolean
): void {
  if (!enabled) return;
  const ctx = getAudioCtx();
  if (!ctx) return;

  const now = ctx.currentTime;
  const freqs =
    type === 'start'
      ? [440, 554.37]
      : type === 'rest'
      ? [523.25, 392]
      : type === 'breath'
      ? [349.23]
      : [440, 554.37, 659.25];

  freqs.forEach((f, idx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(f, now + idx * 0.16);
    gain.gain.setValueAtTime(0.0001, now + idx * 0.16);
    gain.gain.exponentialRampToValueAtTime(0.14, now + idx * 0.16 + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.16 + 0.42);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now + idx * 0.16);
    osc.stop(now + idx * 0.16 + 0.45);
  });
}

/**
 * Voz guiada en español:
 * - En Android APK usa el motor nativo Android TTS (@capacitor-community/text-to-speech),
 *   ya que WebView de Android no soporta window.speechSynthesis de forma confiable.
 * - En navegador web usa Web Speech API (window.speechSynthesis).
 */
export async function speakCue(text: string, enabled: boolean): Promise<void> {
  if (!enabled || !text) return;

  if (Capacitor.isNativePlatform()) {
    try {
      await TextToSpeech.stop();
    } catch {
      // ignore if nothing playing
    }
    try {
      await TextToSpeech.speak({
        text,
        lang: 'es-ES',
        rate: 0.92,
        pitch: 1.0,
        volume: 1.0,
        category: 'ambient',
      });
      return;
    } catch {
      try {
        await TextToSpeech.speak({
          text,
          lang: 'es-MX',
          rate: 0.92,
          pitch: 1.0,
          volume: 1.0,
        });
        return;
      } catch {
        // fall through to web fallback
      }
    }
  }

  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  try {
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = 'es-CL';
    utter.rate = 0.92;
    utter.pitch = 1.0;

    const voices = window.speechSynthesis.getVoices();
    const esVoice =
      voices.find((v) => v.lang.toLowerCase().startsWith('es-cl')) ||
      voices.find((v) => v.lang.toLowerCase().startsWith('es-419')) ||
      voices.find((v) => v.lang.toLowerCase().startsWith('es'));
    if (esVoice) utter.voice = esVoice;

    window.speechSynthesis.speak(utter);
  } catch {
    // ignore speech errors on restricted devices
  }
}

export function stopSpeech(): void {
  if (Capacitor.isNativePlatform()) {
    TextToSpeech.stop().catch(() => {});
  }
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
    } catch {
      // ignore
    }
  }
}

export async function gentleHaptic(): Promise<void> {
  try {
    if (Capacitor.isNativePlatform()) {
      await Haptics.impact({ style: ImpactStyle.Light });
    } else if ('vibrate' in navigator) {
      navigator.vibrate(40);
    }
  } catch {
    // ignore
  }
}
