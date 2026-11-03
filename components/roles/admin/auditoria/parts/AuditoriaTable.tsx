'use client';

import React, { useState, useMemo } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight,
  AlertCircle
} from 'lucide-react';
import { AuditoriaLog } from '@/types/auditoria.types';

// Helper visual para clasificar tipos de acciones con badges de colores sutiles
function getBadgeAccion(accion: string) {
  if (accion.includes('LOGIN')) {
    return <span className="badge badge-neutral" style={{ fontSize: '0.675rem', padding: '0.2rem 0.45rem' }}>{accion}</span>;
  }
  if (accion.includes('CREACION') || accion.includes('ALTA')) {
    return <span className="badge badge-success" style={{ fontSize: '0.675rem', padding: '0.2rem 0.45rem' }}>{accion}</span>;
  }
  if (accion.includes('ACTUALIZACION') || accion.includes('GOBERNANZA') || accion.includes('ROL')) {
    return <span className="badge badge-primary" style={{ fontSize: '0.675rem', padding: '0.2rem 0.45rem' }}>{accion}</span>;
  }
  if (accion.includes('DEPURACION') || accion.includes('CAMBIO_ESTADO') || accion.includes('BAJA')) {
    return <span className="badge badge-danger" style={{ fontSize: '0.675rem', padding: '0.2rem 0.45rem' }}>{accion}</span>;
  }
  return <span className="badge badge-neutral" style={{ fontSize: '0.675rem', padding: '0.2rem 0.45rem' }}>{accion}</span>;
}

export const AuditoriaTable: React.FC<{ logs: AuditoriaLog[] }> = ({ logs }) => {
  const [paginaActual, setPaginaActual] = useState(1);
  const [registrosPorPagina, setRegistrosPorPagina] = useState(10);

  // Calcular número total de páginas
  const totalPaginas = useMemo(() => {
    return Math.max(1, Math.ceil(logs.length / registrosPorPagina));
  }, [logs.length, registrosPorPagina]);

  // Asegurar que la página actual sea válida si cambia la cantidad de logs
  const paginaAjustada = Math.min(paginaActual, totalPaginas);

  // Segmentar los registros correspondientes a la página activa
  const logsPaginados = useMemo(() => {
    const inicio = (paginaAjustada - 1) * registrosPorPagina;
    return logs.slice(inicio, inicio + registrosPorPagina);
  }, [logs, paginaAjustada, registrosPorPagina]);

  const indiceInicio = logs.length === 0 ? 0 : (paginaAjustada - 1) * registrosPorPagina + 1;
  const indiceFin = Math.min(paginaAjustada * registrosPorPagina, logs.length);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', flex: 1, minHeight: 0 }}>
      {/* Tabla con tipografía compacta y alta densidad ocupando casi todo el height disponible */}
      <div 
        className="table-container" 
        style={{ 
          flex: 1, 
          overflowX: 'auto', 
          overflowY: 'auto', 
          border: '1px solid var(--border-color)', 
          borderRadius: '10px',
          minHeight: '440px',
        }}
      >
        <table className="data-table" style={{ fontSize: '0.75rem', width: '100%' }}>
          <thead>
            <tr style={{ background: 'var(--bg-card-subtle)', position: 'sticky', top: 0, zIndex: 2 }}>
              <th style={{ padding: '0.55rem 0.65rem', width: '135px', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Fecha / Hora
              </th>
              <th style={{ padding: '0.55rem 0.65rem', width: '180px', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Responsable
              </th>
              <th style={{ padding: '0.55rem 0.65rem', width: '150px', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Acción
              </th>
              <th style={{ padding: '0.55rem 0.65rem', width: '170px', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Entidad Afectada
              </th>
              <th style={{ padding: '0.55rem 0.65rem', width: '120px', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                IP Origen
              </th>
              <th style={{ padding: '0.55rem 0.65rem', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Detalles de Auditoría
              </th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--text-muted)' }}>
                  <AlertCircle size={22} style={{ margin: '0 auto 0.5rem', display: 'block', color: 'var(--slate-400)' }} />
                  No se encontraron registros de auditoría coincidentes con los filtros aplicados.
                </td>
              </tr>
            ) : (
              logsPaginados.map((log) => (
                <tr key={log.id} style={{ transition: 'background-color 0.15s ease' }}>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', padding: '0.45rem 0.65rem' }}>
                    {log.fecha}
                  </td>
                  <td style={{ padding: '0.45rem 0.65rem' }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.775rem' }}>
                      {log.adminNombre}
                    </div>
                    <div style={{ fontSize: '0.685rem', color: 'var(--text-dim)' }}>
                      {log.adminEmail}
                    </div>
                  </td>
                  <td style={{ padding: '0.45rem 0.65rem' }}>
                    {getBadgeAccion(log.accion)}
                  </td>
                  <td style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.75rem', padding: '0.45rem 0.65rem' }}>
                    {log.entidadAfectada}
                  </td>
                  <td style={{ fontSize: '0.7rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', padding: '0.45rem 0.65rem' }}>
                    {log.ipOrigen}
                  </td>
                  <td style={{ fontSize: '0.735rem', color: 'var(--text-muted)', lineHeight: '1.35', padding: '0.45rem 0.65rem' }}>
                    {log.detalles}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Barra de Paginación Inteligente */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '0.75rem',
        padding: '0.5rem 0.25rem',
        fontSize: '0.75rem',
        color: 'var(--text-muted)',
      }}>
        {/* Lado izquierdo: Conteo y selector de registros por página */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <span>
            Mostrando <strong>{indiceInicio}</strong> – <strong>{indiceFin}</strong> de <strong>{logs.length}</strong> registros
          </span>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span>Filas por página:</span>
            <select
              value={registrosPorPagina}
              onChange={(e) => {
                setRegistrosPorPagina(Number(e.target.value));
                setPaginaActual(1);
              }}
              style={{
                padding: '0.2rem 0.4rem',
                borderRadius: '6px',
                border: '1px solid var(--border-color)',
                fontSize: '0.75rem',
                background: 'var(--bg-card)',
                color: 'var(--text-main)',
              }}
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>

        {/* Lado derecho: Controles de navegación de página */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          {/* Ir al inicio */}
          <button
            onClick={() => setPaginaActual(1)}
            disabled={paginaAjustada === 1}
            className="btn btn-secondary"
            style={{ padding: '0.25rem 0.45rem', fontSize: '0.75rem' }}
            title="Primera Página"
          >
            <ChevronsLeft size={14} />
          </button>

          {/* Anterior */}
          <button
            onClick={() => setPaginaActual((prev) => Math.max(1, prev - 1))}
            disabled={paginaAjustada === 1}
            className="btn btn-secondary"
            style={{ padding: '0.25rem 0.45rem', fontSize: '0.75rem' }}
            title="Página Anterior"
          >
            <ChevronLeft size={14} />
          </button>

          {/* Números de página */}
          <span style={{ margin: '0 0.5rem', fontWeight: 600, color: 'var(--text-main)' }}>
            Página {paginaAjustada} de {totalPaginas}
          </span>

          {/* Siguiente */}
          <button
            onClick={() => setPaginaActual((prev) => Math.min(totalPaginas, prev + 1))}
            disabled={paginaAjustada === totalPaginas}
            className="btn btn-secondary"
            style={{ padding: '0.25rem 0.45rem', fontSize: '0.75rem' }}
            title="Página Siguiente"
          >
            <ChevronRight size={14} />
          </button>

          {/* Ir al final */}
          <button
            onClick={() => setPaginaActual(totalPaginas)}
            disabled={paginaAjustada === totalPaginas}
            className="btn btn-secondary"
            style={{ padding: '0.25rem 0.45rem', fontSize: '0.75rem' }}
            title="Última Página"
          >
            <ChevronsRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};
