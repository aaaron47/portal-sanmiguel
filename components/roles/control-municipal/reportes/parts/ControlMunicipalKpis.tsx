import React from 'react';
import { TrendingUp, Clock, FileCheck, Building } from 'lucide-react';
import { KpisReporte } from '@/controllers/reportes.controller';
import { KpiCard } from '@/components/shared/ui/KpiCard';

export const ControlMunicipalKpis: React.FC<{ kpis: KpisReporte }> = ({ kpis }) => (
  <div className="kpi-grid" style={{ marginBottom: '0.5rem' }}>
    <KpiCard
      icon={TrendingUp}
      label="Tasa de Resolución"
      value={`${kpis.tasaResolucionPorcentaje}%`}
      bg="var(--sky-100)"
      color="var(--sky-600)"
    />
    <KpiCard
      icon={Clock}
      label="Tiempo Promedio"
      value={`${kpis.tiempoPromedioResolucionDias} días`}
      bg="var(--amber-100)"
      color="var(--amber-700)"
    />
    <KpiCard
      icon={FileCheck}
      label="Constancias Emitidas"
      value={kpis.totalConstanciasEmitidas}
      bg="var(--green-100)"
      color="var(--green-600)"
    />
    <KpiCard
      icon={Building}
      label="Reclamos Atendidos"
      value={kpis.totalReclamosPeriodo}
      bg="var(--slate-100)"
      color="var(--slate-600)"
    />
  </div>
);
