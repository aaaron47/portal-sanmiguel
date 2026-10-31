import React from 'react';
import { Download, Calendar, RotateCcw } from 'lucide-react';
import { SearchInput } from '@/components/shared/ui/SearchInput';

interface AuditoriaToolbarProps {
  searchQuery: string;
  onSearch: (value: string) => void;
  filtroFecha: string;
  onFiltroFechaChange: (fecha: string) => void;
  filtroResponsable: string;
  onFiltroResponsableChange: (responsable: string) => void;
  filtroAccion: string;
  onFiltroAccionChange: (accion: string) => void;
  responsablesDisponibles: string[];
  accionesDisponibles: string[];
  onDescargarCSV: () => void;
  onResetFiltros: () => void;
}

export const AuditoriaToolbar: React.FC<AuditoriaToolbarProps> = ({
  searchQuery,
  onSearch,
  filtroFecha,
  onFiltroFechaChange,
  filtroResponsable,
  onFiltroResponsableChange,
  filtroAccion,
  onFiltroAccionChange,
  responsablesDisponibles,
  accionesDisponibles,
  onDescargarCSV,
  onResetFiltros,
}) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.25rem' }}>
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.65rem', alignItems: 'center' }}>
      <SearchInput
        value={searchQuery}
        onChange={onSearch}
        placeholder="Buscar por texto, entidad o IP..."
        maxWidth="260px"
      />

      {/* Filtro por Fecha */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
        <Calendar size={15} style={{ color: 'var(--text-muted)' }} />
        <input
          type="date"
          value={filtroFecha}
          onChange={(e) => onFiltroFechaChange(e.target.value)}
          style={{
            padding: '0.45rem 0.65rem',
            borderRadius: '8px',
            border: '1px solid var(--border-color)',
            background: 'var(--bg-card)',
            color: 'var(--text-main)',
            fontSize: '0.825rem',
          }}
          title="Filtrar por fecha"
          aria-label="Filtrar por fecha"
        />
      </div>

      {/* Filtro por Responsable */}
      <select
        value={filtroResponsable}
        onChange={(e) => onFiltroResponsableChange(e.target.value)}
        style={{
          padding: '0.45rem 0.65rem',
          borderRadius: '8px',
          border: '1px solid var(--border-color)',
          background: 'var(--bg-card)',
          color: 'var(--text-main)',
          fontSize: '0.825rem',
        }}
        aria-label="Filtrar por responsable"
      >
        <option value="todos">Todos los Responsables</option>
        {responsablesDisponibles.map((r) => (
          <option key={r} value={r}>
            {r}
          </option>
        ))}
      </select>

      {/* Filtro por Acción */}
      <select
        value={filtroAccion}
        onChange={(e) => onFiltroAccionChange(e.target.value)}
        style={{
          padding: '0.45rem 0.65rem',
          borderRadius: '8px',
          border: '1px solid var(--border-color)',
          background: 'var(--bg-card)',
          color: 'var(--text-main)',
          fontSize: '0.825rem',
        }}
        aria-label="Filtrar por acción de seguridad"
      >
        <option value="todas">Todas las Acciones</option>
        {accionesDisponibles.map((a) => (
          <option key={a} value={a}>
            {a.replace(/_/g, ' ')}
          </option>
        ))}
      </select>

      {/* Botón de limpiar filtros si alguno está activo */}
      {(filtroFecha || filtroResponsable !== 'todos' || filtroAccion !== 'todas' || searchQuery) && (
        <button
          onClick={onResetFiltros}
          className="btn btn-secondary"
          style={{ padding: '0.45rem 0.65rem', fontSize: '0.775rem' }}
          title="Limpiar filtros"
        >
          <RotateCcw size={13} /> Limpiar
        </button>
      )}

      {/* Botón Descargar CSV */}
      <button
        onClick={onDescargarCSV}
        className="btn btn-secondary"
        style={{ fontSize: '0.825rem', padding: '0.45rem 0.75rem', marginLeft: 'auto' }}
        title="Descargar registro de auditoría en CSV"
      >
        <Download size={15} /> Exportar CSV
      </button>
    </div>
  </div>
);
