/** Los 7 estados del requerimiento (reclamos.estado). "por aprobar" es un filtro, no un estado: ver `respuestaPorAprobar`. */
export type TicketEstado =
  | 'registrado'
  | 'pendiente de validación'
  | 'pendiente de asignación'
  | 'en evaluación'
  | 'respondido'
  | 'cerrado'
  | 'improcedente';

/** Estados más el filtro "por aprobar" (en evaluación con una respuesta esperando al supervisor). */
export type TicketFiltroEstado = TicketEstado | 'por aprobar';

/** Valores que acepta la BD (reclamos.prioridad): no existe URGENTE. */
export type TicketPrioridad = 'BAJA' | 'MEDIA' | 'ALTA';

export interface TicketSeguimiento {
  id: string;
  reclamoId: string;
  autorId: string;
  autorNombre: string;
  autorRol: string;
  fecha: string;
  tipoAccion: 'CREACION' | 'ATENCION' | 'DERIVACION' | 'APROBACION' | 'DEVOLUCION' | 'REASIGNACION' | 'EVALUACION_CONSTANCIA' | null;
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
  fechaCreacion: string;
  fechaActualizacion: string;
  seguimientos: TicketSeguimiento[];
  // ---- Flujo de atención (backend único). Opcionales para los datos de ejemplo. ----
  /** Valor de la BD (REGISTRADO, EN_EVALUACION...). */
  estadoCodigo?: string;
  /** En evaluación con una respuesta esperando la aprobación del supervisor. */
  respuestaPorAprobar?: boolean;
  /** Se envía en cada acción: si otra persona cambió el reclamo, el backend responde 409. */
  version?: number;
  areaId?: string;
  tipoReclamo?: string;
  /** INFORMACION_TRIBUTARIA, TRAMITES o ATENCION_CIUDADANO (se fija al validar). */
  categoria?: string;
  pedido?: string;
  canalIncidente?: string;
  /** Información pedida al ciudadano que aún no responde. */
  observacion?: string;
  plazoSubsanacion?: string;
  fechaLimite?: string;
  resultado?: ResultadoReclamo;
  numeroResolucion?: string;
  respuestaFinal?: string;
  /** Lo que puede hacer quien consulta, según su rol y el estado. El front solo muestra estos botones. */
  accionesPermitidas?: AccionCodigo[];
  /** Solo en el detalle. */
  evaluaciones?: TicketEvaluacion[];
  /** Solo en el detalle; la más reciente primero. */
  respuestas?: TicketRespuestaVersion[];
}

/**
 * Archivo de un reclamo (`GET /tickets/{id}/adjuntos`): los que subió el ciudadano en la app y las evidencias
 * que sube el personal al evaluar. El archivo se pide aparte, con la sesión (`GET /tickets/{id}/adjuntos/{adjuntoId}`).
 */
export interface TicketAdjunto {
  id: string;
  nombreArchivo: string;
  /** application/pdf, image/jpeg o image/png. */
  tipoMime: string;
  tamanoBytes: number;
  /** CIUDADANO, EVALUACION (evidencia del personal) o RESPUESTA. */
  origen: string;
  /** El de la BD: SUSTENTO, SUBSANACION, EVIDENCIA o RESPUESTA. */
  tipoAdjunto?: string;
  subidoPor?: string;
  /** Hora de Perú, `AAAA-MM-DD HH:mm:ss`. */
  subidoEn: string;
  /** false: el archivo lo guardó el backend de la app y este servidor todavía no puede entregarlo. */
  disponible?: boolean;
}

export type ResultadoReclamo = 'FUNDADO' | 'FUNDADO_EN_PARTE' | 'INFUNDADO';
export type CategoriaReclamo = 'INFORMACION_TRIBUTARIA' | 'TRAMITES' | 'ATENCION_CIUDADANO';

export interface TicketEvaluacion {
  id: string;
  evaluadoPor: string;
  antecedentes: string;
  hallazgos: string;
  conclusion?: string;
  fecha: string;
}

export interface TicketRespuestaVersion {
  id: string;
  numeroVersion: number;
  respuesta: string;
  fundamentos: string;
  accionesCorrectivas?: string;
  resultado: ResultadoReclamo;
  elaboradoPor: string;
  /** EN_REVISION = por aprobar. */
  estado: 'BORRADOR' | 'EN_REVISION' | 'OBSERVADA' | 'APROBADA';
  requiereRevision: boolean;
  revisadoPor?: string;
  comentarioRevision?: string;
  fecha: string;
}

export interface TicketFiltros {
  estado?: TicketFiltroEstado | 'todos';
  prioridad?: TicketPrioridad | 'todos';
  area?: string;
  busqueda?: string; // Folio, asunto o DNI
  soloAsignadosAMi?: boolean;
}

/** Acciones del flujo (las mismas de `accionesPermitidas` del backend). */
export type AccionCodigo =
  | 'RECIBIR'
  | 'VALIDAR'
  | 'OBSERVAR'
  | 'ASIGNAR'
  | 'REASIGNAR'
  | 'DEVOLVER_PARA_REASIGNAR'
  | 'EVALUAR'
  | 'ELABORAR_RESPUESTA'
  | 'APROBAR_RESPUESTA'
  | 'OBSERVAR_RESPUESTA'
  | 'CERRAR'
  | 'DECLARAR_IMPROCEDENTE'
  | 'NOTA'
  | 'ADJUNTAR_EVIDENCIA';

/** Acción abierta en el detalle de un reclamo. */
export type AccionTicket = 'ninguna' | AccionCodigo;

/** Datos de los formularios de acción; cada acción usa los suyos (el backend valida). */
export interface DatosAccion {
  comentario?: string;
  motivo?: string;
  categoria?: CategoriaReclamo;
  observacion?: string;
  plazoDias?: number;
  areaId?: string;
  funcionarioId?: string;
  prioridad?: TicketPrioridad;
  antecedentes?: string;
  hallazgos?: string;
  conclusion?: string;
  respuesta?: string;
  fundamentos?: string;
  accionesCorrectivas?: string;
  resultado?: ResultadoReclamo;
  /** Solo para el aviso al supervisor tras reasignar. */
  funcionarioNombre?: string;
  /** Evidencia de la evaluación (PDF, JPG o PNG de hasta 10 MB). Se envía como archivo, no en el JSON. */
  archivo?: File;
}

export type OnAccionTicket = (ticket: Ticket, accion: AccionCodigo, datos: DatosAccion) => Promise<void>;
