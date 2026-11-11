/** Políticas de sesión y contraseña (`GET` / `PUT /seguridad/politicas-acceso`, ver docs/Solicitud_backend_control_acceso.md). */
export interface PoliticasAcceso {
  sessionTimeoutMinutes: number;
  passwordExpirationDays: number;
  maxFailedLogins: number;
  minPasswordLength: number;
  /** Bloqueo optimista: se devuelve en el PUT; si otro admin guardó antes, el backend responde 409. */
  version?: number;
  actualizadoEn?: string;
  actualizadoPor?: string;
}
