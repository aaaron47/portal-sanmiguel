import React from 'react';
import { AlertCircle, ExternalLink } from 'lucide-react';
import { Ticket } from '@/types/ticket.types';
import { StatusBadge } from '@/components/shared/ui/TicketLabels';

interface ConstanciasTableProps {
  tickets: Ticket[];
  onSelectTicket: (ticket: Ticket) => void;
}

export const ConstanciasTable: React.FC<ConstanciasTableProps> = ({ tickets, onSelectTicket }) => (
  <div className="table-container">
    <table className="data-table">
      <thead>
        <tr>
          <th>Folio</th>
          <th>Ciudadano</th>
          <th>Asunto</th>
          <th>Estado Reclamo</th>
          <th>Dictamen de Constancia</th>
          <th>Fecha Registro</th>
          <th>Acción</th>
        </tr>
      </thead>
      <tbody>
        {tickets.length === 0 ? (
          <tr>
            <td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
              <AlertCircle size={24} style={{ margin: '0 auto 0.5rem', display: 'block', color: 'var(--text-muted)' }} />
              No se encontraron constancias con los filtros seleccionados.
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
                <div
                  style={{
                    maxWidth: '280px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    color: 'var(--text-main)',
                  }}
                  title={ticket.asunto}
                >
                  {ticket.asunto}
                </div>
              </td>
              <td>
                <StatusBadge estado={ticket.estado} />
              </td>
              <td>
                {/* Requisito 2: Quitar color de etiqueta de valores de Constancia (Solo texto) */}
                <span style={{ fontSize: '0.825rem', fontWeight: 500, color: 'var(--text-main)' }}>
                  {ticket.estadoConstancia === 'aprobada'
                    ? 'Aprobada'
                    : ticket.estadoConstancia === 'observada'
                      ? 'Observada'
                      : 'Por Evaluar'}
                </span>
              </td>
              <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {ticket.fechaCreacion}
              </td>
              <td>
                <button
                  onClick={() => onSelectTicket(ticket)}
                  className="btn btn-secondary"
                  style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                >
                  <ExternalLink size={14} /> Evaluar Constancia
                </button>
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  </div>
);
