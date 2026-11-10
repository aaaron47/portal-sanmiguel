import React from 'react';
import { UserPlus, Download } from 'lucide-react';
import { SearchInput } from '@/components/shared/ui/SearchInput';
import {
  FilterSelectWrapper,
  FilterResetButton,
  ESTILO_SELECT_FILTRO,
  ESTILO_LABEL_FILTRO,
} from '@/components/shared/ui/FilterControls';
import { UserRole, ROLE_LABELS } from '@/types/auth.types';
import { useAreas } from '@/components/shared/hooks/useAreas';

interface UsuariosToolbarProps {
  searchQuery: string;
  onSearch: (value: string) => void;
  filtroRol: string;
  onFiltroRolChange: (rol: string) => void;
  filtroArea: string;
  onFiltroAreaChange: (area: string) => void;
  filtroEstado: string;
  onFiltroEstadoChange: (estado: string) => void;
  onLimpiarFiltros?: () => void;
  selectedCount: number;
  isCreating: boolean;
  onActivar: () => void;
  onDesactivar: () => void;
  onToggleCrear: () => void;
  onDescargarCSV: () => void;
}

export const UsuariosToolbar: React.FC<UsuariosToolbarProps> = ({
  searchQuery,
  onSearch,
  filtroRol,
  onFiltroRolChange,
  filtroArea,
  onFiltroAreaChange,
  filtroEstado,
  onFiltroEstadoChange,
  onLimpiarFiltros,
  selectedCount,
  isCreating,
  onActivar,
  onDesactivar,
  onToggleCrear,
  onDescargarCSV,
}) => {
  const { areas } = useAreas();
  const hayFiltrosActivos = Boolean(
    searchQuery.trim() || filtroRol !== 'todos' || filtroArea !== 'todas' || filtroEstado !== 'todos'
  );

  const handleLimpiar = () => {
    if (onLimpiarFiltros) {
      onLimpiarFiltros();
    } else {
      onSearch('');
      onFiltroRolChange('todos');
      onFiltroAreaChange('todas');
      onFiltroEstadoChange('todos');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.25rem' }}>
      {/* Fila superior: Buscador y Filtros por Rol, Área y Estado */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'flex-end' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', flex: 1, minWidth: '240px', maxWidth: '320px' }}>
          <label style={ESTILO_LABEL_FILTRO}>Búsqueda</label>
          <SearchInput
            value={searchQuery}
            onChange={onSearch}
            placeholder="Buscar por DNI, nombre o correo..."
          />
        </div>

        {/* Filtro por Rol */}
        <FilterSelectWrapper label="Rol">
          <select
            value={filtroRol}
            onChange={(e) => onFiltroRolChange(e.target.value)}
            style={ESTILO_SELECT_FILTRO}
            aria-label="Filtrar por rol"
          >
            <option value="todos">Todo</option>
            {(Object.keys(ROLE_LABELS) as UserRole[]).map((r) => (
              <option key={r} value={r}>
                {ROLE_LABELS[r]}
              </option>
            ))}
          </select>
        </FilterSelectWrapper>

        {/* Filtro por Área */}
        <FilterSelectWrapper label="Área">
          <select
            value={filtroArea}
            onChange={(e) => onFiltroAreaChange(e.target.value)}
            style={ESTILO_SELECT_FILTRO}
            aria-label="Filtrar por área municipal"
          >
            <option value="todas">Todo</option>
            {areas.map((a) => (
              <option key={a.id} value={a.nombre}>
                {a.nombre}
              </option>
            ))}
          </select>
        </FilterSelectWrapper>

        {/* Filtro por Estado */}
        <FilterSelectWrapper label="Estado">
          <select
            value={filtroEstado}
            onChange={(e) => onFiltroEstadoChange(e.target.value)}
            style={ESTILO_SELECT_FILTRO}
            aria-label="Filtrar por estado"
          >
            <option value="todos">Todo</option>
            <option value="activo">Activos</option>
            <option value="inactivo">Inactivos</option>
          </select>
        </FilterSelectWrapper>

        {/* Botón Eliminar Filtros */}
        <FilterResetButton
          onReset={handleLimpiar}
          activo={hayFiltrosActivos}
          title="Eliminar filtros de usuarios"
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
            title="Descargar listado de usuarios en formato CSV"
          >
            <Download size={14} /> Exportar CSV
          </button>
        </div>
      </div>

      {/* Fila inferior: Acciones sobre la selección (estilo AWS) + Crear Usuario */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            {selectedCount} seleccionado(s)
          </span>
          <button
            onClick={onActivar}
            disabled={selectedCount === 0}
            className="btn btn-secondary"
            style={{ fontSize: '0.8rem', opacity: selectedCount === 0 ? 0.5 : 1 }}
          >
            Activar
          </button>
          <button
            onClick={onDesactivar}
            disabled={selectedCount === 0}
            className="btn btn-secondary"
            style={{ fontSize: '0.8rem', opacity: selectedCount === 0 ? 0.5 : 1 }}
          >
            Desactivar
          </button>
        </div>

        <button onClick={onToggleCrear} className="btn btn-primary" style={{ fontSize: '0.825rem' }}>
          <UserPlus size={15} /> {isCreating ? 'Cancelar' : 'Crear usuario'}
        </button>
      </div>
    </div>
  );
};
