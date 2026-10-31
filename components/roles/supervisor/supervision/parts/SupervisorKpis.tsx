import React from 'react';
import { Layers, CheckCircle2, AlertTriangle, UserCheck } from 'lucide-react';
import { Ticket } from '@/types/ticket.types';
import { KpiCard } from '@/components/shared/ui/KpiCard';

export const SupervisorKpis: React.FC<{ tickets: Ticket[] }> = ({ tickets }) => {
  const porAprobar = tickets.filter((t) => t.estado === 'por aprobar').length;
  const urgentes = tickets.filter((t) => t.prioridad === 'URGENTE').length;
  const resueltos = tickets.filter((t) => t.estado === 'resuelto').length;

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
        label="Casos Críticos / Urgentes"
        value={urgentes}
        bg="var(--red-50)"
        color="var(--red-600)"
      />
      <KpiCard
        icon={UserCheck}
        label="Resueltos Conformes"
        value={resueltos}
        bg="var(--green-100)"
        color="var(--green-600)"
      />
    </div>
  );
};
