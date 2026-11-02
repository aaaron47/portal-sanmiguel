export type TicketEstado = 
  | 'pendiente de validación'
  | 'en evaluación'
  | 'derivado'
  | 'por aprobar'
  | 'resuelto'
  | 'archivado';

export type TicketPrioridad = 'BAJA' | 'MEDIA' | 'ALTA' | 'URGENTE';

export interface TicketSeguimiento {
  id: string;
  reclamoId: string;
  autorId: string;
  autorNombre: string;
  autorRol: string;
  fecha: string;
  tipoAccion: 'CREACION' | 'ATENCION' | 'DERIVACION' | 'APROBACION' | 'DEVOLUCION' | 'REASIGNACION' | 'EVALUACION_CONSTANCIA';
  comentario: string; // Guarda texto enriquecido, derivaciones y evidencias según directiva ágil
}

export interface Ticket {
  id: string;
  folio: string; // ej. "REC-2026-0042"
  ciudadanoDni: string;
  ciudadanoNombre: string;
  ciudadanoEmail?: string;
  ciudadanoTelefono?: string;
  asunto: string;
  descripcion: string;
  areaAsignada: string; // ej. "Fiscalización y Control", "Obras Públicas", "Seguridad Ciudadana"
  funcionarioAsignadoId?: string;
  funcionarioAsignadoNombre?: string;
  estado: TicketEstado;
  prioridad: TicketPrioridad;
  tieneConstancia: boolean;
  estadoConstancia?: 'sin_evaluar' | 'aprobada' | 'observada';
  fechaCreacion: string;
  fechaActualizacion: string;
  seguimientos: TicketSeguimiento[];
}

export interface TicketFiltros {
  estado?: TicketEstado | 'todos';
  prioridad?: TicketPrioridad | 'todos';
  area?: string;
  busqueda?: string; // Folio, asunto o DNI
  soloAsignadosAMi?: boolean;
}

export interface RespuestaPayload {
  comentarioRespuesta: string;
  nuevoEstado: 'por aprobar' | 'resuelto' | 'en evaluación';
}

export interface DerivacionPayload {
  areaDestino: string;
  motivoDerivacion: string;
}

export interface DevolucionPayload {
  motivoDevolucion: string;
}

export interface ReasignacionPayload {
  nuevoFuncionarioId: string;
  nuevoFuncionarioNombre: string;
  motivoReasignacion: string;
}

/** Acción abierta en el detalle de un reclamo. */
export type AccionTicket =
  | 'ninguna'
  | 'atender'
  | 'derivar'
  | 'constancia'
  | 'aprobar'
  | 'devolver'
  | 'reasignar';

/** Estados que el funcionario puede elegir al atender (no puede resolver sin el supervisor). */
export type EstadoAtencion = 'en evaluación' | 'por aprobar';
