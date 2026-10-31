import React from 'react';
import { AccionTicket, EstadoAtencion, Ticket } from '@/types/ticket.types';
import { UserRole } from '@/types/auth.types';
import { FuncionarioOpcion } from '@/utils/ticket.utils';
import { ExpedienteHeader } from './ticket-detail/parts/ExpedienteHeader';
import { ExpedienteMetadatos } from './ticket-detail/parts/ExpedienteMetadatos';
import { ExpedienteDescripcion } from './ticket-detail/parts/ExpedienteDescripcion';
import { SeguimientoTimeline } from './ticket-detail/parts/SeguimientoTimeline';
import { AccionesForm } from './ticket-detail/parts/AccionesForm';

interface TicketDetailModalProps {
  ticket: Ticket;
  rolUsuario: UserRole;
  initialAction?: AccionTicket;
  /** Funcionarios a los que el supervisor puede reasignar el reclamo. */
  funcionarios?: FuncionarioOpcion[];
  onClose: () => void;
  onAtender: (id: string, comentario: string, nuevoEstado: EstadoAtencion) => Promise<void>;
  onDerivar: (id: string, areaDestino: string, motivo: string) => Promise<void>;
  onAprobar: (id: string, comentario: string) => Promise<void>;
  onDevolver?: (id: string, motivo: string) => Promise<void>;
  onReasignar: (id: string, nuevoFuncionarioId: string, nuevoNombre: string, motivo: string) => Promise<void>;
  onEvaluarConstancia: (id: string, estado: 'aprobada' | 'observada', observaciones: string) => Promise<void>;
}

export const TicketDetailModal: React.FC<TicketDetailModalProps> = ({
  ticket,
  rolUsuario,
  initialAction = 'ninguna',
  funcionarios,
  onClose,
  onAtender,
  onDerivar,
  onAprobar,
  onDevolver,
  onReasignar,
  onEvaluarConstancia,
}) => {
  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '800px' }}>
        <ExpedienteHeader ticket={ticket} onClose={onClose} />

        <div className="modal-body">
          <ExpedienteMetadatos ticket={ticket} />
          <ExpedienteDescripcion descripcion={ticket.descripcion} />
          <SeguimientoTimeline seguimientos={ticket.seguimientos} />
          <AccionesForm
            // Un formulario nuevo por reclamo y acción inicial: así arranca limpio sin efectos.
            key={`${ticket.id}-${initialAction}`}
            ticket={ticket}
            rolUsuario={rolUsuario}
            initialAction={initialAction}
            funcionarios={funcionarios}
            onAtender={onAtender}
            onDerivar={onDerivar}
            onAprobar={onAprobar}
            onDevolver={onDevolver}
            onReasignar={onReasignar}
            onEvaluarConstancia={onEvaluarConstancia}
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
