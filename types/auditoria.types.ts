export type AccionAuditoria =
  | 'LOGIN'
  | 'LOGOUT'
  | 'CREACION_USUARIO'
  | 'CAMBIO_ESTADO_USUARIO'
  | 'CONSULTA_AUDITORIA'
  | 'REINICIO_PASSWORD'
  | 'ACTUALIZACION_GOBERNANZA_TELEMETRIA'
  | 'CONSULTA_GOBERNANZA'
  | 'ASIGNACION_ROL'
  | 'EXPORTACION_REPORTE'
  | 'ACTUALIZACION_POLITICA'
  | 'REASIGNACION_MASIVA'
  | 'APROBACION_RESOLUCION'
  | 'DEPURACION_PROGRAMADA';

export interface AuditoriaLog {
  id: string;
  adminId: string;
  adminNombre: string;
  adminEmail: string;
  accion: AccionAuditoria | string;
  entidadAfectada: string; // ej. "Usuario: USR-005", "Sesión"
  ipOrigen: string;
  userAgent: string;
  detalles: string;
  fecha: string;
}

export interface AuditoriaFiltros {
  accion?: string;
  busqueda?: string;
  fechaDesde?: string;
  fechaHasta?: string;
}
