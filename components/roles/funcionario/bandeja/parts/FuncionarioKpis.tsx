import React from 'react';
import { Inbox, Clock, FileCheck2 } from 'lucide-react';
import { Ticket } from '@/types/ticket.types';
import { KpiCard } from '@/components/shared/ui/KpiCard';
import { esActivo } from '@/utils/ticket.utils';

interface FuncionarioKpisProps {
  tickets: Ticket[];
  area?: string;
}

export const FuncionarioKpis: React.FC<FuncionarioKpisProps> = ({ tickets, area }) => {
  const pendientes = tickets.filter(esActivo).length;

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
        label="Abiertos (sin responder)"
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
