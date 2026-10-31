'use client';

import React, { useState } from 'react';
import { Activity, Cpu, RefreshCw } from 'lucide-react';
import { RoleViewProps } from '@/types/ui.types';
import { TabsBar, TabItem } from '@/components/shared/ui/TabsBar';
import { useControlTi } from './useControlTi';
import { TelemetriaKpis } from './dashboard/parts/TelemetriaKpis';
import { PrivacidadConsentimientoCard } from './dashboard/parts/PrivacidadConsentimientoCard';
import { DispositivosCard } from './dashboard/parts/DispositivosCard';
import { TopPantallasTable } from './dashboard/parts/TopPantallasTable';
import { EventosAnonimosTable } from './eventos/parts/EventosAnonimosTable';

type TiTab = 'dashboard' | 'eventos';

export const ControlTiView: React.FC<RoleViewProps> = ({
  initialTab = 'ti-telemetria',
  onNotify,
}) => {
  const [subTab, setSubTab] = useState<TiTab>(
    initialTab === 'ti-onboarding' ? 'dashboard' : 'dashboard'
  );

  const t = useControlTi(onNotify);

  const tabs: TabItem<TiTab>[] = [
    { id: 'dashboard', label: 'Métricas y Onboarding', icon: Activity },
    { id: 'eventos', label: `Flujo de Eventos Anónimos (${t.eventos.length})`, icon: Cpu },
  ];

  return (
    <div>
      {/* Botón de Refrescar y Tabs */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <TabsBar tabs={tabs} active={subTab} onChange={setSubTab} marginBottom="0" />

        <button
          onClick={t.cargarTelemetria}
          disabled={t.isLoading}
          className="btn btn-secondary"
          style={{ fontSize: '0.85rem' }}
        >
          <RefreshCw size={15} className={t.isLoading ? 'spin-anim' : ''} />
          {t.isLoading ? 'Actualizando...' : 'Actualizar Telemetría'}
        </button>
      </div>

      {/* Viñeta 1: Dashboard y Métricas */}
      {subTab === 'dashboard' && t.resumen && (
        <>
          <TelemetriaKpis resumen={t.resumen} />

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
            <PrivacidadConsentimientoCard stats={t.resumen.onboarding} />
            <DispositivosCard stats={t.resumen.dispositivos} />
          </div>

          <TopPantallasTable pantallas={t.resumen.topPantallas} />
        </>
      )}

      {/* Viñeta 2: Eventos en Tiempo Real */}
      {subTab === 'eventos' && (
        <EventosAnonimosTable eventos={t.eventos} />
      )}
    </div>
  );
};
