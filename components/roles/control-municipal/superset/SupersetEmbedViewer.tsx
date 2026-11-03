'use client';

import React, { useState } from 'react';
import { 
  BarChart2, 
  Maximize2, 
  Minimize2, 
  RefreshCw, 
  Database,
  Layers,
  Download,
  FileSpreadsheet
} from 'lucide-react';
import { SupersetDashboardInfo } from '@/types/superset.types';
import { CATALOGO_REPORTES_OFICIALES, ReporteItemInfo } from '@/types/reportes-tributarios.types';
import { exportarCSV } from '@/utils/csv.utils';

export const DASHBOARDS_PREDEFINIDOS: SupersetDashboardInfo[] = [
  {
    id: 'D1',
    slug: 'deuda-morosidad-pricos',
    titulo: 'Deuda, Morosidad y PRICOS (R1, R2, R5)',
    descripcion: 'Reporte de morosos con/sin beneficio, contribuyentes sin pagos 2022-2025 y Principales Contribuyentes (≥10 UIT).',
    categoria: 'cumplimiento',
    urlRelativa: '/superset/dashboard/deuda-morosidad-pricos/?standalone=true',
  },
  {
    id: 'D2',
    slug: 'recaudacion-valores',
    titulo: 'Eficacia de Recaudación y Valores (R3, R4)',
    descripcion: '% de recaudación, morosidad, efectividad y estado de cobranza de Órdenes de Pago y Resoluciones.',
    categoria: 'sla',
    urlRelativa: '/superset/dashboard/recaudacion-valores/?standalone=true',
  },
  {
    id: 'D3',
    slug: 'buenos-pagadores-cumplimiento',
    titulo: 'Buenos Pagadores y Cumplimiento (R6, R7, R10)',
    descripcion: 'Contribuyentes puntuales en Predial/Arbitrios, evolución anual de cumplimiento y montos promedio recaudados.',
    categoria: 'cumplimiento',
    urlRelativa: '/superset/dashboard/buenos-pagadores-cumplimiento/?standalone=true',
  },
  {
    id: 'D4',
    slug: 'antiguedad-reincidencia',
    titulo: 'Antigüedad y Comportamiento de Pago (R8, R9, R11)',
    descripcion: 'Estratos de antigüedad de deuda, pagos oportunos vs atrasados y reincidencia en mora.',
    categoria: 'tipologia',
    urlRelativa: '/superset/dashboard/antiguedad-reincidencia/?standalone=true',
  },
];

interface SupersetEmbedViewerProps {
  dashboardSeleccionadoId?: string;
  onCambiarDashboard?: (id: string) => void;
}

export const SupersetEmbedViewer: React.FC<SupersetEmbedViewerProps> = ({
  dashboardSeleccionadoId = 'D1',
  onCambiarDashboard,
}) => {
  const [dashboardId, setDashboardId] = useState(dashboardSeleccionadoId);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [recargando, setRecargando] = useState(false);

  const dashboardActual = DASHBOARDS_PREDEFINIDOS.find((d) => d.id === dashboardId) || DASHBOARDS_PREDEFINIDOS[0];

  const handleSelect = (id: string) => {
    setDashboardId(id);
    onCambiarDashboard?.(id);
  };

  const handleRecargar = () => {
    setRecargando(true);
    setTimeout(() => {
      setRecargando(false);
    }, 500);
  };

  // Exportar plantilla de cabeceras de cualquiera de los 11 reportes
  const handleDescargarPlantilla = (rep: ReporteItemInfo) => {
    exportarCSV(`Plantilla_${rep.codigo}_${rep.nombre.replace(/\s+/g, '_')}`, rep.cabeceras, []);
  };

  return (
    <div className="card" style={{
      position: isFullscreen ? 'fixed' : 'relative',
      top: isFullscreen ? 0 : undefined,
      left: isFullscreen ? 0 : undefined,
      right: isFullscreen ? 0 : undefined,
      bottom: isFullscreen ? 0 : undefined,
      zIndex: isFullscreen ? 9999 : 1,
      height: isFullscreen ? '100vh' : 'auto',
      borderRadius: isFullscreen ? 0 : '16px',
      display: 'flex',
      flexDirection: 'column',
      padding: isFullscreen ? '1.5rem' : '1.25rem',
      background: 'var(--bg-card)',
    }}>
      {/* 1. Catálogo y Plantillas de los 11 Reportes Oficiales (R1 al R11) - Al inicio según solicitud */}
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
                <strong style={{ fontSize: '0.8rem', color: 'var(--sky-700)', display: 'block', textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden' }} title={`${rep.codigo}. ${rep.nombre}`}>
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

      {/* 2. Cabecera del Visor de Gráficos Analíticos */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ padding: '0.5rem', borderRadius: '10px', background: 'var(--violet-50)', color: 'var(--violet-700)' }}>
            <Database size={20} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {dashboardActual.titulo}
              <span className="badge badge-primary" style={{ fontSize: '0.7rem' }}>Apache Superset</span>
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0.2rem 0 0' }}>
              {dashboardActual.descripcion}
            </p>
          </div>
        </div>

        {/* Acciones del visor limpias: solo Recargar Solicitud y Pantalla Completa */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button
            onClick={handleRecargar}
            disabled={recargando}
            className="btn btn-secondary"
            style={{ fontSize: '0.8rem', padding: '0.4rem 0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
            title="Recargar la solicitud y sincronizar con Apache Superset"
          >
            <RefreshCw size={14} style={{ animation: recargando ? 'spin 1s linear infinite' : 'none' }} />
            <span>{recargando ? 'Recargando...' : 'Recargar solicitud'}</span>
          </button>

          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="btn btn-secondary"
            style={{ fontSize: '0.8rem', padding: '0.4rem 0.65rem' }}
            title={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
          >
            {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>
        </div>
      </div>

      {/* 3. Selector de Tableros Predefinidos (D1 - D4) */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
        {DASHBOARDS_PREDEFINIDOS.map((d) => (
          <button
            key={d.id}
            onClick={() => handleSelect(d.id)}
            style={{
              padding: '0.45rem 0.85rem',
              borderRadius: '8px',
              border: '1px solid',
              borderColor: dashboardId === d.id ? 'var(--sky-600)' : 'var(--border-color)',
              background: dashboardId === d.id ? 'var(--sky-50)' : 'var(--bg-card-subtle)',
              color: dashboardId === d.id ? 'var(--sky-700)' : 'var(--text-muted)',
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

      {/* 4. Contenedor de Visualización Analítica */}
      <div style={{
        flex: 1,
        minHeight: isFullscreen ? 'calc(100vh - 280px)' : '420px',
        border: '1px solid var(--border-color)',
        borderRadius: '12px',
        overflow: 'hidden',
        background: 'var(--bg-app)',
        position: 'relative',
      }}>
        {recargando ? (
          <div style={{
            height: '100%',
            minHeight: '380px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '1rem',
            color: 'var(--text-muted)',
          }}>
            <RefreshCw size={28} style={{ animation: 'spin 1s linear infinite' }} color="var(--sky-600)" />
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)' }}>
                Recargando solicitud analítica...
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                Sincronizando gráficos y agregaciones de Apache Superset
              </div>
            </div>
          </div>
        ) : (
          <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{
              background: 'var(--sky-50)',
              border: '1px solid var(--sky-200)',
              borderRadius: '8px',
              padding: '0.75rem 1rem',
              fontSize: '0.825rem',
              color: 'var(--sky-900)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '0.5rem',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Layers size={16} />
                <span>
                  <strong>Panel Tributario San Miguel:</strong> Vista gráfica generada a partir de los datos consolidados del Tablero <strong>{dashboardActual.id}</strong>.
                </span>
              </div>
            </div>

            {/* D1: Deuda, Morosidad y PRICOS */}
            {dashboardId === 'D1' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                <div style={{ background: 'var(--bg-card)', padding: '1.25rem', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--text-main)' }}>
                    R1. Morosidad: Total con Beneficio vs Sin Beneficio (S/.)
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', height: '120px' }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--amber-700)' }}>S/ 14.8M</div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Deuda Sin Beneficio</span>
                    </div>
                    <div style={{ width: '1px', height: '50px', background: 'var(--border-color)' }} />
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--green-600)' }}>S/ 11.2M</div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Deuda Con Beneficio</span>
                    </div>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border-color)', paddingTop: '0.5rem' }}>
                    * Descuento en Arbitrios Municipales aplicado a 8,420 predios fiscales.
                  </div>
                </div>

                <div style={{ background: 'var(--bg-card)', padding: '1.25rem', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--text-main)' }}>
                    R5. Segmentación PRICOS (Base Imponible ≥ 10 UIT)
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                      <span>PRICOS al Día (2026)</span>
                      <strong style={{ color: 'var(--green-600)' }}>342 contribuyentes (68%)</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                      <span>PRICOS con Deuda Anterior</span>
                      <strong style={{ color: 'var(--red-600)' }}>161 contribuyentes (32%)</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                      <span>R2. Cero Pagos (2022-2025)</span>
                      <strong style={{ color: 'var(--amber-700)' }}>89 contribuyentes</strong>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* D2: Recaudación y Valores */}
            {dashboardId === 'D2' && (
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
                      <div style={{ height: '8px', background: 'var(--slate-200)', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ width: '78.4%', height: '100%', background: 'var(--green-600)' }} />
                      </div>
                    </div>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.2rem' }}>
                        <span>% Morosidad Pendiente</span>
                        <strong>21.6%</strong>
                      </div>
                      <div style={{ height: '8px', background: 'var(--slate-200)', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ width: '21.6%', height: '100%', background: 'var(--red-600)' }} />
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
                      <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--sky-700)' }}>4,820</div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Valores Emitidos</span>
                    </div>
                    <div style={{ width: '1px', height: '50px', background: 'var(--border-color)' }} />
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--green-600)' }}>S/ 3.4M</div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Recaudado por Coactiva</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* D3 y D4: Vistas analíticas */}
            {(dashboardId === 'D3' || dashboardId === 'D4') && (
              <div style={{ background: 'var(--bg-card)', padding: '1.5rem', borderRadius: '10px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                <BarChart2 size={36} color="var(--sky-600)" style={{ margin: '0 auto 0.75rem' }} />
                <h4 style={{ fontSize: '1rem', fontWeight: 700, margin: '0 0 0.5rem' }}>
                  {dashboardActual.titulo}
                </h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', maxWidth: '600px', margin: '0 auto 1rem' }}>
                  Este tablero compila el comportamiento histórico, la puntualidad (R6) y la antigüedad de obligaciones tributarias (R8, R9, R11).
                </p>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
                  <div className="badge badge-success">Buenos Pagadores: 64.2%</div>
                  <div className="badge badge-primary">Antigüedad Promedio: 2.3 años</div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
