import React from 'react';
import { X } from 'lucide-react';
import { Ticket } from '@/types/ticket.types';
import { StatusBadge } from '@/components/shared/ui/TicketLabels';

interface ExpedienteHeaderProps {
  ticket: Ticket;
  /** Id del título: el diálogo lo usa como nombre. */
  tituloId: string;
  onClose: () => void;
}

/**
 * Cabecera del expediente. Modelo Z: arriba a la izquierda, qué reclamo es (folio, estado, prioridad y
 * asunto); arriba a la derecha, la salida.
 */
export const ExpedienteHeader: React.FC<ExpedienteHeaderProps> = ({ ticket, tituloId, onClose }) => (
  <div className="modal-header expediente-cabecera">
    <div style={{ minWidth: 0 }}>
      <div className="expediente-cabecera-datos">
        <span className="expediente-folio">{ticket.folio}</span>
        <StatusBadge estado={ticket.estado} porAprobar={ticket.respuestaPorAprobar} />
        <span className="expediente-prioridad">Prioridad {ticket.prioridad}</span>
      </div>
      <h2 id={tituloId} className="expediente-asunto">
        {ticket.asunto}
      </h2>
    </div>
    <button type="button" onClick={onClose} className="expediente-cerrar" aria-label="Cerrar ventana" title="Cerrar ventana (Esc)">
      <X size={18} aria-hidden="true" />
    </button>
  </div>
);
