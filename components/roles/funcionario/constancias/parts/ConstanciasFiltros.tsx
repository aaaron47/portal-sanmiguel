import React from 'react';
import { Download } from 'lucide-react';
import { SearchInput } from '@/components/shared/ui/SearchInput';
import {
  FilterSelectWrapper,
  FilterResetButton,
  ESTILO_SELECT_FILTRO,
  ESTILO_LABEL_FILTRO,
} from '@/components/shared/ui/FilterControls';

export type DictamenFiltro = 'todos' | 'por_evaluar' | 'aprobada' | 'observada';

interface ConstanciasFiltrosProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  filtroDictamen: DictamenFiltro;
  onDictamenChange: (dictamen: DictamenFiltro) => void;
  onLimpiarFiltros?: () => void;
  onDescargarCSV: () => void;
}

export const ConstanciasFiltros: React.FC<ConstanciasFiltrosProps> = ({
  searchQuery,
  onSearchChange,
  filtroDictamen,
  onDictamenChange,
  onLimpiarFiltros,
  onDescargarCSV,
}) => {
  const hayFiltrosActivos = Boolean(searchQuery.trim() || filtroDictamen !== 'todos');

  const handleLimpiar = () => {
    if (onLimpiarFiltros) {
      onLimpiarFiltros();
    } else {
      onSearchChange('');
      onDictamenChange('todos');
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
          placeholder="Buscar por folio, ciudadano, DNI o asunto..."
        />
      </div>

      <FilterSelectWrapper label="Dictamen">
        <select
          aria-label="Filtrar por dictamen"
          value={filtroDictamen}
          onChange={(e) => onDictamenChange(e.target.value as DictamenFiltro)}
          style={ESTILO_SELECT_FILTRO}
        >
          <option value="todos">Todo</option>
          <option value="por_evaluar">Por evaluar</option>
          <option value="aprobada">Aprobada</option>
          <option value="observada">Observada</option>
        </select>
      </FilterSelectWrapper>

      <FilterResetButton
        onReset={handleLimpiar}
        activo={hayFiltrosActivos}
        title="Eliminar filtros de constancias"
      />

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
          title="Descargar constancias en formato CSV"
        >
          <Download size={14} /> Exportar CSV
        </button>
      </div>
    </div>
  );
};
