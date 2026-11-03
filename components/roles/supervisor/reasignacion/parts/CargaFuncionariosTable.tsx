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
  const MARGEN_CAPACIDAD_MAXIMA = 8; // Margen estándar de casos activos simultáneos

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
            <th>Casos en Margen</th>
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
              const porcentajeMargen = Math.min(100, Math.round((c.activos / MARGEN_CAPACIDAD_MAXIMA) * 100));
              const estadoMargen =
                c.activos === 0
                  ? { texto: 'Libre', badge: 'badge-success', colorBarra: 'var(--green-500)' }
                  : c.activos <= 3
                    ? { texto: 'Holgado', badge: 'badge-success', colorBarra: 'var(--green-500)' }
                    : c.activos <= 6
                      ? { texto: 'Moderado', badge: 'badge-warning', colorBarra: 'var(--amber-500)' }
                      : { texto: 'Al límite', badge: 'badge-danger', colorBarra: 'var(--red-500)' };

              return (
                <tr
                  key={c.id}
                  style={seleccionado ? { background: 'var(--sidebar-nav-active-bg)' } : undefined}
                  aria-selected={seleccionado}
                >
                  <td style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                    {c.nombre}
                    {!c.activo && (
                      <span style={{ marginLeft: '0.4rem', fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-muted)' }}>
                        (inactivo: reasigna sus reclamos)
                      </span>
                    )}
                  </td>
                  <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{c.area || '—'}</td>
                  <td style={celdaNumero}>{c.activos}</td>
                  <td style={{ ...celdaNumero, color: c.criticos > 0 ? 'var(--red-600)' : 'var(--text-muted)' }}>
                    {c.criticos}
                  </td>
                  <td style={celdaNumero}>{c.porAprobar}</td>
                  <td style={{ minWidth: '160px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.8rem', color: 'var(--text-main)' }}>
                          {c.activos} de {MARGEN_CAPACIDAD_MAXIMA} casos
                        </span>
                        <span className={`badge ${estadoMargen.badge}`} style={{ fontSize: '0.65rem', padding: '0.12rem 0.35rem' }}>
                          {estadoMargen.texto} ({porcentajeMargen}%)
                        </span>
                      </div>
                      <div
                        role="img"
                        aria-label={`${c.activos} de ${MARGEN_CAPACIDAD_MAXIMA} casos en su margen`}
                        style={{
                          height: '6px',
                          borderRadius: '9999px',
                          background: 'var(--bg-card-subtle)',
                          overflow: 'hidden',
                          width: '100%',
                        }}
                      >
                        <div
                          style={{
                            width: `${porcentajeMargen}%`,
                            height: '100%',
                            background: estadoMargen.colorBarra,
                            borderRadius: '9999px',
                            transition: 'width 0.3s ease',
                          }}
                        />
                      </div>
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
