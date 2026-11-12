import React from 'react';
import { AlertCircle, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
import { ListadoSolicitudesConstancia, SolicitudConstancia } from '@/types/constancia.types';
import { fechaHoraPeru } from '@/utils/fecha-peru.utils';
import { importe, tieneDeuda } from '../constancia.utils';

interface ConstanciasTableProps {
  listado: ListadoSolicitudesConstancia | null;
  cargando: boolean;
  error: string | null;
  filtrosActivos: boolean;
  tamano: number;
  onTamanoChange: (n: number) => void;
  onPaginaChange: (n: number) => void;
  onAbrir: (s: SolicitudConstancia) => void;
}

const muted: React.CSSProperties = { fontSize: '0.75rem', color: 'var(--text-muted)' };
const botonPagina: React.CSSProperties = { padding: '0.25rem 0.5rem', display: 'inline-flex', alignItems: 'center' };

export const ConstanciasTable: React.FC<ConstanciasTableProps> = ({
  listado,
  cargando,
  error,
  filtrosActivos,
  tamano,
  onTamanoChange,
  onPaginaChange,
  onAbrir,
}) => {
  const items = listado?.items ?? [];
  const total = listado?.totalRegistros ?? 0;
  const pagina = listado?.paginaActual ?? 1;
  const totalPaginas = Math.max(1, listado?.totalPaginas ?? 1);
  const desde = total === 0 ? 0 : (pagina - 1) * tamano + 1;
  const hasta = Math.min(desde + items.length - 1, total);

  let vacio: string | null = null;
  if (error) vacio = error;
  else if (!listado) vacio = 'Cargando solicitudes...';
  else if (items.length === 0) vacio = filtrosActivos ? 'Ninguna solicitud cumple los filtros.' : 'No hay solicitudes de constancia.';

  return (
    <>
      <div className="table-container" style={{ opacity: cargando && listado ? 0.6 : 1 }} aria-busy={cargando}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Solicitud</th>
              <th>Contribuyente</th>
              <th>Predio</th>
              <th>Tasa</th>
              <th>Deuda</th>
              <th>Estado</th>
              <th>Acción</th>
            </tr>
          </thead>
          <tbody>
            {vacio ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: error ? 'var(--red-600)' : 'var(--text-muted)' }}>
                  <AlertCircle size={24} style={{ margin: '0 auto 0.5rem', display: 'block' }} />
                  {vacio}
                </td>
              </tr>
            ) : (
              items.map((s) => {
                const evaluar = s.accionesPermitidas.length > 0;
                return (
                  <tr key={s.id}>
                    <td>
                      <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--primary-500)' }}>{s.numero}</div>
                      <div style={muted}>{fechaHoraPeru(s.solicitadoEn)}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{s.contribuyente.nombre}</div>
                      <div style={muted}>
                        {s.contribuyente.tipoDocumento} {s.contribuyente.documento} · {s.contribuyente.codigo}
                      </div>
                    </td>
                    <td>
                      <div style={{ color: 'var(--text-main)' }}>{s.predio.direccion}</div>
                      <div style={muted}>{s.predio.codigo}</div>
                    </td>
                    <td style={{ fontSize: '0.8rem' }}>
                      {s.pago ? (
                        <>
                          <div style={{ color: 'var(--text-main)' }}>Pagada</div>
                          <div style={muted}>{importe(s.pago.importe, s.moneda)}</div>
                        </>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>Sin pagar ({importe(s.tasa, s.moneda)})</span>
                      )}
                    </td>
                    <td style={{ fontSize: '0.8rem' }}>
                      {tieneDeuda(s) ? (
                        <>
                          <div style={{ color: 'var(--text-main)', fontWeight: 600 }}>{importe(s.deuda?.montoPendiente, s.moneda)}</div>
                          <div style={muted}>
                            {s.deuda?.cuotasPendientes ?? 0} cuota(s){s.deuda?.cuotasVencidas ? `, ${s.deuda.cuotasVencidas} vencida(s)` : ''}
                          </div>
                        </>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>Sin deuda</span>
                      )}
                    </td>
                    <td>
                      {/* Requisito 2: el estado va solo en texto, sin color. */}
                      <span style={{ fontSize: '0.825rem', fontWeight: 500, color: 'var(--text-main)' }}>{s.estadoEtiqueta}</span>
                    </td>
                    <td>
                      <button
                        type="button"
                        onClick={() => onAbrir(s)}
                        className={`btn ${evaluar ? 'btn-primary' : 'btn-secondary'}`}
                        style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.35rem', whiteSpace: 'nowrap' }}
                      >
                        <ExternalLink size={14} /> {evaluar ? 'Evaluar' : 'Ver detalle'}
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', padding: '0.5rem 0.25rem', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <span>
            Mostrando <strong>{desde}</strong> – <strong>{hasta}</strong> de <strong>{total}</strong> solicitudes
          </span>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            Por página:
            <select
              value={tamano}
              onChange={(e) => onTamanoChange(Number(e.target.value))}
              style={{ padding: '0.2rem 0.4rem', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '0.75rem', background: 'var(--bg-card)', color: 'var(--text-main)' }}
            >
              {[10, 25, 50].map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </label>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <button type="button" className="btn btn-secondary" style={botonPagina} onClick={() => onPaginaChange(pagina - 1)} disabled={pagina <= 1 || cargando} aria-label="Página anterior">
            <ChevronLeft size={14} />
          </button>
          <span style={{ padding: '0 0.4rem' }}>Página {pagina} de {totalPaginas}</span>
          <button type="button" className="btn btn-secondary" style={botonPagina} onClick={() => onPaginaChange(pagina + 1)} disabled={pagina >= totalPaginas || cargando} aria-label="Página siguiente">
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </>
  );
};
