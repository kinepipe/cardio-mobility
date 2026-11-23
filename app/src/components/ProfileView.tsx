import React from 'react';
import { HeartPulse, ShieldCheck, Sliders } from 'lucide-react';
import { EVIDENCE_SUMMARY } from '../data/safety';
import { ClinicalProfile, SessionRecord } from '../types';
import { POSTURE_META } from '../data/exercises';

interface Props {
  profile: ClinicalProfile;
  history: SessionRecord[];
  onChange: (next: ClinicalProfile) => void;
}

export const ProfileView: React.FC<Props> = ({ profile, history, onChange }) => {
  const toggle = (key: keyof ClinicalProfile) => {
    onChange({ ...profile, [key]: !profile[key] });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div className="card">
        <div className="section-title">
          <Sliders size={22} color="#0F766E" />
          <span>Perfil Clínico de Seguridad (100% Local)</span>
        </div>
        <p className="muted">
          Estos ajustes se guardan solo en tu teléfono y adaptan automáticamente los ejercicios y tiempos a tus
          necesidades cardiovasculares.
        </p>

        <div style={{ marginTop: 10 }}>
          <div className="switch-row">
            <div>
              <strong>Marcapasos o DAI reciente (&lt; 6 semanas)</strong>
              <p className="muted" style={{ fontSize: '0.84rem' }}>
                Filtra automáticamente ejercicios que eleven el brazo sobre 60°–90°.
              </p>
            </div>
            <button
              type="button"
              className={`icon-pill ${profile.recentDeviceUnder6Weeks ? 'active' : ''}`}
              onClick={() => toggle('recentDeviceUnder6Weeks')}
            >
              {profile.recentDeviceUnder6Weeks ? 'Sí' : 'No'}
            </button>
          </div>

          <div className="switch-row">
            <div>
              <strong>Uso de betabloqueantes</strong>
              <p className="muted" style={{ fontSize: '0.84rem' }}>
                Prioriza el control por Escala de Borg CR10 (2–4) y Prueba del Habla en lugar de pulso.
              </p>
            </div>
            <button
              type="button"
              className={`icon-pill ${profile.usesBetaBlockers ? 'active' : ''}`}
              onClick={() => toggle('usesBetaBlockers')}
            >
              {profile.usesBetaBlockers ? 'Sí' : 'No'}
            </button>
          </div>

          <div className="switch-row">
            <div>
              <strong>Adulto mayor (≥ 65 años)</strong>
              <p className="muted" style={{ fontSize: '0.84rem' }}>
                Ajusta estiramientos a 35–40 segundos y amplía las pausas de transición (ACSM).
              </p>
            </div>
            <button
              type="button"
              className={`icon-pill ${profile.isOlderAdult ? 'active' : ''}`}
              onClick={() => toggle('isOlderAdult')}
            >
              {profile.isOlderAdult ? 'Sí' : 'No'}
            </button>
          </div>

          <div className="switch-row">
            <div>
              <strong>Tamaño de letra grande</strong>
              <p className="muted" style={{ fontSize: '0.84rem' }}>
                Facilita la lectura durante las sesiones guiadas.
              </p>
            </div>
            <button
              type="button"
              className={`icon-pill ${profile.largeText ? 'active' : ''}`}
              onClick={() => toggle('largeText')}
            >
              {profile.largeText ? 'Activado' : 'Normal'}
            </button>
          </div>
        </div>
      </div>

      {/* Historial reciente */}
      <div className="card">
        <div className="section-title">
          <HeartPulse size={22} color="#0F766E" />
          <span>Historial Reciente ({history.length})</span>
        </div>
        {history.length === 0 ? (
          <p className="muted">Aún no registras sesiones completadas. ¡Tu primera sesión aparecerá aquí!</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
            {history.slice(0, 8).map((h) => (
              <div key={h.id} className="card-soft" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                <div>
                  <strong>{POSTURE_META[h.posture].label}</strong> · Variante {h.variantUsed}
                  <div className="muted" style={{ fontSize: '0.82rem' }}>
                    {new Date(h.dateISO).toLocaleDateString('es-CL', { weekday: 'short', day: 'numeric', month: 'short' })} ·{' '}
                    {h.totalMinutes} min · {h.completedExercises} bloques
                  </div>
                </div>
                {h.stoppedBySymptom ? (
                  <span className="badge badge-danger">Detenida por síntoma</span>
                ) : (
                  <span className="badge">Borg {h.borgScore ?? '—'}</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Respaldo basado en evidencia */}
      <div className="card">
        <div className="section-title">
          <ShieldCheck size={22} color="#0F766E" />
          <span>Base Científica y Seguridad</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
          {EVIDENCE_SUMMARY.map((e, i) => (
            <div key={i} className="card-soft">
              <strong style={{ display: 'block', marginBottom: 4, fontSize: '0.94rem' }}>{e.title}</strong>
              <p className="muted" style={{ fontSize: '0.86rem' }}>{e.text}</p>
            </div>
          ))}
        </div>
        <p className="muted" style={{ marginTop: 12, fontSize: '0.8rem' }}>
          Nota clínica: Esta aplicación es una guía educativa de movilidad suave complementaria y no reemplaza la
          valoración médica ni un programa de rehabilitación cardíaca supervisada.
        </p>
      </div>
    </div>
  );
};

