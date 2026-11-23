import React, { useEffect, useState } from 'react';
import { MUSCLE_GROUP_META, POSTURE_META } from '../data/exercises';
import { Exercise } from '../types';

interface Props {
  exercise: Exercise;
  activePhase?: 1 | 2;
}

/**
 * Muestra la ilustración clínica paso a paso (PNG generada en public/exercises/<id>.png).
 * Si el archivo PNG aún no existe, renderiza una lámina clínica SVG de 2 pasos
 * (1. Posición Inicial -> 2. Movimiento Suave) adaptada a la postura y grupo muscular.
 */
export const ExerciseVisual: React.FC<Props> = ({ exercise, activePhase = 1 }) => {
  const [imgFailed, setImgFailed] = useState(false);

  useEffect(() => {
    setImgFailed(false);
  }, [exercise.id]);

  if (!imgFailed) {
    return (
      <div className="visual-frame">
        <img
          src={exercise.image}
          alt={exercise.name}
          onError={() => setImgFailed(true)}
        />
      </div>
    );
  }

  const jointHighlight = (phase: 1 | 2) => {
    const isEnd = phase === 2;
    const dx = isEnd ? 10 : 0;
    const dy = isEnd ? -10 : 0;

    if (exercise.posture === 'acostado') {
      // Silueta acostada en cama con almohada (cabeza siempre elevada)
      return (
        <g>
          {/* Cama y almohada */}
          <rect x="20" y="128" width="220" height="22" rx="8" fill="#E2E8F0" />
          <rect x="24" y="108" width="44" height="20" rx="10" fill="#CCFBF1" stroke="#0F766E" strokeWidth="2" />
          {/* Cabeza */}
          <circle
            cx={48 + (exercise.muscleGroup === 'cuello_hombros' && isEnd ? 4 : 0)}
            cy="96"
            r="15"
            fill="#FDE68A"
            stroke="#0F766E"
            strokeWidth="2.5"
          />
          {/* Torso */}
          <line x1="63" y1="108" x2="145" y2="112" stroke="#0F766E" strokeWidth="14" strokeLinecap="round" />
          {/* Brazo */}
          <line
            x1="82"
            y1="108"
            x2={120 + (exercise.muscleGroup === 'cuello_hombros' ? dx : 0)}
            y2={116 + (exercise.muscleGroup === 'torax_columna' ? dy * 0.6 : 0)}
            stroke="#115E59"
            strokeWidth="8"
            strokeLinecap="round"
          />
          {/* Pierna / Rodilla / Tobillo */}
          <line
            x1="145"
            y1="112"
            x2={182 + (exercise.muscleGroup === 'caderas_pelvis' && isEnd ? -18 : 0)}
            y2={
              exercise.muscleGroup === 'caderas_pelvis' && isEnd
                ? 78
                : exercise.muscleGroup === 'rodillas_piernas' && isEnd
                ? 88
                : 112
            }
            stroke="#1E3A5F"
            strokeWidth="10"
            strokeLinecap="round"
          />
          <line
            x1={182 + (exercise.muscleGroup === 'caderas_pelvis' && isEnd ? -18 : 0)}
            y1={
              exercise.muscleGroup === 'caderas_pelvis' && isEnd
                ? 78
                : exercise.muscleGroup === 'rodillas_piernas' && isEnd
                ? 88
                : 112
            }
            x2={220 + (exercise.muscleGroup === 'rodillas_piernas' && isEnd ? -16 : 0)}
            y2={114 + (exercise.muscleGroup === 'tobillos_pies' && isEnd ? -10 : 0)}
            stroke="#1E3A5F"
            strokeWidth="9"
            strokeLinecap="round"
          />
          {/* Pie */}
          <line
            x1={220 + (exercise.muscleGroup === 'rodillas_piernas' && isEnd ? -16 : 0)}
            y1={114 + (exercise.muscleGroup === 'tobillos_pies' && isEnd ? -10 : 0)}
            x2={232 + (exercise.muscleGroup === 'tobillos_pies' && isEnd ? -8 : 0)}
            y2={102 + (exercise.muscleGroup === 'tobillos_pies' && isEnd ? -10 : 8)}
            stroke="#0F766E"
            strokeWidth="7"
            strokeLinecap="round"
          />
        </g>
      );
    }

    if (exercise.posture === 'sentado') {
      // Silueta sentada en silla estable
      return (
        <g>
          {/* Silla */}
          <line x1="76" y1="62" x2="76" y2="152" stroke="#94A3B8" strokeWidth="6" strokeLinecap="round" />
          <line x1="76" y1="112" x2="146" y2="112" stroke="#94A3B8" strokeWidth="7" strokeLinecap="round" />
          <line x1="140" y1="112" x2="140" y2="152" stroke="#94A3B8" strokeWidth="6" strokeLinecap="round" />
          {/* Cabeza */}
          <circle
            cx={102 + (exercise.muscleGroup === 'cuello_hombros' && isEnd ? 8 : 0)}
            cy="42"
            r="15"
            fill="#FDE68A"
            stroke="#0F766E"
            strokeWidth="2.5"
          />
          {/* Torso */}
          <line
            x1={102 + (exercise.muscleGroup === 'torax_columna' && isEnd ? 6 : 0)}
            y1="58"
            x2="100"
            y2="106"
            stroke="#0F766E"
            strokeWidth="14"
            strokeLinecap="round"
          />
          {/* Brazo */}
          <line
            x1="102"
            y1="68"
            x2={132 + (exercise.muscleGroup === 'cuello_hombros' || exercise.muscleGroup === 'torax_columna' ? dx : 0)}
            y2={94 + (exercise.muscleGroup === 'cuello_hombros' ? dy * 0.5 : 0)}
            stroke="#115E59"
            strokeWidth="8"
            strokeLinecap="round"
          />
          {/* Muslo */}
          <line
            x1="100"
            y1="106"
            x2="152"
            y2={106 + (exercise.muscleGroup === 'caderas_pelvis' && isEnd ? -16 : 0)}
            stroke="#1E3A5F"
            strokeWidth="10"
            strokeLinecap="round"
          />
          {/* Pierna inferior */}
          <line
            x1="152"
            y1={106 + (exercise.muscleGroup === 'caderas_pelvis' && isEnd ? -16 : 0)}
            x2={156 + (exercise.muscleGroup === 'rodillas_piernas' && isEnd ? 46 : 0)}
            y2={148 + (exercise.muscleGroup === 'rodillas_piernas' && isEnd ? -34 : 0)}
            stroke="#1E3A5F"
            strokeWidth="9"
            strokeLinecap="round"
          />
          {/* Pie */}
          <line
            x1={156 + (exercise.muscleGroup === 'rodillas_piernas' && isEnd ? 46 : 0)}
            y1={148 + (exercise.muscleGroup === 'rodillas_piernas' && isEnd ? -34 : 0)}
            x2={176 + (exercise.muscleGroup === 'rodillas_piernas' && isEnd ? 46 : 0)}
            y2={148 + (exercise.muscleGroup === 'tobillos_pies' && isEnd ? -14 : 0) + (exercise.muscleGroup === 'rodillas_piernas' && isEnd ? -36 : 0)}
            stroke="#0F766E"
            strokeWidth="7"
            strokeLinecap="round"
          />
        </g>
      );
    }

    // Postura suelo / colchoneta (cabeza siempre nivelada o sobre corazón)
    return (
      <g>
        {/* Colchoneta */}
        <rect x="20" y="138" width="220" height="12" rx="6" fill="#99F6E4" stroke="#0F766E" strokeWidth="1.5" />
        {/* Cojín */}
        <rect x="64" y="124" width="38" height="14" rx="6" fill="#FEF3C7" stroke="#D97706" strokeWidth="1.5" />
        {/* Cabeza */}
        <circle
          cx={84 + (exercise.muscleGroup === 'cuello_hombros' && isEnd ? 6 : 0)}
          cy="62"
          r="15"
          fill="#FDE68A"
          stroke="#0F766E"
          strokeWidth="2.5"
        />
        {/* Torso erguido en colchoneta */}
        <line
          x1={84 + (exercise.muscleGroup === 'torax_columna' && isEnd ? 12 : 0)}
          y1="78"
          x2="84"
          y2="124"
          stroke="#0F766E"
          strokeWidth="14"
          strokeLinecap="round"
        />
        {/* Brazo */}
        <line
          x1="84"
          y1="88"
          x2={116 + (exercise.muscleGroup === 'torax_columna' || exercise.muscleGroup === 'cuello_hombros' ? dx : 0)}
          y2={108 + (exercise.muscleGroup === 'torax_columna' ? dy : 0)}
          stroke="#115E59"
          strokeWidth="8"
          strokeLinecap="round"
        />
        {/* Piernas */}
        <line
          x1="84"
          y1="126"
          x2={150 + (exercise.muscleGroup === 'caderas_pelvis' && isEnd ? -12 : 0)}
          y2={126 + (exercise.muscleGroup === 'rodillas_piernas' && isEnd ? -26 : 0)}
          stroke="#1E3A5F"
          strokeWidth="10"
          strokeLinecap="round"
        />
        <line
          x1={150 + (exercise.muscleGroup === 'caderas_pelvis' && isEnd ? -12 : 0)}
          y1={126 + (exercise.muscleGroup === 'rodillas_piernas' && isEnd ? -26 : 0)}
          x2="205"
          y2={132 + (exercise.muscleGroup === 'tobillos_pies' && isEnd ? -12 : 0)}
          stroke="#1E3A5F"
          strokeWidth="9"
          strokeLinecap="round"
        />
      </g>
    );
  };

  return (
    <div className="visual-frame" style={{ padding: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, flexWrap: 'wrap', gap: 6 }}>
        <span className="badge">{POSTURE_META[exercise.posture].label}</span>
        <span className="badge badge-warn">{MUSCLE_GROUP_META[exercise.muscleGroup].label} · Variante {exercise.variant}</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {([1, 2] as const).map((stepNum) => (
          <div
            key={stepNum}
            style={{
              background: '#FFFFFF',
              borderRadius: 12,
              border: activePhase === stepNum ? '2.5px solid #0F766E' : '1px solid #E2E8F0',
              padding: 6,
              transition: 'border-color 0.3s ease',
            }}
          >
            <div
              style={{
                fontSize: '0.75rem',
                fontWeight: 800,
                color: activePhase === stepNum ? '#0F766E' : '#64748B',
                marginBottom: 4,
                textAlign: 'center',
              }}
            >
              {stepNum === 1 ? '1. Posición inicial' : '2. Movimiento suave'}
            </div>
            <svg viewBox="0 0 260 165" style={{ width: '100%', height: 'auto', display: 'block' }}>
              {jointHighlight(stepNum)}
              {stepNum === 2 && (
                <path
                  d="M210 38 Q228 24 238 42"
                  fill="none"
                  stroke="#D97706"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              )}
            </svg>
          </div>
        ))}
      </div>
    </div>
  );
};

