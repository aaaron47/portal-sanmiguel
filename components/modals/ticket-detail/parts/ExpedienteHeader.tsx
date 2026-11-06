import React from 'react';
import { X } from 'lucide-react';
import { Ticket } from '@/types/ticket.types';
import { StatusBadge, PriorityLabel } from '@/components/shared/ui/TicketLabels';

interface ExpedienteHeaderProps {
  ticket: Ticket;
  onClose: () => void;
}

export const ExpedienteHeader: React.FC<ExpedienteHeaderProps> = ({ ticket, onClose }) => (
  <div className="modal-header">
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
        <span style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--primary-500)', fontFamily: 'var(--font-mono)' }}>
          {ticket.folio}
        </span>
        <StatusBadge estado={ticket.estado} porAprobar={ticket.respuestaPorAprobar} />
        <PriorityLabel prioridad={ticket.prioridad} />
      </div>
      <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
        {ticket.asunto}
      </h2>
    </div>
    <button
      onClick={onClose}
      style={{
        background: 'var(--bg-card-subtle)',
        border: '1px solid var(--border-color)',
        borderRadius: '8px',
        padding: '0.35rem',
        cursor: 'pointer',
        color: 'var(--text-muted)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      aria-label="Cerrar modal"
    >
      <X size={18} />
    </button>
  </div>
);
