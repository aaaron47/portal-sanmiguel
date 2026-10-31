import React from 'react';
import { Filter, Download } from 'lucide-react';
import { SearchInput } from '@/components/shared/ui/SearchInput';

export type DictamenFiltro = 'todos' | 'por_evaluar' | 'aprobada' | 'observada';

interface ConstanciasFiltrosProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  filtroDictamen: DictamenFiltro;
  onDictamenChange: (dictamen: DictamenFiltro) => void;
  onDescargarCSV: () => void;
}

export const ConstanciasFiltros: React.FC<ConstanciasFiltrosProps> = ({
  searchQuery,
  onSearchChange,
  filtroDictamen,
  onDictamenChange,
  onDescargarCSV,
}) => (
  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center', marginBottom: '1.25rem' }}>
    <SearchInput
      value={searchQuery}
      onChange={onSearchChange}
      placeholder="Buscar por folio, ciudadano, DNI o asunto..."
    />

    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
      <Filter size={15} color="var(--text-muted)" />
      <select
        value={filtroDictamen}
        onChange={(e) => onDictamenChange(e.target.value as DictamenFiltro)}
        style={{
          padding: '0.45rem 0.6rem',
          borderRadius: '8px',
          border: '1px solid var(--border-color)',
          background: 'var(--bg-card)',
          color: 'var(--text-main)',
          fontSize: '0.825rem',
        }}
      >
        <option value="todos">Todos los Dictámenes</option>
        <option value="por_evaluar">Por Evaluar (Pendientes)</option>
        <option value="aprobada">Constancias Aprobadas</option>
        <option value="observada">Constancias Observadas</option>
      </select>
    </div>

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
      title="Descargar constancias en formato CSV"
    >
      <Download size={14} /> Exportar CSV
    </button>
  </div>
);
