import React from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { SearchInput } from '@/components/shared/ui/SearchInput';
import { FilterSelectWrapper, FilterResetButton, ESTILO_SELECT_FILTRO, ESTILO_LABEL_FILTRO } from '@/components/shared/ui/FilterControls';
import { ReporteExportMenu } from '@/components/shared/ui/ReporteExportMenu';
import { FiltroEstadoConstancia } from '../useConstancias';

interface ConstanciasFiltrosProps {
  busqueda: string;
  onBusquedaChange: (valor: string) => void;
  estado: FiltroEstadoConstancia;
  onEstadoChange: (estado: FiltroEstadoConstancia) => void;
  filtrosActivos: boolean;
  onLimpiar: () => void;
  enmascararPrivacidad: boolean;
  onTogglePrivacidad: () => void;
  onExportarCsv: () => void | Promise<void>;
  onExportarExcel: () => void | Promise<void>;
  onExportarPdf: () => void | Promise<void>;
  exportando: boolean;
  sinRegistros?: boolean;
}

export const ConstanciasFiltros: React.FC<ConstanciasFiltrosProps> = ({
  busqueda,
  onBusquedaChange,
  estado,
  onEstadoChange,
  filtrosActivos,
  onLimpiar,
  enmascararPrivacidad,
  onTogglePrivacidad,
  onExportarCsv,
  onExportarExcel,
  onExportarPdf,
  exportando,
  sinRegistros = false,
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
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <button
          type="button"
          onClick={onTogglePrivacidad}
          className={`btn ${enmascararPrivacidad ? 'btn-primary' : 'btn-secondary'}`}
          style={{ height: '38px', fontSize: '0.85rem', boxSizing: 'border-box' }}
          aria-label={
            enmascararPrivacidad
              ? 'Mostrar datos sensibles completos'
              : 'Enmascarar datos de personas según Ley 29733 de Protección de Datos Personales'
          }
          title={
            enmascararPrivacidad
              ? 'Mostrar datos sensibles completos'
              : 'Enmascarar datos de personas según Ley 29733 de Protección de Datos Personales'
          }
        >
          {enmascararPrivacidad ? <EyeOff size={15} /> : <Eye size={15} />}
        </button>

        <ReporteExportMenu
          onExportCsv={onExportarCsv}
          onExportExcel={onExportarExcel}
          onExportPdf={onExportarPdf}
          cargando={exportando}
          disabled={sinRegistros}
          title="Opciones de descarga de constancias (CSV, Excel, PDF)"
        />
      </div>
    </div>
  </div>
);
