'use client';

import React, { useState, useMemo } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight,
  AlertCircle,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { Usuario, ROLE_LABELS } from '@/types/auth.types';
import { NivelMcp } from '@/types/superset.types';

interface UsuariosTableProps {
  usuarios: Usuario[];
  selectedIds: string[];
  todosSeleccionados: boolean;
  onToggle: (id: string) => void;
  onToggleTodos: () => void;
  onCambiarAccesoMcp?: (id: string, nivel: NivelMcp | 'DESHABILITADO') => void;
}

export const UsuariosTable: React.FC<UsuariosTableProps> = ({
  usuarios,
  selectedIds,
  todosSeleccionados,
  onToggle,
  onToggleTodos,
  onCambiarAccesoMcp,
}) => {
  const [paginaActual, setPaginaActual] = useState(1);
  const [registrosPorPagina, setRegistrosPorPagina] = useState(10);

  // Total de páginas calculadas
  const totalPaginas = useMemo(() => {
    return Math.max(1, Math.ceil(usuarios.length / registrosPorPagina));
  }, [usuarios.length, registrosPorPagina]);

  const paginaAjustada = Math.min(paginaActual, totalPaginas);

  // Usuarios en la página activa
  const usuariosPaginados = useMemo(() => {
    const inicio = (paginaAjustada - 1) * registrosPorPagina;
    return usuarios.slice(inicio, inicio + registrosPorPagina);
  }, [usuarios, paginaAjustada, registrosPorPagina]);

  const indiceInicio = usuarios.length === 0 ? 0 : (paginaAjustada - 1) * registrosPorPagina + 1;
  const indiceFin = Math.min(paginaAjustada * registrosPorPagina, usuarios.length);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <div className="table-container" style={{ overflowX: 'auto', border: '1px solid var(--border-color)', borderRadius: '10px' }}>
        <table className="data-table" style={{ fontSize: '0.8rem', width: '100%' }}>
          <thead>
            <tr style={{ background: 'var(--bg-card-subtle)' }}>
              <th style={{ width: '40px', padding: '0.6rem 0.65rem' }}>
                <input
                  type="checkbox"
                  checked={todosSeleccionados}
                  onChange={onToggleTodos}
                  aria-label="Seleccionar todos los usuarios"
                />
              </th>
              <th style={{ width: '110px', padding: '0.6rem 0.65rem' }}>DNI</th>
              <th style={{ padding: '0.6rem 0.65rem' }}>Nombre / Correo</th>
              <th style={{ width: '180px', padding: '0.6rem 0.65rem' }}>Rol Asignado</th>
              <th style={{ width: '190px', padding: '0.6rem 0.65rem' }}>Área Municipal</th>
              <th style={{ width: '110px', padding: '0.6rem 0.65rem' }}>Estado</th>
              <th style={{ width: '170px', padding: '0.6rem 0.65rem' }}>Acceso MCP</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--text-muted)' }}>
                  <AlertCircle size={22} style={{ margin: '0 auto 0.5rem', display: 'block', color: 'var(--slate-400)' }} />
                  No se encontraron usuarios coincidentes con los filtros aplicados.
                </td>
              </tr>
            ) : (
              usuariosPaginados.map((u) => {
                const isSelected = selectedIds.includes(u.id);
                return (
                  <tr
                    key={u.id}
                    onClick={() => onToggle(u.id)}
                    style={{
                      cursor: 'pointer',
                      background: isSelected ? 'var(--sky-50)' : undefined,
                      transition: 'background-color 0.15s ease',
                    }}
                  >
                    <td onClick={(e) => e.stopPropagation()} style={{ padding: '0.5rem 0.65rem' }}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onToggle(u.id)}
                        aria-label={`Seleccionar a ${u.nombreCompleto}`}
                      />
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: '0.78rem', padding: '0.5rem 0.65rem' }}>
                      {u.dni || '—'}
                    </td>
                    <td style={{ padding: '0.5rem 0.65rem' }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.825rem' }}>{u.nombreCompleto}</div>
                      <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>{u.email}</div>
                    </td>
                    <td style={{ padding: '0.5rem 0.65rem' }}>
                      <span className="badge badge-primary" style={{ fontSize: '0.725rem' }}>
                        {ROLE_LABELS[u.rol] || u.rol}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)', padding: '0.5rem 0.65rem' }}>
                      {u.area || '—'}
                    </td>
                    <td style={{ padding: '0.5rem 0.65rem' }}>
                      {u.activo ? (
                        <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.725rem' }}>
                          <CheckCircle2 size={12} /> Activo
                        </span>
                      ) : (
                        <span className="badge badge-neutral" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.725rem', color: 'var(--text-dim)' }}>
                          <XCircle size={12} /> Inactivo
                        </span>
                      )}
                    </td>
                    <td onClick={(e) => e.stopPropagation()} style={{ padding: '0.5rem 0.65rem' }}>
                      <select
                        value={u.mcpHabilitado ? (u.mcpNivel || 'CONSULTA') : 'DESHABILITADO'}
                        onChange={(e) => {
                          const val = e.target.value as NivelMcp | 'DESHABILITADO';
                          onCambiarAccesoMcp?.(u.id, val);
                        }}
                        style={{
                          fontSize: '0.72rem',
                          padding: '0.25rem 0.4rem',
                          borderRadius: '6px',
                          border: '1px solid var(--border-color)',
                          background: u.mcpHabilitado ? 'var(--sky-50)' : 'var(--bg-card)',
                          color: u.mcpHabilitado ? 'var(--sky-800)' : 'var(--text-muted)',
                          fontWeight: u.mcpHabilitado ? 600 : 400,
                          cursor: 'pointer',
                        }}
                        title="Nivel de acceso MCP a Superset (sección 6 de la guía)"
                      >
                        <option value="DESHABILITADO">Deshabilitado</option>
                        <option value="CONSULTA">Solo consulta</option>
                        <option value="CONSTRUCCION">Consulta y construcción</option>
                      </select>
                      {u.supersetUsuario && (
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                          Superset: {u.supersetUsuario}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Barra de Paginación */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '0.75rem',
        padding: '0.4rem 0.25rem',
        fontSize: '0.75rem',
        color: 'var(--text-muted)',
      }}>
        {/* Lado izquierdo: Total y Selector de Filas */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <span>
            Mostrando <strong>{indiceInicio}</strong> – <strong>{indiceFin}</strong> de <strong>{usuarios.length}</strong> usuarios
          </span>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span>Usuarios por página:</span>
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
            </select>
          </div>
        </div>

        {/* Lado derecho: Botones de Paginación */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          <button
            onClick={() => setPaginaActual(1)}
            disabled={paginaAjustada === 1}
            className="btn btn-secondary"
            style={{ padding: '0.25rem 0.45rem', fontSize: '0.75rem' }}
            title="Primera Página"
          >
            <ChevronsLeft size={14} />
          </button>

          <button
            onClick={() => setPaginaActual((prev) => Math.max(1, prev - 1))}
            disabled={paginaAjustada === 1}
            className="btn btn-secondary"
            style={{ padding: '0.25rem 0.45rem', fontSize: '0.75rem' }}
            title="Página Anterior"
          >
            <ChevronLeft size={14} />
          </button>

          <span style={{ margin: '0 0.5rem', fontWeight: 600, color: 'var(--text-main)' }}>
            Página {paginaAjustada} de {totalPaginas}
          </span>

          <button
            onClick={() => setPaginaActual((prev) => Math.min(totalPaginas, prev + 1))}
            disabled={paginaAjustada === totalPaginas}
            className="btn btn-secondary"
            style={{ padding: '0.25rem 0.45rem', fontSize: '0.75rem' }}
            title="Página Siguiente"
          >
            <ChevronRight size={14} />
          </button>

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
