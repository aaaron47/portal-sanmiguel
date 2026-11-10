import React from 'react';
import { SearchInput } from '@/components/shared/ui/SearchInput';
import {
  FilterSelectWrapper,
  FilterResetButton,
  ESTILO_SELECT_FILTRO,
  ESTILO_LABEL_FILTRO,
} from '@/components/shared/ui/FilterControls';
import { TicketFiltroEstado, TicketPrioridad } from '@/types/ticket.types';
import { ESTADOS, FuncionarioOpcion } from '@/utils/ticket.utils';

interface SupervisorFiltrosProps {
  searchQuery: string;
  onSearchChange: (val: string) => void;
  areas: string[];
  filtroArea: string;
  onAreaChange: (val: string) => void;
  funcionarios: FuncionarioOpcion[];
  filtroFuncionario: string;
  onFuncionarioChange: (val: string) => void;
  /** En la pestaña "Por aprobar" el estado ya está fijo y no se muestra. */
  mostrarEstado?: boolean;
  filtroEstado: TicketFiltroEstado | 'todos';
  onEstadoChange: (val: TicketFiltroEstado | 'todos') => void;
  filtroPrioridad: TicketPrioridad | 'todos';
  onPrioridadChange: (val: TicketPrioridad | 'todos') => void;
  onLimpiarFiltros?: () => void;
}

const PRIORIDADES: TicketPrioridad[] = ['ALTA', 'MEDIA', 'BAJA'];

export const SupervisorFiltros: React.FC<SupervisorFiltrosProps> = ({
  searchQuery,
  onSearchChange,
  areas,
  filtroArea,
  onAreaChange,
  funcionarios,
  filtroFuncionario,
  onFuncionarioChange,
  mostrarEstado = true,
  filtroEstado,
  onEstadoChange,
  filtroPrioridad,
  onPrioridadChange,
  onLimpiarFiltros,
}) => {
  const hayFiltrosActivos = Boolean(
    searchQuery.trim() ||
      filtroArea !== 'todas' ||
      filtroFuncionario !== 'todos' ||
      (mostrarEstado && filtroEstado !== 'todos') ||
      filtroPrioridad !== 'todos'
  );

  const handleLimpiar = () => {
    if (onLimpiarFiltros) {
      onLimpiarFiltros();
    } else {
      onSearchChange('');
      onAreaChange('todas');
      onFuncionarioChange('todos');
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
          placeholder="Buscar por folio, vecino, área o asunto..."
        />
      </div>

      <FilterSelectWrapper label="Área">
        <select
          aria-label="Filtrar por área"
          value={filtroArea}
          onChange={(e) => onAreaChange(e.target.value)}
          style={ESTILO_SELECT_FILTRO}
        >
          <option value="todas">Todo</option>
          {areas.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
      </FilterSelectWrapper>

      <FilterSelectWrapper label="Asignado">
        <select
          aria-label="Filtrar por funcionario asignado"
          value={filtroFuncionario}
          onChange={(e) => onFuncionarioChange(e.target.value)}
          style={ESTILO_SELECT_FILTRO}
        >
          <option value="todos">Todo</option>
          <option value="sin_asignar">Sin asignar</option>
          {funcionarios.map((f) => (
            <option key={f.id} value={f.id}>
              {f.nombre} {!f.activo ? '(inactivo)' : ''}
            </option>
          ))}
        </select>
      </FilterSelectWrapper>

      {mostrarEstado && (
        <FilterSelectWrapper label="Estado">
          <select
            aria-label="Filtrar por estado"
            value={filtroEstado}
            onChange={(e) => onEstadoChange(e.target.value as TicketFiltroEstado | 'todos')}
            style={{ ...ESTILO_SELECT_FILTRO, textTransform: 'capitalize' }}
          >
            <option value="todos">Todo</option>
            {ESTADOS.map((e) => (
              <option key={e} value={e}>
                {e}
              </option>
            ))}
            <option value="por aprobar">Por aprobar</option>
          </select>
        </FilterSelectWrapper>
      )}

      <FilterSelectWrapper label="Prioridad">
        <select
          aria-label="Filtrar por prioridad"
          value={filtroPrioridad}
          onChange={(e) => onPrioridadChange(e.target.value as TicketPrioridad | 'todos')}
          style={ESTILO_SELECT_FILTRO}
        >
          <option value="todos">Todo</option>
          {PRIORIDADES.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </FilterSelectWrapper>

      <FilterResetButton
        onReset={handleLimpiar}
        activo={hayFiltrosActivos}
        title="Eliminar filtros de reclamos"
      />
    </div>
  );
};
