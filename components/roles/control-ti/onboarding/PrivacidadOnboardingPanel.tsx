'use client';

import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Bell, 
  FileText, 
  Clock, 
  Power, 
  Download, 
  CheckCircle2, 
  XCircle, 
  Users, 
  AlertTriangle,
  Lock
} from 'lucide-react';
import { OnboardingStats, ConsentimientoAuditoriaLog } from '@/types/telemetria.types';
import { CardHeader, CardAside } from '@/components/shared/ui/CardHeader';
import { exportarCSV } from '@/utils/csv.utils';
import { telemetriaController } from '@/controllers/telemetria.controller';
import { mensajeErrorApi } from '@/services/api-client.service';
import { MENSAJES_TELEMETRIA } from '../useControlTi';

interface PrivacidadOnboardingPanelProps {
  stats: OnboardingStats;
  onActualizar: () => void;
  onNotify: (type: 'success' | 'error' | 'info', message: string) => void;
}

export const PrivacidadOnboardingPanel: React.FC<PrivacidadOnboardingPanelProps> = ({
  stats,
  onNotify,
}) => {
  const [auditLogs, setAuditLogs] = useState<ConsentimientoAuditoriaLog[]>([]);
  const [cargandoLogs, setCargandoLogs] = useState(true);

  // Cargar logs para la tabla y exportación
  React.useEffect(() => {
    let montado = true;
    telemetriaController.getConsentimientosAuditoria()
      .then((logs) => {
        if (montado) setAuditLogs(logs);
      })
      .catch((err) => {
        if (montado) {
          onNotify(
            'error',
            mensajeErrorApi(err, 'No se pudieron cargar los registros de consentimiento. Inténtalo de nuevo.', MENSAJES_TELEMETRIA)
          );
        }
      })
      .finally(() => {
        if (montado) setCargandoLogs(false);
      });
    return () => { montado = false; };
  }, [onNotify]);

  // Exportar reporte de auditoría Ley 29733 a CSV
  const handleExportarReporte = () => {
    if (auditLogs.length === 0) {
      onNotify('info', 'No hay registros de auditoría para exportar.');
      return;
    }
    const cabeceras = [
      'ID Registro',
      'Dispositivo Hash (SHA-256)',
      'Acepta Analítica (Ley 29733)',
      'Permiso Notificaciones Push',
      'Versión Términos',
      'Fecha y Hora Decisión',
      'IP Anonimizada',
    ];
    const filas = auditLogs.map((log) => [
      log.id,
      log.dispositivoHash,
      log.aceptaAnalitica ? 'SÍ' : 'NO',
      log.permiteNotificaciones ? 'AUTORIZADO' : 'DENEGADO',
      log.versionTerminos,
      log.fechaDecision,
      log.ipAnonimizada,
    ]);

    exportarCSV('Auditoria_Privacidad_Ley29733', cabeceras, filas);
    onNotify('success', 'Reporte de trazabilidad de consentimientos exportado correctamente.');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* 1. KPIs Principales de Privacidad y Onboarding */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '1rem' }}>
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <div style={{ padding: '0.5rem', borderRadius: '10px', background: 'var(--sky-50)', color: 'var(--sky-600)' }}>
              <Users size={20} />
            </div>
            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Total Registros</span>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)' }}>
                {stats.totalUsuariosRegistrados.toLocaleString()}
              </div>
            </div>
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Ciudadanos que completaron el onboarding: <strong>{stats.onboardingTasaPorcentaje}%</strong>
          </span>
        </div>

        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <div style={{ padding: '0.5rem', borderRadius: '10px', background: 'var(--green-50)', color: 'var(--green-600)' }}>
              <ShieldCheck size={20} />
            </div>
            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Consentimiento Ley 29733</span>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--green-600)' }}>
                {stats.aceptaAnaliticaPorcentaje}%
              </div>
            </div>
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            <strong>{stats.aceptaAnaliticaCount.toLocaleString()}</strong> aceptan compartir analítica anónima
          </span>
        </div>

        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <div style={{ padding: '0.5rem', borderRadius: '10px', background: 'var(--violet-50)', color: 'var(--violet-700)' }}>
              <Bell size={20} />
            </div>
            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Notificaciones Push</span>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--violet-700)' }}>
                {stats.notificacionesPermitidasPorcentaje}%
              </div>
            </div>
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            <strong>{stats.notificacionesPermitidasCount.toLocaleString()}</strong> autorizadas para seguimiento de reclamos
          </span>
        </div>

        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <div style={{ 
              padding: '0.5rem', 
              borderRadius: '10px', 
              background: stats.telemetriaActiva ? 'var(--green-50)' : 'var(--amber-50)', 
              color: stats.telemetriaActiva ? 'var(--green-600)' : 'var(--amber-700)' 
            }}>
              <Power size={20} />
            </div>
            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Telemetría en Vivo</span>
              <div style={{ 
                fontSize: '1.2rem', 
                fontWeight: 800, 
                color: stats.telemetriaActiva ? 'var(--green-600)' : 'var(--amber-700)' 
              }}>
                {stats.telemetriaActiva ? 'ACTIVA' : 'EN PAUSA'}
              </div>
            </div>
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Retención actual: <strong>{stats.mesesRetencionUso} meses</strong>
          </span>
        </div>
      </div>

      {/* 2. Embudo de Onboarding Ciudadano (Funnel de Conversión) */}
      <div className="card">
        <CardHeader
          icon={<Users size={20} />}
          title="Embudo de Conversión del Onboarding (App Móvil)"
          aside={<CardAside>Paso a paso de adopción ciudadana</CardAside>}
        />

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '0.5rem' }}>
          {stats.embudoPasos.map((step) => (
            <div key={step.paso} style={{ background: 'var(--bg-card-subtle)', padding: '1rem', borderRadius: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: 'var(--sky-600)',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                  }}>
                    {step.paso}
                  </span>
                  <div>
                    <strong style={{ fontSize: '0.9rem', color: 'var(--text-main)' }}>{step.nombre}</strong>
                    <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>{step.descripcion}</div>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-main)' }}>
                    {step.usuariosCount.toLocaleString()} usuarios
                  </span>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--sky-700)', marginLeft: '0.5rem' }}>
                    ({step.porcentajeRetencion}%)
                  </span>
                  {step.porcentajeAbandono > 0 && (
                    <div style={{ fontSize: '0.725rem', color: 'var(--red-600)', fontWeight: 600 }}>
                      Abandono: {step.porcentajeAbandono}%
                    </div>
                  )}
                </div>
              </div>

              {/* Barra de progreso */}
              <div style={{ height: '8px', background: 'var(--slate-200)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{
                  width: `${step.porcentajeRetencion}%`,
                  height: '100%',
                  background: step.porcentajeRetencion > 90 ? 'var(--sky-600)' : 'var(--amber-500)',
                  transition: 'width 0.3s ease',
                }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Panel de Gobernanza y Parámetros Técnicos (Supervisión TI - Solo Lectura) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
        {/* Punto 1: Versión de Términos */}
        <div className="card">
          <CardHeader
            icon={<FileText size={18} />}
            title="1. Términos y Privacidad"
            aside={<CardAside>Ley N° 29733</CardAside>}
          />
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
            Versión activa en la App Móvil: <strong style={{ color: 'var(--text-main)' }}>{stats.versionTerminosVigente}</strong>.
            <div style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>Última auditoría legal: {stats.fechaRevisionTerminos}</div>
          </div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: 'var(--text-dim)', background: 'var(--bg-card-subtle)', padding: '0.4rem 0.65rem', borderRadius: '6px' }}>
            <Lock size={13} />
            Actualización de versión custodiada por Administrador
          </div>
        </div>

        {/* Punto 2: Retención de Logs */}
        <div className="card">
          <CardHeader
            icon={<Clock size={18} />}
            title="2. Retención de Logs"
            aside={<CardAside>Depuración</CardAside>}
          />
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
            Periodo de depuración automática configurado:
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <span className="badge badge-primary" style={{ fontSize: '0.9rem', padding: '0.35rem 0.75rem' }}>
              {stats.mesesRetencionUso} meses
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
              (purga mensual automática)
            </span>
          </div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: 'var(--text-dim)', background: 'var(--bg-card-subtle)', padding: '0.4rem 0.65rem', borderRadius: '6px' }}>
            <Lock size={13} />
            Parámetro gestionado por Gerencia TI / Admin
          </div>
        </div>

        {/* Punto 3: Kill-Switch de Emergencia */}
        <div className="card">
          <CardHeader
            icon={<Power size={18} />}
            title="3. Estado de Telemetría"
            aside={<CardAside>Kill-Switch</CardAside>}
          />
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
            {stats.telemetriaActiva ? (
              <span style={{ color: 'var(--green-700)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <CheckCircle2 size={16} /> Recolección de telemetría activa en producción
              </span>
            ) : (
              <span style={{ color: 'var(--amber-800)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <AlertTriangle size={16} /> Telemetría en pausa de emergencia
              </span>
            )}
          </div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: 'var(--text-dim)', background: 'var(--bg-card-subtle)', padding: '0.4rem 0.65rem', borderRadius: '6px', width: '100%' }}>
            <Lock size={13} />
            Interruptor maestro de emergencia exclusivo de Administrador
          </div>
        </div>
      </div>

      {/* 4. Trazabilidad y Exportación de Reporte para Auditoría (Punto 4) */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShieldCheck size={18} color="var(--sky-600)" />
              4. Trazabilidad de Consentimientos y Auditoría Legal
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0.25rem 0 0' }}>
              Registro de consentimiento informado anonimizado bajo estándares de la Ley N° 29733.
            </p>
          </div>

          <button
            onClick={handleExportarReporte}
            className="btn btn-primary"
            style={{ fontSize: '0.85rem' }}
          >
            <Download size={15} />
            Exportar Informe de Auditoría (CSV)
          </button>
        </div>

        {/* Tabla previa de registros anonimizados */}
        {cargandoLogs ? (
          <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Cargando registros de auditoría...
          </div>
        ) : (
          <div className="table-container" style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID Registro</th>
                  <th>Hash Dispositivo (Anonimizado)</th>
                  <th>Analítica Ley 29733</th>
                  <th>Notificaciones Push</th>
                  <th>Versión Términos</th>
                  <th>Fecha de Decisión</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.map((log) => (
                  <tr key={log.id}>
                    <td><span className="badge badge-neutral" style={{ fontFamily: 'var(--font-mono)' }}>{log.id}</span></td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-muted)' }} title={log.dispositivoHash}>
                      {log.dispositivoHash.substring(0, 16)}...
                    </td>
                    <td>
                      {log.aceptaAnalitica ? (
                        <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                          <CheckCircle2 size={12} /> Aceptado
                        </span>
                      ) : (
                        <span className="badge badge-danger" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                          <XCircle size={12} /> Rechazado
                        </span>
                      )}
                    </td>
                    <td>
                      {log.permiteNotificaciones ? (
                        <span className="badge badge-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                          <CheckCircle2 size={12} /> Autorizado
                        </span>
                      ) : (
                        <span className="badge badge-neutral" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                          <AlertTriangle size={12} /> Denegado
                        </span>
                      )}
                    </td>
                    <td style={{ fontSize: '0.8rem' }}>{log.versionTerminos}</td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{log.fechaDecision}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
