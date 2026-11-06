import React from 'react';
import { Filter, Download } from 'lucide-react';
import { TicketFiltroEstado, TicketPrioridad } from '@/types/ticket.types';
import { FiltroConstancia } from '../../useFuncionarioTickets';
import { SearchInput } from '@/components/shared/ui/SearchInput';
import { ESTADOS } from '@/utils/ticket.utils';

interface ReclamosFiltrosProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  filtroEstado: TicketFiltroEstado | 'todos';
  onEstadoChange: (estado: TicketFiltroEstado | 'todos') => void;
  filtroPrioridad: TicketPrioridad | 'todos';
  onPrioridadChange: (prioridad: TicketPrioridad | 'todos') => void;
  filtroConstancia: FiltroConstancia;
  onConstanciaChange: (constancia: FiltroConstancia) => void;
  soloAsignadosAMi: boolean;
  onSoloAsignadosChange: (val: boolean) => void;
  onDescargarCSV?: () => void;
}

export const ReclamosFiltros: React.FC<ReclamosFiltrosProps> = ({
  searchQuery,
  onSearchChange,
  filtroEstado,
  onEstadoChange,
  filtroPrioridad,
  onPrioridadChange,
  filtroConstancia,
  onConstanciaChange,
  soloAsignadosAMi,
  onSoloAsignadosChange,
  onDescargarCSV,
}) => (
  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center', marginBottom: '1.25rem' }}>
    <SearchInput
      value={searchQuery}
      onChange={onSearchChange}
      placeholder="Buscar por folio, vecino, DNI o asunto..."
    />

    {/* Filtro Estado */}
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
      <Filter size={15} color="var(--text-muted)" />
      <select
        value={filtroEstado}
        onChange={(e) => onEstadoChange(e.target.value as TicketFiltroEstado | 'todos')}
        style={{
          padding: '0.45rem 0.6rem',
          borderRadius: '8px',
          border: '1px solid var(--border-color)',
          background: 'var(--bg-card)',
          color: 'var(--text-main)',
          fontSize: '0.825rem',
        }}
      >
        <option value="todos">Todos los Estados</option>
        {ESTADOS.map((e) => (
          <option key={e} value={e}>{e[0].toUpperCase() + e.slice(1)}</option>
        ))}
        <option value="por aprobar">Por aprobar (respuesta en revisión)</option>
      </select>
    </div>

    {/* Filtro Prioridad */}
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
      <select
        value={filtroPrioridad}
        onChange={(e) => onPrioridadChange(e.target.value as TicketPrioridad | 'todos')}
        style={{
          padding: '0.45rem 0.6rem',
          borderRadius: '8px',
          border: '1px solid var(--border-color)',
          background: 'var(--bg-card)',
          color: 'var(--text-main)',
          fontSize: '0.825rem',
        }}
      >
        <option value="todos">Todas las Prioridades</option>
        <option value="BAJA">Prioridad Baja</option>
        <option value="MEDIA">Prioridad Media</option>
        <option value="ALTA">Prioridad Alta</option>
      </select>
    </div>

    {/* Filtro Constancia */}
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
      <select
        value={filtroConstancia}
        onChange={(e) => onConstanciaChange(e.target.value as FiltroConstancia)}
        style={{
          padding: '0.45rem 0.6rem',
          borderRadius: '8px',
          border: '1px solid var(--border-color)',
          background: 'var(--bg-card)',
          color: 'var(--text-main)',
          fontSize: '0.825rem',
        }}
      >
        <option value="todos">Todas las Constancias</option>
        <option value="con_constancia">Con Constancia Requerida</option>
        <option value="sin_constancia">Sin Constancia</option>
        <option value="por_evaluar">Por Evaluar</option>
        <option value="aprobada">Constancia Aprobada</option>
        <option value="observada">Constancia Observada</option>
      </select>
    </div>

    {/* Asignados a mí */}
    <label
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.35rem',
        fontSize: '0.825rem',
        cursor: 'pointer',
        color: 'var(--text-main)',
      }}
    >
      <input
        type="checkbox"
        checked={soloAsignadosAMi}
        onChange={(e) => onSoloAsignadosChange(e.target.checked)}
      />
      Solo asignados a mi nombre
    </label>

    {/* Exportar CSV */}
    {onDescargarCSV && (
      <button
        onClick={onDescargarCSV}
        className="btn btn-secondary"
        style={{
          padding: '0.45rem 0.75rem',
          fontSize: '0.8rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem',
          marginLeft: 'auto',
        }}
        title="Descargar datos en formato CSV"
      >
        <Download size={14} /> Exportar CSV
      </button>
    )}
  </div>
);

