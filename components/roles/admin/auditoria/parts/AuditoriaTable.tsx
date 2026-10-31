import React from 'react';
import { AuditoriaLog } from '@/types/auditoria.types';

export const AuditoriaTable: React.FC<{ logs: AuditoriaLog[] }> = ({ logs }) => (
  <div className="table-container">
    <table className="data-table">
      <thead>
        <tr>
          <th>Fecha / Hora</th>
          <th>Responsable</th>
          <th>Acción</th>
          <th>Entidad Afectada</th>
          <th>IP / Navegador</th>
          <th>Detalles</th>
        </tr>
      </thead>
      <tbody>
        {logs.map((log) => (
          <tr key={log.id}>
            <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--slate-500)', whiteSpace: 'nowrap' }}>{log.fecha}</td>
            <td>
              <div style={{ fontWeight: 600 }}>{log.adminNombre}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)' }}>{log.adminEmail}</div>
            </td>
            <td style={{ fontWeight: 500 }}>{log.accion}</td>
            <td style={{ fontWeight: 500 }}>{log.entidadAfectada}</td>
            <td style={{ fontSize: '0.75rem', color: 'var(--slate-500)' }}>{log.ipOrigen}</td>
            <td style={{ fontSize: '0.825rem', color: 'var(--slate-700)' }}>{log.detalles}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);
