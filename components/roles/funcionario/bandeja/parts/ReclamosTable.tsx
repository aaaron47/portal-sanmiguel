import React from 'react';
import { AlertCircle, ExternalLink } from 'lucide-react';
import { Ticket } from '@/types/ticket.types';
import { StatusBadge, PriorityLabel } from '@/components/shared/ui/TicketLabels';
import { funcionarioTieneAcciones } from '@/utils/ticket.utils';

interface ReclamosTableProps {
  tickets: Ticket[];
  onSelectTicket: (ticket: Ticket) => void;
}

export const ReclamosTable: React.FC<ReclamosTableProps> = ({ tickets, onSelectTicket }) => (
  <div className="table-container">
    <table className="data-table">
      <thead>
        <tr>
          <th>Folio</th>
          <th>Ciudadano</th>
          <th>Asunto / Incidencia</th>
          <th>Estado</th>
          <th>Prioridad</th>
          <th>Constancia</th>
          <th>Acción</th>
        </tr>
      </thead>
      <tbody>
        {tickets.length === 0 ? (
          <tr>
            <td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
              <AlertCircle size={24} style={{ margin: '0 auto 0.5rem', display: 'block', color: 'var(--text-muted)' }} />
              No se encontraron reclamos con los filtros seleccionados.
            </td>
          </tr>
        ) : (
          tickets.map((ticket) => (
            <tr key={ticket.id}>
              <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--primary-500)' }}>
                {ticket.folio}
              </td>
              <td>
                <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{ticket.ciudadanoNombre}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>DNI: {ticket.ciudadanoDni || '—'}</div>
              </td>
              <td>
                <div style={{ fontWeight: 500, maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-main)' }} title={ticket.asunto}>
                  {ticket.asunto}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Ingreso: {ticket.fechaCreacion}</div>
              </td>
              <td>
                <StatusBadge estado={ticket.estado} />
              </td>
              <td>
                <PriorityLabel prioridad={ticket.prioridad} />
              </td>
              <td>
                {ticket.tieneConstancia ? (
                  <span style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-main)' }}>
                    {ticket.estadoConstancia === 'aprobada'
                      ? 'Aprobada'
                      : ticket.estadoConstancia === 'observada'
                      ? 'Observada'
                      : 'Por Evaluar'}
                  </span>
                ) : (
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>No requerida</span>
                )}
              </td>
              <td>
                <button
                  onClick={() => onSelectTicket(ticket)}
                  className="btn btn-secondary"
                  style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}
                >
                  <ExternalLink size={14} /> {funcionarioTieneAcciones(ticket) ? 'Atender' : 'Ver'}
                </button>
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  </div>
);
