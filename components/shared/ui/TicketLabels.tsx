import React from 'react';
import { Ticket } from '@/types/ticket.types';

/** Estado del reclamo; si hay una respuesta esperando al supervisor, lo indica ("en evaluación · por aprobar"). */
export const StatusBadge: React.FC<{ estado: Ticket['estado']; porAprobar?: boolean }> = ({ estado, porAprobar }) => (
  <span className="badge-status">{porAprobar ? `${estado} · por aprobar` : estado}</span>
);

export const PriorityLabel: React.FC<{ prioridad: Ticket['prioridad'] }> = ({ prioridad }) => (
  <span
    style={{
      fontSize: '0.75rem',
      fontWeight: 500,
      color: 'var(--text-main)',
    }}
  >
    {prioridad}
  </span>
);
