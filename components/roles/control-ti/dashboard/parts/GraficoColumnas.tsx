import React, { useState } from 'react';

export interface DatoColumna {
  clave: string;
  /** Nombre completo para el tooltip y la tabla, p. ej. "lun 10/11" o "14:00 – 14:59". */
  etiqueta: string;
  /** Texto bajo la columna; vacío para no rotular esa columna. */
  etiquetaEje: string;
  valor: number;
  /** Segunda línea del tooltip, p. ej. "312 sesiones". */
  detalle?: string;
}

interface GraficoColumnasProps {
  titulo: string;
  /** Cabecera de la primera columna de la tabla, p. ej. "Día" u "Hora". */
  nombreCategoria: string;
  nombreValor: string;
  datos: DatoColumna[];
  alto?: number;
}

const formato = (n: number) => n.toLocaleString('es-PE');

/** Tope "redondo" del eje: 1, 2, 2.5 o 5 × 10^k. */
function topeEje(max: number): number {
  if (max <= 0) return 1;
  const p = Math.pow(10, Math.floor(Math.log10(max)));
  for (const m of [1, 2, 2.5, 5, 10]) if (m * p >= max) return m * p;
  return 10 * p;
}

const compacto = (n: number) => (n >= 10000 ? `${Math.round(n / 1000)} mil` : formato(n));

/**
 * Columnas de una sola serie (sin leyenda: el título dice qué se mide). Cada columna muestra su valor al
 * pasar el mouse o con el teclado; el valor máximo va rotulado y todos los datos están en la tabla.
 */
export const GraficoColumnas: React.FC<GraficoColumnasProps> = ({ titulo, nombreCategoria, nombreValor, datos, alto = 170 }) => {
  const [activo, setActivo] = useState<number | null>(null);
  const max = Math.max(0, ...datos.map((d) => d.valor));
  const tope = topeEje(max);
  const idxMax = datos.findIndex((d) => d.valor === max && max > 0);
  const ticks = [tope, tope / 2, 0];

  return (
    <div>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        {/* Eje Y */}
        <div
          aria-hidden
          style={{
            position: 'relative',
            width: '44px',
            height: alto,
            fontSize: '0.7rem',
            color: 'var(--text-muted)',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {ticks.map((t) => (
            <span
              key={t}
              style={{ position: 'absolute', right: 0, top: `${(1 - t / tope) * 100}%`, transform: 'translateY(-50%)' }}
            >
              {compacto(t)}
            </span>
          ))}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Área de trazado */}
          <div style={{ position: 'relative', height: alto }}>
            {ticks.map((t) => (
              <div
                key={t}
                aria-hidden
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  top: `${(1 - t / tope) * 100}%`,
                  borderTop: '1px solid var(--border-color)',
                }}
              />
            ))}

            <div
              role="list"
              aria-label={titulo}
              style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'flex-end', gap: '2px' }}
              onMouseLeave={() => setActivo(null)}
            >
              {datos.map((d, i) => {
                const altoPct = (d.valor / tope) * 100;
                return (
                  <div
                    key={d.clave}
                    role="listitem"
                    tabIndex={0}
                    aria-label={`${d.etiqueta}: ${formato(d.valor)} ${nombreValor}${d.detalle ? `, ${d.detalle}` : ''}`}
                    onMouseEnter={() => setActivo(i)}
                    onFocus={() => setActivo(i)}
                    onBlur={() => setActivo(null)}
                    style={{
                      flex: 1,
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'flex-end',
                      alignItems: 'center',
                      position: 'relative',
                      cursor: 'default',
                      outline: 'none',
                    }}
                  >
                    {i === idxMax && (
                      <span
                        aria-hidden
                        style={{
                          fontSize: '0.7rem',
                          fontWeight: 600,
                          color: 'var(--text-main)',
                          marginBottom: '2px',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {compacto(d.valor)}
                      </span>
                    )}
                    <div
                      style={{
                        width: '100%',
                        maxWidth: '24px',
                        height: `${altoPct}%`,
                        minHeight: d.valor > 0 ? '2px' : 0,
                        background: 'var(--chart-uso)',
                        borderRadius: '4px 4px 0 0',
                        filter: activo === i ? 'brightness(1.18)' : undefined,
                        boxShadow: activo === i ? '0 0 0 2px var(--bg-card), 0 0 0 3px var(--chart-uso)' : undefined,
                        transition: 'filter 120ms',
                      }}
                    />
                  </div>
                );
              })}
            </div>

            {/* Tooltip: el valor primero, la etiqueta después */}
            {activo !== null && datos[activo] && (
              <div
                aria-hidden
                style={{
                  position: 'absolute',
                  left: `${((activo + 0.5) / datos.length) * 100}%`,
                  // Justo encima de la columna activa (no del borde del gráfico)
                  top: `calc(${(1 - datos[activo].valor / tope) * 100}% - 0.5rem)`,
                  transform: `translate(${activo < datos.length / 4 ? '-10%' : activo > (datos.length * 3) / 4 ? '-90%' : '-50%'}, -100%)`,
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  padding: '0.4rem 0.6rem',
                  boxShadow: '0 6px 16px rgba(0,0,0,0.15)',
                  pointerEvents: 'none',
                  whiteSpace: 'nowrap',
                  zIndex: 5,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span style={{ width: '10px', height: '2px', background: 'var(--chart-uso)', display: 'inline-block' }} />
                  <strong style={{ fontSize: '0.85rem', color: 'var(--text-main)' }}>
                    {formato(datos[activo].valor)} {nombreValor}
                  </strong>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {datos[activo].etiqueta}
                  {datos[activo].detalle ? ` · ${datos[activo].detalle}` : ''}
                </div>
              </div>
            )}
          </div>

          {/* Eje X */}
          <div aria-hidden style={{ display: 'flex', gap: '2px', marginTop: '0.35rem' }}>
            {datos.map((d) => (
              <span
                key={d.clave}
                style={{
                  flex: 1,
                  textAlign: 'center',
                  fontSize: '0.68rem',
                  color: 'var(--text-muted)',
                  whiteSpace: 'nowrap',
                  overflow: 'visible',
                }}
              >
                {d.etiquetaEje}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Vista de tabla: todos los valores sin depender del mouse */}
      <details style={{ marginTop: '0.6rem', fontSize: '0.8rem' }}>
        <summary style={{ cursor: 'pointer', color: 'var(--text-muted)' }}>Ver los datos en tabla</summary>
        <div className="table-container" style={{ marginTop: '0.5rem', maxHeight: '220px', overflowY: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>{nombreCategoria}</th>
                <th style={{ textAlign: 'right' }}>{nombreValor.replace(/^\w/, (c) => c.toUpperCase())}</th>
                {datos.some((d) => d.detalle) && <th style={{ textAlign: 'right' }}>Detalle</th>}
              </tr>
            </thead>
            <tbody>
              {datos.map((d) => (
                <tr key={d.clave}>
                  <td>{d.etiqueta}</td>
                  <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{formato(d.valor)}</td>
                  {datos.some((x) => x.detalle) && (
                    <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{d.detalle ?? ''}</td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
};
