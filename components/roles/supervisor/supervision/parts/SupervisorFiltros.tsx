import React from 'react';
import { SearchInput } from '@/components/shared/ui/SearchInput';

interface SupervisorFiltrosProps {
  searchQuery: string;
  onSearchChange: (val: string) => void;
  filtroArea: string;
  onAreaChange: (val: string) => void;
}

export const SupervisorFiltros: React.FC<SupervisorFiltrosProps> = ({
  searchQuery,
  onSearchChange,
  filtroArea,
  onAreaChange,
}) => (
  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center', marginBottom: '1.25rem' }}>
    <SearchInput
      value={searchQuery}
      onChange={onSearchChange}
      placeholder="Buscar por folio, vecino, área o asunto..."
    />

    <select
      value={filtroArea}
      onChange={(e) => onAreaChange(e.target.value)}
      style={{ padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '0.85rem' }}
    >
      <option value="todas">Todas las Áreas</option>
      <option value="Fiscalización y Control">Fiscalización y Control</option>
      <option value="Obras Públicas">Obras Públicas</option>
      <option value="Limpieza Pública">Limpieza Pública</option>
      <option value="Parques y Jardines">Parques y Jardines</option>
    </select>
  </div>
);
