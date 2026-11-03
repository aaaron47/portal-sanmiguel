'use client';

import React from 'react';
import {
  KeyRound,
  ShieldCheck,
  Lock,
  X,
  CheckCircle2
} from 'lucide-react';
import { NotifyFn } from '@/types/ui.types';
import { CardHeader, CardAside } from '@/components/shared/ui/CardHeader';
import { useControlAcceso } from './useControlAcceso';
import { ControlAccesoToolbar } from './parts/ControlAccesoToolbar';
import { VariablesAccesoCards } from './parts/VariablesAccesoCards';
import { MatrizPermisosTable } from './parts/MatrizPermisosTable';
import { GobernanzaDatosCard } from './parts/GobernanzaDatosCard';

export const ControlAccesoPanel: React.FC<{ onNotify: NotifyFn }> = ({ onNotify }) => {
  const c = useControlAcceso(onNotify);

  return (
    <div className="card">
      <CardHeader
        icon={<KeyRound size={20} />}
        title="Control de Acceso y Políticas de Seguridad"
        aside={
          <CardAside>
            Políticas de autenticación, sesión, RBAC y gobernanza Ley N° 29733
          </CardAside>
        }
      />

      <ControlAccesoToolbar
        isSaving={c.isSaving}
        hayCambios={c.hayCambios}
        onGuardar={c.solicitarGuardar}
        onDescartar={c.descartarCambios}
        onRestablecer={c.restablecerValores}
        onDescargarCSV={c.descargarCSV}
      />

      {/* Sección 1: Variables de configuración de acceso */}
      <h4 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.75rem' }}>
        1. Variables de Sesión y Reglas de Autenticación
      </h4>
      <VariablesAccesoCards variables={c.variables} onChange={c.updateVariable} />

      {/* Sección 2: Matriz de Control de Acceso por Roles (RBAC) */}
      <div style={{ marginTop: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
          <ShieldCheck size={18} style={{ color: 'var(--sky-600)' }} />
          <h4 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-main)' }}>
            2. Matriz de Permisos y Alcance Institucional por Rol
          </h4>
        </div>
        <MatrizPermisosTable permisos={c.matrizPermisos} />
      </div>

      {/* Sección 3: Gobernanza de Datos y Seguridad Legal (Misma pestaña, guardado unificado) */}
      <GobernanzaDatosCard
        telemetriaActiva={c.variables.telemetriaActiva}
        diasRetencionLogs={c.variables.diasRetencionLogs}
        versionTerminosVigente={c.variables.versionTerminosVigente}
        onChange={c.updateVariable}
        modificadoTelemetria={c.variables.telemetriaActiva !== c.variablesGuardadas.telemetriaActiva}
        modificadoRetencion={c.variables.diasRetencionLogs !== c.variablesGuardadas.diasRetencionLogs}
        modificadoTerminos={c.variables.versionTerminosVigente !== c.variablesGuardadas.versionTerminosVigente}
      />

      {/* Modal Unificado de Confirmación de Alta Seguridad Institucional */}
      {c.isModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.65)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '1.5rem',
        }}>
          <div style={{
            background: 'var(--bg-card)',
            color: 'var(--text-main)',
            borderRadius: '14px',
            maxWidth: '580px',
            width: '100%',
            padding: '1.75rem',
            boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
            position: 'relative',
            border: '1px solid var(--border-color)',
          }}>
            {/* Botón Cerrar */}
            <button
              onClick={c.cancelarGuardar}
              disabled={c.isSaving}
              style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
              }}
            >
              <X size={20} />
            </button>

            {/* Cabecera del Modal */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <div style={{ padding: '0.6rem', borderRadius: '12px', background: 'var(--amber-100)', color: 'var(--amber-800)' }}>
                <Lock size={24} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
                  ¿Estás seguro de realizar estos cambios?
                </h3>
                <p style={{ fontSize: '0.775rem', color: 'var(--text-muted)', margin: '0.2rem 0 0' }}>
                  Modificación de políticas de seguridad, acceso y telemetría móvil
                </p>
              </div>
            </div>

            {/* Resumen de Cambios a Aplicar en la Pestaña */}
            <div style={{ background: 'var(--bg-card-subtle)', padding: '0.85rem 1rem', borderRadius: '8px', border: '1px solid var(--border-color)', marginBottom: '1.25rem' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                Resumen de Modificaciones Detectadas ({c.resumenCambios.length}):
              </div>
              <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.8rem', color: 'var(--text-main)', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                {c.resumenCambios.map((cambio, idx) => (
                  <li key={idx} style={{ fontWeight: 600 }}>{cambio}</li>
                ))}
              </ul>
            </div>

            {/* Advertencia y Reto de Seguridad */}
            <div style={{ marginBottom: '1.25rem' }}>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.4', margin: '0 0 0.75rem' }}>
                Cada modificación en las variables de esta pestaña afectará la seguridad de los usuarios, sesiones activas y recolección de datos en producción. Quedará registrado en auditoría.
              </p>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.4rem' }}>
                Para confirmar, escribe exactamente: <span style={{ color: 'var(--sky-600)', fontFamily: 'var(--font-mono)' }}>realizar cambios</span>
              </label>
              <input
                type="text"
                value={c.textoConfirmacion}
                onChange={(e) => c.setTextoConfirmacion(e.target.value)}
                placeholder="Escribe 'realizar cambios'"
                disabled={c.isSaving}
                autoFocus
                style={{
                  width: '100%',
                  padding: '0.55rem 0.75rem',
                  borderRadius: '8px',
                  border: c.textoConfirmacion.trim().toLowerCase() === 'realizar cambios'
                    ? '1.5px solid var(--green-500)'
                    : '1px solid var(--border-color)',
                  fontSize: '0.85rem',
                  fontFamily: 'var(--font-mono)',
                  outline: 'none',
                }}
              />
            </div>

            {/* Botones de Acción */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={c.cancelarGuardar}
                disabled={c.isSaving}
                className="btn btn-secondary"
                style={{ fontSize: '0.85rem' }}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={c.confirmarYGuardar}
                disabled={c.textoConfirmacion.trim().toLowerCase() !== 'realizar cambios' || c.isSaving}
                className="btn btn-primary"
                style={{
                  fontSize: '0.85rem',
                  opacity: c.textoConfirmacion.trim().toLowerCase() === 'realizar cambios' && !c.isSaving ? 1 : 0.6,
                }}
              >
                {c.isSaving ? (
                  'Guardando en Backend...'
                ) : (
                  <>
                    <CheckCircle2 size={16} /> Aceptar y Aplicar Cambios
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
