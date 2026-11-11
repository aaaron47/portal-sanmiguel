/**
 * Políticas de acceso del personal (`GET` / `PUT /seguridad/politicas-acceso`, solo ADMIN). El backend las guarda
 * en `configuracion_sistema` y las aplica: bloqueo por intentos fallidos, cierre por inactividad y longitud mínima
 * al cambiar la contraseña. Ver docs/Solicitud_backend_control_acceso.md.
 */
export interface PoliticasAcceso {
  /** 15, 30, 45, 60 o 120. Sin peticiones durante ese tiempo, la sesión del portal se cierra. */
  sessionTimeoutMinutes: number;
  /** 3, 5 o 10 intentos fallidos antes de bloquear la cuenta. */
  maxFailedLogins: number;
  /** 5, 15, 30 o 60 minutos de bloqueo. */
  lockoutMinutes: number;
  /** 8, 10 o 12 caracteres. */
  minPasswordLength: number;
  /** Bloqueo optimista: se envía la leída; si otro admin guardó antes, el backend responde 409 `version_conflict`. */
  version?: number;
  actualizadoEn?: string;
  actualizadoPor?: string;
}

/** Campos que se pueden cambiar (los que no se envían no cambian). */
export type CambiosPoliticas = Partial<Omit<PoliticasAcceso, 'version' | 'actualizadoEn' | 'actualizadoPor'>>;

/** Tipos de `documentos_versiones`. El ciudadano acepta el `AVISO_ANALITICA` en el onboarding de la app. */
export type TipoDocumento = 'TERMINOS' | 'DEVOLUCIONES' | 'PRIVACIDAD' | 'AVISO_ANALITICA';

/** Una versión de un documento (`GET /documentos-versiones?tipo=…`, la más reciente primero). */
export interface DocumentoVersion {
  id: string;
  tipo: TipoDocumento;
  version: string;
  publicadoEn: string;
  activo: boolean;
}
