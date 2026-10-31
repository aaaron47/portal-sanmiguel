import React from 'react';
import { Usuario, ROLE_LABELS } from '@/types/auth.types';

interface UsuariosTableProps {
  usuarios: Usuario[];
  selectedIds: string[];
  todosSeleccionados: boolean;
  onToggle: (id: string) => void;
  onToggleTodos: () => void;
}

export const UsuariosTable: React.FC<UsuariosTableProps> = ({
  usuarios,
  selectedIds,
  todosSeleccionados,
  onToggle,
  onToggleTodos,
}) => (
  <div className="table-container">
    <table className="data-table">
      <thead>
        <tr>
          <th style={{ width: '40px' }}>
            <input
              type="checkbox"
              checked={todosSeleccionados}
              onChange={onToggleTodos}
              aria-label="Seleccionar todos los usuarios"
            />
          </th>
          <th>DNI</th>
          <th>Nombre</th>
          <th>Rol</th>
          <th>Área</th>
          <th>Estado</th>
        </tr>
      </thead>
      <tbody>
        {usuarios.map((u) => (
          <tr
            key={u.id}
            onClick={() => onToggle(u.id)}
            style={{ cursor: 'pointer', background: selectedIds.includes(u.id) ? 'var(--sky-50)' : undefined }}
          >
            <td onClick={(e) => e.stopPropagation()}>
              <input
                type="checkbox"
                checked={selectedIds.includes(u.id)}
                onChange={() => onToggle(u.id)}
                aria-label={`Seleccionar a ${u.nombreCompleto}`}
              />
            </td>
            <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{u.dni}</td>
            <td>
              <div style={{ fontWeight: 600 }}>{u.nombreCompleto}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)' }}>{u.email}</div>
            </td>
            <td>{ROLE_LABELS[u.rol]}</td>
            <td>{u.area || 'General'}</td>
            <td>{u.activo ? 'Activo' : 'Inactivo'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);
