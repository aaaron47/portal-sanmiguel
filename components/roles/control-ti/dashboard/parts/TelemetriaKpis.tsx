import React from 'react';
import { Smartphone, ShieldCheck, Activity, Users } from 'lucide-react';
import { TelemetriaResumen } from '@/types/telemetria.types';
import { KpiCard } from '@/components/shared/ui/KpiCard';

export const TelemetriaKpis: React.FC<{ resumen: TelemetriaResumen }> = ({ resumen }) => (
  <div className="kpi-grid">
    <KpiCard
      icon={Smartphone}
      label="Onboarding Completado"
      value={`${resumen.onboarding.onboardingTasaPorcentaje}%`}
      bg="var(--sky-100)"
      color="var(--sky-600)"
    />
    <KpiCard
      icon={ShieldCheck}
      label="Aceptación de Analítica"
      value={`${resumen.onboarding.aceptaAnaliticaPorcentaje}%`}
      bg="var(--green-100)"
      color="var(--green-600)"
    />
    <KpiCard
      icon={Activity}
      label="Eventos en 24h"
      value={resumen.totalEventosUltimas24h.toLocaleString()}
      bg="var(--amber-100)"
      color="var(--amber-700)"
    />
    <KpiCard
      icon={Users}
      label="Tasa de Errores App"
      value={`${resumen.tasaErroresAppPorcentaje}%`}
      bg="var(--fuchsia-100)"
      color="var(--fuchsia-800)"
    />
  </div>
);
