import React from 'react';
import { Clock, Lock, KeyRound } from 'lucide-react';
import { VariablesAcceso } from '../useControlAcceso';

interface VariablesAccesoCardsProps {
  variables: VariablesAcceso;
  onChange: <K extends keyof VariablesAcceso>(key: K, value: VariablesAcceso[K]) => void;
}

type CampoPolitica = 'sessionTimeoutMinutes' | 'maxFailedLogins' | 'lockoutMinutes' | 'minPasswordLength';

/** Valores que acepta el backend (otro valor → 422). */
const OPCIONES: Record<CampoPolitica, { valor: number; texto: string }[]> = {
  sessionTimeoutMinutes: [
    { valor: 15, texto: '15 minutos (alta seguridad)' },
    { valor: 30, texto: '30 minutos (recomendado)' },
    { valor: 45, texto: '45 minutos' },
    { valor: 60, texto: '60 minutos (1 hora)' },
    { valor: 120, texto: '120 minutos (2 horas)' },
  ],
  maxFailedLogins: [
    { valor: 3, texto: '3 intentos' },
    { valor: 5, texto: '5 intentos (recomendado)' },
    { valor: 10, texto: '10 intentos' },
  ],
  lockoutMinutes: [
    { valor: 5, texto: '5 minutos' },
    { valor: 15, texto: '15 minutos (recomendado)' },
    { valor: 30, texto: '30 minutos' },
    { valor: 60, texto: '60 minutos' },
  ],
  minPasswordLength: [
    { valor: 8, texto: '8 caracteres (recomendado)' },
    { valor: 10, texto: '10 caracteres' },
    { valor: 12, texto: '12 caracteres (máxima seguridad)' },
  ],
};

const estiloTarjeta: React.CSSProperties = {
  background: 'var(--bg-card-subtle)',
  border: '1px solid var(--border-color)',
  borderRadius: '10px',
  padding: '1rem',
};
const estiloSelect: React.CSSProperties = {
  width: '100%',
  padding: '0.45rem',
  borderRadius: '6px',
  border: '1px solid var(--border-color)',
  background: 'var(--bg-card)',
  color: 'var(--text-main)',
};
const estiloAyuda: React.CSSProperties = { fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0.35rem 0 0', lineHeight: 1.4 };

const Titulo: React.FC<{ icono: React.ReactNode; texto: string }> = ({ icono, texto }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
    {icono}
    <span style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-main)' }}>{texto}</span>
  </div>
);

export const VariablesAccesoCards: React.FC<VariablesAccesoCardsProps> = ({ variables, onChange }) => {
  const Selector = ({ campo, etiqueta }: { campo: CampoPolitica; etiqueta: string }) => {
    const opciones = OPCIONES[campo];
    // Si el servidor guardó un valor que no está en la lista, se muestra igual para no cambiarlo sin querer.
    const lista = opciones.some((o) => o.valor === variables[campo])
      ? opciones
      : [...opciones, { valor: variables[campo], texto: String(variables[campo]) }];
    return (
      <div>
        <label htmlFor={`politica-${campo}`} style={{ display: 'block', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
          {etiqueta}
        </label>
        <select
          id={`politica-${campo}`}
          value={variables[campo]}
          onChange={(e) => onChange(campo, Number(e.target.value))}
          style={estiloSelect}
        >
          {lista.map((o) => (
            <option key={o.valor} value={o.valor}>{o.texto}</option>
          ))}
        </select>
      </div>
    );
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem', marginBottom: '1.5rem', fontSize: '0.825rem' }}>
      <div style={estiloTarjeta}>
        <Titulo icono={<Clock size={18} style={{ color: 'var(--sky-600)' }} />} texto="Sesión" />
        {Selector({ campo: 'sessionTimeoutMinutes', etiqueta: 'Cerrar la sesión tras este tiempo sin actividad:' })}
        <p style={estiloAyuda}>Aunque haya actividad, la sesión dura como máximo 8 horas.</p>
      </div>

      <div style={estiloTarjeta}>
        <Titulo icono={<Lock size={18} style={{ color: 'var(--sky-600)' }} />} texto="Bloqueo de cuentas" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {Selector({ campo: 'maxFailedLogins', etiqueta: 'Intentos fallidos antes de bloquear:' })}
          {Selector({ campo: 'lockoutMinutes', etiqueta: 'Duración del bloqueo:' })}
        </div>
        <p style={estiloAyuda}>Solo para el personal del portal. La app del ciudadano mantiene 5 intentos y 15 minutos.</p>
      </div>

      <div style={estiloTarjeta}>
        <Titulo icono={<KeyRound size={18} style={{ color: 'var(--sky-600)' }} />} texto="Contraseñas" />
        {Selector({ campo: 'minPasswordLength', etiqueta: 'Longitud mínima:' })}
        <p style={estiloAyuda}>
          Se exige cuando el personal cambia su contraseña (menú de la cuenta → Cambiar contraseña). Las contraseñas
          temporales ya tienen 15 caracteres.
        </p>
      </div>
    </div>
  );
};
