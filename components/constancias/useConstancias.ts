'use client';

import { useCallback, useEffect, useState } from 'react';
import { constanciasController } from '@/controllers/constancias.controller';
import { mensajeErrorApi } from '@/services/api-client.service';
import { EstadoSolicitudConstancia, ListadoSolicitudesConstancia } from '@/types/constancia.types';

export type FiltroEstadoConstancia = '' | EstadoSolicitudConstancia;

/** Los cuatro estados que se cuentan arriba de la tabla, en el orden en que se muestran. */
export const ESTADOS_CONTADOS: EstadoSolicitudConstancia[] = ['EN_VERIFICACION', 'PENDIENTE_PAGO', 'EMITIDA', 'RECHAZADA'];

export const MENSAJES_CONSTANCIAS = {
  403: 'Tu rol no puede ver las solicitudes de constancia.',
  404: 'El servidor todavía no ofrece las solicitudes de constancia.',
};

/**
 * Bandeja de solicitudes de constancia de no adeudo (funcionario y supervisor). El filtro, la búsqueda y la paginación
 * los hace el backend (`GET /constancias`). Mientras carga se sigue viendo la página anterior.
 */
export function useConstancias() {
  const [estado, setEstadoState] = useState<FiltroEstadoConstancia>('');
  const [busqueda, setBusqueda] = useState('');
  const [busquedaAplicada, setBusquedaAplicada] = useState('');
  const [pagina, setPagina] = useState(1);
  const [tamano, setTamanoState] = useState(10);
  const [recarga, setRecarga] = useState(0);

  const [resultado, setResultado] = useState<{ clave: string; error: string | null } | null>(null);
  const [listado, setListado] = useState<ListadoSolicitudesConstancia | null>(null);
  const [conteos, setConteos] = useState<Partial<Record<EstadoSolicitudConstancia, number>> | null>(null);

  // La búsqueda se envía al dejar de escribir, no en cada tecla.
  useEffect(() => {
    const t = setTimeout(() => {
      // Solo corre cuando cambió lo escrito: vuelve a la primera página.
      setBusquedaAplicada(busqueda.trim());
      setPagina(1);
    }, 350);
    return () => clearTimeout(t);
  }, [busqueda]);

  const clave = JSON.stringify([estado, busquedaAplicada, pagina, tamano, recarga]);

  useEffect(() => {
    let vigente = true;
    constanciasController
      .listar({ estado: estado || undefined, busqueda: busquedaAplicada, pagina, tamano })
      .then((r) => {
        if (!vigente) return;
        setListado(r);
        setResultado({ clave, error: null });
      })
      .catch((err) => {
        if (!vigente) return;
        setResultado({ clave, error: mensajeErrorApi(err, 'No se pudieron cargar las solicitudes. Inténtalo de nuevo.', MENSAJES_CONSTANCIAS) });
      });
    return () => {
      vigente = false;
    };
  }, [clave, estado, busquedaAplicada, pagina, tamano]);

  useEffect(() => {
    let vigente = true;
    Promise.all(ESTADOS_CONTADOS.map((e) => constanciasController.contar(e)))
      .then((n) => {
        if (vigente) setConteos(Object.fromEntries(ESTADOS_CONTADOS.map((e, i) => [e, n[i]])));
      })
      .catch(() => {
        // El error ya se muestra en la tabla; sin conteos, las tarjetas muestran "—".
        if (vigente) setConteos(null);
      });
    return () => {
      vigente = false;
    };
  }, [recarga]);

  const setEstado = useCallback((e: FiltroEstadoConstancia) => {
    setEstadoState(e);
    setPagina(1);
  }, []);
  const setTamano = useCallback((n: number) => {
    setTamanoState(n);
    setPagina(1);
  }, []);
  const limpiarFiltros = useCallback(() => {
    setEstadoState('');
    setBusqueda('');
    setBusquedaAplicada('');
    setPagina(1);
  }, []);
  const refrescar = useCallback(() => setRecarga((n) => n + 1), []);

  return {
    estado,
    setEstado,
    busqueda,
    setBusqueda,
    pagina,
    setPagina,
    tamano,
    setTamano,
    limpiarFiltros,
    refrescar,
    listado,
    conteos,
    cargando: resultado?.clave !== clave,
    error: resultado?.clave === clave ? resultado.error : null,
    filtrosActivos: Boolean(estado || busqueda.trim()),
    busquedaAplicada,
  };
}
