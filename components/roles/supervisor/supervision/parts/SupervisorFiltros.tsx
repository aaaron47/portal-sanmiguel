import React from 'react';
import { SearchInput } from '@/components/shared/ui/SearchInput';
import { TicketEstado, TicketPrioridad } from '@/types/ticket.types';
import { ESTADOS_ACTIVOS } from '@/utils/ticket.utils';

interface SupervisorFiltrosProps {
  searchQuery: string;
  onSearchChange: (val: string) => void;
  areas: string[];
  filtroArea: string;
  onAreaChange: (val: string) => void;
  /** En la pestaña "Por aprobar" el estado ya está fijo y no se muestra. */
  mostrarEstado?: boolean;
  filtroEstado: TicketEstado | 'todos';
  onEstadoChange: (val: TicketEstado | 'todos') => void;
  filtroPrioridad: TicketPrioridad | 'todos';
  onPrioridadChange: (val: TicketPrioridad | 'todos') => void;
}

const ESTADOS: TicketEstado[] = [...ESTADOS_ACTIVOS, 'resuelto', 'archivado'];
const PRIORIDADES: TicketPrioridad[] = ['ALTA', 'MEDIA', 'BAJA'];

const estiloSelect: React.CSSProperties = {
  padding: '0.5rem',
  borderRadius: '8px',
  border: '1px solid var(--border-color)',
  background: 'var(--bg-card)',
  color: 'var(--text-main)',
  fontSize: '0.85rem',
};

export const SupervisorFiltros: React.FC<SupervisorFiltrosProps> = ({
  searchQuery,
  onSearchChange,
  areas,
  filtroArea,
  onAreaChange,
  mostrarEstado = true,
  filtroEstado,
  onEstadoChange,
  filtroPrioridad,
  onPrioridadChange,
}) => (
  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center', marginBottom: '1.25rem' }}>
    <SearchInput
      value={searchQuery}
      onChange={onSearchChange}
      placeholder="Buscar por folio, vecino, área o asunto..."
    />

    <select aria-label="Filtrar por área" value={filtroArea} onChange={(e) => onAreaChange(e.target.value)} style={estiloSelect}>
      <option value="todas">Todas las áreas</option>
      {areas.map((a) => (
        <option key={a} value={a}>{a}</option>
      ))}
    </select>

    {mostrarEstado && (
      <select
        aria-label="Filtrar por estado"
        value={filtroEstado}
        onChange={(e) => onEstadoChange(e.target.value as TicketEstado | 'todos')}
        style={{ ...estiloSelect, textTransform: 'capitalize' }}
      >
        <option value="todos">Todos los estados</option>
        {ESTADOS.map((e) => (
          <option key={e} value={e}>{e}</option>
        ))}
      </select>
    )}

    <select
      aria-label="Filtrar por prioridad"
      value={filtroPrioridad}
      onChange={(e) => onPrioridadChange(e.target.value as TicketPrioridad | 'todos')}
      style={estiloSelect}
    >
      <option value="todos">Todas las prioridades</option>
      {PRIORIDADES.map((p) => (
        <option key={p} value={p}>{p}</option>
      ))}
    </select>
  </div>
);
