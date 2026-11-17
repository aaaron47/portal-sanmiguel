import type { LucideIcon } from 'lucide-react';
import {
  Ban,
  CheckCircle,
  ClipboardList,
  Inbox,
  MessageSquareWarning,
  Paperclip,
  PenLine,
  RotateCcw,
  Send,
  StickyNote,
  ThumbsUp,
  Undo2,
  UserPlus,
} from 'lucide-react';
import { UserRole } from '@/types/auth.types';
import { AccionCodigo, Ticket } from '@/types/ticket.types';
import { fechaLegible } from '@/utils/fecha-peru.utils';
import { MAXIMO_EVIDENCIAS, estaConcluido, puede } from '@/utils/ticket.utils';

/**
 * Lugar del botón en el pie del expediente (modelo Z: la vista termina abajo a la derecha).
 * - principal: el paso que hace avanzar el reclamo; va al final, abajo a la derecha.
 * - alterna: otro paso del flujo; va junto al principal, a su izquierda.
 * - complementaria: no hace avanzar el reclamo; va abajo a la izquierda.
 */
export type NivelAccion = 'principal' | 'alterna' | 'complementaria';

export interface DefAccion {
  /** Texto del botón que abre el formulario. */
  label: string;
  /** Título del formulario. */
  titulo: string;
  /** Texto del botón que confirma. */
  confirmar: string;
  icon: LucideIcon;
  nivel: NivelAccion;
  /** Color del botón: verde si envía la respuesta al ciudadano, rojo si descarta el reclamo. */
  tono?: 'success' | 'danger';
}

/** Acciones en el orden del flujo. Solo se muestran las que vienen en `accionesPermitidas`. */
export const ACCIONES: Record<AccionCodigo, DefAccion> = {
  RECIBIR: { label: 'Recibir', titulo: 'Recibir el reclamo', confirmar: 'Marcar como recibido', icon: Inbox, nivel: 'alterna' },
  OBSERVAR: { label: 'Pedir información', titulo: 'Pedir información al ciudadano', confirmar: 'Enviar al ciudadano', icon: MessageSquareWarning, nivel: 'alterna' },
  VALIDAR: { label: 'Validar', titulo: 'Validar y clasificar', confirmar: 'Validar reclamo', icon: CheckCircle, nivel: 'principal' },
  ASIGNAR: { label: 'Asignar', titulo: 'Asignar área y funcionario', confirmar: 'Asignar', icon: UserPlus, nivel: 'principal' },
  EVALUAR: { label: 'Registrar evaluación', titulo: 'Registrar la evaluación del área', confirmar: 'Guardar evaluación', icon: ClipboardList, nivel: 'alterna' },
  ELABORAR_RESPUESTA: { label: 'Elaborar respuesta', titulo: 'Elaborar la respuesta al ciudadano', confirmar: 'Guardar respuesta', icon: Send, nivel: 'principal' },
  OBSERVAR_RESPUESTA: { label: 'Observar respuesta', titulo: 'Devolver la respuesta al funcionario', confirmar: 'Devolver con observaciones', icon: PenLine, nivel: 'alterna' },
  APROBAR_RESPUESTA: { label: 'Aprobar respuesta', titulo: 'Aprobar y enviar la respuesta', confirmar: 'Aprobar y enviar', icon: ThumbsUp, nivel: 'principal', tono: 'success' },
  NOTA: { label: 'Nota interna', titulo: 'Agregar una nota interna', confirmar: 'Guardar nota', icon: StickyNote, nivel: 'complementaria' },
  ADJUNTAR_EVIDENCIA: { label: 'Adjuntar evidencia', titulo: 'Adjuntar una evidencia de la evaluación', confirmar: 'Adjuntar evidencia', icon: Paperclip, nivel: 'complementaria' },
  REASIGNAR: { label: 'Reasignar funcionario', titulo: 'Reasignar a otro funcionario del área', confirmar: 'Reasignar', icon: RotateCcw, nivel: 'complementaria' },
  DEVOLVER_PARA_REASIGNAR: { label: 'Devolver para reasignar', titulo: 'Devolver al supervisor para reasignar', confirmar: 'Devolver', icon: Undo2, nivel: 'complementaria' },
  DECLARAR_IMPROCEDENTE: { label: 'Declarar improcedente', titulo: 'Declarar improcedente', confirmar: 'Declarar improcedente', icon: Ban, nivel: 'complementaria', tono: 'danger' },
};

const ORDEN = Object.keys(ACCIONES) as AccionCodigo[];

/** Si no hay una acción principal, estas pueden ocupar su lugar: también hacen avanzar el reclamo. */
const PUEDEN_SER_PRINCIPAL: AccionCodigo[] = ['RECIBIR', 'EVALUAR'];

export interface AccionesDelPie {
  principal?: AccionCodigo;
  alternas: AccionCodigo[];
  complementarias: AccionCodigo[];
}

/** Reparte las acciones que permite el backend entre las zonas del pie del expediente. */
export function repartirAcciones(t: Ticket): AccionesDelPie {
  const disponibles = ORDEN.filter((a) => puede(t, a));
  const delFlujo = disponibles.filter((a) => ACCIONES[a].nivel !== 'complementaria');
  const principal =
    [...delFlujo].reverse().find((a) => ACCIONES[a].nivel === 'principal') ??
    delFlujo.find((a) => PUEDEN_SER_PRINCIPAL.includes(a));
  return {
    principal,
    alternas: delFlujo.filter((a) => a !== principal),
    complementarias: disponibles.filter((a) => ACCIONES[a].nivel === 'complementaria'),
  };
}

export const esRolDeAtencion = (rol: UserRole) => rol === 'FUNCIONARIO' || rol === 'SUPERVISOR';

/**
 * Una frase con la situación del reclamo y a quién le toca el siguiente paso. Se muestra siempre, bajo los
 * pasos del flujo, para que nadie tenga que deducirlo de los botones.
 */
export function situacionReclamo(t: Ticket): string {
  if (t.estado === 'improcedente') return 'Reclamo concluido: se declaró improcedente y se avisó al ciudadano.';
  if (estaConcluido(t)) return 'Reclamo concluido: la respuesta final ya se envió al ciudadano.';
  if (t.observacion) {
    const plazo = t.plazoSubsanacion ? ` (plazo: ${fechaLegible(t.plazoSubsanacion)})` : '';
    return `Esperando que el ciudadano complete la información pedida${plazo}.`;
  }
  if (t.respuestaPorAprobar) {
    return puede(t, 'APROBAR_RESPUESTA')
      ? 'Te toca: revisa la respuesta del funcionario y apruébala o devuélvela con tus observaciones.'
      : 'La respuesta está esperando la aprobación del supervisor.';
  }
  switch (t.estado) {
    case 'registrado':
      return puede(t, 'VALIDAR') || puede(t, 'RECIBIR')
        ? 'Te toca: recibe el reclamo y valídalo.'
        : 'Esperando que un funcionario reciba y valide el reclamo.';
    case 'pendiente de validación':
      return puede(t, 'VALIDAR')
        ? 'Te toca: valida y clasifica el reclamo, o pide al ciudadano la información que falte.'
        : 'Esperando que un funcionario valide el reclamo.';
    case 'pendiente de asignación':
      return puede(t, 'ASIGNAR')
        ? 'Te toca: asigna el área, el funcionario y la prioridad.'
        : 'Esperando que el supervisor asigne el área y el funcionario.';
    default:
      return puede(t, 'ELABORAR_RESPUESTA') || puede(t, 'EVALUAR')
        ? 'Te toca: registra la evaluación y elabora la respuesta para el ciudadano.'
        : `En evaluación a cargo de ${t.funcionarioAsignadoNombre || 'el funcionario asignado'}.`;
  }
}

export interface Consecuencia {
  texto: string;
  /** true: no se puede deshacer; se avisa con más énfasis junto al botón de confirmar. */
  irreversible?: boolean;
}

/** Qué pasa al confirmar cada acción. Se muestra junto al botón de confirmar, antes de hacer clic. */
export function consecuenciaAccion(accion: AccionCodigo, t: Ticket): Consecuencia {
  switch (accion) {
    case 'RECIBIR':
      return { texto: 'El reclamo quedará pendiente de validación.' };
    case 'VALIDAR':
      return { texto: 'El reclamo quedará pendiente de asignación: el supervisor elegirá el área y el funcionario.' };
    case 'OBSERVAR':
      return { texto: 'El ciudadano verá el pedido en la app, con el plazo para responder.' };
    case 'ASIGNAR':
      return { texto: 'El reclamo pasará a evaluación y el funcionario lo verá en su bandeja.' };
    case 'REASIGNAR':
      return { texto: 'El reclamo pasará a la bandeja del funcionario elegido.' };
    case 'DEVOLVER_PARA_REASIGNAR':
      return { texto: 'El reclamo volverá al supervisor para que lo reasigne.' };
    case 'EVALUAR':
      return { texto: 'La evaluación quedará en el expediente. El ciudadano no la ve.' };
    case 'ADJUNTAR_EVIDENCIA':
      return { texto: `La evidencia quedará unida a la última evaluación (hasta ${MAXIMO_EVIDENCIAS} por reclamo). El ciudadano no la ve.` };
    case 'ELABORAR_RESPUESTA':
      return t.prioridad === 'ALTA'
        ? { texto: 'Prioridad alta: la respuesta irá al supervisor para su aprobación antes de enviarse.' }
        : {
            texto:
              'Si el tipo de reclamo exige revisión, la respuesta irá al supervisor. Si no, se enviará al ciudadano y el reclamo quedará concluido.',
            irreversible: true,
          };
    case 'APROBAR_RESPUESTA':
      return { texto: 'La respuesta se enviará al ciudadano y el reclamo quedará concluido.', irreversible: true };
    case 'OBSERVAR_RESPUESTA':
      return { texto: 'La respuesta volverá al funcionario para que la corrija.' };
    case 'DECLARAR_IMPROCEDENTE':
      return { texto: 'El ciudadano recibirá este motivo y el reclamo quedará concluido.', irreversible: true };
    case 'NOTA':
      return { texto: 'La nota quedará en el historial. Solo la ve el personal.' };
  }
}
