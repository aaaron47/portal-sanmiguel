import React from 'react';
import { ArrowDown, ArrowUp } from 'lucide-react';
import { CargaFuncionario } from '@/utils/ticket.utils';

export type CriterioOrdenCarga = 'activos' | 'alta' | 'media' | 'baja' | 'porAprobar' | 'nombre';

interface CargaFuncionariosTableProps {
  carga: CargaFuncionario[];
  campoOrden: CriterioOrdenCarga;
  direccionOrden: 'asc' | 'desc';
  onAlternarOrden: (campo: CriterioOrdenCarga) => void;
  seleccionadoId: string | null;
  onSeleccionar: (id: string) => void;
}

const celdaNumero: React.CSSProperties = {
  textAlign: 'center',
  fontWeight: 600,
  color: 'var(--text-main)',
};

const btnCabecera: React.CSSProperties = {
  background: 'transparent',
  border: 'none',
  color: 'inherit',
  font: 'inherit',
  fontWeight: 700,
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.3rem',
  padding: 0,
};

export const CargaFuncionariosTable: React.FC<CargaFuncionariosTableProps> = ({
  carga,
  campoOrden,
  direccionOrden,
  onAlternarOrden,
  seleccionadoId,
  onSeleccionar,
}) => {
  const iconoOrden = (campo: CriterioOrdenCarga) => {
    if (campoOrden !== campo) return null;
    return direccionOrden === 'desc' ? (
      <ArrowDown size={14} color="var(--sky-600)" />
    ) : (
      <ArrowUp size={14} color="var(--sky-600)" />
    );
  };

  return (
    <div className="table-container">
      <table className="data-table">
        <thead>
          <tr>
            <th>
              <button
                type="button"
                onClick={() => onAlternarOrden('nombre')}
                style={btnCabecera}
                title="Ordenar por nombre de funcionario"
              >
                Funcionario
                {iconoOrden('nombre')}
              </button>
            </th>
            <th>Área</th>
            <th style={{ textAlign: 'center' }}>
              <button
                type="button"
                onClick={() => onAlternarOrden('alta')}
                style={btnCabecera}
                title="Ordenar por prioridad Alta"
              >
                Alta
                {iconoOrden('alta')}
              </button>
            </th>
            <th style={{ textAlign: 'center' }}>
              <button
                type="button"
                onClick={() => onAlternarOrden('media')}
                style={btnCabecera}
                title="Ordenar por prioridad Media"
              >
                Media
                {iconoOrden('media')}
              </button>
            </th>
            <th style={{ textAlign: 'center' }}>
              <button
                type="button"
                onClick={() => onAlternarOrden('baja')}
                style={btnCabecera}
                title="Ordenar por prioridad Baja"
              >
                Baja
                {iconoOrden('baja')}
              </button>
            </th>
            <th style={{ textAlign: 'center' }}>
              <button
                type="button"
                onClick={() => onAlternarOrden('porAprobar')}
                style={btnCabecera}
                title="Ordenar por respuestas pendientes de aprobación"
              >
                Por aprobar
                {iconoOrden('porAprobar')}
              </button>
            </th>
            <th style={{ textAlign: 'center' }}>
              <button
                type="button"
                onClick={() => onAlternarOrden('activos')}
                style={btnCabecera}
                title="Ordenar por total de casos activos"
              >
                Casos activos
                {iconoOrden('activos')}
              </button>
            </th>
            <th style={{ textAlign: 'center' }}>Acción</th>
          </tr>
        </thead>
        <tbody>
          {carga.length === 0 ? (
            <tr>
              <td colSpan={8} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                No hay funcionarios registrados para el filtro seleccionado.
              </td>
            </tr>
          ) : (
            carga.map((c) => {
              const seleccionado = c.id === seleccionadoId;
              const estaLibre = c.activos === 0;

              return (
                <tr
                  key={c.id}
                  style={seleccionado ? { background: 'var(--sidebar-nav-active-bg)' } : undefined}
                  aria-selected={seleccionado}
                >
                  <td style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                    {c.nombre}
                    {!c.activo && (
                      <span
                        style={{
                          marginLeft: '0.4rem',
                          fontSize: '0.75rem',
                          fontWeight: 500,
                          color: 'var(--text-muted)',
                        }}
                      >
                        (inactivo)
                      </span>
                    )}
                  </td>
                  <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{c.area || '—'}</td>
                  
                  {/* Prioridad Alta: solo número */}
                  <td style={celdaNumero}>
                    <span style={{ color: c.alta > 0 ? 'var(--red-600)' : 'var(--text-muted)', fontWeight: c.alta > 0 ? 700 : 500 }}>
                      {c.alta}
                    </span>
                  </td>

                  {/* Prioridad Media: solo número */}
                  <td style={celdaNumero}>
                    <span style={{ color: c.media > 0 ? 'var(--amber-700)' : 'var(--text-muted)', fontWeight: c.media > 0 ? 700 : 500 }}>
                      {c.media}
                    </span>
                  </td>

                  {/* Prioridad Baja: solo número */}
                  <td style={celdaNumero}>
                    <span style={{ color: c.baja > 0 ? 'var(--text-main)' : 'var(--text-muted)' }}>
                      {c.baja}
                    </span>
                  </td>

                  {/* Por aprobar: solo número */}
                  <td style={celdaNumero}>
                    <span style={{ color: c.porAprobar > 0 ? 'var(--sky-700)' : 'var(--text-muted)', fontWeight: c.porAprobar > 0 ? 700 : 500 }}>
                      {c.porAprobar}
                    </span>
                  </td>

                  {/* Casos activos */}
                  <td style={celdaNumero}>
                    {estaLibre ? (
                      <span className="badge badge-success" style={{ fontSize: '0.75rem', padding: '0.15rem 0.45rem' }}>
                        0
                      </span>
                    ) : (
                      <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)' }}>
                        {c.activos}
                      </span>
                    )}
                  </td>

                  <td style={{ textAlign: 'center' }}>
                    <button
                      onClick={() => onSeleccionar(c.id)}
                      className={`btn ${seleccionado ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ padding: '0.3rem 0.65rem', fontSize: '0.75rem' }}
                      disabled={estaLibre}
                    >
                      {estaLibre ? 'Sin reclamos' : seleccionado ? 'Viendo reclamos' : 'Ver reclamos'}
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
