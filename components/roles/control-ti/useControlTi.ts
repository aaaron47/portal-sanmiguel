import { useEffect, useState } from 'react';
import { telemetriaController } from '@/controllers/telemetria.controller';
import { TelemetriaResumen, TelemetriaEvento } from '@/types/telemetria.types';
import { NotifyFn } from '@/types/ui.types';

export function useControlTi(onNotify: NotifyFn) {
  const [resumen, setResumen] = useState<TelemetriaResumen | null>(null);
  const [eventos, setEventos] = useState<TelemetriaEvento[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    cargarTelemetria();
  }, []);

  const cargarTelemetria = async () => {
    setIsLoading(true);
    try {
      const [resumenData, eventosData] = await Promise.all([
        telemetriaController.getResumen(),
        telemetriaController.getEventosRecientes(15),
      ]);
      setResumen(resumenData);
      setEventos(eventosData);
    } catch {
      onNotify('error', 'Error al consultar métricas de telemetría de la app');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    resumen,
    eventos,
    isLoading,
    cargarTelemetria,
  };
}
