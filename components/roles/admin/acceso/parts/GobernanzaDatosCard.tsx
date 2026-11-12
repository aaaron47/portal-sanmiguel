'use client';

import React from 'react';
import { Power, Clock, FileText, ShieldCheck } from 'lucide-react';
import { VariablesAcceso } from '../useControlAcceso';
import { DocumentoVersion } from '@/types/seguridad.types';
import { fechaPeru } from '@/utils/fecha-peru.utils';

interface GobernanzaDatosCardProps {
  telemetriaActiva: boolean;
  mesesRetencionUso: number;
  versionAvisoId: string;
  versionesAviso: DocumentoVersion[];
  /** Versión que informa `/telemetria/resumen`, por si no se pudieron leer las versiones. */
  versionAvisoVigente: string;
  /** Cada control se habilita solo si su sección se pudo leer del servidor. */
  telemetriaLeida: boolean;
  documentosLeidos: boolean;
  cargando: boolean;
  onChange: <K extends keyof VariablesAcceso>(key: K, value: VariablesAcceso[K]) => void;
  modificadoTelemetria?: boolean;
  modificadoVersion?: boolean;
}

const tarjeta = (modificado: boolean | undefined, habilitada: boolean): React.CSSProperties => ({
  background: 'var(--bg-card)',
  padding: '1rem',
  borderRadius: '10px',
  border: modificado ? '1.5px solid var(--amber-500)' : '1px solid var(--border-color)',
  opacity: habilitada ? 1 : 0.6,
});
const ayuda: React.CSSProperties = { fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0 0 0.75rem', lineHeight: 1.4 };

const Encabezado: React.FC<{ icono: React.ReactNode; titulo: string; modificado?: boolean }> = ({ icono, titulo, modificado }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      {icono}
      <strong style={{ fontSize: '0.825rem', color: 'var(--text-main)' }}>{titulo}</strong>
    </div>
    {modificado && <span className="badge badge-danger" style={{ fontSize: '0.65rem' }}>Modificado</span>}
  </div>
);

export const GobernanzaDatosCard: React.FC<GobernanzaDatosCardProps> = ({
  telemetriaActiva,
  mesesRetencionUso,
  versionAvisoId,
  versionesAviso,
  versionAvisoVigente,
  telemetriaLeida,
  documentosLeidos,
  cargando,
  onChange,
  modificadoTelemetria,
  modificadoVersion,
}) => {
  const versionActiva = versionesAviso.find((d) => d.activo)?.version ?? versionAvisoVigente;
  return (
    <div style={{ marginTop: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <ShieldCheck size={18} color="var(--sky-600)" />
          <h4 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
            3. Gobernanza de Datos y Telemetría Móvil (Ley N° 29733)
          </h4>
        </div>
        <span className="badge badge-primary" style={{ fontSize: '0.7rem' }}>Privilegio Exclusivo de Administrador</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
        {/* 1. Interruptor general de la analítica (kill switch) */}
        <div style={tarjeta(modificadoTelemetria, telemetriaLeida || cargando)}>
          <Encabezado
            icono={<Power size={16} color={telemetriaActiva ? 'var(--green-600)' : 'var(--amber-600)'} />}
            titulo="Interruptor de telemetría"
            modificado={modificadoTelemetria}
          />
          <p style={ayuda}>
            {telemetriaActiva ? 'Activa. ' : 'En pausa. '}
            En pausa, el servidor deja de guardar pantallas, acciones y consultas de la app; solo guarda el inicio y el
            cierre de sesión.
          </p>
          <button
            type="button"
            disabled={!telemetriaLeida}
            onClick={() => onChange('telemetriaActiva', !telemetriaActiva)}
            className={`btn ${telemetriaActiva ? 'btn-secondary' : 'btn-primary'}`}
            style={{ width: '100%', fontSize: '0.8rem', padding: '0.45rem' }}
          >
            {telemetriaActiva ? 'Pausar telemetría' : 'Reanudar telemetría'}
          </button>
        </div>

        {/* 2. Retención (solo lectura) */}
        <div style={tarjeta(false, telemetriaLeida || cargando)}>
          <Encabezado icono={<Clock size={16} color="var(--sky-600)" />} titulo="Plazo de conservación" />
          <p style={ayuda}>Registros de uso de la app. El servidor borra cada día los que superan este plazo.</p>
          <span className="badge badge-primary" style={{ fontSize: '0.85rem', padding: '0.35rem 0.75rem' }}>
            {mesesRetencionUso} meses
          </span>
        </div>

        {/* 3. Versión activa del aviso de analítica */}
        <div style={tarjeta(modificadoVersion, documentosLeidos || cargando)}>
          <Encabezado icono={<FileText size={16} color="var(--violet-700)" />} titulo="Aviso de analítica" modificado={modificadoVersion} />
          <p style={ayuda}>
            Es el aviso que el ciudadano acepta en el onboarding de la app. Versión activa:{' '}
            <strong style={{ color: 'var(--text-main)' }}>{versionActiva || '—'}</strong>. Si se activa otra, los
            ciudadanos deberán aceptarla de nuevo. Las versiones nuevas las carga el responsable de la base de datos.
          </p>
          {documentosLeidos ? (
            <>
              <label htmlFor="versionAviso" style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                Versión que verán los ciudadanos:
              </label>
              <select
                id="versionAviso"
                value={versionAvisoId}
                onChange={(e) => onChange('versionAvisoId', e.target.value)}
                disabled={versionesAviso.length < 2}
                style={{ width: '100%', padding: '0.45rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-main)', fontSize: '0.8rem' }}
              >
                {versionesAviso.length === 0 && <option value="">No hay versiones cargadas</option>}
                {versionesAviso.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.version} · publicada el {fechaPeru(d.publicadoEn)}
                    {d.activo ? ' (activa)' : ''}
                  </option>
                ))}
              </select>
              {versionesAviso.length === 1 && (
                <p style={{ ...ayuda, margin: '0.35rem 0 0' }}>Solo hay una versión cargada.</p>
              )}
            </>
          ) : (
            !cargando && <p style={{ ...ayuda, margin: 0 }}>No se pudieron leer las versiones del servidor.</p>
          )}
        </div>
      </div>
    </div>
  );
};
