import React, { useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { AccionCodigo, AccionTicket, OnAccionTicket, Ticket } from '@/types/ticket.types';
import { UserRole } from '@/types/auth.types';
import { FuncionarioOpcion } from '@/utils/ticket.utils';
import { useAccionReclamo } from './ticket-detail/useAccionReclamo';
import { ExpedienteHeader } from './ticket-detail/parts/ExpedienteHeader';
import { FlujoPasos } from './ticket-detail/parts/FlujoPasos';
import { ExpedienteTabs, PestanaExpediente } from './ticket-detail/parts/ExpedienteTabs';
import { ExpedienteMetadatos } from './ticket-detail/parts/ExpedienteMetadatos';
import { ExpedienteDescripcion } from './ticket-detail/parts/ExpedienteDescripcion';
import { ExpedienteAdjuntos } from './ticket-detail/parts/ExpedienteAdjuntos';
import { ExpedienteFlujo } from './ticket-detail/parts/ExpedienteFlujo';
import { SeguimientoTimeline } from './ticket-detail/parts/SeguimientoTimeline';
import { AccionesForm } from './ticket-detail/parts/AccionesForm';
import { AccionesPie, Descarte } from './ticket-detail/parts/AccionesPie';

interface TicketDetailModalProps {
  ticket: Ticket;
  rolUsuario: UserRole;
  initialAction?: AccionTicket;
  /** Funcionarios a los que el supervisor puede asignar o reasignar el reclamo. */
  funcionarios?: FuncionarioOpcion[];
  onClose: () => void;
  onAccion: OnAccionTicket;
}

const TITULO_ID = 'expediente-titulo';
const FORM_ID = 'expediente-accion';
const ENFOCABLES = 'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])';

/**
 * Expediente de un reclamo. Se lee en Z: arriba, qué reclamo es y en qué paso está; al medio, dos pestañas
 * (datos generales y flujo); abajo, las acciones, con la que hace avanzar el reclamo al final a la derecha.
 * La cabecera y el pie quedan fijos; solo se desplaza el contenido de la pestaña.
 */
export const TicketDetailModal: React.FC<TicketDetailModalProps> = ({
  ticket,
  rolUsuario,
  initialAction = 'ninguna',
  funcionarios = [],
  onClose,
  onAccion,
}) => {
  // Cada evidencia nueva vuelve a montar la lista de adjuntos para que lea la del servidor.
  const [evidenciasSubidas, setEvidenciasSubidas] = useState(0);
  const ejecutar: OnAccionTicket = async (t, accion, datos) => {
    await onAccion(t, accion, datos);
    if (accion === 'ADJUNTAR_EVIDENCIA') setEvidenciasSubidas((n) => n + 1);
  };

  const estado = useAccionReclamo({ ticket, initialAction, funcionarios, onAccion: ejecutar });
  const hayAccion = estado.accion !== 'ninguna';
  // Si se abre con una acción (p. ej. "Aprobar" desde la tabla), se entra directo a su formulario.
  const [pestana, setPestana] = useState<PestanaExpediente>(hayAccion ? 'flujo' : 'datos');
  const [descarte, setDescarte] = useState<Descarte>(null);
  const dialogo = useRef<HTMLDivElement>(null);

  // Al abrir, el foco entra al expediente; al cerrar, vuelve al botón desde el que se abrió.
  useEffect(() => {
    const anterior = document.activeElement as HTMLElement | null;
    dialogo.current?.focus();
    return () => anterior?.focus?.();
  }, []);

  // El foco nunca queda fuera del expediente (p. ej. cuando desaparece el botón que se acaba de usar).
  useEffect(() => {
    if (dialogo.current && !dialogo.current.contains(document.activeElement)) dialogo.current.focus();
  });

  // Al abrir una acción, el cursor va al primer campo de su formulario.
  useEffect(() => {
    if (estado.accion === 'ninguna') return;
    document.getElementById(FORM_ID)?.querySelector<HTMLElement>('select:not(:disabled), textarea, input')?.focus();
  }, [estado.accion]);

  const abrirAccion = (accion: AccionCodigo) => {
    estado.abrir(accion);
    setPestana('flujo');
  };

  // Antes de perder lo escrito se pregunta; si no hay nada escrito, se sale sin más.
  const pedirCancelar = () => {
    if (estado.enviando) return;
    if (estado.conCambios) setDescarte('accion');
    else estado.cerrar();
  };
  const pedirCerrar = () => {
    if (estado.enviando) return;
    if (hayAccion && estado.conCambios) setDescarte('expediente');
    else onClose();
  };
  const descartar = () => {
    const cerrarExpediente = descarte === 'expediente';
    setDescarte(null);
    if (cerrarExpediente) onClose();
    else estado.cerrar();
  };

  const alTeclear = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape') {
      // Esc retrocede un nivel: la pregunta de descarte, la acción abierta y, por último, el expediente.
      e.stopPropagation();
      if (descarte) setDescarte(null);
      else if (hayAccion) pedirCancelar();
      else pedirCerrar();
      return;
    }
    if (e.key !== 'Tab' || !dialogo.current) return;
    // Tab da la vuelta dentro del expediente: no se escapa a la página de atrás.
    const enfocables = [...dialogo.current.querySelectorAll<HTMLElement>(ENFOCABLES)].filter(
      (el) => el.offsetParent !== null && !el.matches(':disabled')
    );
    if (enfocables.length === 0) return;
    const primero = enfocables[0];
    const ultimo = enfocables[enfocables.length - 1];
    const actual = document.activeElement;
    if (e.shiftKey && (actual === primero || actual === dialogo.current)) {
      e.preventDefault();
      ultimo.focus();
    } else if (!e.shiftKey && actual === ultimo) {
      e.preventDefault();
      primero.focus();
    }
  };

  return (
    <div className="modal-overlay">
      <div
        ref={dialogo}
        className="modal-content expediente-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={TITULO_ID}
        tabIndex={-1}
        onKeyDown={alTeclear}
      >
        <ExpedienteHeader ticket={ticket} tituloId={TITULO_ID} onClose={pedirCerrar} />
        <FlujoPasos ticket={ticket} />
        <ExpedienteTabs activa={pestana} onCambiar={setPestana} enEdicion={hayAccion} />

        {/* Las dos pestañas quedan montadas: al cambiar de una a otra no se pierde lo escrito ni el archivo abierto. */}
        <div id="panel-datos" role="tabpanel" aria-labelledby="pestana-datos" className="expediente-panel" hidden={pestana !== 'datos'} tabIndex={0}>
          <ExpedienteMetadatos ticket={ticket} />
          <ExpedienteDescripcion ticket={ticket} />
          <ExpedienteAdjuntos key={`${ticket.id}-${evidenciasSubidas}`} ticketId={ticket.id} />
        </div>

        <div id="panel-flujo" role="tabpanel" aria-labelledby="pestana-flujo" className="expediente-panel" hidden={pestana !== 'flujo'} tabIndex={0}>
          {estado.accion !== 'ninguna' && (
            <AccionesForm key={estado.accion} id={FORM_ID} accion={estado.accion} ticket={ticket} estado={estado} />
          )}
          <ExpedienteFlujo ticket={ticket} />
          <SeguimientoTimeline seguimientos={ticket.seguimientos} />
        </div>

        <AccionesPie
          ticket={ticket}
          rolUsuario={rolUsuario}
          estado={estado}
          formId={FORM_ID}
          descarte={descarte}
          onAbrir={abrirAccion}
          onCancelar={pedirCancelar}
          onCerrar={pedirCerrar}
          onSeguirEditando={() => setDescarte(null)}
          onDescartar={descartar}
          onAntesDeConfirmar={() => {
            // Si el formulario está en la otra pestaña, se muestra antes de enviar: así se ve qué campo falta.
            if (pestana !== 'flujo') flushSync(() => setPestana('flujo'));
          }}
        />
      </div>
    </div>
  );
};
