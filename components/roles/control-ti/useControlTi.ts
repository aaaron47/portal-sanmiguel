import { useEffect, useState } from 'react';
import { telemetriaController } from '@/controllers/telemetria.controller';
import { mensajeErrorApi } from '@/services/api-client.service';
import { TelemetriaResumen, TelemetriaEvento } from '@/types/telemetria.types';
import { NotifyFn } from '@/types/ui.types';

export function useControlTi(onNotify: NotifyFn) {
  const [resumen, setResumen] = useState<TelemetriaResumen | null>(null);
  const [eventos, setEventos] = useState<TelemetriaEvento[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  // Cada vez que sube, el efecto vuelve a pedir la telemetría (botón "Actualizar").
  const [recarga, setRecarga] = useState(0);

  useEffect(() => {
    let cancelado = false;
    Promise.all([telemetriaController.getResumen(), telemetriaController.getEventosRecientes(15)])
      .then(([resumenData, eventosData]) => {
        if (cancelado) return;
        setResumen(resumenData);
        setEventos(eventosData);
      })
      .catch((err) => {
        if (!cancelado) {
          onNotify('error', mensajeErrorApi(err, 'No se pudieron cargar las métricas de la app. Inténtalo de nuevo.'));
        }
      })
      .finally(() => {
        if (!cancelado) setIsLoading(false);
      });
    return () => {
      cancelado = true;
    };
    // onNotify cambia de identidad entre renders del padre; solo importa la recarga.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recarga]);

  const cargarTelemetria = () => {
    setIsLoading(true);
    setRecarga((n) => n + 1);
  };

  return {
    resumen,
    eventos,
    isLoading,
    cargarTelemetria,
  };
}
