import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  Bell,
  BookOpen,
  Heart,
  Play,
  Sliders,
  Type,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { POSTURE_META } from './data/exercises';
import { ClinicalProfile, Posture, ReminderConfig, SessionDuration, SessionRecord, SessionStep } from './types';
import { buildSession } from './utils/sessionBuilder';
import {
  appendHistory,
  getNextVariantForPosture,
  loadHistory,
  loadProfile,
  loadReminders,
  markVariantCompleted,
  saveProfile,
  saveReminders,
} from './utils/storage';
import { RedFlagModal } from './components/RedFlagModal';
import { SessionPlayer } from './components/SessionPlayer';
import { RemindersView } from './components/RemindersView';
import { CatalogView } from './components/CatalogView';
import { ProfileView } from './components/ProfileView';

type Tab = 'inicio' | 'catalogo' | 'recordatorios' | 'perfil';

export default function App() {
  const [tab, setTab] = useState<Tab>('inicio');
  const [profile, setProfile] = useState<ClinicalProfile>(() => loadProfile());
  const [history, setHistory] = useState<SessionRecord[]>(() => loadHistory());
  const [reminders, setReminders] = useState<ReminderConfig[]>(() => loadReminders());

  const [posture, setPosture] = useState<Posture>('sentado');
  const [duration, setDuration] = useState<SessionDuration>('estandar');
  const [showRedFlag, setShowRedFlag] = useState(false);
  const [activeSteps, setActiveSteps] = useState<SessionStep[] | null>(null);
  const [activeVariant, setActiveVariant] = useState<'A' | 'B'>('A');

  useEffect(() => {
    saveProfile(profile);
    document.body.classList.toggle('large-text', profile.largeText);
  }, [profile]);

  const nextVariant = useMemo(() => getNextVariantForPosture(posture), [posture, history.length]);

  const previewSession = useMemo(
    () => buildSession(posture, duration, profile, nextVariant),
    [posture, duration, profile, nextVariant]
  );

  const handleStartApproved = () => {
    setShowRedFlag(false);
    setActiveVariant(nextVariant);
    setActiveSteps(previewSession.steps);
  };

  const handleSessionComplete = (res: {
    completedExercises: number;
    totalMinutes: number;
    borgScore: number | null;
    stoppedBySymptom: boolean;
  }) => {
    const rec: SessionRecord = {
      id: `ses_${Date.now()}`,
      dateISO: new Date().toISOString(),
      posture,
      duration,
      completedExercises: res.completedExercises,
      totalMinutes: res.totalMinutes,
      borgScore: res.borgScore,
      stoppedBySymptom: res.stoppedBySymptom,
      variantUsed: activeVariant,
    };
    const nextHist = appendHistory(rec);
    setHistory(nextHist);
    if (!res.stoppedBySymptom) {
      markVariantCompleted(posture, activeVariant);
    }
    setActiveSteps(null);
    setTab('inicio');
  };

  return (
    <div className="app-shell">
      <header className="top-bar">
        <div className="brand">
          <div className="brand-icon">
            <Heart size={22} />
          </div>
          <div>
            <h1>Cardio Mobility</h1>
            <span>Movilidad cardiovascular segura</span>
          </div>
        </div>
        <div className="top-actions">
          <button
            type="button"
            className={`icon-pill ${profile.largeText ? 'active' : ''}`}
            onClick={() => setProfile((p) => ({ ...p, largeText: !p.largeText }))}
            title="Cambiar tamaño de letra"
            aria-label="Cambiar tamaño de letra"
          >
            <Type size={18} />
          </button>
          <button
            type="button"
            className={`icon-pill ${profile.audioEnabled ? 'active' : ''}`}
            onClick={() => setProfile((p) => ({ ...p, audioEnabled: !p.audioEnabled }))}
            title="Activar o silenciar voz guiada"
            aria-label="Activar o silenciar voz guiada"
          >
            {profile.audioEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
          </button>
        </div>
      </header>

      <main className="main-content">
        {activeSteps ? (
          <SessionPlayer
            steps={activeSteps}
            posture={posture}
            duration={duration}
            profile={profile}
            onToggleAudio={() => setProfile((p) => ({ ...p, audioEnabled: !p.audioEnabled }))}
            onComplete={handleSessionComplete}
            onExit={() => setActiveSteps(null)}
          />
        ) : tab === 'inicio' ? (
          <>
            <div className="card">
              <div className="section-title">
                <Activity size={22} color="#0F766E" />
                <span>¿Cómo te sientes hoy? Elige tu postura</span>
              </div>
              <p className="muted">
                Todos los ejercicios evitan aguantar la respiración (anti-Valsalva) y mantienen tu cabeza en posición
                segura.
              </p>

              <div className="posture-grid">
                {(['acostado', 'sentado', 'suelo'] as Posture[]).map((p) => (
                  <button
                    key={p}
                    type="button"
                    className={`posture-card ${posture === p ? 'selected' : ''}`}
                    onClick={() => setPosture(p)}
                  >
                    <strong>{POSTURE_META[p].label}</strong>
                    <span className="muted" style={{ fontSize: '0.86rem' }}>
                      {POSTURE_META[p].feeling}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="card">
              <strong style={{ display: 'block', fontSize: '1rem' }}>Duración de tu sesión automática</strong>
              <p className="muted" style={{ fontSize: '0.86rem' }}>
                Hoy toca <strong>Variante {nextVariant}</strong> (alternamos los ejercicios por grupo muscular en cada
                sesión).
              </p>

              <div className="duration-row">
                <button
                  type="button"
                  className={`pill-btn ${duration === 'corta' ? 'selected' : ''}`}
                  onClick={() => setDuration('corta')}
                >
                  <span>Suave</span>
                  <small>5 ejercicios</small>
                </button>
                <button
                  type="button"
                  className={`pill-btn ${duration === 'estandar' ? 'selected' : ''}`}
                  onClick={() => setDuration('estandar')}
                >
                  <span>Estándar</span>
                  <small>7 ejercicios</small>
                </button>
                <button
                  type="button"
                  className={`pill-btn ${duration === 'completa' ? 'selected' : ''}`}
                  onClick={() => setDuration('completa')}
                >
                  <span>Completa</span>
                  <small>10 ejercicios</small>
                </button>
              </div>

              <div className="card-soft" style={{ marginTop: 14, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                <span>
                  <strong>Duración estimada:</strong> ~{previewSession.estimatedMinutes} minutos
                </span>
                <span className="badge">
                  {previewSession.exercises.length} ejercicios · Calentamiento + Enfriamiento
                </span>
              </div>

              {profile.recentDeviceUnder6Weeks && (
                <p className="muted" style={{ marginTop: 8, color: '#92400E', fontWeight: 600 }}>
                  Filtro activo: Marcapasos/DAI &lt; 6 semanas (sin elevación de hombro &gt; 60°–90°).
                </p>
              )}

              <button
                type="button"
                className="btn btn-primary"
                style={{ marginTop: 14 }}
                onClick={() => setShowRedFlag(true)}
              >
                <Play size={20} />
                <span>Iniciar sesión guiada</span>
              </button>
            </div>

            <div className="card-soft" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
              <div>
                <strong>Sesiones registradas: {history.length}</strong>
                <p className="muted" style={{ fontSize: '0.84rem' }}>
                  Objetivo recomendado: 2–3 veces por semana (o pausas diarias suaves).
                </p>
              </div>
              <button type="button" className="btn btn-secondary" onClick={() => setTab('recordatorios')}>
                <Bell size={18} />
                <span>Configurar recordatorios</span>
              </button>
            </div>
          </>
        ) : tab === 'catalogo' ? (
          <CatalogView profile={profile} />
        ) : tab === 'recordatorios' ? (
          <RemindersView
            reminders={reminders}
            onChange={(next) => {
              setReminders(next);
              saveReminders(next);
            }}
          />
        ) : (
          <ProfileView profile={profile} history={history} onChange={setProfile} />
        )}
      </main>

      {!activeSteps && (
        <nav className="bottom-nav" aria-label="Navegación principal">
          <button type="button" className={`nav-item ${tab === 'inicio' ? 'active' : ''}`} onClick={() => setTab('inicio')}>
            <Activity size={20} />
            <span>Inicio</span>
          </button>
          <button type="button" className={`nav-item ${tab === 'catalogo' ? 'active' : ''}`} onClick={() => setTab('catalogo')}>
            <BookOpen size={20} />
            <span>Ejercicios</span>
          </button>
          <button
            type="button"
            className={`nav-item ${tab === 'recordatorios' ? 'active' : ''}`}
            onClick={() => setTab('recordatorios')}
          >
            <Bell size={20} />
            <span>Alertas</span>
          </button>
          <button type="button" className={`nav-item ${tab === 'perfil' ? 'active' : ''}`} onClick={() => setTab('perfil')}>
            <Sliders size={20} />
            <span>Seguridad</span>
          </button>
        </nav>
      )}

      {showRedFlag && (
        <RedFlagModal onApprove={handleStartApproved} onCancel={() => setShowRedFlag(false)} />
      )}
    </div>
  );
}

