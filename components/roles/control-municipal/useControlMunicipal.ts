import { useEffect, useState } from 'react';
import { reportesController, KpisReporte, ReportePorArea } from '@/controllers/reportes.controller';
import { mensajeErrorApi } from '@/services/api-client.service';
import { NotifyFn } from '@/types/ui.types';

export function useControlMunicipal(onNotify: NotifyFn) {
  const [kpis, setKpis] = useState<KpisReporte | null>(null);
  const [areas, setAreas] = useState<ReportePorArea[]>([]);
  const [periodo, setPeriodo] = useState('2026-10');

  // Se vuelve a pedir cada vez que cambia el período, y se le pasa al backend.
  useEffect(() => {
    let cancelado = false;
    Promise.all([reportesController.getKpis(periodo), reportesController.getReportesPorArea(periodo)])
      .then(([dataKpis, dataAreas]) => {
        // Si se cambió de período antes de que llegara la respuesta, se descarta.
        if (cancelado) return;
        setKpis(dataKpis);
        setAreas(dataAreas);
      })
      .catch((err) => {
        if (!cancelado) {
          // Sin datos en lugar de los del período anterior bajo el período elegido.
          setKpis(null);
          setAreas([]);
          onNotify('error', mensajeErrorApi(err, 'No se pudieron cargar los reportes del período. Recarga la página.'));
        }
      });
    return () => {
      cancelado = true;
    };
  }, [periodo, onNotify]);

  const descargarReporte = () => {
    onNotify('success', 'Generando Reporte Oficial de Cumplimiento Municipal en PDF...');
  };

  // Al elegir otro período se borran los números del anterior mientras llegan los nuevos.
  const cambiarPeriodo = (nuevo: string) => {
    if (nuevo === periodo) return;
    setKpis(null);
    setAreas([]);
    setPeriodo(nuevo);
  };

  return {
    kpis,
    areas,
    periodo,
    setPeriodo: cambiarPeriodo,
    descargarReporte,
  };
}
