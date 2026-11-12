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

export type FiltroOrigenDashboards = 'TODOS' | 'OFICIALES' | 'BORRADORES' | 'SUPERSET' | 'IA';

export function useIaDashboards(modulo: ModuloAnalitico, onNotify?: NotifyFn) {
  const config = CONFIG_MODULOS_IA[modulo];

  const [dashboardsSuperset, setDashboardsSuperset] = useState<SupersetDashboardInfo[]>([]);
  const [dashboardsIA, setDashboardsIA] = useState<SupersetDashboardInfo[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [busqueda, setBusqueda] = useState<string>('');
  const [filtroOrigen, setFiltroOrigen] = useState<FiltroOrigenDashboards>('TODOS');
  const [dashboardActivo, setDashboardActivo] = useState<SupersetDashboardInfo | null>(null);

  // Estado del panel flotante no invasivo del Chat de IA (cerrado por defecto para dar 100% de espacio al dashboard)
  const [chatAbierto, setChatAbierto] = useState<boolean>(false);
  const [modoChatInicial, setModoChatInicial] = useState<ModoConsultaIA>('CONSULTA_DATOS');
  const [modeloChatInicial, setModeloChatInicial] = useState<ProveedorModeloIA>('API');
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

  const todosLosDashboards = useMemo(() => {
    const mapa = new Map<string, SupersetDashboardInfo>();
    for (const d of dashboardsSuperset) {
      mapa.set(String(d.supersetId || d.id), d);
    }
    for (const d of dashboardsIA) {
      mapa.set(String(d.supersetId || d.id), d);
    }
    return Array.from(mapa.values());
  }, [dashboardsSuperset, dashboardsIA]);

  const supersetFiltrados = useMemo(() => {
    if (filtroOrigen === 'IA' || filtroOrigen === 'BORRADORES') return [];
    const q = busqueda.trim().toLowerCase();

    // Conjunto de identificadores en Borradores para garantizar estricta exclusión mutua
    const idsEnBorradores = new Set(
      dashboardsIA.map((b) => String(b.supersetId || b.id))
    );

    const soloOficialesValidos = dashboardsSuperset.filter((d) => {
      if (d.publicado === false) return false;
      const key = String(d.supersetId || d.id);
      if (idsEnBorradores.has(key)) return false;
      return true;
    });

    if (!q) return soloOficialesValidos;
    return soloOficialesValidos.filter(
      (d) =>
        d.titulo.toLowerCase().includes(q) ||
        d.descripcion.toLowerCase().includes(q) ||
        (d.fuentesDatos || []).some((f) => f.toLowerCase().includes(q))
    );
  }, [dashboardsSuperset, dashboardsIA, filtroOrigen, busqueda]);

  const iaFiltrados = useMemo(() => {
    if (filtroOrigen === 'SUPERSET' || filtroOrigen === 'OFICIALES') return [];
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
        onNotify?.('success', `Nuevo borrador "${guardado.titulo}" añadido al listado.`);
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
        onNotify?.('info', 'Borrador eliminado del listado.');
      } catch (err) {
        onNotify?.(
          'error',
          mensajeErrorApi(err, 'No se pudo eliminar el borrador.')
        );
      }
    },
    [modulo, dashboardActivo, dashboardsSuperset, onNotify]
  );

  const publicarDashboardComoOficial = useCallback(
    async (dashboardId: string | number, publicar: boolean = true) => {
      const d = todosLosDashboards.find(
        (item) => item.id === String(dashboardId) || item.supersetId === Number(dashboardId)
      );
      const numId = Number(d?.supersetId || dashboardId);

      try {
        if (!Number.isNaN(numId)) {
          await iaDashboardsController.publicarDashboard(numId, publicar);
          // Si se sube a oficial y aún no tiene embebido habilitado, intentamos habilitarlo
          if (publicar && d && !d.embedUuid) {
            try {
              const respEmb = await iaDashboardsController.habilitarEmbebidoConReintentos(numId);
              if (d) {
                d.embedUuid = respEmb.uuid;
                d.embedKey = respEmb.uuid;
              }
            } catch {
              // Continúa si no se pudo habilitar de inmediato
            }
          }
        }

        const idCoincide = (item: SupersetDashboardInfo) =>
          item.id === String(dashboardId) ||
          (d && item.id === d.id) ||
          (!Number.isNaN(numId) && item.supersetId === numId);

        if (publicar) {
          const target = d || {
            id: String(dashboardId),
            supersetId: Number(dashboardId) || undefined,
            slug: `dashboard-${dashboardId}`,
            titulo: `Dashboard #${dashboardId}`,
            descripcion: 'Dashboard oficial publicado',
            categoria: 'tributario' as const,
            urlRelativa: `/superset/dashboard/${dashboardId}/?standalone=true`,
          };

          const actualizado: SupersetDashboardInfo = {
            ...target,
            publicado: true,
            origen: 'SUPERSET',
          };

          setDashboardsIA((prev) => prev.filter((item) => !idCoincide(item)));
          setDashboardsSuperset((prev) => {
            const existe = prev.some(idCoincide);
            return existe
              ? prev.map((item) => (idCoincide(item) ? actualizado : item))
              : [actualizado, ...prev];
          });

          setDashboardActivo((prev) =>
            idCoincide(prev || ({} as SupersetDashboardInfo)) ? actualizado : prev
          );

          onNotify?.(
            'success',
            `El dashboard "${actualizado.titulo}" ha sido subido a Oficial. Ahora es visible para todos los usuarios de Control Municipal.`
          );

          // Sincronizar en segundo plano con el backend para verificar persistencia real
          if (!Number.isNaN(numId)) {
            iaDashboardsController
              .getDashboards(modulo)
              .then((res) => {
                // Asegurar que el dashboard promovido no quede en borradores
                const borradoresLimpios = res.dashboardsIA.filter((item) => !idCoincide(item));
                const oficialesConActualizado = [
                  actualizado,
                  ...res.dashboardsSuperset.filter((item) => !idCoincide(item)),
                ];
                setDashboardsIA(borradoresLimpios);
                setDashboardsSuperset(oficialesConActualizado);
              })
              .catch(() => {
                // Conserva el estado local optimista
              });
          }
        } else {
          const target = d || {
            id: String(dashboardId),
            supersetId: Number(dashboardId) || undefined,
            slug: `dashboard-${dashboardId}`,
            titulo: `Dashboard #${dashboardId}`,
            descripcion: 'Borrador en Apache Superset',
            categoria: 'tributario' as const,
            urlRelativa: `/superset/dashboard/${dashboardId}/?standalone=true`,
          };

          const actualizado: SupersetDashboardInfo = {
            ...target,
            publicado: false,
            origen: 'IA',
          };

          setDashboardsSuperset((prev) => prev.filter((item) => !idCoincide(item)));
          setDashboardsIA((prev) => {
            const base = prev.filter((item) => !idCoincide(item));
            return [actualizado, ...base];
          });

          setDashboardActivo((prev) =>
            idCoincide(prev || ({} as SupersetDashboardInfo)) ? actualizado : prev
          );

          onNotify?.(
            'info',
            `El dashboard "${actualizado.titulo}" ha sido devuelto a Borradores.`
          );

          // Sincronizar en segundo plano con el backend
          if (!Number.isNaN(numId)) {
            iaDashboardsController
              .getDashboards(modulo)
              .then((res) => {
                // Blindar: asegurar que el dashboard devuelto a borrador NUNCA quede en oficiales
                // aun si el backend o la caché de Superset todavía lo incluye
                const oficialesLimpios = res.dashboardsSuperset.filter((item) => !idCoincide(item));
                const borradoresConActualizado = [
                  actualizado,
                  ...res.dashboardsIA.filter((item) => !idCoincide(item)),
                ];
                setDashboardsSuperset(oficialesLimpios);
                setDashboardsIA(borradoresConActualizado);
              })
              .catch(() => {
                // Conserva el estado local optimista
              });
          }
        }
      } catch (err) {
        onNotify?.(
          'error',
          mensajeErrorApi(
            err,
            publicar
              ? 'No se pudo subir el borrador a oficial.'
              : 'No se pudo devolver el dashboard a borrador.'
          )
        );
        throw err;
      }
    },
    [modulo, todosLosDashboards, onNotify]
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
    dashboardsOficiales: dashboardsSuperset,
    dashboardsIA,
    dashboardsBorradores: dashboardsIA,
    todosLosDashboards,
    supersetFiltrados,
    oficialesFiltrados: supersetFiltrados,
    iaFiltrados,
    borradoresFiltrados: iaFiltrados,
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
    publicarDashboardComoOficial,
    seleccionarDashboardPorId,
    recargarDashboards,
  };
}
