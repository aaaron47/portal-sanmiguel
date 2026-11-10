import React from 'react';
import { FilterX } from 'lucide-react';

export const ESTILO_SELECT_FILTRO: React.CSSProperties = {
  width: '150px',
  height: '38px',
  padding: '0.45rem 0.55rem',
  borderRadius: '8px',
  border: '1px solid var(--border-color)',
  background: 'var(--bg-card)',
  color: 'var(--text-main)',
  fontSize: '0.825rem',
  boxSizing: 'border-box',
};

export const ESTILO_LABEL_FILTRO: React.CSSProperties = {
  fontSize: '0.7rem',
  fontWeight: 600,
  color: 'var(--text-muted)',
  textTransform: 'uppercase',
  letterSpacing: '0.02em',
  lineHeight: '1.2',
};

interface FilterSelectWrapperProps {
  label: string;
  children: React.ReactNode;
  width?: string;
}

/**
 * Contenedor estándar para filtros de tabla:
 * Muestra el nombre del campo arriba en tamaño pequeño para no perder contexto
 * y mantiene un ancho fijo uniforme.
 */
export const FilterSelectWrapper: React.FC<FilterSelectWrapperProps> = ({
  label,
  children,
  width,
}) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', width }}>
    <label style={ESTILO_LABEL_FILTRO}>{label}</label>
    {children}
  </div>
);

interface FilterResetButtonProps {
  onReset: () => void;
  activo?: boolean;
  title?: string;
}

/**
 * Botón tipo icono estándar para eliminar/limpiar filtros aplicados a la tabla.
 */
export const FilterResetButton: React.FC<FilterResetButtonProps> = ({
  onReset,
  activo = true,
  title = 'Eliminar filtros',
}) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', justifyContent: 'flex-end' }}>
    <span style={{ ...ESTILO_LABEL_FILTRO, visibility: 'hidden' }}>&nbsp;</span>
    <button
      type="button"
      onClick={onReset}
      disabled={!activo}
      className="btn btn-secondary"
      style={{
        width: '38px',
        height: '38px',
        minWidth: '38px',
        padding: 0,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '8px',
        opacity: activo ? 1 : 0.45,
        cursor: activo ? 'pointer' : 'default',
        boxSizing: 'border-box',
      }}
      title={title}
      aria-label={title}
    >
      <FilterX size={16} />
    </button>
  </div>
);

