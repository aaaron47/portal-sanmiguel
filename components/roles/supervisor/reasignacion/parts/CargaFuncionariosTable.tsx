import React from 'react';
import { CargaFuncionario } from '@/utils/ticket.utils';

interface CargaFuncionariosTableProps {
  carga: CargaFuncionario[];
  seleccionadoId: string | null;
  onSeleccionar: (id: string) => void;
}

const celdaNumero: React.CSSProperties = { textAlign: 'center', fontWeight: 600, color: 'var(--text-main)' };

export const CargaFuncionariosTable: React.FC<CargaFuncionariosTableProps> = ({
  carga,
  seleccionadoId,
  onSeleccionar,
}) => {
  const maximo = Math.max(1, ...carga.map((c) => c.activos));

  return (
    <div className="table-container">
      <table className="data-table">
        <thead>
          <tr>
            <th>Funcionario</th>
            <th>Área</th>
            <th style={{ textAlign: 'center' }}>Activos</th>
            <th style={{ textAlign: 'center' }}>Alta / Urgente</th>
            <th style={{ textAlign: 'center' }}>Por aprobar</th>
            <th>Carga</th>
            <th>Acción</th>
          </tr>
        </thead>
        <tbody>
          {carga.length === 0 ? (
            <tr>
              <td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                No hay funcionarios activos registrados.
              </td>
            </tr>
          ) : (
            carga.map((c) => {
              const seleccionado = c.id === seleccionadoId;
              return (
                <tr
                  key={c.id}
                  style={seleccionado ? { background: 'var(--sidebar-nav-active-bg)' } : undefined}
                  aria-selected={seleccionado}
                >
                  <td style={{ fontWeight: 600, color: 'var(--text-main)' }}>{c.nombre}</td>
                  <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{c.area || '—'}</td>
                  <td style={celdaNumero}>{c.activos}</td>
                  <td style={{ ...celdaNumero, color: c.criticos > 0 ? 'var(--red-600)' : 'var(--text-muted)' }}>
                    {c.criticos}
                  </td>
                  <td style={celdaNumero}>{c.porAprobar}</td>
                  <td style={{ minWidth: '120px' }}>
                    <div
                      role="img"
                      aria-label={`${c.activos} reclamos activos`}
                      style={{ height: '8px', borderRadius: '9999px', background: 'var(--bg-card-subtle)', overflow: 'hidden' }}
                    >
                      <div
                        style={{
                          width: `${(c.activos / maximo) * 100}%`,
                          height: '100%',
                          background: 'var(--primary-500)',
                        }}
                      />
                    </div>
                  </td>
                  <td>
                    <button
                      onClick={() => onSeleccionar(c.id)}
                      className={`btn ${seleccionado ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}
                      disabled={c.activos === 0}
                    >
                      {c.activos === 0 ? 'Sin reclamos' : seleccionado ? 'Viendo reclamos' : 'Ver reclamos'}
                    </button>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
};
