import React, { useEffect, useRef, useState } from 'react';
import {
  AlertOctagon,
  CheckCircle2,
  Pause,
  Play,
  RotateCcw,
  SkipForward,
  Volume2,
  VolumeX,
  Wind,
} from 'lucide-react';
import { BORG_CR10_GUIDE, STOP_NOW_SYMPTOMS } from '../data/safety';
import { ClinicalProfile, Posture, SessionDuration, SessionStep } from '../types';
import { gentleHaptic, playGentleChime, speakCue, stopSpeech } from '../utils/audioGuide';
import { ExerciseVisual } from './ExerciseVisual';

interface Props {
  steps: SessionStep[];
  posture: Posture;
  duration: SessionDuration;
  profile: ClinicalProfile;
  onToggleAudio: () => void;
  onComplete: (result: { completedExercises: number; totalMinutes: number; borgScore: number | null; stoppedBySymptom: boolean }) => void;
  onExit: () => void;
}

export const SessionPlayer: React.FC<Props> = ({
  steps,
  profile,
  onToggleAudio,
  onComplete,
  onExit,
}) => {
  const [stepIndex, setStepIndex] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(steps[0]?.durationSec ?? 10);
  const [paused, setPaused] = useState(false);
  const [finished, setFinished] = useState(false);
  const [showStopAlert, setShowStopAlert] = useState(false);
  const [borgScore, setBorgScore] = useState<number | null>(3);
  const [activeVisualPhase, setActiveVisualPhase] = useState<1 | 2>(1);

  const startedAtRef = useRef<number>(Date.now());
  const halfCueFiredRef = useRef<boolean>(false);

  const currentStep = steps[stepIndex];
  const audioOn = profile.audioEnabled;

  // Mantener pantalla encendida (WakeLock API) durante la sesión
  useEffect(() => {
    let wakeLock: { release: () => Promise<void> } | null = null;
    const nav = navigator as unknown as { wakeLock?: { request: (t: string) => Promise<{ release: () => Promise<void> }> } };
    nav.wakeLock?.request('screen').then((wl) => {
      wakeLock = wl;
    }).catch(() => {});
    return () => {
      wakeLock?.release().catch(() => {});
      stopSpeech();
    };
  }, []);

  // Disparo de voz y tono al entrar a cada paso
  useEffect(() => {
    if (!currentStep || finished) return;
    setSecondsLeft(currentStep.durationSec);
    halfCueFiredRef.current = false;
    setActiveVisualPhase(1);

    if (currentStep.kind === 'exercise') {
      playGentleChime('start', audioOn);
    } else if (currentStep.kind === 'rest' || currentStep.kind === 'cooldown_watch') {
      playGentleChime('rest', audioOn);
    }
    gentleHaptic();
    speakCue(currentStep.voicePrompt, audioOn);
  }, [stepIndex, finished]);

  // Alternar visualización paso 1 <-> paso 2 suavemente cada 3.5 s
  useEffect(() => {
    if (paused || finished || showStopAlert) return;
    const iv = window.setInterval(() => {
      setActiveVisualPhase((p) => (p === 1 ? 2 : 1));
    }, 3500);
    return () => window.clearInterval(iv);
  }, [paused, finished, showStopAlert]);

  // Temporizador automático principal
  useEffect(() => {
    if (paused || finished || showStopAlert || !currentStep) return;

    const timer = window.setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          if (stepIndex + 1 < steps.length) {
            setStepIndex((i) => i + 1);
          } else {
            setFinished(true);
            playGentleChime('finish', audioOn);
            speakCue('Sesión finalizada. Felicitaciones por cuidar tu salud cardiovascular.', audioOn);
          }
          return 0;
        }
        // Recordatorio suave de exhalación a mitad de un ejercicio
        if (
          currentStep.kind === 'exercise' &&
          !halfCueFiredRef.current &&
          prev === Math.floor(currentStep.durationSec / 2)
        ) {
          halfCueFiredRef.current = true;
          playGentleChime('breath', audioOn);
          speakCue('Recuerda exhalar suavemente, sin aguantar el aire.', audioOn);
        }
        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [paused, finished, showStopAlert, stepIndex, steps.length, currentStep, audioOn]);

  const progressPct = Math.round(((stepIndex + (finished ? 1 : 0)) / Math.max(1, steps.length)) * 100);

  const countCompletedExercises = () =>
    steps.slice(0, stepIndex + (finished ? 1 : 0)).filter((s) => s.kind === 'exercise').length;

  const elapsedMinutes = () => Math.max(1, Math.round((Date.now() - startedAtRef.current) / 60000));

  const handleFinishSave = (stoppedBySymptom: boolean) => {
    stopSpeech();
    onComplete({
      completedExercises: countCompletedExercises(),
      totalMinutes: elapsedMinutes(),
      borgScore,
      stoppedBySymptom,
    });
  };

  if (finished) {
    return (
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <CheckCircle2 size={36} color="#0F766E" />
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#115E59' }}>¡Sesión completada!</h2>
            <p className="muted">
              Completaste {countCompletedExercises()} bloques de movilidad segura ({elapsedMinutes()} min).
            </p>
          </div>
        </div>

        <div>
          <strong style={{ display: 'block', marginBottom: 8 }}>
            ¿Cómo sentiste el esfuerzo? (Escala de Borg CR10)
          </strong>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {BORG_CR10_GUIDE.map((b) => (
              <button
                key={b.level}
                type="button"
                className={`pill-btn ${borgScore === b.level ? 'selected' : ''}`}
                style={{ alignItems: 'flex-start', padding: '10px 14px' }}
                onClick={() => setBorgScore(b.level)}
              >
                <span>
                  {b.level} — {b.label}
                </span>
              </button>
            ))}
          </div>
          {profile.usesBetaBlockers && (
            <p className="muted" style={{ marginTop: 8 }}>
              Como indicaste uso de betabloqueantes, guiarte por esta escala (2–4) y poder hablar con comodidad es el
              indicador más confiable.
            </p>
          )}
        </div>

        <button type="button" className="btn btn-primary" onClick={() => handleFinishSave(false)}>
          Guardar en mi historial y volver al inicio
        </button>
      </div>
    );
  }

  return (
    <div className="player-wrap">
      {/* Barra superior de progreso */}
      <div className="card" style={{ padding: '12px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <span className="badge">
            Paso {stepIndex + 1} de {steps.length} · {currentStep.phase.toUpperCase()}
          </span>
          <button type="button" className="icon-pill" onClick={onToggleAudio} aria-label="Silenciar o activar voz">
            {audioOn ? <Volume2 size={18} /> : <VolumeX size={18} />}
            <span>{audioOn ? 'Voz activa' : 'Silencio'}</span>
          </button>
        </div>
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${progressPct}%` }} />
        </div>
      </div>

      {/* Temporizador principal */}
      <div className={`timer-banner ${currentStep.kind === 'rest' ? 'rest' : ''}`}>
        <div>
          <div style={{ fontSize: '0.82rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
            {currentStep.kind === 'exercise'
              ? `Repetición ${currentStep.repIndex} de ${currentStep.totalReps}`
              : currentStep.kind === 'rest'
              ? 'Pausa de recuperación'
              : currentStep.kind === 'cooldown_watch'
              ? 'Enfriamiento y transición lenta'
              : 'Preparación'}
          </div>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 800, marginTop: 2 }}>{currentStep.title}</h2>
        </div>
        <div className="timer-digits">{secondsLeft}s</div>
      </div>

      {/* Ilustración clínica paso a paso */}
      {currentStep.exercise && (
        <ExerciseVisual exercise={currentStep.exercise} activePhase={activeVisualPhase} />
      )}

      {/* Guía de respiración anti-Valsalva */}
      <div className="breath-bar">
        <span className="breath-dot" />
        <Wind size={20} style={{ flexShrink: 0 }} />
        <span>{currentStep.subtitle}</span>
      </div>

      {/* Instrucciones escritas */}
      {currentStep.exercise && (
        <div className="card">
          <strong style={{ fontSize: '0.96rem', color: '#115E59' }}>Cómo hacerlo con seguridad:</strong>
          <ol className="steps-list">
            {currentStep.exercise.steps.map((st, idx) => (
              <li key={idx}>{st}</li>
            ))}
          </ol>
          <p className="muted" style={{ marginTop: 10, fontSize: '0.86rem' }}>
            <strong>Precaución:</strong> {currentStep.exercise.safetyNote}
          </p>
        </div>
      )}

      {/* Controles táctiles grandes */}
      <div className="controls-grid">
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => {
            setPaused((p) => !p);
            if (!paused) stopSpeech();
          }}
        >
          {paused ? <Play size={20} /> : <Pause size={20} />}
          <span>{paused ? 'Reanudar' : 'Pausar'}</span>
        </button>

        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => setSecondsLeft(currentStep.durationSec)}
        >
          <RotateCcw size={18} />
          <span>Repetir</span>
        </button>

        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => {
            if (stepIndex + 1 < steps.length) setStepIndex((i) => i + 1);
            else setFinished(true);
          }}
        >
          <SkipForward size={18} />
          <span>Siguiente</span>
        </button>

        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => {
            stopSpeech();
            onExit();
          }}
        >
          Salir
        </button>
      </div>

      {/* Botón permanente de detención por síntomas */}
      <button
        type="button"
        className="btn btn-danger-soft"
        style={{ width: '100%' }}
        onClick={() => {
          setPaused(true);
          stopSpeech();
          setShowStopAlert(true);
        }}
      >
        <AlertOctagon size={20} />
        <span>Detener por síntoma / Signos de alarma</span>
      </button>

      {showStopAlert && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal-box">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#DC2626' }}>
              <AlertOctagon size={28} />
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>Protocolo de detención inmediata</h3>
            </div>
            <p className="muted">
              Detén el ejercicio de inmediato si presentas cualquiera de estos signos:
            </p>
            <ul className="steps-list">
              {STOP_NOW_SYMPTOMS.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
            <div className="card-soft" style={{ background: '#FEF3C7', borderColor: '#FCD34D' }}>
              <strong>Si sientes mareo o bajada de presión:</strong> recuéstate de inmediato con las piernas
              ligeramente elevadas y respira tranquilo. Si los síntomas no ceden o hay dolor en el pecho, llama a
              emergencias (131 en Chile) o acude a urgencias.
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ flex: 1 }}
                onClick={() => {
                  setShowStopAlert(false);
                  setPaused(false);
                }}
              >
                Solo quería revisar (continuar)
              </button>
              <button
                type="button"
                className="btn btn-danger"
                style={{ flex: 1 }}
                onClick={() => handleFinishSave(true)}
              >
                Detener sesión ahora
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

