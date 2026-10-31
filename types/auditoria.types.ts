export interface AuditoriaLog {
  id: string;
  adminId: string;
  adminNombre: string;
  adminEmail: string;
  accion: 'LOGIN' | 'LOGOUT' | 'CREACION_USUARIO' | 'CAMBIO_ESTADO_USUARIO' | 'CONSULTA_AUDITORIA' | 'REINICIO_PASSWORD';
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
