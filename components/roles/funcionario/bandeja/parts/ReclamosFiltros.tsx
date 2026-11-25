import React from 'react';
import { TicketFiltroEstado, TicketPrioridad } from '@/types/ticket.types';
import { SearchInput } from '@/components/shared/ui/SearchInput';
import {
  FilterSelectWrapper,
  FilterResetButton,
  ESTILO_SELECT_FILTRO,
  ESTILO_LABEL_FILTRO,
} from '@/components/shared/ui/FilterControls';
import { ReporteExportMenu } from '@/components/shared/ui/ReporteExportMenu';
import { ESTADOS } from '@/utils/ticket.utils';

interface ReclamosFiltrosProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  filtroEstado: TicketFiltroEstado | 'todos';
  onEstadoChange: (estado: TicketFiltroEstado | 'todos') => void;
  filtroPrioridad: TicketPrioridad | 'todos';
  onPrioridadChange: (prioridad: TicketPrioridad | 'todos') => void;
  onLimpiarFiltros?: () => void;
  onDescargarCSV?: () => void;
  onDescargarExcel?: () => void;
  onDescargarPDF?: () => Promise<void>;
  sinRegistros?: boolean;
}

export const ReclamosFiltros: React.FC<ReclamosFiltrosProps> = ({
  searchQuery,
  onSearchChange,
  filtroEstado,
  onEstadoChange,
  filtroPrioridad,
  onPrioridadChange,
  onLimpiarFiltros,
  onDescargarCSV,
  onDescargarExcel,
  onDescargarPDF,
  sinRegistros = false,
}) => {
  const hayFiltrosActivos = Boolean(
    searchQuery.trim() ||
      filtroEstado !== 'todos' ||
      filtroPrioridad !== 'todos'
  );

  const handleLimpiar = () => {
    if (onLimpiarFiltros) {
      onLimpiarFiltros();
    } else {
      onSearchChange('');
      onEstadoChange('todos');
      onPrioridadChange('todos');
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

      <FilterResetButton
        onReset={handleLimpiar}
        activo={hayFiltrosActivos}
        title="Eliminar filtros de la bandeja"
      />

      {onDescargarCSV && onDescargarExcel && onDescargarPDF && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', justifyContent: 'flex-end', marginLeft: 'auto' }}>
          <span style={{ ...ESTILO_LABEL_FILTRO, visibility: 'hidden' }}>&nbsp;</span>
          <ReporteExportMenu
            onExportCsv={onDescargarCSV}
            onExportExcel={onDescargarExcel}
            onExportPdf={onDescargarPDF}
            disabled={sinRegistros}
            title="Opciones de descarga de la bandeja (CSV, Excel, PDF)"
          />
        </div>
      )}
    </div>
  );
};
