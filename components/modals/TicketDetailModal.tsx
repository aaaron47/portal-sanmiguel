import React from 'react';
import { AccionTicket, OnAccionTicket, Ticket } from '@/types/ticket.types';
import { UserRole } from '@/types/auth.types';
import { FuncionarioOpcion } from '@/utils/ticket.utils';
import { ExpedienteHeader } from './ticket-detail/parts/ExpedienteHeader';
import { ExpedienteMetadatos } from './ticket-detail/parts/ExpedienteMetadatos';
import { ExpedienteDescripcion } from './ticket-detail/parts/ExpedienteDescripcion';
import { ExpedienteFlujo } from './ticket-detail/parts/ExpedienteFlujo';
import { SeguimientoTimeline } from './ticket-detail/parts/SeguimientoTimeline';
import { AccionesForm } from './ticket-detail/parts/AccionesForm';

interface TicketDetailModalProps {
  ticket: Ticket;
  rolUsuario: UserRole;
  initialAction?: AccionTicket;
  /** Funcionarios a los que el supervisor puede asignar o reasignar el reclamo. */
  funcionarios?: FuncionarioOpcion[];
  onClose: () => void;
  onAccion: OnAccionTicket;
}

export const TicketDetailModal: React.FC<TicketDetailModalProps> = ({
  ticket,
  rolUsuario,
  initialAction = 'ninguna',
  funcionarios,
  onClose,
  onAccion,
}) => {
  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '800px' }}>
        <ExpedienteHeader ticket={ticket} onClose={onClose} />

        <div className="modal-body">
          <ExpedienteMetadatos ticket={ticket} />
          <ExpedienteDescripcion descripcion={ticket.descripcion} />
          <ExpedienteFlujo ticket={ticket} />
          <SeguimientoTimeline seguimientos={ticket.seguimientos} />
          <AccionesForm
            // Un formulario nuevo por reclamo, versión y acción inicial: así arranca limpio sin efectos.
            key={`${ticket.id}-${ticket.version ?? ''}-${initialAction}`}
            ticket={ticket}
            rolUsuario={rolUsuario}
            initialAction={initialAction}
            funcionarios={funcionarios}
            onAccion={onAccion}
          />
        </div>

        <div className="modal-footer">
          <button onClick={onClose} className="btn btn-secondary">
            Cerrar Expediente
          </button>
        </div>
      </div>
    </div>
  );
};
