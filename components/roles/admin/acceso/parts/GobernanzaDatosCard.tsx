'use client';

import React from 'react';
import { Power, Clock, FileText, ShieldCheck } from 'lucide-react';
import { VariablesAcceso } from '../useControlAcceso';

interface GobernanzaDatosCardProps {
  telemetriaActiva: boolean;
  diasRetencionLogs: number;
  versionTerminosVigente: string;
  onChange: <K extends keyof VariablesAcceso>(key: K, value: VariablesAcceso[K]) => void;
  modificadoTelemetria?: boolean;
  modificadoRetencion?: boolean;
  modificadoTerminos?: boolean;
}

export const GobernanzaDatosCard: React.FC<GobernanzaDatosCardProps> = ({
  telemetriaActiva,
  diasRetencionLogs,
  versionTerminosVigente,
  onChange,
  modificadoTelemetria,
  modificadoRetencion,
  modificadoTerminos,
}) => {
  return (
    <div style={{ marginTop: '1.5rem' }}>
      {/* Encabezado */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <ShieldCheck size={18} color="var(--sky-600)" />
          <h4 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
            Gobernanza de Datos y Telemetría Móvil (Ley N° 29733)
          </h4>
        </div>
        <span className="badge badge-primary" style={{ fontSize: '0.7rem' }}>
          Privilegio Exclusivo de Administrador
        </span>
      </div>

      {/* Grid de 3 Controles */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
        {/* Control 1: Kill-Switch de Emergencia */}
        <div style={{
          background: 'var(--bg-card)',
          padding: '1rem',
          borderRadius: '10px',
          border: modificadoTelemetria ? '1.5px solid var(--amber-500)' : '1px solid var(--border-color)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Power size={16} color={telemetriaActiva ? 'var(--green-600)' : 'var(--amber-600)'} />
              <strong style={{ fontSize: '0.825rem', color: 'var(--text-main)' }}>Interruptor Kill-Switch</strong>
            </div>
            {modificadoTelemetria && (
              <span className="badge badge-danger" style={{ fontSize: '0.65rem' }}>Modificado</span>
            )}
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0 0 0.75rem' }}>
            Pausa temporalmente el envío de analítica anónima de la App en caso de saturación o incidencia.
          </p>
          <button
            type="button"
            onClick={() => onChange('telemetriaActiva', !telemetriaActiva)}
            className={`btn ${telemetriaActiva ? 'btn-secondary' : 'btn-primary'}`}
            style={{ width: '100%', fontSize: '0.8rem', padding: '0.45rem' }}
          >
            {telemetriaActiva ? 'Pausar Telemetría (Preparar Kill-Switch)' : 'Reanudar Telemetría'}
          </button>
        </div>

        {/* Control 2: Retención Legal de Logs */}
        <div style={{
          background: 'var(--bg-card)',
          padding: '1rem',
          borderRadius: '10px',
          border: modificadoRetencion ? '1.5px solid var(--amber-500)' : '1px solid var(--border-color)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Clock size={16} color="var(--sky-600)" />
              <strong style={{ fontSize: '0.825rem', color: 'var(--text-main)' }}>Política de Retención Legal</strong>
            </div>
            {modificadoRetencion && (
              <span className="badge badge-danger" style={{ fontSize: '0.65rem' }}>Modificado</span>
            )}
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0 0 0.75rem' }}>
            Plazo de caducidad para la purga automática de eventos anónimos de la base de datos municipal.
          </p>
          <div style={{ display: 'flex', gap: '0.35rem' }}>
            {[30, 60, 90].map((dias) => (
              <button
                key={dias}
                type="button"
                onClick={() => onChange('diasRetencionLogs', dias)}
                className={`btn ${diasRetencionLogs === dias ? 'btn-primary' : 'btn-secondary'}`}
                style={{ flex: 1, fontSize: '0.75rem', padding: '0.4rem' }}
              >
                {dias} Días
              </button>
            ))}
          </div>
        </div>

        {/* Control 3: Versión de Términos */}
        <div style={{
          background: 'var(--bg-card)',
          padding: '1rem',
          borderRadius: '10px',
          border: modificadoTerminos ? '1.5px solid var(--amber-500)' : '1px solid var(--border-color)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FileText size={16} color="var(--violet-600)" />
              <strong style={{ fontSize: '0.825rem', color: 'var(--text-main)' }}>Versión de Términos</strong>
            </div>
            {modificadoTerminos && (
              <span className="badge badge-danger" style={{ fontSize: '0.65rem' }}>Modificado</span>
            )}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
            Versión configurada: <strong style={{ color: 'var(--text-main)' }}>{versionTerminosVigente}</strong>
          </div>
          <button
            type="button"
            onClick={() => {
              const nueva = versionTerminosVigente === 'v1.4 (2026-11)' ? 'v1.3 (2026-10)' : 'v1.4 (2026-11)';
              onChange('versionTerminosVigente', nueva);
            }}
            className="btn btn-secondary"
            style={{ width: '100%', fontSize: '0.8rem', padding: '0.45rem' }}
          >
            {versionTerminosVigente === 'v1.4 (2026-11)'
              ? 'Volver a v1.3 (2026-10)'
              : 'Preparar Re-Aceptación (v1.4)'}
          </button>
        </div>
      </div>
    </div>
  );
};
