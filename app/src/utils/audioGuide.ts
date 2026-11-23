import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

let audioCtx: AudioContext | null = null;

function getAudioCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  if (!Ctx) return null;
  if (!audioCtx) audioCtx = new Ctx();
  if (audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

/** Tono cálido y suave (sin sobresaltos para pacientes cardíacos) */
export function playGentleChime(type: 'start' | 'rest' | 'breath' | 'finish', enabled: boolean): void {
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
    gain.gain.exponentialRampToValueAtTime(0.11, now + idx * 0.16 + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.16 + 0.42);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now + idx * 0.16);
    osc.stop(now + idx * 0.16 + 0.45);
  });
}

export function speakCue(text: string, enabled: boolean): void {
  if (!enabled || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
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

