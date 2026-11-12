'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  BarChart2,
  Maximize2,
  Minimize2,
  RefreshCw,
  Download,
  FileSpreadsheet,
  Globe,
  Lock,
  Share2,
} from 'lucide-react';
import {
  ModuloAnalitico,
  SupersetDashboardInfo,
  SupersetEmbedTokenResponse,
} from '@/types/superset.types';
import { CATALOGO_REPORTES_OFICIALES, ReporteItemInfo } from '@/types/reportes-tributarios.types';
import {
  DASHBOARDS_SUPERSET_CONTROL_MUNICIPAL,
  formatearErrorIaBackend,
  iaDashboardsController,
} from '@/controllers/ia-dashboards.controller';
import { exportarCSV } from '@/utils/csv.utils';
import { SupersetSdkDashboard } from '@/components/superset/SupersetSdkDashboard';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';

export const DASHBOARDS_PREDEFINIDOS: SupersetDashboardInfo[] = DASHBOARDS_SUPERSET_CONTROL_MUNICIPAL;

function inyectarParametrosTemaUrl(url: string, tema: 'light' | 'dark'): string {
  if (!url) return url;
  try {
    const modo = tema === 'dark' ? 'dark' : 'default';
    const parsed = new URL(url, typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');
    parsed.searchParams.set('themeMode', modo);
    parsed.searchParams.set('theme', tema);
    return parsed.toString();
  } catch {
    const modo = tema === 'dark' ? 'dark' : 'default';
    const separador = url.includes('?') ? '&' : '?';
    return `${url}${separador}themeMode=${modo}&theme=${tema}`;
  }
}

interface SupersetEmbedViewerProps {
  modulo?: ModuloAnalitico;
  dashboardSeleccionadoId?: string;
  dashboardPersonalizado?: SupersetDashboardInfo;
  dashboardsDisponibles?: SupersetDashboardInfo[];
  onCambiarDashboard?: (id: string) => void;
  /** Cuando es true (ej. en Dashboard General), muestra directamente el dashboard asignado sin selector de pestañas */
  modoFijo?: boolean;
  /** Mostrar el catálogo de plantillas R1-R11 en la parte superior */
  mostrarCatalogoPlantillas?: boolean;
  /** Control opcional al inicio de la cabecera (ej. botón para ocultar/mostrar barra lateral) */
  controlIzquierdoCabecera?: React.ReactNode;
  /** Control opcional al final de la cabecera (ej. botón para abrir el asistente IA) */
  controlDerechoCabecera?: React.ReactNode;
  /** Estado de pantalla completa controlado por el contenedor padre (para incluir paneles laterales) */
  isFullscreen?: boolean;
  /** Callback para alternar pantalla completa desde el contenedor padre */
  onToggleFullscreen?: () => void;
  /** Callback opcional cuando se sube a oficial o se devuelve a borrador */
  onPublicarDashboard?: (dashboardId: string | number, publicar: boolean) => Promise<void>;
}

export const SupersetEmbedViewer: React.FC<SupersetEmbedViewerProps> = ({
  modulo = 'CONTROL_MUNICIPAL',
  dashboardSeleccionadoId = 'reportes-tributarios',
  dashboardPersonalizado,
  dashboardsDisponibles = DASHBOARDS_PREDEFINIDOS,
  onCambiarDashboard,
  modoFijo = false,
  mostrarCatalogoPlantillas = false,
  controlIzquierdoCabecera,
  controlDerechoCabecera,
  isFullscreen: externalFullscreen,
  onToggleFullscreen,
  onPublicarDashboard,
}) => {
  const { theme } = useTheme();
  const [internalId, setInternalId] = useState(dashboardSeleccionadoId);
  const [internalFullscreen, setInternalFullscreen] = useState(false);
  const [recargando, setRecargando] = useState(false);
  const [embedConfig, setEmbedConfig] = useState<SupersetEmbedTokenResponse | null>(null);
  const [iframeRefreshKey, setIframeRefreshKey] = useState(0);

  const esControladoPorPadre = typeof onToggleFullscreen === 'function';
  const isFullscreen = esControladoPorPadre ? Boolean(externalFullscreen) : internalFullscreen;

  const handleToggleFullscreen = () => {
    if (onToggleFullscreen) {
      onToggleFullscreen();
    } else {
      setInternalFullscreen((prev) => !prev);
    }
  };

  // Heurística de Nielsen 3 (Control y libertad del usuario): salir con tecla Escape cuando es local
  useEffect(() => {
    if (esControladoPorPadre || !internalFullscreen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setInternalFullscreen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [esControladoPorPadre, internalFullscreen]);

  const activeId = onCambiarDashboard ? dashboardSeleccionadoId : internalId;

  const dashboardActual: SupersetDashboardInfo =
    dashboardPersonalizado ||
    dashboardsDisponibles.find((d) => d.id === activeId) ||
    DASHBOARDS_PREDEFINIDOS[0];

  const { rol } = useAuth();
  const esAdmin = rol === 'ADMIN';

  const [uuidManual, setUuidManual] = useState<Record<string, string | null>>({});
  const [publicadoManual, setPublicadoManual] = useState<Record<string, boolean>>({});
  const [habilitandoEmbebido, setHabilitandoEmbebido] = useState(false);
  const [mensajeEmbebido, setMensajeEmbebido] = useState<string | null>(null);
  const [errorEmbebido, setErrorEmbebido] = useState<string | null>(null);
  const [publicando, setPublicando] = useState(false);

  const sidNumerico =
    dashboardActual.supersetId ??
    (Number.isInteger(Number(dashboardActual.id)) ? Number(dashboardActual.id) : null);

  const uuidEmbebido =
    uuidManual[dashboardActual.id] !== undefined
      ? uuidManual[dashboardActual.id] || undefined
      : dashboardActual.embedUuid ||
        (dashboardActual.embedKey && dashboardActual.embedKey.length > 20 ? dashboardActual.embedKey : undefined);

  const estadoPublicado =
    publicadoManual[dashboardActual.id] !== undefined
      ? publicadoManual[dashboardActual.id]
      : dashboardActual.publicado;

  const handleHabilitarEmbebido = async () => {
    if (!sidNumerico) return;
    setHabilitandoEmbebido(true);
    setErrorEmbebido(null);
    setMensajeEmbebido('Solicitando habilitar embebido...');
    try {
      const res = await iaDashboardsController.habilitarEmbebidoConReintentos(
        sidNumerico,
        (intento: number) => {
          setMensajeEmbebido(
            `Preparando gráficos en Superset (intento ${intento})... reintentando en unos segundos`
          );
        }
      );
      setUuidManual((prev) => ({ ...prev, [dashboardActual.id]: res.uuid }));
      dashboardActual.embedUuid = res.uuid;
      setMensajeEmbebido(null);
    } catch (err) {
      setErrorEmbebido(
        formatearErrorIaBackend(
          err,
          'No se pudo habilitar el embebido. Asegúrate de ser dueño del dashboard en Superset.'
        )
      );
    } finally {
      setHabilitandoEmbebido(false);
    }
  };

  const handleAlternarPublicacion = async () => {
    const idDashboard = sidNumerico ?? dashboardActual.id;
    if (!idDashboard) return;
    setPublicando(true);
    try {
      const nuevo = !estadoPublicado;
      if (onPublicarDashboard) {
        await onPublicarDashboard(idDashboard, nuevo);
      } else if (sidNumerico) {
        const res = await iaDashboardsController.publicarDashboard(sidNumerico, nuevo);
        dashboardActual.publicado = res.publicado;
      }
      setPublicadoManual((prev) => ({ ...prev, [dashboardActual.id]: nuevo }));
      dashboardActual.publicado = nuevo;
    } catch (err) {
      alert(
        formatearErrorIaBackend(
          err,
          'No se pudo actualizar el estado de publicación del dashboard.'
        )
      );
    } finally {
      setPublicando(false);
    }
  };

  const handleRetirarEmbebido = async () => {
    if (!sidNumerico) return;
    if (!confirm('¿Deseas retirar el embebido de este dashboard en Apache Superset?')) return;
    setHabilitandoEmbebido(true);
    try {
      await iaDashboardsController.retirarEmbebido(sidNumerico);
      setUuidManual((prev) => ({ ...prev, [dashboardActual.id]: null }));
      dashboardActual.embedUuid = null;
    } catch (err) {
      alert(formatearErrorIaBackend(err, 'No se pudo retirar el embebido del dashboard.'));
    } finally {
      setHabilitandoEmbebido(false);
    }
  };

  const cargarEmbedToken = useCallback(
    async (idDashboard: string, mostrarSpinner = false) => {
      if (mostrarSpinner) setRecargando(true);
      try {
        const cfg = await iaDashboardsController.getSupersetEmbedToken(
          idDashboard,
          dashboardActual.modulo || modulo,
          theme
        );
        setEmbedConfig(cfg);
      } catch {
        setEmbedConfig(null);
      } finally {
        if (mostrarSpinner) setRecargando(false);
      }
    },
    [dashboardActual.modulo, modulo, theme]
  );

  // Carga inicial del token al cambiar de tablero (sin spinner). "Recargar" usa cargarEmbedToken.
  useEffect(() => {
    let cancelado = false;
    if (uuidEmbebido) return;
    iaDashboardsController
      .getSupersetEmbedToken(dashboardActual.id, dashboardActual.modulo || modulo, theme)
      .then((cfg) => {
        if (!cancelado) setEmbedConfig(cfg);
      })
      .catch(() => {
        if (!cancelado) setEmbedConfig(null);
      });
    return () => {
      cancelado = true;
    };
  }, [dashboardActual.id, dashboardActual.modulo, modulo, theme, uuidEmbebido]);

  const handleSelect = (id: string) => {
    setInternalId(id);
    onCambiarDashboard?.(id);
  };

  const handleRecargar = () => {
    setIframeRefreshKey((prev) => prev + 1);
    if (!uuidEmbebido) {
      cargarEmbedToken(dashboardActual.id, true);
    }
  };

  const handleDescargarPlantilla = (rep: ReporteItemInfo) => {
    exportarCSV(`Plantilla_${rep.codigo}_${rep.nombre.replace(/\s+/g, '_')}`, rep.cabeceras, []);
  };

  const fullscreenPropio = !esControladoPorPadre && isFullscreen;

  return (
    <div
      className="card"
      style={{
        position: fullscreenPropio ? 'fixed' : 'relative',
        top: fullscreenPropio ? 0 : undefined,
        left: fullscreenPropio ? 0 : undefined,
        right: fullscreenPropio ? 0 : undefined,
        bottom: fullscreenPropio ? 0 : undefined,
        zIndex: fullscreenPropio ? 9999 : 1,
        height: fullscreenPropio ? '100vh' : isFullscreen ? 'calc(100vh - 2rem)' : 'auto',
        borderRadius: fullscreenPropio ? 0 : '16px',
        display: 'flex',
        flexDirection: 'column',
        padding: fullscreenPropio ? '1.5rem' : '1.25rem',
        background: 'var(--bg-card)',
        overflowY: isFullscreen ? 'auto' : undefined,
      }}
    >
      {/* 1. Catálogo opcional de los 11 Reportes Oficiales (R1 al R11) */}
      {mostrarCatalogoPlantillas && (
        <div style={{ marginBottom: '1.25rem', paddingBottom: '1.25rem', borderBottom: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FileSpreadsheet size={18} color="var(--green-600)" />
              Catálogo y Plantillas de los 11 Reportes Oficiales (R1 al R11)
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Estructuras tabulares normadas por la Municipalidad de San Miguel · Descarga directa en CSV
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: '0.5rem' }}>
            {CATALOGO_REPORTES_OFICIALES.map((rep) => (
              <div
                key={rep.codigo}
                style={{
                  background: 'var(--bg-card-subtle)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  padding: '0.65rem 0.75rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <div style={{ overflow: 'hidden' }}>
                  <strong
                    style={{
                      fontSize: '0.8rem',
                      color: theme === 'dark' ? 'var(--sky-400)' : 'var(--sky-700)',
                      display: 'block',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                    }}
                    title={`${rep.codigo}. ${rep.nombre}`}
                  >
                    {rep.codigo}. {rep.nombre}
                  </strong>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{rep.cabeceras.length} columnas requeridas</span>
                </div>

                <button
                  onClick={() => handleDescargarPlantilla(rep)}
                  className="btn btn-secondary"
                  style={{ padding: '0.3rem 0.5rem', fontSize: '0.75rem', flexShrink: 0 }}
                  title={`Descargar plantilla CSV de ${rep.codigo}`}
                >
                  <Download size={13} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. Cabecera Única del Visor Analítico */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          {controlIzquierdoCabecera}
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              {modoFijo ? 'Apache Superset' : dashboardActual.titulo}
            </h3>
          </div>
        </div>

        {/* Acciones del visor */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          {controlDerechoCabecera}

          {/* Acciones de gestión y publicación: Subir a oficial / Devolver a borrador */}
          {(sidNumerico !== null || onPublicarDashboard) && (
            estadoPublicado ? (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                <span
                  className="badge badge-success"
                  style={{
                    fontSize: '0.72rem',
                    padding: '0.35rem 0.55rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                  }}
                  title="Dashboard oficial publicado y visible para todos los usuarios"
                >
                  <Globe size={12} />
                  Oficial
                </span>

                <button
                  type="button"
                  onClick={handleAlternarPublicacion}
                  disabled={publicando}
                  className="btn btn-secondary"
                  style={{
                    fontSize: '0.78rem',
                    padding: '0.4rem 0.65rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                  }}
                  title="Devolver este dashboard a borrador privado"
                >
                  <Lock size={13} />
                  <span>{publicando ? 'Guardando...' : 'Devolver a borrador'}</span>
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleAlternarPublicacion}
                disabled={publicando}
                className="btn btn-primary"
                style={{
                  fontSize: '0.78rem',
                  padding: '0.4rem 0.65rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                }}
                title="Subir borrador a oficial (visible para todos los usuarios de Control Municipal)"
              >
                <Globe size={13} />
                <span>{publicando ? 'Subiendo...' : 'Subir a oficial'}</span>
              </button>
            )
          )}

          {!uuidEmbebido && sidNumerico !== null && (
            <button
              type="button"
              onClick={handleHabilitarEmbebido}
              disabled={habilitandoEmbebido}
              className="btn btn-primary"
              style={{
                fontSize: '0.78rem',
                padding: '0.4rem 0.65rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
              }}
              title="Habilitar embebido en Superset para este dashboard"
            >
              <Share2 size={13} />
              <span>{habilitandoEmbebido ? 'Preparando...' : 'Habilitar embebido'}</span>
            </button>
          )}

          {uuidEmbebido && sidNumerico !== null && esAdmin && (
            <button
              type="button"
              onClick={handleRetirarEmbebido}
              disabled={habilitandoEmbebido}
              className="btn btn-secondary"
              style={{ fontSize: '0.78rem', padding: '0.4rem 0.55rem' }}
              title="Retirar embebido de Apache Superset"
            >
              <Share2 size={13} style={{ opacity: 0.7 }} />
            </button>
          )}

          <button
            onClick={handleRecargar}
            disabled={recargando}
            className="btn btn-secondary"
            style={{ fontSize: '0.8rem', padding: '0.4rem 0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
            title="Sincronizar datos con Apache Superset"
          >
            <RefreshCw size={14} style={{ animation: recargando ? 'spin 1s linear infinite' : 'none' }} />
            <span>{recargando ? 'Actualizando...' : 'Actualizar'}</span>
          </button>

          <button
            onClick={handleToggleFullscreen}
            className="btn btn-secondary"
            style={{ fontSize: '0.8rem', padding: '0.4rem 0.65rem' }}
            title={isFullscreen ? 'Salir de pantalla completa (Esc)' : 'Pantalla completa'}
          >
            {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>
        </div>
      </div>

      {/* 3. Selector de Tableros (se oculta si modoFijo es true o si se inspecciona un dashboard específico) */}
      {!modoFijo && !dashboardPersonalizado && dashboardsDisponibles.length > 1 && (
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
          {dashboardsDisponibles.map((d) => (
            <button
              key={d.id}
              onClick={() => handleSelect(d.id)}
              style={{
                padding: '0.45rem 0.85rem',
                borderRadius: '8px',
                border: '1px solid',
                borderColor: activeId === d.id ? 'var(--sky-500)' : 'var(--border-color)',
                background: activeId === d.id
                  ? theme === 'dark' ? 'rgba(14, 165, 233, 0.18)' : 'var(--sky-50)'
                  : 'var(--bg-card-subtle)',
                color: activeId === d.id
                  ? theme === 'dark' ? 'var(--sky-300)' : 'var(--sky-700)'
                  : 'var(--text-muted)',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
              }}
            >
              <BarChart2 size={14} />
              {d.titulo}
            </button>
          ))}
        </div>
      )}

      {/* 4. Contenedor de Visualización Analítica */}
      <div
        style={{
          flex: 1,
          minHeight: isFullscreen ? 'calc(100vh - 280px)' : '420px',
          border: '1px solid var(--border-color)',
          borderRadius: '12px',
          overflow: 'hidden',
          background: 'var(--bg-app)',
          position: 'relative',
        }}
      >
        {recargando ? (
          <div
            style={{
              height: '100%',
              minHeight: '380px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '1rem',
              color: 'var(--text-muted)',
            }}
          >
            <RefreshCw size={28} style={{ animation: 'spin 1s linear infinite' }} color="var(--sky-600)" />
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)' }}>
                Actualizando &quot;{dashboardActual.titulo}&quot;...
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                Sincronizando paneles con Apache Superset
              </div>
            </div>
          </div>
        ) : uuidEmbebido ? (
          /* Embebido oficial mediante Apache Superset SDK con Guest Token y seguridad RLS */
          <SupersetSdkDashboard
            key={`${dashboardActual.id}-${iframeRefreshKey}`}
            dashboardId={uuidEmbebido}
            height={isFullscreen ? 'calc(100vh - 130px)' : '620px'}
            hideTitle
            hideTab={false}
            hideChartControls={false}
            theme={theme}
          />
        ) : embedConfig?.embedUrl ? (
          /* Fallback con URL directa si existiese */
          <iframe
            key={`${dashboardActual.id}-${iframeRefreshKey}-${theme}`}
            src={inyectarParametrosTemaUrl(embedConfig.embedUrl, theme)}
            title={dashboardActual.titulo}
            allow="fullscreen"
            referrerPolicy="strict-origin-when-cross-origin"
            style={{
              width: '100%',
              height: isFullscreen ? 'calc(100vh - 130px)' : '620px',
              border: 'none',
              display: 'block',
              colorScheme: theme,
              background: 'var(--bg-card)',
            }}
          />
        ) : (
          <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

            {/* Aviso si el dashboard de Superset no tiene el embebido habilitado (sección 3.1) */}
            {sidNumerico !== null && (
              <div
                style={{
                  padding: '1rem 1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '1rem',
                  flexWrap: 'wrap',
                  background: 'var(--bg-card)',
                  borderRadius: '10px',
                  border: '1px dashed var(--border-color)',
                }}
              >
                <div>
                  <strong style={{ fontSize: '0.85rem', color: 'var(--text-main)', display: 'block' }}>
                    Embebido no habilitado en Superset
                  </strong>
                  <span
                    style={{
                      fontSize: '0.76rem',
                      color: errorEmbebido ? 'var(--red-600)' : 'var(--text-muted)',
                    }}
                  >
                    {mensajeEmbebido ||
                      errorEmbebido ||
                      'El dashboard existe en Superset pero su identificador de embebido no está activo (embedUuid: null).'}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleHabilitarEmbebido}
                  disabled={habilitandoEmbebido}
                  className="btn btn-primary"
                  style={{ fontSize: '0.78rem', padding: '0.38rem 0.85rem' }}
                >
                  {habilitandoEmbebido ? 'Preparando embebido...' : 'Habilitar embebido'}
                </button>
              </div>
            )}

            {/* Métricas Resumen del Dashboard */}
            {dashboardActual.metricasResumen && dashboardActual.metricasResumen.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '0.85rem' }}>
                {dashboardActual.metricasResumen.map((m, idx) => (
                  <div
                    key={idx}
                    style={{
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '10px',
                      padding: '0.9rem 1rem',
                    }}
                  >
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>
                      {m.label}
                    </span>
                    <div
                      style={{
                        fontSize: '1.35rem',
                        fontWeight: 800,
                        color:
                          m.positivo === false
                            ? theme === 'dark' ? 'var(--amber-400)' : 'var(--amber-700)'
                            : theme === 'dark' ? 'var(--sky-400)' : 'var(--sky-700)',
                      }}
                    >
                      {m.valor}
                    </div>
                    {m.cambio && (
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        {m.cambio}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Widgets dinámicos (usados por el dashboard "Reportes Tributarios" y por los dashboards creados por IA) */}
            {dashboardActual.widgets && dashboardActual.widgets.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
                {dashboardActual.widgets.map((w) => (
                  <div
                    key={w.id}
                    style={{
                      background: 'var(--bg-card)',
                      padding: '1.25rem',
                      borderRadius: '10px',
                      border: '1px solid var(--border-color)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-main)' }}>{w.titulo}</div>
                      {w.subtitulo && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.85rem', marginTop: '0.15rem' }}>
                          {w.subtitulo}
                        </div>
                      )}

                      {w.tipo === 'kpi_comparativo' && (
                        <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', minHeight: '110px', gap: '0.75rem', flexWrap: 'wrap' }}>
                          {w.items.map((item, idx) => (
                            <React.Fragment key={idx}>
                              {idx > 0 && <div style={{ width: '1px', height: '48px', background: 'var(--border-color)' }} />}
                              <div style={{ textAlign: 'center' }}>
                                <div
                                  style={{
                                    fontSize: '1.45rem',
                                    fontWeight: 800,
                                    color:
                                      item.tono === 'positivo'
                                        ? theme === 'dark' ? 'var(--green-400)' : 'var(--green-600)'
                                        : item.tono === 'negativo'
                                          ? theme === 'dark' ? 'var(--red-400)' : 'var(--red-600)'
                                          : theme === 'dark' ? 'var(--amber-400)' : 'var(--amber-700)',
                                  }}
                                >
                                  {item.valor}
                                </div>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-main)', fontWeight: 600, display: 'block' }}>
                                  {item.etiqueta}
                                </span>
                                {item.detalle && (
                                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{item.detalle}</span>
                                )}
                              </div>
                            </React.Fragment>
                          ))}
                        </div>
                      )}

                      {w.tipo === 'barras_progreso' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
                          {w.items.map((item, idx) => (
                            <div key={idx}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.25rem' }}>
                                <span>{item.etiqueta}</span>
                                <strong>{item.valor}</strong>
                              </div>
                              <div style={{ height: '8px', background: 'var(--bg-card-subtle)', borderRadius: '4px', overflow: 'hidden' }}>
                                <div
                                  style={{
                                    width: `${Math.min(100, Math.max(0, item.porcentaje ?? 50))}%`,
                                    height: '100%',
                                    background:
                                      item.tono === 'positivo'
                                        ? theme === 'dark' ? 'var(--green-500)' : 'var(--green-600)'
                                        : item.tono === 'negativo'
                                          ? theme === 'dark' ? 'var(--red-500)' : 'var(--red-600)'
                                          : theme === 'dark' ? 'var(--sky-500)' : 'var(--sky-600)',
                                  }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {w.tipo === 'resumen_segmentos' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginTop: '0.5rem' }}>
                          {w.items.map((item, idx) => (
                            <div
                              key={idx}
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                fontSize: '0.8rem',
                                paddingBottom: '0.4rem',
                                borderBottom: idx < w.items.length - 1 ? '1px solid var(--border-color)' : 'none',
                              }}
                            >
                              <span>{item.etiqueta}</span>
                              <strong
                                style={{
                                  color:
                                    item.tono === 'positivo'
                                      ? theme === 'dark' ? 'var(--green-400)' : 'var(--green-600)'
                                      : item.tono === 'negativo'
                                        ? theme === 'dark' ? 'var(--red-400)' : 'var(--red-600)'
                                        : item.tono === 'alerta'
                                          ? theme === 'dark' ? 'var(--amber-400)' : 'var(--amber-700)'
                                          : 'var(--text-main)',
                                }}
                              >
                                {item.valor}
                              </strong>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {w.notaPie && (
                      <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border-color)', paddingTop: '0.5rem', marginTop: '0.85rem' }}>
                        * {w.notaPie}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Vistas para D1, D2, D3 y D4 cuando no traen widgets personalizados */}
            {(!dashboardActual.widgets || dashboardActual.widgets.length === 0) && dashboardActual.id === 'D1' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                <div style={{ background: 'var(--bg-card)', padding: '1.25rem', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--text-main)' }}>
                    R1. Morosidad: Total con Beneficio vs Sin Beneficio (S/.)
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', height: '120px' }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '1.5rem', fontWeight: 800, color: theme === 'dark' ? 'var(--amber-400)' : 'var(--amber-700)' }}>S/ 14.8M</div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Deuda Sin Beneficio</span>
                    </div>
                    <div style={{ width: '1px', height: '50px', background: 'var(--border-color)' }} />
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '1.5rem', fontWeight: 800, color: theme === 'dark' ? 'var(--green-400)' : 'var(--green-600)' }}>S/ 11.2M</div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Deuda Con Beneficio</span>
                    </div>
                  </div>
                </div>

                <div style={{ background: 'var(--bg-card)', padding: '1.25rem', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--text-main)' }}>
                    R5. Segmentación PRICOS (Base Imponible ≥ 10 UIT)
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                      <span>PRICOS al Día (2026)</span>
                      <strong style={{ color: theme === 'dark' ? 'var(--green-400)' : 'var(--green-600)' }}>342 contribuyentes (68%)</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                      <span>PRICOS con Deuda Anterior</span>
                      <strong style={{ color: theme === 'dark' ? 'var(--red-400)' : 'var(--red-600)' }}>161 contribuyentes (32%)</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                      <span>R2. Cero Pagos (2022-2025)</span>
                      <strong style={{ color: theme === 'dark' ? 'var(--amber-400)' : 'var(--amber-700)' }}>89 contribuyentes</strong>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {(!dashboardActual.widgets || dashboardActual.widgets.length === 0) && dashboardActual.id === 'D2' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                <div style={{ background: 'var(--bg-card)', padding: '1.25rem', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--text-main)' }}>
                    R3. Ratios de Cobranza Tributaria 2026
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.2rem' }}>
                        <span>% Recaudación Efectiva</span>
                        <strong>78.4%</strong>
                      </div>
                      <div style={{ height: '8px', background: 'var(--bg-card-subtle)', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ width: '78.4%', height: '100%', background: theme === 'dark' ? 'var(--green-500)' : 'var(--green-600)' }} />
                      </div>
                    </div>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.2rem' }}>
                        <span>% Morosidad Pendiente</span>
                        <strong>21.6%</strong>
                      </div>
                      <div style={{ height: '8px', background: 'var(--bg-card-subtle)', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ width: '21.6%', height: '100%', background: theme === 'dark' ? 'var(--red-500)' : 'var(--red-600)' }} />
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ background: 'var(--bg-card)', padding: '1.25rem', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--text-main)' }}>
                    R4. Emisión de Valores (Órdenes de Pago y RD)
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', height: '120px' }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '1.5rem', fontWeight: 800, color: theme === 'dark' ? 'var(--sky-400)' : 'var(--sky-700)' }}>4,820</div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Valores Emitidos</span>
                    </div>
                    <div style={{ width: '1px', height: '50px', background: 'var(--border-color)' }} />
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '1.5rem', fontWeight: 800, color: theme === 'dark' ? 'var(--green-400)' : 'var(--green-600)' }}>S/ 3.4M</div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Recaudado por Coactiva</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {(!dashboardActual.widgets || dashboardActual.widgets.length === 0) &&
              dashboardActual.id !== 'D1' &&
              dashboardActual.id !== 'D2' && (
                <div style={{ background: 'var(--bg-card)', padding: '1.5rem', borderRadius: '10px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                  <BarChart2 size={36} color="var(--sky-600)" style={{ margin: '0 auto 0.75rem' }} />
                  <h4 style={{ fontSize: '1rem', fontWeight: 700, margin: '0 0 0.5rem' }}>{dashboardActual.titulo}</h4>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', maxWidth: '600px', margin: '0 auto 1rem' }}>
                    {dashboardActual.descripcion}
                  </p>
                </div>
              )}
          </div>
        )}
      </div>
    </div>
  );
};
