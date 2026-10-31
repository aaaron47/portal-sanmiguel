import React from 'react';
import { AlertCircle } from 'lucide-react';
import { AccionTicket, Ticket } from '@/types/ticket.types';
import { StatusBadge, PriorityLabel } from '@/components/shared/ui/TicketLabels';
import { puedeAprobar, puedeReasignar } from '@/utils/ticket.utils';

interface SupervisorTableProps {
  tickets: Ticket[];
  onSelectTicket: (t: Ticket, accion?: AccionTicket) => void;
  /** Muestra el botón "Reasignar" en vez de "Aprobar" (pestaña de carga). */
  modoReasignacion?: boolean;
  mensajeVacio?: string;
}

const estiloBoton: React.CSSProperties = { padding: '0.3rem 0.6rem', fontSize: '0.75rem' };

export const SupervisorTable: React.FC<SupervisorTableProps> = ({
  tickets,
  onSelectTicket,
  modoReasignacion = false,
  mensajeVacio = 'No hay reclamos con los filtros seleccionados.',
}) => (
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
        {tickets.length === 0 ? (
          <tr>
            <td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
              <AlertCircle size={24} style={{ margin: '0 auto 0.5rem', display: 'block' }} />
              {mensajeVacio}
            </td>
          </tr>
        ) : (
          tickets.map((ticket) => (
            <tr key={ticket.id}>
              <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--primary-500)' }}>
                {ticket.folio}
              </td>
              <td>
                <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{ticket.areaAsignada}</span>
              </td>
              <td>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-main)' }}>
                  {ticket.funcionarioAsignadoNombre || 'Sin asignar'}
                </span>
              </td>
              <td>
                <div style={{ maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 500, color: 'var(--text-main)' }} title={ticket.asunto}>
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
                  <button onClick={() => onSelectTicket(ticket)} className="btn btn-secondary" style={estiloBoton}>
                    Examinar Caso
                  </button>
                  {modoReasignacion
                    ? puedeReasignar(ticket) && (
                        <button onClick={() => onSelectTicket(ticket, 'reasignar')} className="btn btn-primary" style={estiloBoton}>
                          Reasignar
                        </button>
                      )
                    : puedeAprobar(ticket) && (
                        <button onClick={() => onSelectTicket(ticket, 'aprobar')} className="btn btn-success" style={estiloBoton}>
                          Aprobar
                        </button>
                      )}
                </div>
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  </div>
);
