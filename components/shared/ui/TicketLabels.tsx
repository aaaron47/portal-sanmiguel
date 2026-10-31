import React from 'react';
import { Ticket } from '@/types/ticket.types';

export const StatusBadge: React.FC<{ estado: Ticket['estado'] }> = ({ estado }) => (
  <span className="badge-status">{estado}</span>
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
