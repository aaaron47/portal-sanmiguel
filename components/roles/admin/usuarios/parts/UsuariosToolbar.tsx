import React from 'react';
import { UserPlus, Download } from 'lucide-react';
import { SearchInput } from '@/components/shared/ui/SearchInput';
import { UserRole, ROLE_LABELS } from '@/types/auth.types';

interface UsuariosToolbarProps {
  searchQuery: string;
  onSearch: (value: string) => void;
  filtroRol: string;
  onFiltroRolChange: (rol: string) => void;
  filtroArea: string;
  onFiltroAreaChange: (area: string) => void;
  filtroEstado: string;
  onFiltroEstadoChange: (estado: string) => void;
  selectedCount: number;
  isCreating: boolean;
  onActivar: () => void;
  onDesactivar: () => void;
  onToggleCrear: () => void;
  onDescargarCSV: () => void;
}

const AREAS = [
  'Fiscalización y Control',
  'Obras Públicas',
  'Limpieza Pública',
  'Parques y Jardines',
  'Tránsito y Transporte',
  'Seguridad Ciudadana',
  'Gerencia de Informática y TI',
  'Secretaría General',
  'Administración',
];

export const UsuariosToolbar: React.FC<UsuariosToolbarProps> = ({
  searchQuery,
  onSearch,
  filtroRol,
  onFiltroRolChange,
  filtroArea,
  onFiltroAreaChange,
  filtroEstado,
  onFiltroEstadoChange,
  selectedCount,
  isCreating,
  onActivar,
  onDesactivar,
  onToggleCrear,
  onDescargarCSV,
}) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.25rem' }}>
    {/* Fila superior: Buscador y Filtros por Rol, Área y Estado */}
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.65rem', alignItems: 'center' }}>
      <SearchInput
        value={searchQuery}
        onChange={onSearch}
        placeholder="Buscar por DNI, nombre o correo..."
        maxWidth="280px"
      />

      {/* Filtro por Rol */}
      <select
        value={filtroRol}
        onChange={(e) => onFiltroRolChange(e.target.value)}
        style={{
          padding: '0.45rem 0.65rem',
          borderRadius: '8px',
          border: '1px solid var(--border-color)',
          background: 'var(--bg-card)',
          color: 'var(--text-main)',
          fontSize: '0.825rem',
        }}
        aria-label="Filtrar por rol"
      >
        <option value="todos">Todos los Roles</option>
        {(Object.keys(ROLE_LABELS) as UserRole[]).map((r) => (
          <option key={r} value={r}>
            {ROLE_LABELS[r]}
          </option>
        ))}
      </select>

      {/* Filtro por Área */}
      <select
        value={filtroArea}
        onChange={(e) => onFiltroAreaChange(e.target.value)}
        style={{
          padding: '0.45rem 0.65rem',
          borderRadius: '8px',
          border: '1px solid var(--border-color)',
          background: 'var(--bg-card)',
          color: 'var(--text-main)',
          fontSize: '0.825rem',
        }}
        aria-label="Filtrar por área municipal"
      >
        <option value="todas">Todas las Áreas</option>
        {AREAS.map((a) => (
          <option key={a} value={a}>
            {a}
          </option>
        ))}
      </select>

      {/* Filtro por Estado */}
      <select
        value={filtroEstado}
        onChange={(e) => onFiltroEstadoChange(e.target.value)}
        style={{
          padding: '0.45rem 0.65rem',
          borderRadius: '8px',
          border: '1px solid var(--border-color)',
          background: 'var(--bg-card)',
          color: 'var(--text-main)',
          fontSize: '0.825rem',
        }}
        aria-label="Filtrar por estado"
      >
        <option value="todos">Todos los Estados</option>
        <option value="activo">Activos</option>
        <option value="inactivo">Inactivos</option>
      </select>

      {/* Botón Descargar CSV */}
      <button
        onClick={onDescargarCSV}
        className="btn btn-secondary"
        style={{ fontSize: '0.825rem', padding: '0.45rem 0.75rem', marginLeft: 'auto' }}
        title="Descargar listado de usuarios en formato CSV"
      >
        <Download size={15} /> Exportar CSV
      </button>
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
