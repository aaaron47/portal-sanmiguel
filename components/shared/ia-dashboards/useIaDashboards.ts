import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ModoConsultaIA,
  ModuloAnalitico,
  ProveedorModeloIA,
  SupersetDashboardInfo,
} from '@/types/superset.types';
import {
  CONFIG_MODULOS_IA,
  iaDashboardsController,
} from '@/controllers/ia-dashboards.controller';
import { mensajeErrorApi } from '@/services/api-client.service';
import { NotifyFn } from '@/types/ui.types';

export function useIaDashboards(modulo: ModuloAnalitico, onNotify?: NotifyFn) {
  const config = CONFIG_MODULOS_IA[modulo];

  const [dashboardsSuperset, setDashboardsSuperset] = useState<SupersetDashboardInfo[]>([]);
  const [dashboardsIA, setDashboardsIA] = useState<SupersetDashboardInfo[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [busqueda, setBusqueda] = useState<string>('');
  const [filtroOrigen, setFiltroOrigen] = useState<'TODOS' | 'SUPERSET' | 'IA'>('TODOS');
  const [dashboardActivo, setDashboardActivo] = useState<SupersetDashboardInfo | null>(null);

  // Estado del panel flotante no invasivo del Chat de IA (cerrado por defecto para dar 100% de espacio al dashboard)
  const [chatAbierto, setChatAbierto] = useState<boolean>(false);
  const [modoChatInicial, setModoChatInicial] = useState<ModoConsultaIA>('CONSULTA_DATOS');
  const [modeloChatInicial, setModeloChatInicial] = useState<ProveedorModeloIA>('LOCAL');
  const [dashboardContextoChatId, setDashboardContextoChatId] = useState<string>('TODOS');
  const [chatSessionKey, setChatSessionKey] = useState<number>(1);

  useEffect(() => {
    let cancelado = false;

    iaDashboardsController
      .getDashboards(modulo)
      .then((res) => {
        if (cancelado) return;
        setDashboardsSuperset(res.dashboardsSuperset);
        setDashboardsIA(res.dashboardsIA);
        if (res.dashboardsSuperset.length > 0) {
          setDashboardActivo((prev) => prev || res.dashboardsSuperset[0]);
        }
      })
      .catch((err) => {
        if (cancelado) return;
        onNotify?.(
          'error',
          mensajeErrorApi(err, 'No se pudieron cargar los dashboards del módulo. Intenta recargar.')
        );
      })
      .finally(() => {
        if (!cancelado) setIsLoading(false);
      });

    return () => {
      cancelado = true;
    };
  }, [modulo, onNotify]);

  const recargarDashboards = useCallback(() => {
    setIsLoading(true);
    iaDashboardsController
      .getDashboards(modulo)
      .then((res) => {
        setDashboardsSuperset(res.dashboardsSuperset);
        setDashboardsIA(res.dashboardsIA);
      })
      .catch((err) => {
        onNotify?.(
          'error',
          mensajeErrorApi(err, 'No se pudieron cargar los dashboards del módulo. Intenta recargar.')
        );
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [modulo, onNotify]);

  const todosLosDashboards = useMemo(
    () => [...dashboardsSuperset, ...dashboardsIA],
    [dashboardsSuperset, dashboardsIA]
  );

  const supersetFiltrados = useMemo(() => {
    if (filtroOrigen === 'IA') return [];
    const q = busqueda.trim().toLowerCase();
    if (!q) return dashboardsSuperset;
    return dashboardsSuperset.filter(
      (d) =>
        d.titulo.toLowerCase().includes(q) ||
        d.descripcion.toLowerCase().includes(q) ||
        (d.fuentesDatos || []).some((f) => f.toLowerCase().includes(q))
    );
  }, [dashboardsSuperset, filtroOrigen, busqueda]);

  const iaFiltrados = useMemo(() => {
    if (filtroOrigen === 'SUPERSET') return [];
    const q = busqueda.trim().toLowerCase();
    if (!q) return dashboardsIA;
    return dashboardsIA.filter(
      (d) =>
        d.titulo.toLowerCase().includes(q) ||
        d.descripcion.toLowerCase().includes(q) ||
        (d.promptOrigen || '').toLowerCase().includes(q) ||
        (d.fuentesDatos || []).some((f) => f.toLowerCase().includes(q))
    );
  }, [dashboardsIA, filtroOrigen, busqueda]);

  const abrirChat = useCallback(
    (opciones?: {
      modo?: ModoConsultaIA;
      modelo?: ProveedorModeloIA;
      dashboardId?: string;
    }) => {
      if (opciones?.modo) setModoChatInicial(opciones.modo);
      if (opciones?.modelo) setModeloChatInicial(opciones.modelo);
      setDashboardContextoChatId(opciones?.dashboardId || 'TODOS');
      setChatSessionKey((prev) => prev + 1);
      setChatAbierto(true);
    },
    []
  );

  const cerrarChat = useCallback(() => {
    setChatAbierto(false);
  }, []);

  const agregarDashboardGenerado = useCallback(
    async (nuevoDashboard: SupersetDashboardInfo) => {
      try {
        const guardado = await iaDashboardsController.guardarDashboardIA(modulo, nuevoDashboard);
        setDashboardsIA((prev) => [guardado, ...prev.filter((d) => d.id !== guardado.id)]);
        onNotify?.('success', `Nuevo dashboard "${guardado.titulo}" generado por IA y añadido al listado.`);
      } catch (err) {
        onNotify?.(
          'error',
          mensajeErrorApi(err, 'No se pudo guardar el dashboard generado en el servidor.')
        );
      }
    },
    [modulo, onNotify]
  );

  const eliminarDashboardIA = useCallback(
    async (dashboardId: string) => {
      try {
        await iaDashboardsController.eliminarDashboardIA(modulo, dashboardId);
        setDashboardsIA((prev) => prev.filter((d) => d.id !== dashboardId));
        if (dashboardActivo?.id === dashboardId) {
          setDashboardActivo(dashboardsSuperset[0] || null);
        }
        onNotify?.('info', 'Dashboard generado por IA eliminado del listado.');
      } catch (err) {
        onNotify?.(
          'error',
          mensajeErrorApi(err, 'No se pudo eliminar el dashboard generado por IA.')
        );
      }
    },
    [modulo, dashboardActivo, dashboardsSuperset, onNotify]
  );

  const seleccionarDashboardPorId = useCallback(
    (dashboardId: string, dashboardExplicito?: SupersetDashboardInfo) => {
      if (dashboardExplicito) {
        setDashboardActivo(dashboardExplicito);
        return;
      }
      const encontrado = todosLosDashboards.find((d) => d.id === dashboardId);
      if (encontrado) {
        setDashboardActivo(encontrado);
      }
    },
    [todosLosDashboards]
  );

  return {
    config,
    dashboardsSuperset,
    dashboardsIA,
    todosLosDashboards,
    supersetFiltrados,
    iaFiltrados,
    isLoading,
    busqueda,
    setBusqueda,
    filtroOrigen,
    setFiltroOrigen,
    dashboardActivo,
    setDashboardActivo,
    chatAbierto,
    modoChatInicial,
    modeloChatInicial,
    dashboardContextoChatId,
    chatSessionKey,
    abrirChat,
    cerrarChat,
    agregarDashboardGenerado,
    eliminarDashboardIA,
    seleccionarDashboardPorId,
    recargarDashboards,
  };
}
