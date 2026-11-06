import React from 'react';
import { Layers, CheckCircle2, AlertTriangle, UserCheck } from 'lucide-react';
import { Ticket } from '@/types/ticket.types';
import { KpiCard } from '@/components/shared/ui/KpiCard';
import { puedeAprobar } from '@/utils/ticket.utils';

export const SupervisorKpis: React.FC<{ tickets: Ticket[] }> = ({ tickets }) => {
  const porAprobar = tickets.filter(puedeAprobar).length;
  const prioridadAlta = tickets.filter((t) => t.prioridad === 'ALTA').length;
  const resueltos = tickets.filter((t) => t.estado === 'respondido' || t.estado === 'cerrado').length;

  return (
    <div className="kpi-grid">
      <KpiCard
        icon={Layers}
        label="Total Panorama Municipal"
        value={tickets.length}
        bg="var(--sky-100)"
        color="var(--sky-600)"
      />
      <KpiCard
        icon={CheckCircle2}
        label="Pendientes de Aprobación"
        value={porAprobar}
        bg="var(--orange-100)"
        color="var(--orange-600)"
      />
      <KpiCard
        icon={AlertTriangle}
        label="Casos de Prioridad Alta"
        value={prioridadAlta}
        bg="var(--red-50)"
        color="var(--red-600)"
      />
      <KpiCard
        icon={UserCheck}
        label="Respondidos o cerrados"
        value={resueltos}
        bg="var(--green-100)"
        color="var(--green-600)"
      />
    </div>
  );
};
