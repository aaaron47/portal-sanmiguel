'use client';

import React from 'react';
import { RoleViewProps } from '@/types/ui.types';
import { useControlMunicipal } from './useControlMunicipal';
import { DashboardGeneralControl } from './dashboard/DashboardGeneralControl';
import { ReportesTributariosView } from './tributarios/ReportesTributariosView';
import { AsistenteMcpView } from './ia/AsistenteMcpView';
import { ConstanciasNoAdeudoPanel } from './constancias/ConstanciasNoAdeudoPanel';

export const ControlMunicipalView: React.FC<RoleViewProps> = ({ 
  initialTab = 'control-dashboard', 
  onNotify,
}) => {
  const c = useControlMunicipal(onNotify);

  // La navegación se realiza exclusivamente desde el Sidebar Lateral (sin TabsBar internas)
  return (
    <div>
      {/* 1. Dashboard General de Control (Indicadores Ejecutivos + OCI + Dashboard Superset Reportes Tributarios) */}
      {(initialTab === 'control-dashboard' || initialTab === 'control-reportes') && (
        <DashboardGeneralControl
          kpis={c.kpis}
          areas={c.areas}
          periodo={c.periodo}
          onPeriodoChange={c.setPeriodo}
          onDescargarReporte={c.descargarReporte}
        />
      )}

      {/* 2. Reportes Tributarios Oficiales (R1 a R11 en Tablas con Filtros y Exportación CSV) */}
      {initialTab === 'control-tributarios' && (
        <ReportesTributariosView />
      )}

      {/* 3. Centro de Dashboards (Superset + IA) y Asistente IA (Modelo Local / API) */}
      {(initialTab === 'control-ia' || initialTab === 'control-superset') && (
        <AsistenteMcpView onNotify={onNotify} />
      )}

      {/* 4. Constancias de No Adeudo Tributario y Firma Digital PAdES / RENIEC */}
      {initialTab === 'control-constancias' && (
        <ConstanciasNoAdeudoPanel />
      )}
    </div>
  );
};
