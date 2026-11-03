import React, { useState } from 'react';
import { AlertCircle, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
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
}) => {
  const [paginaActual, setPaginaActual] = useState(1);
  const [registrosPorPagina, setRegistrosPorPagina] = useState(10);

  const totalPaginas = Math.max(1, Math.ceil(tickets.length / registrosPorPagina));
  const paginaAjustada = Math.min(paginaActual, totalPaginas);
  const indiceInicio = tickets.length === 0 ? 0 : (paginaAjustada - 1) * registrosPorPagina + 1;
  const indiceFin = Math.min(paginaAjustada * registrosPorPagina, tickets.length);
  const ticketsPaginados = tickets.slice((paginaAjustada - 1) * registrosPorPagina, paginaAjustada * registrosPorPagina);

  return (
    <div>
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
              ticketsPaginados.map((ticket) => (
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

      {/* Barra de Paginación */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.75rem',
          padding: '0.5rem 0.25rem',
          fontSize: '0.75rem',
          color: 'var(--text-muted)',
          marginTop: '0.5rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <span>
            Mostrando <strong>{indiceInicio}</strong> – <strong>{indiceFin}</strong> de <strong>{tickets.length}</strong> reclamos
          </span>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span>Reclamos por página:</span>
            <select
              value={registrosPorPagina}
              onChange={(e) => {
                setRegistrosPorPagina(Number(e.target.value));
                setPaginaActual(1);
              }}
              style={{
                padding: '0.2rem 0.4rem',
                borderRadius: '6px',
                border: '1px solid var(--border-color)',
                fontSize: '0.75rem',
                background: 'var(--bg-card)',
                color: 'var(--text-main)',
              }}
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          <button
            onClick={() => setPaginaActual(1)}
            disabled={paginaAjustada === 1}
            className="btn btn-secondary"
            style={{ padding: '0.25rem 0.45rem', fontSize: '0.75rem' }}
            title="Primera Página"
          >
            <ChevronsLeft size={14} />
          </button>

          <button
            onClick={() => setPaginaActual((prev) => Math.max(1, prev - 1))}
            disabled={paginaAjustada === 1}
            className="btn btn-secondary"
            style={{ padding: '0.25rem 0.45rem', fontSize: '0.75rem' }}
            title="Página Anterior"
          >
            <ChevronLeft size={14} />
          </button>

          <span style={{ margin: '0 0.5rem', fontWeight: 600, color: 'var(--text-main)' }}>
            Página {paginaAjustada} de {totalPaginas}
          </span>

          <button
            onClick={() => setPaginaActual((prev) => Math.min(totalPaginas, prev + 1))}
            disabled={paginaAjustada === totalPaginas}
            className="btn btn-secondary"
            style={{ padding: '0.25rem 0.45rem', fontSize: '0.75rem' }}
            title="Página Siguiente"
          >
            <ChevronRight size={14} />
          </button>

          <button
            onClick={() => setPaginaActual(totalPaginas)}
            disabled={paginaAjustada === totalPaginas}
            className="btn btn-secondary"
            style={{ padding: '0.25rem 0.45rem', fontSize: '0.75rem' }}
            title="Última Página"
          >
            <ChevronsRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};
