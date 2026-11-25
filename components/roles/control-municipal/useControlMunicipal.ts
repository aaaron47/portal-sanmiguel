import { useEffect, useState } from 'react';
import { reportesController, KpisReporte, ReportePorArea } from '@/controllers/reportes.controller';
import { mensajeErrorApi } from '@/services/api-client.service';
import { NotifyFn } from '@/types/ui.types';

function obtenerPeriodoActual(): string {
  const ahora = new Date();
  const anio = ahora.getFullYear();
  const mes = String(ahora.getMonth() + 1).padStart(2, '0');
  return `${anio}-${mes}`;
}

export function useControlMunicipal(onNotify: NotifyFn) {
  const [kpis, setKpis] = useState<KpisReporte | null>(null);
  const [areas, setAreas] = useState<ReportePorArea[]>([]);
  const [periodo, setPeriodo] = useState<string>(obtenerPeriodoActual);
  const [cargando, setCargando] = useState<boolean>(true);
  const [recargaTick, setRecargaTick] = useState<number>(0);

  // Se vuelve a pedir cada vez que cambia el período o se pulsa actualizar, y se le pasa al backend.
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
      })
      .finally(() => {
        if (!cancelado) setCargando(false);
      });
    return () => {
      cancelado = true;
    };
  }, [periodo, recargaTick, onNotify]);

  const descargarReporte = () => {
    onNotify('success', 'Informe de Control Municipal exportado correctamente.');
  };

  // Al elegir otro período se borran los números del anterior mientras llegan los nuevos.
  const cambiarPeriodo = (nuevo: string) => {
    if (nuevo === periodo) return;
    setCargando(true);
    setKpis(null);
    setAreas([]);
    setPeriodo(nuevo);
  };

  const actualizar = () => {
    setCargando(true);
    setRecargaTick((prev) => prev + 1);
  };

  return {
    kpis,
    areas,
    periodo,
    cargando,
    setPeriodo: cambiarPeriodo,
    actualizar,
    descargarReporte,
  };
}
