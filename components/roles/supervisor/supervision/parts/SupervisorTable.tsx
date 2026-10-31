import React from 'react';
import { Ticket } from '@/types/ticket.types';
import { StatusBadge, PriorityLabel } from '@/components/shared/ui/TicketLabels';

interface SupervisorTableProps {
  tickets: Ticket[];
  onSelectTicket: (t: Ticket) => void;
}

export const SupervisorTable: React.FC<SupervisorTableProps> = ({ tickets, onSelectTicket }) => (
  <div className="table-container">
    <table className="data-table">
      <thead>
        <tr>
          <th>Folio</th>
          <th>Área Municipal</th>
          <th>Funcionario Asignado</th>
          <th>Asunto</th>
          <th>Estado</th>
          <th>Prioridad</th>
          <th>Acción de Supervisor</th>
        </tr>
      </thead>
      <tbody>
        {tickets.map((ticket) => (
          <tr key={ticket.id}>
            <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--sky-600)' }}>
              {ticket.folio}
            </td>
            <td>
              <span style={{ fontWeight: 600, color: 'var(--slate-900)' }}>{ticket.areaAsignada}</span>
            </td>
            <td>
              <span style={{ fontSize: '0.85rem', color: 'var(--slate-700)' }}>
                {ticket.funcionarioAsignadoNombre || 'Sin asignar'}
              </span>
            </td>
            <td>
              <div style={{ maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 500 }} title={ticket.asunto}>
                {ticket.asunto}
              </div>
            </td>
            <td>
              <StatusBadge estado={ticket.estado} />
            </td>
            <td>
              <PriorityLabel prioridad={ticket.prioridad} />
            </td>
            <td>
              <div style={{ display: 'flex', gap: '0.35rem' }}>
                <button
                  onClick={() => onSelectTicket(ticket)}
                  className="btn btn-secondary"
                  style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}
                >
                  Examinar Caso
                </button>
                {ticket.estado === 'por aprobar' && (
                  <button
                    onClick={() => onSelectTicket(ticket)}
                    className="btn btn-success"
                    style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}
                  >
                    Aprobar
                  </button>
                )}
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);
