import { useEffect, useMemo, useState } from 'react';
import { telemetriaController } from '@/controllers/telemetria.controller';
import { mensajeErrorApi } from '@/services/api-client.service';
import { TelemetriaResumen, TelemetriaEvento, FiltrosUso, CanalUso } from '@/types/telemetria.types';
import { NotifyFn } from '@/types/ui.types';
import { hoyEnPeru, sumarDias } from '@/utils/fecha-peru.utils';

/** Cantidad de eventos recientes que se piden para la tabla de eventos anónimos. */
export const LIMITE_EVENTOS = 15;

/** Mensajes de Control TI según la respuesta del backend (el 404 significa que aún no publica la telemetría). */
export const MENSAJES_TELEMETRIA = {
  404: 'Las métricas de uso de la app todavía no están disponibles en el servidor. Inténtalo más tarde.',
};

export type PeriodoUso = 'hoy' | '7d' | '30d' | 'mes';

export const PERIODOS_USO: Array<{ valor: PeriodoUso; etiqueta: string }> = [
  { valor: 'hoy', etiqueta: 'Hoy' },
  { valor: '7d', etiqueta: 'Últimos 7 días' },
  { valor: '30d', etiqueta: 'Últimos 30 días' },
  { valor: 'mes', etiqueta: 'Este mes' },
];

/** Rango de fechas (hora de Perú, ambas incluidas) de cada período. */
function rangoPeriodo(periodo: PeriodoUso, hoy: string): Pick<FiltrosUso, 'fechaDesde' | 'fechaHasta'> {
  if (periodo === 'hoy') return { fechaDesde: hoy, fechaHasta: hoy };
  if (periodo === '7d') return { fechaDesde: sumarDias(hoy, -6), fechaHasta: hoy };
  if (periodo === '30d') return { fechaDesde: sumarDias(hoy, -29), fechaHasta: hoy };
  return { fechaDesde: `${hoy.slice(0, 8)}01`, fechaHasta: hoy };
}

/** Lo elegido en los filtros; cadena vacía = sin filtrar. Los valores son los códigos del backend. */
export interface SeleccionUso {
  periodo: PeriodoUso;
  canal: '' | CanalUso;
  funcionalidad: string;
  sistemaOperativo: string;
  appVersion: string;
}

const SELECCION_INICIAL: SeleccionUso = { periodo: '7d', canal: '', funcionalidad: '', sistemaOperativo: '', appVersion: '' };

export function useControlTi(onNotify: NotifyFn) {
  const [resumen, setResumen] = useState<TelemetriaResumen | null>(null);
  const [eventos, setEventos] = useState<TelemetriaEvento[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  // Mensaje del último error de carga; se muestra en la pantalla mientras no haya datos.
  const [errorCarga, setErrorCarga] = useState<string | null>(null);
  // Cada vez que sube, el efecto vuelve a pedir la telemetría (botón "Actualizar").
  const [recarga, setRecarga] = useState(0);
  const [seleccion, setSeleccion] = useState<SeleccionUso>(SELECCION_INICIAL);
  // Fecha de hoy en Perú; "Actualizar" la vuelve a leer por si cambió el día.
  const [hoy, setHoy] = useState(hoyEnPeru);

  const filtros: FiltrosUso = useMemo(
    () => ({
      ...rangoPeriodo(seleccion.periodo, hoy),
      canal: seleccion.canal || undefined,
      funcionalidad: seleccion.funcionalidad || undefined,
      sistemaOperativo: seleccion.sistemaOperativo || undefined,
      appVersion: seleccion.appVersion || undefined,
    }),
    [seleccion, hoy]
  );

  useEffect(() => {
    let cancelado = false;
    Promise.all([telemetriaController.getResumen(filtros), telemetriaController.getEventosRecientes(LIMITE_EVENTOS)])
      .then(([resumenData, eventosData]) => {
        if (cancelado) return;
        setResumen(resumenData);
        setEventos(eventosData);
        setErrorCarga(null);
      })
      .catch((err) => {
        if (cancelado) return;
        const mensaje = mensajeErrorApi(
          err,
          'No se pudieron cargar las métricas de la app. Inténtalo de nuevo.',
          MENSAJES_TELEMETRIA
        );
        setErrorCarga(mensaje);
        onNotify('error', mensaje);
      })
      .finally(() => {
        if (!cancelado) setIsLoading(false);
      });
    return () => {
      cancelado = true;
    };
  }, [filtros, recarga, onNotify]);

  const cargarTelemetria = () => {
    setIsLoading(true);
    setHoy(hoyEnPeru());
    setRecarga((n) => n + 1);
  };

  const cambiarFiltro = <K extends keyof SeleccionUso>(campo: K, valor: SeleccionUso[K]) => {
    setIsLoading(true);
    setSeleccion((prev) => ({ ...prev, [campo]: valor }));
  };

  const limpiarFiltros = () => {
    setIsLoading(true);
    setSeleccion(SELECCION_INICIAL);
  };

  return {
    resumen,
    eventos,
    isLoading,
    errorCarga,
    cargarTelemetria,
    seleccion,
    filtros,
    cambiarFiltro,
    limpiarFiltros,
  };
}
