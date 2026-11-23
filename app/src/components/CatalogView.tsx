import React, { useState } from 'react';
import { BookOpen } from 'lucide-react';
import { EXERCISES, MUSCLE_GROUP_META, POSTURE_META } from '../data/exercises';
import { ClinicalProfile, Posture } from '../types';
import { ExerciseVisual } from './ExerciseVisual';

interface Props {
  profile: ClinicalProfile;
}

export const CatalogView: React.FC<Props> = ({ profile }) => {
  const [posture, setPosture] = useState<Posture>('sentado');

  const filtered = EXERCISES.filter((e) => e.posture === posture);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div className="card">
        <div className="section-title">
          <BookOpen size={22} color="#0F766E" />
          <span>Catálogo de 30 Ejercicios Seguros</span>
        </div>
        <p className="muted">
          2 variantes rotativas (A y B) por cada grupo muscular en las 3 posturas. La app los alterna automáticamente
          entre sesiones.
        </p>

        <div className="duration-row" style={{ marginTop: 12 }}>
          {(['acostado', 'sentado', 'suelo'] as Posture[]).map((p) => (
            <button
              key={p}
              type="button"
              className={`pill-btn ${posture === p ? 'selected' : ''}`}
              onClick={() => setPosture(p)}
            >
              <span>{POSTURE_META[p].short}</span>
              <small>10 ejercicios</small>
            </button>
          ))}
        </div>
      </div>

      <div className="catalog-grid">
        {filtered.map((ex) => {
          const adaptedByDevice = profile.recentDeviceUnder6Weeks && ex.shoulderCaution;
          return (
            <div key={ex.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <ExerciseVisual exercise={ex} activePhase={2} />
              <div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 4 }}>
                  <span className="badge">{MUSCLE_GROUP_META[ex.muscleGroup].short}</span>
                  <span className="badge badge-warn">Variante {ex.variant}</span>
                  {adaptedByDevice && (
                    <span className="badge badge-danger">Omitido por Marcapasos/DAI &lt;6 sem</span>
                  )}
                </div>
                <h3 style={{ fontSize: '1.02rem', fontWeight: 800 }}>{ex.name}</h3>
              </div>
              <ol className="steps-list" style={{ fontSize: '0.9rem' }}>
                {ex.steps.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ol>
              <p className="muted" style={{ fontSize: '0.84rem' }}>
                <strong>Respiración:</strong> {ex.breathingCue}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

