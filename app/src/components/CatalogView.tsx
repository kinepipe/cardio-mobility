import React, { useState } from 'react';
import { BookOpen, Eye } from 'lucide-react';
import { EXERCISES, MUSCLE_GROUP_META, POSTURE_META } from '../data/exercises';
import { ClinicalProfile, Exercise, Posture } from '../types';
import { OpenSimViewer3D } from './OpenSimViewer3D';

interface Props {
  profile: ClinicalProfile;
}

export const CatalogView: React.FC<Props> = ({ profile }) => {
  const [posture, setPosture] = useState<Posture>('sentado');
  const filtered = EXERCISES.filter((e) => e.posture === posture);
  const [selectedEx, setSelectedEx] = useState<Exercise>(filtered[0]);

  const handlePostureChange = (next: Posture) => {
    setPosture(next);
    const first = EXERCISES.find((e) => e.posture === next);
    if (first) setSelectedEx(first);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div className="card">
        <div className="section-title">
          <BookOpen size={22} color="#0F766E" />
          <span>Catálogo de 30 Ejercicios Seguros (Visor 3D)</span>
        </div>
        <p className="muted">
          Toca cualquier ejercicio para inspeccionar su movimiento en el <strong>modelo anatómico 3D estilo OpenSim</strong>.
        </p>

        <div className="duration-row" style={{ marginTop: 12 }}>
          {(['acostado', 'sentado', 'suelo'] as Posture[]).map((p) => (
            <button
              key={p}
              type="button"
              className={`pill-btn ${posture === p ? 'selected' : ''}`}
              onClick={() => handlePostureChange(p)}
            >
              <span>{POSTURE_META[p].short}</span>
              <small>10 ejercicios</small>
            </button>
          ))}
        </div>
      </div>

      {/* Visor 3D único compartido (óptimo para GPU móvil Android) */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <h3 style={{ fontSize: '1.08rem', fontWeight: 800, color: '#115E59' }}>{selectedEx.name}</h3>
        <OpenSimViewer3D exercise={selectedEx} height={260} />
        <ol className="steps-list" style={{ fontSize: '0.92rem' }}>
          {selectedEx.steps.map((s, i) => (
            <li key={i}>{s}</li>
          ))}
        </ol>
        <p className="muted" style={{ fontSize: '0.86rem' }}>
          <strong>Respiración:</strong> {selectedEx.breathingCue}
        </p>
        <p className="muted" style={{ fontSize: '0.84rem' }}>
          <strong>Seguridad:</strong> {selectedEx.safetyNote}
        </p>
      </div>

      {/* Selector de los 10 ejercicios de la postura */}
      <div className="catalog-grid">
        {filtered.map((ex) => {
          const isSelected = selectedEx.id === ex.id;
          const adaptedByDevice = profile.recentDeviceUnder6Weeks && ex.shoulderCaution;
          return (
            <button
              key={ex.id}
              type="button"
              onClick={() => setSelectedEx(ex)}
              className={`posture-card ${isSelected ? 'selected' : ''}`}
            >
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                <span className="badge">{MUSCLE_GROUP_META[ex.muscleGroup].short}</span>
                <span className="badge badge-warn">Var. {ex.variant}</span>
                {adaptedByDevice && <span className="badge badge-danger">Omitido DAI &lt;6 sem</span>}
              </div>
              <strong style={{ marginTop: 4 }}>{ex.name}</strong>
              <span className="muted" style={{ fontSize: '0.84rem', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <Eye size={14} /> {isSelected ? 'Viendo ahora en 3D' : 'Tocar para ver en 3D'}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
