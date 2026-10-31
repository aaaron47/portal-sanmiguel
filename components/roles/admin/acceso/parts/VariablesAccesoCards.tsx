import React from 'react';
import { Clock, Lock } from 'lucide-react';
import { VariablesAcceso } from '../useControlAcceso';

interface VariablesAccesoCardsProps {
  variables: VariablesAcceso;
  onChange: <K extends keyof VariablesAcceso>(key: K, value: VariablesAcceso[K]) => void;
}

export const VariablesAccesoCards: React.FC<VariablesAccesoCardsProps> = ({ variables, onChange }) => (
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
    {/* Tarjeta 1: Sesión e Inactividad */}
    <div style={{ background: 'var(--bg-card-subtle)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
        <Clock size={18} style={{ color: 'var(--sky-600)' }} />
        <span style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-main)' }}>
          Tiempo de Sesión y Expiración
        </span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.825rem' }}>
        <div>
          <label style={{ display: 'block', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
            Caducidad por inactividad (minutos):
          </label>
          <select
            value={variables.sessionTimeoutMinutes}
            onChange={(e) => onChange('sessionTimeoutMinutes', Number(e.target.value))}
            style={{ width: '100%', padding: '0.45rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-main)' }}
          >
            <option value={15}>15 minutos (Alta seguridad)</option>
            <option value={30}>30 minutos (Recomendado)</option>
            <option value={45}>45 minutos</option>
            <option value={60}>60 minutos (1 hora)</option>
            <option value={120}>120 minutos (2 horas)</option>
          </select>
        </div>

        <div>
          <label style={{ display: 'block', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
            Renovación periódica de contraseña (días):
          </label>
          <select
            value={variables.passwordExpirationDays}
            onChange={(e) => onChange('passwordExpirationDays', Number(e.target.value))}
            style={{ width: '100%', padding: '0.45rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-main)' }}
          >
            <option value={30}>Cada 30 días</option>
            <option value={60}>Cada 60 días</option>
            <option value={90}>Cada 90 días (Estándar)</option>
            <option value={180}>Cada 180 días</option>
          </select>
        </div>
      </div>
    </div>

    {/* Tarjeta 2: Bloqueo y Seguridad de Contraseña */}
    <div style={{ background: 'var(--bg-card-subtle)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
        <Lock size={18} style={{ color: 'var(--sky-600)' }} />
        <span style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-main)' }}>
          Bloqueo de Cuentas y Políticas
        </span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.825rem' }}>
        <div>
          <label style={{ display: 'block', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
            Intentos fallidos antes de bloqueo:
          </label>
          <select
            value={variables.maxFailedLogins}
            onChange={(e) => onChange('maxFailedLogins', Number(e.target.value))}
            style={{ width: '100%', padding: '0.45rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-main)' }}
          >
            <option value={3}>3 intentos fallidos</option>
            <option value={5}>5 intentos fallidos (Recomendado)</option>
            <option value={10}>10 intentos fallidos</option>
          </select>
        </div>

        <div>
          <label style={{ display: 'block', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
            Longitud mínima de contraseña:
          </label>
          <select
            value={variables.minPasswordLength}
            onChange={(e) => onChange('minPasswordLength', Number(e.target.value))}
            style={{ width: '100%', padding: '0.45rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-main)' }}
          >
            <option value={8}>8 caracteres mínimos</option>
            <option value={10}>10 caracteres mínimos</option>
            <option value={12}>12 caracteres mínimos (Máxima robustez)</option>
          </select>
        </div>
      </div>
    </div>
  </div>
);
