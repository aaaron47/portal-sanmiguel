import React from 'react';
import { ReportePorArea } from '@/controllers/reportes.controller';

export const CumplimientoAreasTable: React.FC<{ areas: ReportePorArea[] }> = ({ areas }) => (
  <div className="table-container">
    <table className="data-table">
      <thead>
        <tr>
          <th>Gerencia / Área</th>
          <th>Total Recibidos</th>
          <th>Resueltos</th>
          <th>En Trámite</th>
          <th>Efectividad</th>
          <th>Nivel</th>
        </tr>
      </thead>
      <tbody>
        {areas.map((area, idx) => (
          <tr key={idx}>
            <td style={{ fontWeight: 600 }}>{area.area}</td>
            <td>{area.totalReclamos}</td>
            <td style={{ color: 'var(--green-600)', fontWeight: 600 }}>{area.resueltos}</td>
            <td style={{ color: 'var(--orange-600)' }}>{area.enProceso}</td>
            <td>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ flex: 1, height: '8px', background: 'var(--slate-200)', borderRadius: '4px', overflow: 'hidden', minWidth: '80px' }}>
                  <div
                    style={{
                      width: `${area.porcentajeCumplimiento}%`,
                      height: '100%',
                      background: area.porcentajeCumplimiento > 90 ? 'var(--green-600)' : 'var(--sky-600)',
                    }}
                  />
                </div>
                <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>{area.porcentajeCumplimiento}%</span>
              </div>
            </td>
            <td>
              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  color: area.porcentajeCumplimiento >= 90 ? 'var(--green-600)' : 'var(--amber-600)',
                }}
              >
                {area.porcentajeCumplimiento >= 90 ? 'Excelente' : 'Aceptable'}
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);
