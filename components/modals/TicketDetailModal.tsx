import React from 'react';
import { Ticket } from '@/types/ticket.types';
import { UserRole } from '@/types/auth.types';
import { ExpedienteHeader } from './ticket-detail/parts/ExpedienteHeader';
import { ExpedienteMetadatos } from './ticket-detail/parts/ExpedienteMetadatos';
import { ExpedienteDescripcion } from './ticket-detail/parts/ExpedienteDescripcion';
import { SeguimientoTimeline } from './ticket-detail/parts/SeguimientoTimeline';
import { AccionesForm } from './ticket-detail/parts/AccionesForm';

interface TicketDetailModalProps {
  ticket: Ticket;
  rolUsuario: UserRole;
  initialAction?: 'ninguna' | 'atender' | 'derivar' | 'aprobar' | 'reasignar' | 'constancia';
  onClose: () => void;
  onAtender: (id: string, comentario: string, nuevoEstado: 'por aprobar' | 'resuelto' | 'en evaluación') => Promise<void>;
  onDerivar: (id: string, areaDestino: string, motivo: string) => Promise<void>;
  onAprobar: (id: string, comentario: string) => Promise<void>;
  onReasignar: (id: string, nuevoFuncionarioId: string, nuevoNombre: string, motivo: string) => Promise<void>;
  onEvaluarConstancia: (id: string, estado: 'aprobada' | 'observada', observaciones: string) => Promise<void>;
}

export const TicketDetailModal: React.FC<TicketDetailModalProps> = ({
  ticket,
  rolUsuario,
  initialAction,
  onClose,
  onAtender,
  onDerivar,
  onAprobar,
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
            ticket={ticket}
            rolUsuario={rolUsuario}
            initialAction={initialAction}
            onAtender={onAtender}
            onDerivar={onDerivar}
            onAprobar={onAprobar}
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
