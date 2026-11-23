import React, { useEffect, useState } from 'react';
import { MUSCLE_GROUP_META, POSTURE_META } from '../data/exercises';
import { Exercise } from '../types';
import {
  getActiveJoints,
  getExercisePosePair,
  interpolatePose,
  solveForwardKinematics,
  SolvedSkeleton,
  Vec2,
} from '../utils/kinematicModel';

interface Props {
  exercise: Exercise;
  activePhase?: 1 | 2;
  /** Si true, anima continuamente el esqueleto biomecánico (usado en el reproductor de sesión) */
  animate?: boolean;
}

/**
 * Renderiza el modelo anatómico articulado estilo OpenSim / OpenPose (cadena cinemática conectada FK).
 * - Si existe una ilustración PNG en public/exercises/<id>.png la muestra automáticamente.
 * - De lo contrario renderiza el modelo biomecánico articulado con animación suave de 60 fps
 *   (o comparación lado a lado en el catálogo), destacando las articulaciones objetivo.
 */
export const ExerciseVisual: React.FC<Props> = ({ exercise, activePhase = 1, animate = true }) => {
  const [imgFailed, setImgFailed] = useState(false);
  const [phaseT, setPhaseT] = useState<number>(activePhase === 2 ? 1 : 0);

  useEffect(() => {
    setImgFailed(false);
  }, [exercise.id]);

  // Animación sinusoidal suave (ciclo lento de 5.5 s compatible con ritmo respiratorio anti-Valsalva)
  useEffect(() => {
    if (!animate) {
      setPhaseT(activePhase === 2 ? 1 : 0);
      return;
    }
    let raf = 0;
    const startMs = performance.now();
    const tick = (now: number) => {
      const elapsed = (now - startMs) / 1000;
      const t = 0.5 - 0.5 * Math.cos((elapsed / 5.5) * Math.PI * 2);
      setPhaseT(t);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [animate, exercise.id, activePhase]);

  if (!imgFailed) {
    return (
      <div className="visual-frame">
        <img src={exercise.image} alt={exercise.name} onError={() => setImgFailed(true)} />
      </div>
    );
  }

  const pair = getExercisePosePair(exercise);
  const activeJoints = getActiveJoints(exercise.muscleGroup);

  const renderSurface = (surface: SolvedSkeleton['surface']) => {
    if (surface === 'bed') {
      return (
        <g>
          {/* Base cama clínica */}
          <rect x="28" y="152" width="284" height="24" rx="8" fill="#E2E8F0" stroke="#CBD5E1" strokeWidth="1.5" />
          <rect x="34" y="176" width="12" height="16" rx="3" fill="#94A3B8" />
          <rect x="294" y="176" width="12" height="16" rx="3" fill="#94A3B8" />
          {/* Almohada ergonómica (cabeza siempre nivelada o sobre el corazón) */}
          <path d="M40 152 Q52 128 96 134 Q108 144 106 152 Z" fill="#CCFBF1" stroke="#0F766E" strokeWidth="1.5" />
        </g>
      );
    }
    if (surface === 'chair') {
      return (
        <g>
          {/* Suelo */}
          <line x1="24" y1="184" x2="316" y2="184" stroke="#CBD5E1" strokeWidth="2" />
          {/* Silla firme con respaldo */}
          <rect x="118" y="64" width="10" height="72" rx="5" fill="#94A3B8" />
          <rect x="118" y="130" width="66" height="10" rx="5" fill="#64748B" />
          <line x1="126" y1="140" x2="122" y2="184" stroke="#64748B" strokeWidth="6" strokeLinecap="round" />
          <line x1="176" y1="140" x2="180" y2="184" stroke="#64748B" strokeWidth="6" strokeLinecap="round" />
        </g>
      );
    }
    if (surface === 'mat_quadruped') {
      return (
        <g>
          <rect x="26" y="174" width="288" height="12" rx="6" fill="#99F6E4" stroke="#0F766E" strokeWidth="1.5" />
          {/* Línea de referencia horizontal (cabeza nunca bajo el nivel del corazón) */}
          <line x1="40" y1="114" x2="296" y2="114" stroke="#0F766E" strokeWidth="1" strokeDasharray="4 4" opacity="0.35" />
        </g>
      );
    }
    // Colchoneta con cojín
    return (
      <g>
        <rect x="26" y="166" width="288" height="12" rx="6" fill="#99F6E4" stroke="#0F766E" strokeWidth="1.5" />
        <rect x="44" y="152" width="54" height="14" rx="7" fill="#FEF3C7" stroke="#D97706" strokeWidth="1.2" opacity="0.85" />
      </g>
    );
  };

  const capsule = (a: Vec2, b: Vec2, width: number, fill: string, opacity = 1) => (
    <line
      x1={a.x}
      y1={a.y}
      x2={b.x}
      y2={b.y}
      stroke={fill}
      strokeWidth={width}
      strokeLinecap="round"
      opacity={opacity}
    />
  );

  const jointDot = (pt: Vec2, key: keyof SolvedSkeleton, isSecondary = false) => {
    const isActive = activeJoints.includes(key);
    return (
      <g key={`${key}_${isSecondary ? 's' : 'p'}`}>
        {isActive && (
          <circle cx={pt.x} cy={pt.y} r="10.5" fill="#D97706" opacity="0.22" />
        )}
        <circle
          cx={pt.x}
          cy={pt.y}
          r={isActive ? 5.2 : isSecondary ? 3.2 : 4}
          fill={isActive ? '#D97706' : '#FFFFFF'}
          stroke={isActive ? '#FFFFFF' : '#0F766E'}
          strokeWidth="2"
        />
      </g>
    );
  };

  const renderSkeleton = (sk: SolvedSkeleton) => (
    <g>
      {renderSurface(sk.surface)}

      {/* === LADO LEJANO / IZQUIERDO (profundidad anatómica suave) === */}
      {capsule(sk.pelvis, sk.lKnee, 14, '#64748B', 0.45)}
      {capsule(sk.lKnee, sk.lAnkle, 11, '#64748B', 0.45)}
      {capsule(sk.lAnkle, sk.lToe, 8, '#475569', 0.5)}
      {capsule(sk.shoulder, sk.lElbow, 11, '#0F766E', 0.4)}
      {capsule(sk.lElbow, sk.lWrist, 9, '#0F766E', 0.4)}

      {/* === TRONCO Y COLUMNA (OpenSim axial core) === */}
      {capsule(sk.pelvis, sk.midSpine, 20, '#0F766E', 0.92)}
      {capsule(sk.midSpine, sk.shoulder, 22, '#0F766E', 0.95)}
      {/* Línea esquelética axial */}
      {capsule(sk.pelvis, sk.shoulder, 2.5, '#CCFBF1', 0.85)}

      {/* === CUELLO Y CABEZA === */}
      {capsule(sk.shoulder, sk.head, 8, '#F59E0B', 0.55)}
      <circle cx={sk.head.x} cy={sk.head.y} r="14.5" fill="#FDE68A" stroke="#0F766E" strokeWidth="2.4" />
      {/* Indicador de dirección facial */}
      <circle
        cx={sk.head.x + (sk.surface === 'bed' ? 2 + sk.headTurn : 7 + sk.headTurn * 0.6)}
        cy={sk.head.y - 2}
        r="2.2"
        fill="#1E293B"
      />

      {/* === LADO CERCANO / DERECHO (en primer plano) === */}
      {capsule(sk.pelvis, sk.rKnee, 15, '#1E3A5F', 0.95)}
      {capsule(sk.rKnee, sk.rAnkle, 12, '#1E3A5F', 0.95)}
      {capsule(sk.rAnkle, sk.rToe, 9, '#0F766E', 0.95)}
      {/* Líneas óseas internas estilo OpenPose */}
      {capsule(sk.pelvis, sk.rKnee, 2.2, '#93C5FD', 0.8)}
      {capsule(sk.rKnee, sk.rAnkle, 2.2, '#93C5FD', 0.8)}

      {capsule(sk.shoulder, sk.rElbow, 12, '#115E59', 0.96)}
      {capsule(sk.rElbow, sk.rWrist, 10, '#115E59', 0.96)}
      {capsule(sk.shoulder, sk.rElbow, 2, '#99F6E4', 0.8)}
      {capsule(sk.rElbow, sk.rWrist, 2, '#99F6E4', 0.8)}

      {/* === MARCADORES ARTICULARES ESTILO OPENPOSE / OPENSIM === */}
      {jointDot(sk.pelvis, 'pelvis')}
      {jointDot(sk.midSpine, 'midSpine')}
      {jointDot(sk.shoulder, 'shoulder')}
      {jointDot(sk.head, 'head')}
      {jointDot(sk.rElbow, 'rElbow')}
      {jointDot(sk.rWrist, 'rWrist', true)}
      {jointDot(sk.rKnee, 'rKnee')}
      {jointDot(sk.rAnkle, 'rAnkle')}
      {jointDot(sk.rToe, 'rToe', true)}
    </g>
  );

  const currentSk = solveForwardKinematics(interpolatePose(pair.start, pair.end, phaseT));
  const ghostEndSk = solveForwardKinematics(pair.end);

  return (
    <div className="visual-frame" style={{ padding: '12px' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 8,
          flexWrap: 'wrap',
          gap: 6,
        }}
      >
        <span className="badge">{POSTURE_META[exercise.posture].label}</span>
        <span className="badge badge-warn">
          {MUSCLE_GROUP_META[exercise.muscleGroup].label} · Modelo Biomecánico
        </span>
      </div>

      <div
        style={{
          background: '#FFFFFF',
          borderRadius: 14,
          border: '1.5px solid #E2E8F0',
          padding: '6px 8px',
          position: 'relative',
        }}
      >
        <svg viewBox="0 0 340 200" style={{ width: '100%', height: 'auto', display: 'block' }}>
          {/* Cuadrícula biomecánica sutil de referencia */}
          <defs>
            <pattern id={`grid_${exercise.id}`} width="24" height="24" patternUnits="userSpaceOnUse">
              <path d="M 24 0 L 0 0 0 24" fill="none" stroke="#F1F5F9" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="340" height="200" fill={`url(#grid_${exercise.id})`} />

          {/* Silueta fantasma de rango objetivo (posición final) */}
          <g opacity="0.16">{renderSkeleton(ghostEndSk)}</g>

          {/* Modelo articulado activo conectado por Forward Kinematics */}
          {renderSkeleton(currentSk)}
        </svg>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '0.76rem',
            color: '#475569',
            padding: '2px 6px 4px',
            fontWeight: 600,
          }}
        >
          <span>{phaseT < 0.5 ? 'Fase: Posición inicial → movimiento' : 'Fase: Mantener y volver despacio'}</span>
          <span style={{ color: '#D97706' }}>● Articulación activa</span>
        </div>
      </div>
    </div>
  );
};
