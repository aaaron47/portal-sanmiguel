import { useEffect, useState } from 'react';
import { reportesController, KpisReporte, ReportePorArea } from '@/controllers/reportes.controller';
import { NotifyFn } from '@/types/ui.types';

export function useControlMunicipal(onNotify: NotifyFn) {
  const [kpis, setKpis] = useState<KpisReporte | null>(null);
  const [areas, setAreas] = useState<ReportePorArea[]>([]);
  const [periodo, setPeriodo] = useState('2026-10');

  useEffect(() => {
    cargarReportes();
  }, [periodo]);

  const cargarReportes = async () => {
    try {
      const [dataKpis, dataAreas] = await Promise.all([
        reportesController.getKpis(),
        reportesController.getReportesPorArea(),
      ]);
      setKpis(dataKpis);
      setAreas(dataAreas);
    } catch {
      onNotify('error', 'Error al obtener reportes de control municipal');
    }
  };

  const descargarReporte = () => {
    onNotify('success', 'Generando Reporte Oficial de Cumplimiento Municipal en PDF...');
  };

  return {
    kpis,
    areas,
    periodo,
    setPeriodo,
    descargarReporte,
  };
}
