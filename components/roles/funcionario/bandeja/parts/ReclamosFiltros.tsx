import React from 'react';
import { Download } from 'lucide-react';
import { TicketFiltroEstado, TicketPrioridad } from '@/types/ticket.types';
import { SearchInput } from '@/components/shared/ui/SearchInput';
import {
  FilterSelectWrapper,
  FilterResetButton,
  ESTILO_SELECT_FILTRO,
  ESTILO_LABEL_FILTRO,
} from '@/components/shared/ui/FilterControls';
import { ESTADOS } from '@/utils/ticket.utils';

interface ReclamosFiltrosProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  filtroEstado: TicketFiltroEstado | 'todos';
  onEstadoChange: (estado: TicketFiltroEstado | 'todos') => void;
  filtroPrioridad: TicketPrioridad | 'todos';
  onPrioridadChange: (prioridad: TicketPrioridad | 'todos') => void;
  soloAsignadosAMi: boolean;
  onSoloAsignadosChange: (val: boolean) => void;
  onLimpiarFiltros?: () => void;
  onDescargarCSV?: () => void;
}

export const ReclamosFiltros: React.FC<ReclamosFiltrosProps> = ({
  searchQuery,
  onSearchChange,
  filtroEstado,
  onEstadoChange,
  filtroPrioridad,
  onPrioridadChange,
  soloAsignadosAMi,
  onSoloAsignadosChange,
  onLimpiarFiltros,
  onDescargarCSV,
}) => {
  const hayFiltrosActivos = Boolean(
    searchQuery.trim() ||
      filtroEstado !== 'todos' ||
      filtroPrioridad !== 'todos' ||
      soloAsignadosAMi
  );

  const handleLimpiar = () => {
    if (onLimpiarFiltros) {
      onLimpiarFiltros();
    } else {
      onSearchChange('');
      onEstadoChange('todos');
      onPrioridadChange('todos');
      onSoloAsignadosChange(false);
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '0.75rem',
        alignItems: 'flex-end',
        marginBottom: '1.25rem',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', flex: 1, minWidth: '240px' }}>
        <label style={ESTILO_LABEL_FILTRO}>Búsqueda</label>
        <SearchInput
          value={searchQuery}
          onChange={onSearchChange}
          placeholder="Buscar por folio, vecino, DNI o asunto..."
        />
      </div>

      <FilterSelectWrapper label="Estado">
        <select
          aria-label="Filtrar por estado"
          value={filtroEstado}
          onChange={(e) => onEstadoChange(e.target.value as TicketFiltroEstado | 'todos')}
          style={ESTILO_SELECT_FILTRO}
        >
          <option value="todos">Todo</option>
          {ESTADOS.map((e) => (
            <option key={e} value={e}>
              {e[0].toUpperCase() + e.slice(1)}
            </option>
          ))}
          <option value="por aprobar">Por aprobar</option>
        </select>
      </FilterSelectWrapper>

      <FilterSelectWrapper label="Prioridad">
        <select
          aria-label="Filtrar por prioridad"
          value={filtroPrioridad}
          onChange={(e) => onPrioridadChange(e.target.value as TicketPrioridad | 'todos')}
          style={ESTILO_SELECT_FILTRO}
        >
          <option value="todos">Todo</option>
          <option value="BAJA">Baja</option>
          <option value="MEDIA">Media</option>
          <option value="ALTA">Alta</option>
        </select>
      </FilterSelectWrapper>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', justifyContent: 'flex-end', height: '38px', paddingBottom: '0.45rem', boxSizing: 'border-box' }}>
        <label
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
            fontSize: '0.825rem',
            cursor: 'pointer',
            color: 'var(--text-main)',
            userSelect: 'none',
            whiteSpace: 'nowrap',
          }}
        >
          <input
            type="checkbox"
            checked={soloAsignadosAMi}
            onChange={(e) => onSoloAsignadosChange(e.target.checked)}
          />
          Solo asignados a mí
        </label>
      </div>

      <FilterResetButton
        onReset={handleLimpiar}
        activo={hayFiltrosActivos}
        title="Eliminar filtros de la bandeja"
      />

      {onDescargarCSV && (
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
            title="Descargar datos en formato CSV"
          >
            <Download size={14} /> Exportar CSV
          </button>
        </div>
      )}
    </div>
  );
};
