import { apiClient, usarDatosDemo } from '@/services/api-client.service';
import { CambiosPoliticas, DocumentoVersion, PoliticasAcceso, TipoDocumento } from '@/types/seguridad.types';

// Datos simulados (solo sin conexión y en modo demo).
const MOCK_POLITICAS: PoliticasAcceso = {
  sessionTimeoutMinutes: 30,
  maxFailedLogins: 5,
  lockoutMinutes: 15,
  minPasswordLength: 8,
  version: 1,
  actualizadoEn: '2026-11-11T19:03:08Z',
  actualizadoPor: 'Administrador Demo',
};

const MOCK_DOCUMENTOS: DocumentoVersion[] = [
  { id: 'DOC-AVISO-1', tipo: 'AVISO_ANALITICA', version: '1.0', publicadoEn: '2026-10-30', activo: true },
  { id: 'DOC-PRIV-1', tipo: 'PRIVACIDAD', version: '1.0', publicadoEn: '2026-10-30', activo: true },
  { id: 'DOC-TERM-1', tipo: 'TERMINOS', version: '1.0', publicadoEn: '2026-10-30', activo: true },
  { id: 'DOC-DEV-1', tipo: 'DEVOLUCIONES', version: '1.0', publicadoEn: '2026-10-30', activo: true },
];

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
   * Endpoint backend: `PUT /seguridad/politicas-acceso` (solo ADMIN). Se envían solo los campos que cambiaron y la
   * `version` leída (409 si otro admin guardó antes). El backend valida los valores (422) y registra la auditoría.
   */
  async guardarPoliticas(cambios: CambiosPoliticas, version: number | undefined): Promise<PoliticasAcceso> {
    try {
      return await apiClient<PoliticasAcceso>('/seguridad/politicas-acceso', {
        method: 'PUT',
        body: JSON.stringify({ ...cambios, version }),
      });
    } catch (err) {
      if (!usarDatosDemo(err)) throw err;
      Object.assign(MOCK_POLITICAS, cambios, {
        version: (MOCK_POLITICAS.version ?? 0) + 1,
        actualizadoEn: new Date().toISOString(),
      });
      return { ...MOCK_POLITICAS };
    }
  }

  /** Endpoint backend: `GET /documentos-versiones?tipo=…` (solo ADMIN), la más reciente primero. */
  async getDocumentosVersiones(tipo?: TipoDocumento): Promise<DocumentoVersion[]> {
    try {
      return await apiClient<DocumentoVersion[]>('/documentos-versiones', { params: { tipo } });
    } catch (err) {
      if (!usarDatosDemo(err)) throw err;
      return MOCK_DOCUMENTOS.filter((d) => !tipo || d.tipo === tipo);
    }
  }

  /**
   * Endpoint backend: `PUT /documentos-versiones/{id}/activar` (solo ADMIN). Deja esa versión como la activa de su
   * tipo. Hoy responde 501: falta que el responsable de la BD dé el permiso. Sin simulación.
   */
  async activarDocumentoVersion(id: string): Promise<DocumentoVersion> {
    return apiClient<DocumentoVersion>(`/documentos-versiones/${id}/activar`, { method: 'PUT' });
  }
}

export const seguridadController = new SeguridadController();
