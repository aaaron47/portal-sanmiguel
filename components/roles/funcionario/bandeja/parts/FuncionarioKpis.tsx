import React from 'react';
import { Inbox, Clock, FileCheck2 } from 'lucide-react';
import { Ticket } from '@/types/ticket.types';
import { KpiCard } from '@/components/shared/ui/KpiCard';

interface FuncionarioKpisProps {
  tickets: Ticket[];
  area?: string;
}

export const FuncionarioKpis: React.FC<FuncionarioKpisProps> = ({ tickets, area }) => {
  const pendientes = tickets.filter(
    (t) => t.estado === 'en evaluación' || t.estado === 'pendiente de validación'
  ).length;

  const constanciasPorEvaluar = tickets.filter(
    (t) => t.tieneConstancia && t.estadoConstancia === 'sin_evaluar'
  ).length;

  return (
    <div className="kpi-grid">
      <KpiCard
        icon={Inbox}
        label={`Reclamos en ${area || 'Mi Área'}`}
        value={tickets.length}
        bg="var(--sky-100)"
        color="var(--sky-600)"
      />
      <KpiCard
        icon={Clock}
        label="En Evaluación / Pendientes"
        value={pendientes}
        bg="var(--amber-100)"
        color="var(--amber-700)"
      />
      <KpiCard
        icon={FileCheck2}
        label="Constancias por Evaluar"
        value={constanciasPorEvaluar}
        bg="var(--green-100)"
        color="var(--green-600)"
      />
    </div>
  );
};
