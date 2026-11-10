import React from 'react';
import { Download, Calendar } from 'lucide-react';
import { SearchInput } from '@/components/shared/ui/SearchInput';
import {
  FilterSelectWrapper,
  FilterResetButton,
  ESTILO_SELECT_FILTRO,
  ESTILO_LABEL_FILTRO,
} from '@/components/shared/ui/FilterControls';

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
}) => {
  const hayFiltrosActivos = Boolean(
    filtroFecha || filtroResponsable !== 'todos' || filtroAccion !== 'todas' || searchQuery.trim()
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.25rem' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'flex-end' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', flex: 1, minWidth: '240px', maxWidth: '300px' }}>
          <label style={ESTILO_LABEL_FILTRO}>Búsqueda</label>
          <SearchInput
            value={searchQuery}
            onChange={onSearch}
            placeholder="Buscar por texto, entidad o IP..."
          />
        </div>

        {/* Filtro por Fecha */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <label style={ESTILO_LABEL_FILTRO}>
            <Calendar size={11} style={{ verticalAlign: 'middle', marginRight: '3px' }} />
            Fecha
          </label>
          <input
            type="date"
            value={filtroFecha}
            onChange={(e) => onFiltroFechaChange(e.target.value)}
            style={{
              ...ESTILO_SELECT_FILTRO,
              width: '140px',
            }}
            title="Filtrar por fecha"
            aria-label="Filtrar por fecha"
          />
        </div>

        {/* Filtro por Responsable */}
        <FilterSelectWrapper label="Responsable">
          <select
            value={filtroResponsable}
            onChange={(e) => onFiltroResponsableChange(e.target.value)}
            style={ESTILO_SELECT_FILTRO}
            aria-label="Filtrar por responsable"
          >
            <option value="todos">Todo</option>
            {responsablesDisponibles.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </FilterSelectWrapper>

        {/* Filtro por Acción */}
        <FilterSelectWrapper label="Acción">
          <select
            value={filtroAccion}
            onChange={(e) => onFiltroAccionChange(e.target.value)}
            style={ESTILO_SELECT_FILTRO}
            aria-label="Filtrar por acción de seguridad"
          >
            <option value="todas">Todo</option>
            {accionesDisponibles.map((a) => (
              <option key={a} value={a}>
                {a.replace(/_/g, ' ')}
              </option>
            ))}
          </select>
        </FilterSelectWrapper>

        {/* Botón de eliminar filtros */}
        <FilterResetButton
          onReset={onResetFiltros}
          activo={hayFiltrosActivos}
          title="Eliminar filtros de auditoría"
        />

        {/* Botón Descargar CSV */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', justifyContent: 'flex-end', marginLeft: 'auto' }}>
          <span style={{ ...ESTILO_LABEL_FILTRO, visibility: 'hidden' }}>&nbsp;</span>
          <button
            type="button"
            onClick={onDescargarCSV}
            className="btn btn-secondary"
            style={{
              height: '38px',
              padding: '0 0.85rem',
              fontSize: '0.8rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              boxSizing: 'border-box',
            }}
            title="Descargar registro de auditoría en CSV"
          >
            <Download size={14} /> Exportar CSV
          </button>
        </div>
      </div>
    </div>
  );
};
