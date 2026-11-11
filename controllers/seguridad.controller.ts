import { apiClient, usarDatosDemo } from '@/services/api-client.service';
import { PoliticasAcceso } from '@/types/seguridad.types';

// Datos simulados (solo sin conexión y en modo demo).
const MOCK_POLITICAS: PoliticasAcceso = {
  sessionTimeoutMinutes: 45,
  passwordExpirationDays: 90,
  maxFailedLogins: 5,
  minPasswordLength: 8,
  version: 1,
};

export class SeguridadController {
  /** Endpoint backend: `GET /seguridad/politicas-acceso` (solo ADMIN). */
  async getPoliticas(): Promise<PoliticasAcceso> {
    try {
      return await apiClient<PoliticasAcceso>('/seguridad/politicas-acceso');
    } catch (err) {
      if (!usarDatosDemo(err)) throw err;
      return { ...MOCK_POLITICAS };
    }
  }

  /**
   * Endpoint backend: `PUT /seguridad/politicas-acceso` (solo ADMIN). Se envía la `version` leída;
   * si otro admin guardó antes, el backend responde 409.
   */
  async guardarPoliticas(politicas: PoliticasAcceso & Record<string, unknown>): Promise<PoliticasAcceso> {
    try {
      return await apiClient<PoliticasAcceso>('/seguridad/politicas-acceso', {
        method: 'PUT',
        body: JSON.stringify(politicas),
      });
    } catch (err) {
      if (!usarDatosDemo(err)) throw err;
      Object.assign(MOCK_POLITICAS, {
        sessionTimeoutMinutes: politicas.sessionTimeoutMinutes,
        passwordExpirationDays: politicas.passwordExpirationDays,
        maxFailedLogins: politicas.maxFailedLogins,
        minPasswordLength: politicas.minPasswordLength,
        version: (MOCK_POLITICAS.version ?? 0) + 1,
      });
      return { ...MOCK_POLITICAS };
    }
  }
}

export const seguridadController = new SeguridadController();
