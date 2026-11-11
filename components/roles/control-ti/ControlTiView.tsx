'use client';

import React from 'react';
import { RefreshCw, Activity, ShieldCheck, AlertCircle } from 'lucide-react';
import { RoleViewProps } from '@/types/ui.types';
import { useControlTi } from './useControlTi';
import { TelemetriaKpis } from './dashboard/parts/TelemetriaKpis';
import { DispositivosCard } from './dashboard/parts/DispositivosCard';
import { TopPantallasTable } from './dashboard/parts/TopPantallasTable';
import { EventosAnonimosTable } from './eventos/parts/EventosAnonimosTable';
import { UsoFiltros } from './dashboard/parts/UsoFiltros';
import { UsoSistemaPanel } from './dashboard/parts/UsoSistemaPanel';
import { PrivacidadOnboardingPanel } from './onboarding/PrivacidadOnboardingPanel';

export const ControlTiView: React.FC<RoleViewProps> = ({
  initialTab = 'ti-telemetria',
  onNotify,
}) => {
  const t = useControlTi(onNotify);

  const esOnboarding = initialTab === 'ti-onboarding';

  return (
    <div>
      {/* Cabecera de la sección según la opción elegida en el Sidebar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {esOnboarding ? (
              <>
                <ShieldCheck size={22} color="var(--sky-600)" />
                Privacidad y Onboarding Ciudadano
              </>
            ) : (
              <>
                <Activity size={22} color="var(--sky-600)" />
                Dashboard de Telemetría y Rendimiento App
              </>
            )}
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0.25rem 0 0' }}>
            {esOnboarding 
              ? 'Trazabilidad de consentimiento vecinal (Ley N° 29733), notificaciones push y embudo de adopción.'
              : 'Monitoreo de tráfico, versiones de clientes móviles y estabilidad en producción.'}
          </p>
        </div>

        <button
          onClick={t.cargarTelemetria}
          disabled={t.isLoading}
          className="btn btn-secondary"
          style={{ fontSize: '0.85rem' }}
        >
          <RefreshCw size={15} className={t.isLoading ? 'spin-anim' : ''} />
          {t.isLoading ? 'Actualizando...' : 'Actualizar Métricas'}
        </button>
      </div>

      {/* Filtros del dashboard de uso: una fila sobre todo lo que filtran */}
      {!esOnboarding && (
        <UsoFiltros
          seleccion={t.seleccion}
          disponibles={t.resumen?.uso?.filtrosDisponibles}
          actualizadoEn={t.resumen?.uso?.actualizadoEn}
          onCambiar={t.cambiarFiltro}
          onLimpiar={t.limpiarFiltros}
        />
      )}

      {/* Sin datos: se explica por qué en lugar de dejar la pantalla en blanco */}
      {!t.resumen && !t.isLoading && t.errorCarga && (
        <div className="card" style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
          <AlertCircle size={22} color="var(--amber-600)" style={{ flexShrink: 0 }} />
          <div>
            <div style={{ fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.25rem' }}>
              No hay métricas para mostrar
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{t.errorCarga}</div>
          </div>
        </div>
      )}

      {/* Vista 1: Dashboard de Telemetría (si se seleccionó ti-telemetria en Sidebar) */}
      {!esOnboarding && t.resumen && (
        // Mientras se vuelve a pedir, se mantiene lo anterior atenuado (sin saltos de diseño).
        <div style={{ opacity: t.isLoading ? 0.55 : 1, transition: 'opacity 150ms' }} aria-busy={t.isLoading}>
          {t.resumen.uso ? (
            <UsoSistemaPanel uso={t.resumen.uso} />
          ) : (
            <div className="card" style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
              <AlertCircle size={20} color="var(--amber-600)" style={{ flexShrink: 0 }} />
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                <strong style={{ color: 'var(--text-main)' }}>El servidor todavía no envía los datos de uso</strong> (usuarios
                únicos, sesiones, actividad por día y hora y consultas completadas). Se mostrarán aquí cuando estén
                disponibles.
              </div>
            </div>
          )}

          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)', margin: '1.75rem 0 0.25rem' }}>
            Estado general de la app
          </h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0 0 1rem' }}>
            No depende de los filtros: datos acumulados y de las últimas 24 horas.
          </p>
          <TelemetriaKpis resumen={t.resumen} />

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
            <DispositivosCard stats={t.resumen.dispositivos} />
            <TopPantallasTable pantallas={t.resumen.topPantallas} />
          </div>

          <div style={{ marginTop: '1.25rem' }}>
            <EventosAnonimosTable eventos={t.eventos} />
          </div>
        </div>
      )}

      {/* Vista 2: Privacidad y Onboarding (si se seleccionó ti-onboarding en Sidebar) */}
      {esOnboarding && t.resumen && (
        <PrivacidadOnboardingPanel
          stats={t.resumen.onboarding}
          onActualizar={t.cargarTelemetria}
          onNotify={onNotify}
        />
      )}
    </div>
  );
};
