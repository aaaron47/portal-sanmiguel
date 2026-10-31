import React from 'react';
import { PermisoRol } from '../useControlAcceso';

interface MatrizPermisosTableProps {
  permisos: PermisoRol[];
}

export const MatrizPermisosTable: React.FC<MatrizPermisosTableProps> = ({ permisos }) => (
  <div className="table-container">
    <table className="data-table">
      <thead>
        <tr>
          <th>Rol Municipal</th>
          <th>Nivel de Acceso</th>
          <th>Alcance Institucional</th>
          <th>Operaciones Permitidas</th>
        </tr>
      </thead>
      <tbody>
        {permisos.map((p) => (
          <tr key={p.rol}>
            <td style={{ fontWeight: 600, color: 'var(--text-main)', whiteSpace: 'nowrap' }}>
              {p.nombreRol}
            </td>
            <td>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--sky-600)' }}>
                {p.nivelAcceso}
              </span>
            </td>
            <td style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>
              {p.alcance}
            </td>
            <td style={{ fontSize: '0.825rem', color: 'var(--text-main)' }}>
              {p.operacionesPermitidas}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);
