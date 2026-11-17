import React from 'react';
import { Ticket } from '@/types/ticket.types';

/** Determina la clase CSS semántica y accesible para el estado de un reclamo. */
export function claseEstadoReclamo(estado: string, porAprobar?: boolean): string {
  if (porAprobar) return 'status-por-aprobar';
  const normalizado = (estado || '').toLowerCase().trim();
  if (normalizado === 'registrado') return 'status-registrado';
  if (normalizado.includes('validaci')) return 'status-pendiente-validacion';
  if (normalizado.includes('asignaci')) return 'status-pendiente-asignacion';
  if (normalizado.includes('evaluaci')) return 'status-en-evaluacion';
  if (normalizado === 'respondido') return 'status-respondido';
  if (normalizado === 'cerrado') return 'status-cerrado';
  if (normalizado.includes('improcedente')) return 'status-improcedente';
  return 'status-registrado';
}

/** Determina la clase CSS semántica y accesible para el estado de una solicitud de constancia o constancia emitida. */
export function claseEstadoConstancia(estado: string): string {
  const upper = (estado || '').toUpperCase().trim();
  if (upper === 'EN_VERIFICACION') return 'status-en-verificacion';
  if (upper === 'PENDIENTE_PAGO') return 'status-pendiente-pago';
  if (upper === 'EMITIDA' || upper === 'VIGENTE') return 'status-emitida';
  if (upper === 'RECHAZADA') return 'status-rechazada';

  const lower = (estado || '').toLowerCase().trim();
  if (lower.includes('verificaci')) return 'status-en-verificacion';
  if (lower.includes('pago')) return 'status-pendiente-pago';
  if (lower.includes('emitid') || lower.includes('aprob') || lower.includes('vigente')) return 'status-emitida';
  if (lower.includes('rechaz') || lower.includes('desaprob') || lower.includes('observad')) return 'status-rechazada';

  return 'status-registrado';
}

/**
 * Estado del reclamo accesible; si hay una respuesta esperando al supervisor, lo indica ("en evaluación · por aprobar").
 * Cumple WCAG AA/AAA mediante contraste superior a 7:1, indicador visual y atributos ARIA.
 */
export const StatusBadge: React.FC<{
  estado: Ticket['estado'];
  porAprobar?: boolean;
  className?: string;
}> = ({ estado, porAprobar, className = '' }) => {
  const claseColor = claseEstadoReclamo(estado, porAprobar);
  const texto = porAprobar ? `${estado} · por aprobar` : estado;
  return (
    <span
      className={`badge-status ${claseColor} ${className}`.trim()}
      role="status"
      aria-label={`Estado del reclamo: ${texto}`}
    >
      {texto}
    </span>
  );
};

/**
 * Etiqueta de estado para solicitudes de constancia de no adeudo con colores semánticos e indicador visual.
 */
export const ConstanciaStatusBadge: React.FC<{
  estado: string;
  etiqueta?: string;
  className?: string;
}> = ({ estado, etiqueta, className = '' }) => {
  const claseColor = claseEstadoConstancia(estado);
  const texto = etiqueta || estado;
  return (
    <span
      className={`badge-status ${claseColor} ${className}`.trim()}
      role="status"
      aria-label={`Estado de solicitud: ${texto}`}
    >
      {texto}
    </span>
  );
};

export const PriorityLabel: React.FC<{ prioridad: Ticket['prioridad'] }> = ({ prioridad }) => (
  <span
    style={{
      fontSize: '0.75rem',
      fontWeight: 500,
      color: 'var(--text-main)',
    }}
  >
    {prioridad}
  </span>
);
