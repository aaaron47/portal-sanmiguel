import { apiClient } from '@/services/api-client.service';

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
  async getKpis(): Promise<KpisReporte> {
    try {
      return await apiClient<KpisReporte>('/reportes/kpis');
    } catch {
      return MOCK_KPIS;
    }
  }

  async getReportesPorArea(): Promise<ReportePorArea[]> {
    try {
      return await apiClient<ReportePorArea[]>('/reportes/areas');
    } catch {
      return MOCK_AREAS;
    }
  }
}

export const reportesController = new ReportesController();
