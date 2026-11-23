import React, { useState } from 'react';
import { AlertTriangle, CheckCircle2, ShieldAlert } from 'lucide-react';
import { PRE_SESSION_RED_FLAGS } from '../data/safety';

interface Props {
  onApprove: () => void;
  onCancel: () => void;
}

export const RedFlagModal: React.FC<Props> = ({ onApprove, onCancel }) => {
  const [checked, setChecked] = useState<string[]>([]);

  const toggle = (id: string) => {
    setChecked((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const hasRedFlag = checked.length > 0;

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="redflag-title">
      <div className="modal-box">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <ShieldAlert size={28} color="#0F766E" />
          <div>
            <h2 id="redflag-title" style={{ fontSize: '1.15rem', fontWeight: 800 }}>
              Chequeo rápido de seguridad
            </h2>
            <p className="muted">Antes de comenzar, marca si presentas alguno de estos síntomas hoy:</p>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {PRE_SESSION_RED_FLAGS.map((item) => {
            const isOn = checked.includes(item.id);
            return (
              <label key={item.id} className={`check-row ${isOn ? 'checked' : ''}`}>
                <input type="checkbox" checked={isOn} onChange={() => toggle(item.id)} />
                <div>
                  <strong style={{ display: 'block', fontSize: '0.95rem' }}>{item.label}</strong>
                  <span className="muted" style={{ fontSize: '0.84rem' }}>
                    {item.detail}
                  </span>
                </div>
              </label>
            );
          })}
        </div>

        {hasRedFlag ? (
          <div className="card-soft" style={{ background: '#FEE2E2', borderColor: '#FCA5A5' }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', color: '#991B1B' }}>
              <AlertTriangle size={22} style={{ flexShrink: 0, marginTop: 2 }} />
              <div>
                <strong>No es seguro iniciar la sesión hoy.</strong>
                <p style={{ fontSize: '0.88rem', marginTop: 4 }}>
                  Por precaución cardiovascular, descansa y consulta con tu médico, cardiólogo o equipo de rehabilitación
                  antes de retomar los ejercicios. Si hay dolor de pecho o falta de aire intensa, acude a urgencias.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="card-soft" style={{ background: '#F0FDFA', borderColor: '#99F6E4' }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', color: '#115E59', fontWeight: 700 }}>
              <CheckCircle2 size={20} />
              <span>Sin signos de alarma marcados. Puedes iniciar con calma.</span>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={onCancel}>
            Volver
          </button>
          {!hasRedFlag && (
            <button type="button" className="btn btn-primary" style={{ flex: 2 }} onClick={onApprove}>
              Estoy bien, comenzar sesión
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

