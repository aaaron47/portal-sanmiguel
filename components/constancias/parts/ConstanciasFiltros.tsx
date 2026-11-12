import React from 'react';
import { Download } from 'lucide-react';
import { SearchInput } from '@/components/shared/ui/SearchInput';
import { FilterSelectWrapper, FilterResetButton, ESTILO_SELECT_FILTRO, ESTILO_LABEL_FILTRO } from '@/components/shared/ui/FilterControls';
import { FiltroEstadoConstancia } from '../useConstancias';

interface ConstanciasFiltrosProps {
  busqueda: string;
  onBusquedaChange: (valor: string) => void;
  estado: FiltroEstadoConstancia;
  onEstadoChange: (estado: FiltroEstadoConstancia) => void;
  filtrosActivos: boolean;
  onLimpiar: () => void;
  onExportar: () => void;
  exportando: boolean;
}

export const ConstanciasFiltros: React.FC<ConstanciasFiltrosProps> = ({
  busqueda,
  onBusquedaChange,
  estado,
  onEstadoChange,
  filtrosActivos,
  onLimpiar,
  onExportar,
  exportando,
}) => (
  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'flex-end', marginBottom: '1.25rem' }}>
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', flex: 1, minWidth: '240px' }}>
      <label style={ESTILO_LABEL_FILTRO}>Búsqueda</label>
      <SearchInput value={busqueda} onChange={onBusquedaChange} placeholder="Buscar por número, contribuyente o predio..." />
    </div>

    <FilterSelectWrapper label="Estado">
      <select
        aria-label="Filtrar por estado"
        value={estado}
        onChange={(e) => onEstadoChange(e.target.value as FiltroEstadoConstancia)}
        style={ESTILO_SELECT_FILTRO}
      >
        <option value="">Todos</option>
        <option value="EN_VERIFICACION">Por evaluar (en verificación)</option>
        <option value="PENDIENTE_PAGO">Pendiente de pago</option>
        <option value="EMITIDA">Aprobada (emitida)</option>
        <option value="RECHAZADA">Desaprobada</option>
      </select>
    </FilterSelectWrapper>

    <FilterResetButton onReset={onLimpiar} activo={filtrosActivos} title="Quitar los filtros" />

    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', justifyContent: 'flex-end', marginLeft: 'auto' }}>
      <span style={{ ...ESTILO_LABEL_FILTRO, visibility: 'hidden' }}>&nbsp;</span>
      <button
        type="button"
        onClick={onExportar}
        disabled={exportando}
        className="btn btn-secondary"
        style={{ height: '38px', padding: '0 0.85rem', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', boxSizing: 'border-box' }}
        title="Descargar en CSV las solicitudes que cumplen los filtros"
      >
        <Download size={14} /> {exportando ? 'Exportando...' : 'Exportar CSV'}
      </button>
    </div>
  </div>
);
