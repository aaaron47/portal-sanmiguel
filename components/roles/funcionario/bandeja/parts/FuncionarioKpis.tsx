import React from 'react';
import { Inbox, Clock, AlertTriangle } from 'lucide-react';
import { Ticket } from '@/types/ticket.types';
import { KpiCard } from '@/components/shared/ui/KpiCard';
import { esActivo } from '@/utils/ticket.utils';

interface FuncionarioKpisProps {
  tickets: Ticket[];
  area?: string;
}

export const FuncionarioKpis: React.FC<FuncionarioKpisProps> = ({ tickets, area }) => {
  const pendientes = tickets.filter(esActivo).length;

  const prioridadAlta = tickets.filter((t) => esActivo(t) && t.prioridad === 'ALTA').length;

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
        icon={AlertTriangle}
        label="Abiertos con prioridad alta"
        value={prioridadAlta}
        bg="var(--green-100)"
        color="var(--green-600)"
      />
    </div>
  );
};
