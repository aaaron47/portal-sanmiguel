'use client';

import React from 'react';
import { RefreshCw, Activity, ShieldCheck } from 'lucide-react';
import { RoleViewProps } from '@/types/ui.types';
import { useControlTi } from './useControlTi';
import { TelemetriaKpis } from './dashboard/parts/TelemetriaKpis';
import { DispositivosCard } from './dashboard/parts/DispositivosCard';
import { TopPantallasTable } from './dashboard/parts/TopPantallasTable';
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

      {/* Vista 1: Dashboard de Telemetría (si se seleccionó ti-telemetria en Sidebar) */}
      {!esOnboarding && t.resumen && (
        <>
          <TelemetriaKpis resumen={t.resumen} />

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
            <DispositivosCard stats={t.resumen.dispositivos} />
            <TopPantallasTable pantallas={t.resumen.topPantallas} />
          </div>
        </>
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
