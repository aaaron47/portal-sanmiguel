'use client';

import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Search,
  PanelLeftClose,
  PanelLeftOpen,
  Trash2,
  UploadCloud,
  RefreshCw,
} from 'lucide-react';
import { ModuloAnalitico } from '@/types/superset.types';
import { NotifyFn } from '@/types/ui.types';
import { SupersetEmbedViewer } from '@/components/roles/control-municipal/superset/SupersetEmbedViewer';
import { SupersetChatAssistant } from '@/components/roles/control-municipal/superset/SupersetChatAssistant';
import { useIaDashboards } from './useIaDashboards';

interface IaDashboardsHubViewProps {
  modulo?: ModuloAnalitico;
  onNotify?: NotifyFn;
}

export const IaDashboardsHubView: React.FC<IaDashboardsHubViewProps> = ({
  modulo = 'CONTROL_MUNICIPAL',
  onNotify,
}) => {
  const h = useIaDashboards(modulo, onNotify);
  const [sidebarAbierto, setSidebarAbierto] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [confirmandoEliminarId, setConfirmandoEliminarId] = useState<string | null>(null);
  const [subiendoId, setSubiendoId] = useState<string | null>(null);

  // Heurística de Nielsen #3 (Control y libertad del usuario): salir de pantalla completa con tecla Escape
  useEffect(() => {
    if (!isFullscreen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isFullscreen]);

  const isAiPanelOpen = h.chatAbierto;
  const dashboardMostrado = h.dashboardActivo || h.todosLosDashboards[0];

  const columnasGrid = [
    sidebarAbierto ? '240px' : '',
    'minmax(0, 1fr)',
    isAiPanelOpen ? '360px' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      style={
        isFullscreen
          ? {
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            height: '100vh',
            padding: '1rem',
            background: 'var(--bg-app)',
            overflow: 'hidden',
            boxSizing: 'border-box',
          }
          : { position: 'relative' }
      }
    >
      {/* Layout en Grid compartido: Menú Lateral + Contenido Principal + Side Drawer Derecho de IA */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: columnasGrid,
          gap: '1rem',
          alignItems: 'start',
          height: isFullscreen ? '100%' : 'auto',
          transition: 'grid-template-columns 0.2s ease',
        }}
      >
        {/* 1. Menú Lateral de Dashboards (sin íconos genéricos, con truncamiento y papelera en hover) */}
        {sidebarAbierto && (
          <aside
            className="card"
            style={{
              padding: '0.85rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.85rem',
              height: isFullscreen ? 'calc(100vh - 2rem)' : 'auto',
              maxHeight: isFullscreen ? 'calc(100vh - 2rem)' : '80vh',
              overflowY: 'auto',
              minWidth: 0,
            }}
          >
            {/* Buscador rápido + Botón Asistente IA (unificados en una sola fila) */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <div style={{ position: 'relative', flex: 1, minWidth: 0 }}>
                <Search
                  size={14}
                  color="var(--text-muted)"
                  style={{ position: 'absolute', left: '0.6rem', top: '50%', transform: 'translateY(-50%)' }}
                />
                <input
                  type="text"
                  value={h.busqueda}
                  onChange={(e) => h.setBusqueda(e.target.value)}
                  placeholder="Filtrar dashboards..."
                  style={{
                    width: '100%',
                    padding: '0.42rem 0.6rem 0.42rem 1.85rem',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    fontSize: '0.78rem',
                    boxSizing: 'border-box',
                    background: 'var(--bg-card)',
                  }}
                />
              </div>

              <button
                type="button"
                onClick={() => {
                  if (isAiPanelOpen) {
                    h.cerrarChat();
                  } else {
                    h.abrirChat({ modo: 'GENERAR_DASHBOARD' });
                  }
                }}
                className="btn btn-secondary"
                style={{
                  width: '32px',
                  height: '32px',
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  borderRadius: '8px',
                  border: '1px solid',
                  borderColor: isAiPanelOpen ? 'var(--sky-500)' : 'var(--border-color)',
                  background: isAiPanelOpen ? 'rgba(14, 165, 233, 0.15)' : 'var(--bg-card)',
                  color: isAiPanelOpen ? 'var(--sky-600)' : 'var(--text-muted)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                title={isAiPanelOpen ? 'Cerrar asistente IA' : 'Nuevo dashboard con IA'}
                aria-label="Nuevo dashboard con IA"
              >
                <Sparkles size={15} color={isAiPanelOpen ? 'var(--sky-600)' : 'var(--sky-500)'} />
              </button>
            </div>

            {/* Selector de Ámbito: Todos | Oficiales | Borradores */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '0.2rem',
                background: 'var(--bg-app)',
                padding: '0.2rem',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
              }}
            >
              <button
                type="button"
                onClick={() => h.setFiltroOrigen('TODOS')}
                style={{
                  padding: '0.32rem 0.15rem',
                  fontSize: '0.7rem',
                  fontWeight: h.filtroOrigen === 'TODOS' ? 700 : 500,
                  borderRadius: '6px',
                  border: 'none',
                  background: h.filtroOrigen === 'TODOS' ? 'var(--bg-card)' : 'transparent',
                  color: h.filtroOrigen === 'TODOS' ? 'var(--sky-600)' : 'var(--text-muted)',
                  boxShadow: h.filtroOrigen === 'TODOS' ? '0 1px 2px rgba(0,0,0,0.08)' : 'none',
                  cursor: 'pointer',
                  textAlign: 'center',
                }}
                title="Mostrar todos los reportes (oficiales y borradores)"
              >
                Todos
              </button>
              <button
                type="button"
                onClick={() => h.setFiltroOrigen('OFICIALES')}
                style={{
                  padding: '0.32rem 0.15rem',
                  fontSize: '0.7rem',
                  fontWeight: (h.filtroOrigen === 'OFICIALES' || h.filtroOrigen === 'SUPERSET') ? 700 : 500,
                  borderRadius: '6px',
                  border: 'none',
                  background: (h.filtroOrigen === 'OFICIALES' || h.filtroOrigen === 'SUPERSET') ? 'var(--bg-card)' : 'transparent',
                  color: (h.filtroOrigen === 'OFICIALES' || h.filtroOrigen === 'SUPERSET') ? 'var(--sky-600)' : 'var(--text-muted)',
                  boxShadow: (h.filtroOrigen === 'OFICIALES' || h.filtroOrigen === 'SUPERSET') ? '0 1px 2px rgba(0,0,0,0.08)' : 'none',
                  cursor: 'pointer',
                  textAlign: 'center',
                }}
                title="Mostrar únicamente reportes oficiales certificados"
              >
                Oficiales
              </button>
              <button
                type="button"
                onClick={() => h.setFiltroOrigen('BORRADORES')}
                style={{
                  padding: '0.32rem 0.15rem',
                  fontSize: '0.7rem',
                  fontWeight: (h.filtroOrigen === 'BORRADORES' || h.filtroOrigen === 'IA') ? 700 : 500,
                  borderRadius: '6px',
                  border: 'none',
                  background: (h.filtroOrigen === 'BORRADORES' || h.filtroOrigen === 'IA') ? 'var(--bg-card)' : 'transparent',
                  color: (h.filtroOrigen === 'BORRADORES' || h.filtroOrigen === 'IA') ? 'var(--sky-600)' : 'var(--text-muted)',
                  boxShadow: (h.filtroOrigen === 'BORRADORES' || h.filtroOrigen === 'IA') ? '0 1px 2px rgba(0,0,0,0.08)' : 'none',
                  cursor: 'pointer',
                  textAlign: 'center',
                }}
                title="Mostrar únicamente borradores"
              >
                Borradores
              </button>
            </div>

            {/* Grupo 1: Dashboards Oficiales */}
            {(h.filtroOrigen === 'TODOS' || h.filtroOrigen === 'OFICIALES' || h.filtroOrigen === 'SUPERSET') && (
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '0.7rem',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    color: 'var(--text-muted)',
                    marginBottom: '0.4rem',
                    padding: '0 0.25rem',
                  }}
                >
                  <span>Oficiales</span>
                  <span>{h.supersetFiltrados.length}</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                  {h.supersetFiltrados.map((d) => {
                    const activo = dashboardMostrado?.id === d.id;
                    return (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => h.setDashboardActivo(d)}
                        title={d.titulo}
                        className="truncate overflow-hidden whitespace-nowrap text-ellipsis"
                        style={{
                          width: '100%',
                          textAlign: 'left',
                          padding: '0.48rem 0.65rem',
                          borderRadius: '8px',
                          border: '1px solid',
                          borderColor: activo ? 'var(--sky-600)' : 'transparent',
                          background: activo ? 'var(--sky-50)' : 'transparent',
                          color: activo ? 'var(--sky-700)' : 'var(--text-main)',
                          fontSize: '0.78rem',
                          fontWeight: activo ? 700 : 500,
                          cursor: 'pointer',
                          display: 'block',
                          overflow: 'hidden',
                          whiteSpace: 'nowrap',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {d.titulo}
                      </button>
                    );
                  })}
                  {h.supersetFiltrados.length === 0 && (
                    <div style={{ padding: '0.5rem', fontSize: '0.74rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                      Sin reportes oficiales
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Grupo 2: Dashboards Borradores */}
            {(h.filtroOrigen === 'TODOS' || h.filtroOrigen === 'BORRADORES' || h.filtroOrigen === 'IA') && (
              <div
                style={{
                  borderTop: (h.filtroOrigen === 'TODOS') ? '1px solid var(--border-color)' : 'none',
                  paddingTop: (h.filtroOrigen === 'TODOS') ? '0.75rem' : '0',
                  minWidth: 0,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '0.7rem',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    color: 'var(--text-muted)',
                    marginBottom: '0.4rem',
                    padding: '0 0.25rem',
                  }}
                >
                  <span>Borradores</span>
                  <span>{h.iaFiltrados.length}</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                  {h.iaFiltrados.map((d) => {
                    const activo = dashboardMostrado?.id === d.id;
                    const pidiendoConfirmacion = confirmandoEliminarId === d.id;
                    const subiendoEste = subiendoId === d.id;

                    return (
                      <div
                        key={d.id}
                        className="group dashboard-sidebar-item"
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.25rem',
                          padding: '0.42rem 0.55rem',
                          borderRadius: '8px',
                          border: '1px solid',
                          borderColor: activo ? 'var(--green-600)' : 'transparent',
                          background: activo ? 'var(--green-50)' : 'transparent',
                          minWidth: 0,
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '0.35rem',
                            minWidth: 0,
                          }}
                        >
                          <button
                            type="button"
                            onClick={() => h.setDashboardActivo(d)}
                            title={d.titulo}
                            className="truncate overflow-hidden whitespace-nowrap text-ellipsis"
                            style={{
                              flex: 1,
                              minWidth: 0,
                              textAlign: 'left',
                              border: 'none',
                              background: 'transparent',
                              padding: 0,
                              color: activo ? 'var(--green-700)' : 'var(--text-main)',
                              fontSize: '0.78rem',
                              fontWeight: activo ? 700 : 500,
                              cursor: 'pointer',
                              overflow: 'hidden',
                              whiteSpace: 'nowrap',
                              textOverflow: 'ellipsis',
                            }}
                          >
                            {d.titulo}
                          </button>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', flexShrink: 0 }}>
                            {/* Opción de pasar de borrador a oficial */}
                            {!pidiendoConfirmacion && (
                              <button
                                type="button"
                                onClick={async () => {
                                  setSubiendoId(d.id);
                                  try {
                                    await h.publicarDashboardComoOficial(d.id, true);
                                  } finally {
                                    setSubiendoId(null);
                                  }
                                }}
                                disabled={subiendoEste}
                                className={`dashboard-action-btn ${subiendoEste ? 'is-loading' : ''}`}
                                style={{
                                  border: 'none',
                                  background: 'transparent',
                                  color: 'var(--sky-600)',
                                  cursor: 'pointer',
                                  padding: '0.15rem',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                }}
                                title="Subir a oficial (visible para todo Control Municipal)"
                                aria-label={`Subir a oficial ${d.titulo}`}
                              >
                                {subiendoEste ? (
                                  <RefreshCw size={13} style={{ animation: 'spin 1s linear infinite' }} />
                                ) : (
                                  <UploadCloud size={13} />
                                )}
                              </button>
                            )}

                            {!pidiendoConfirmacion && (
                              <button
                                type="button"
                                onClick={() => setConfirmandoEliminarId(d.id)}
                                className="dashboard-delete-btn"
                                style={{
                                  border: 'none',
                                  background: 'transparent',
                                  color: 'var(--text-muted)',
                                  cursor: 'pointer',
                                  padding: '0.15rem',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                }}
                                title="Eliminar borrador"
                                aria-label={`Eliminar ${d.titulo}`}
                              >
                                <Trash2 size={13} />
                              </button>
                            )}
                          </div>
                        </div>

                        {pidiendoConfirmacion && (
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: '0.35rem',
                              paddingTop: '0.25rem',
                              borderTop: '1px dashed var(--border-color)',
                              fontSize: '0.7rem',
                            }}
                          >
                            <span style={{ color: 'var(--red-600)', fontWeight: 700 }}>¿Eliminar?</span>
                            <div style={{ display: 'flex', gap: '0.25rem' }}>
                              <button
                                type="button"
                                onClick={() => {
                                  h.eliminarDashboardIA(d.id);
                                  setConfirmandoEliminarId(null);
                                }}
                                className="btn btn-primary"
                                style={{
                                  background: 'var(--red-600)',
                                  borderColor: 'var(--red-600)',
                                  padding: '0.12rem 0.4rem',
                                  fontSize: '0.68rem',
                                }}
                              >
                                Sí
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmandoEliminarId(null)}
                                className="btn btn-secondary"
                                style={{ padding: '0.12rem 0.4rem', fontSize: '0.68rem' }}
                              >
                                No
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {h.iaFiltrados.length === 0 && (
                    <div style={{ padding: '0.5rem', fontSize: '0.74rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                      Sin borradores
                    </div>
                  )}
                </div>
              </div>
            )}
          </aside>
        )}

        {/* 2. Contenido Principal del Dashboard */}
        <div style={{ minWidth: 0 }}>
          {dashboardMostrado && (
            <SupersetEmbedViewer
              dashboardPersonalizado={dashboardMostrado}
              dashboardsDisponibles={h.todosLosDashboards}
              modoFijo={false}
              mostrarCatalogoPlantillas={false}
              isFullscreen={isFullscreen}
              onToggleFullscreen={() => setIsFullscreen((prev) => !prev)}
              onPublicarDashboard={h.publicarDashboardComoOficial}
              controlIzquierdoCabecera={
                <button
                  type="button"
                  onClick={() => setSidebarAbierto(!sidebarAbierto)}
                  className="btn btn-secondary"
                  style={{ fontSize: '0.8rem', padding: '0.4rem 0.65rem' }}
                  title={sidebarAbierto ? 'Ocultar lista de dashboards' : 'Mostrar lista de dashboards'}
                >
                  {sidebarAbierto ? <PanelLeftClose size={15} /> : <PanelLeftOpen size={15} />}
                </button>
              }
            />
          )}
        </div>

        {/* 3. Side Drawer Derecho del Asistente IA (se cierra únicamente desde su botón "X") */}
        {isAiPanelOpen && (
          <div style={{ minWidth: 0 }}>
            <SupersetChatAssistant
              key={h.chatSessionKey}
              modulo={modulo}
              dashboardsDisponibles={h.todosLosDashboards}
              modoInicial={h.modoChatInicial}
              modeloInicial={h.modeloChatInicial}
              dashboardContextoInicialId={h.dashboardContextoChatId}
              isFullscreen={isFullscreen}
              onVisualizarDashboard={h.seleccionarDashboardPorId}
              onDashboardGenerado={(nuevo) => {
                h.agregarDashboardGenerado(nuevo);
                h.setDashboardActivo(nuevo);
              }}
              onCerrar={h.cerrarChat}
            />
          </div>
        )}
      </div>
    </div>
  );
};
