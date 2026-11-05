import { apiClient, usarDatosDemo } from '@/services/api-client.service';

/** Área municipal (`GET /areas`): solo las activas, ordenadas por nombre. */
export interface Area {
  id: string;
  codigo: string;
  nombre: string;
}

const MOCK_AREAS: Area[] = [
  { id: 'AREA-01', codigo: 'FISCALIZACION', nombre: 'Fiscalización y Control' },
  { id: 'AREA-02', codigo: 'OBRAS', nombre: 'Obras Públicas' },
];

export class AreasController {
  async getAreas(): Promise<Area[]> {
    try {
      return await apiClient<Area[]>('/areas');
    } catch (err) {
      // Datos simulados solo sin conexión y en modo demo; si no, el error llega a la vista.
      if (!usarDatosDemo(err)) throw err;
      return [...MOCK_AREAS];
    }
  }
}

export const areasController = new AreasController();
