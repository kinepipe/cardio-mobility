import React, { useState } from 'react';
import { Bell, CalendarPlus, Check, Plus, Trash2 } from 'lucide-react';
import { POSTURE_META } from '../data/exercises';
import { Posture, ReminderConfig } from '../types';
import { downloadReminderICS, syncNativeReminders } from '../utils/reminders';

interface Props {
  reminders: ReminderConfig[];
  onChange: (next: ReminderConfig[]) => void;
}

const DAY_LABELS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

export const RemindersView: React.FC<Props> = ({ reminders, onChange }) => {
  const [statusMsg, setStatusMsg] = useState<string>('');

  const updateAndSync = async (next: ReminderConfig[]) => {
    onChange(next);
    const res = await syncNativeReminders(next);
    if (res.mode === 'native') {
      setStatusMsg(
        res.granted
          ? `Recordatorios nativos programados en tu teléfono (${res.scheduledCount} alertas semanales).`
          : 'Activa el permiso de notificaciones en los ajustes de Android para recibir alertas.'
      );
    } else {
      setStatusMsg(
        'Guardado en la app. Usa "Agregar al Calendario (.ics)" para que suene siempre aunque la app esté cerrada.'
      );
    }
  };

  const toggleEnabled = (id: string) => {
    updateAndSync(reminders.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r)));
  };

  const toggleDay = (id: string, day: number) => {
    updateAndSync(
      reminders.map((r) => {
        if (r.id !== id) return r;
        const has = r.days.includes(day);
        const days = has ? r.days.filter((d) => d !== day) : [...r.days, day].sort();
        return { ...r, days };
      })
    );
  };

  const updateField = (id: string, patch: Partial<ReminderConfig>) => {
    updateAndSync(reminders.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  };

  const addReminder = () => {
    const next: ReminderConfig = {
      id: `rem_${Date.now()}`,
      label: 'Nueva pausa de movilidad',
      time: '12:00',
      days: [1, 2, 3, 4, 5],
      posture: 'sentado',
      enabled: true,
    };
    updateAndSync([...reminders, next]);
  };

  const removeReminder = (id: string) => {
    updateAndSync(reminders.filter((r) => r.id !== id));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div className="card">
        <div className="section-title">
          <Bell size={22} color="#0F766E" />
          <span>Recordatorios de Movilidad</span>
        </div>
        <p className="muted">
          La evidencia recomienda realizar movilidad suave al menos <strong>2 a 3 días por semana</strong> (y mejor aún
          a diario). En Android APK las alertas se programan nativamente; además puedes exportar cada recordatorio a tu
          calendario con un toque.
        </p>
        {statusMsg && (
          <div className="card-soft" style={{ marginTop: 10, background: '#F0FDFA', borderColor: '#99F6E4', color: '#115E59', fontWeight: 600 }}>
            <Check size={16} style={{ display: 'inline', marginRight: 6 }} />
            {statusMsg}
          </div>
        )}
      </div>

      {reminders.map((rem) => (
        <div key={rem.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
            <input
              type="text"
              value={rem.label}
              onChange={(e) => updateField(rem.id, { label: e.target.value })}
              style={{
                flex: 1,
                fontSize: '1rem',
                fontWeight: 700,
                padding: '8px 10px',
                borderRadius: 10,
                border: '1px solid #CBD5E1',
              }}
            />
            <button
              type="button"
              className={`icon-pill ${rem.enabled ? 'active' : ''}`}
              onClick={() => toggleEnabled(rem.id)}
            >
              {rem.enabled ? 'Activo' : 'Inactivo'}
            </button>
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, minWidth: 120 }}>
              <span className="muted" style={{ fontSize: '0.82rem' }}>Hora</span>
              <input
                type="time"
                value={rem.time}
                onChange={(e) => updateField(rem.id, { time: e.target.value })}
                style={{ padding: '10px', borderRadius: 10, border: '1px solid #CBD5E1', fontSize: '1rem' }}
              />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, minWidth: 150 }}>
              <span className="muted" style={{ fontSize: '0.82rem' }}>Postura sugerida</span>
              <select
                value={rem.posture}
                onChange={(e) => updateField(rem.id, { posture: e.target.value as Posture })}
                style={{ padding: '10px', borderRadius: 10, border: '1px solid #CBD5E1', fontSize: '1rem', background: '#fff' }}
              >
                {(['acostado', 'sentado', 'suelo'] as Posture[]).map((p) => (
                  <option key={p} value={p}>
                    {POSTURE_META[p].label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div>
            <span className="muted" style={{ fontSize: '0.82rem' }}>Días de la semana</span>
            <div className="day-chips">
              {DAY_LABELS.map((lbl, idx) => (
                <button
                  key={lbl}
                  type="button"
                  className={`day-chip ${rem.days.includes(idx) ? 'on' : ''}`}
                  onClick={() => toggleDay(rem.id, idx)}
                >
                  {lbl}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ flex: 1 }}
              onClick={() => downloadReminderICS(rem)}
            >
              <CalendarPlus size={18} />
              <span>Agregar al Calendario (.ics)</span>
            </button>
            {reminders.length > 1 && (
              <button
                type="button"
                className="btn btn-danger-soft"
                onClick={() => removeReminder(rem.id)}
                aria-label="Eliminar recordatorio"
              >
                <Trash2 size={18} />
              </button>
            )}
          </div>
        </div>
      ))}

      <button type="button" className="btn btn-primary" onClick={addReminder}>
        <Plus size={20} />
        <span>Agregar otro recordatorio</span>
      </button>
    </div>
  );
};

