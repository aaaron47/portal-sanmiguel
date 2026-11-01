import { apiClient, usarDatosDemo } from '@/services/api-client.service';

export interface KpisReporte {
  totalReclamosPeriodo: number;
  tiempoPromedioResolucionDias: number;
  tasaResolucionPorcentaje: number;
  totalConstanciasEmitidas: number;
  constanciasAprobadas: number;
  constanciasObservadas: number;
  constanciasPendientes: number;
}

export interface ReportePorArea {
  area: string;
  totalReclamos: number;
  resueltos: number;
  enProceso: number;
  porcentajeCumplimiento: number;
}

const MOCK_KPIS: KpisReporte = {
  totalReclamosPeriodo: 487,
  tiempoPromedioResolucionDias: 2.8,
  tasaResolucionPorcentaje: 91.4,
  totalConstanciasEmitidas: 142,
  constanciasAprobadas: 118,
  constanciasObservadas: 14,
  constanciasPendientes: 10,
};

const MOCK_AREAS: ReportePorArea[] = [
  { area: 'Fiscalización y Control', totalReclamos: 184, resueltos: 168, enProceso: 16, porcentajeCumplimiento: 91.3 },
  { area: 'Obras Públicas', totalReclamos: 112, resueltos: 98, enProceso: 14, porcentajeCumplimiento: 87.5 },
  { area: 'Limpieza Pública', totalReclamos: 96, resueltos: 94, enProceso: 2, porcentajeCumplimiento: 97.9 },
  { area: 'Parques y Jardines', totalReclamos: 58, resueltos: 52, enProceso: 6, porcentajeCumplimiento: 89.6 },
  { area: 'Seguridad Ciudadana', totalReclamos: 37, resueltos: 36, enProceso: 1, porcentajeCumplimiento: 97.2 },
];

export class ReportesController {
  /** `periodo`: "2026-10" (mes) o "2026-T3" (trimestre). Los datos simulados no cambian por período. */
  async getKpis(periodo: string): Promise<KpisReporte> {
    try {
      return await apiClient<KpisReporte>('/reportes/kpis', { params: { periodo } });
    } catch (err) {
      // Datos simulados solo sin conexión y en modo demo; si no, el error llega a la vista.
      if (!usarDatosDemo(err)) throw err;
      return MOCK_KPIS;
    }
  }

  async getReportesPorArea(periodo: string): Promise<ReportePorArea[]> {
    try {
      return await apiClient<ReportePorArea[]>('/reportes/areas', { params: { periodo } });
    } catch (err) {
      // Datos simulados solo sin conexión y en modo demo; si no, el error llega a la vista.
      if (!usarDatosDemo(err)) throw err;
      return MOCK_AREAS;
    }
  }
}

export const reportesController = new ReportesController();
