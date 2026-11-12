import React from 'react';
import { Cpu } from 'lucide-react';
import { TelemetriaEvento } from '@/types/telemetria.types';
import { CardHeader, CardAside } from '@/components/shared/ui/CardHeader';
import {
  etiquetaCanal,
  etiquetaFuncionalidad,
  etiquetaResultado,
  etiquetaSistema,
  etiquetaTipoEvento,
} from '@/utils/telemetria.utils';

const CLASE_RESULTADO: Record<string, string> = {
  COMPLETADA: 'badge badge-success',
  FALLIDA: 'badge badge-danger',
  INICIADA: 'badge badge-neutral',
};

/** Últimos eventos de uso (Req 3): seudónimo, fecha y hora, pantalla o acción, resultado, sistema y versión. */
export const EventosAnonimosTable: React.FC<{ eventos: TelemetriaEvento[] }> = ({ eventos }) => (
  <div className="card">
    <CardHeader
      icon={<Cpu size={18} />}
      title="Eventos de uso recientes (anónimos)"
      aside={<CardAside>Últimos {eventos.length} eventos · sin nombre, correo ni DNI · hora de Perú</CardAside>}
    />

    <div className="table-container">
      <table className="data-table">
        <thead>
          <tr>
            <th>Fecha / Hora</th>
            <th>ID seudónimo</th>
            <th>Tipo de evento</th>
            <th>Funcionalidad / Pantalla</th>
            <th>Resultado</th>
            <th>Plataforma</th>
            <th>Versión</th>
          </tr>
        </thead>
        <tbody>
          {eventos.length === 0 && (
            <tr>
              <td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '1.25rem' }}>
                Todavía no hay eventos registrados.
              </td>
            </tr>
          )}
          {eventos.map((evt) => {
            const resultado = etiquetaResultado(evt.resultado);
            const detalle = [evt.pantalla, evt.componenteId && `[${evt.componenteId}]`].filter(Boolean).join(' ');
            return (
              <tr key={evt.id}>
                <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {evt.fechaRegistro}
                </td>
                <td
                  style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--sky-600)' }}
                  title={evt.sesionId ? `Sesión ${evt.sesionId}` : undefined}
                >
                  {evt.dispositivoAnonimoId}
                </td>
                <td>
                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      background: 'var(--bg-card-subtle)',
                      padding: '0.2rem 0.4rem',
                      borderRadius: '4px',
                      border: '1px solid var(--border-color)',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {etiquetaTipoEvento(evt.tipoEvento)}
                  </span>
                </td>
                <td>
                  <span style={{ fontWeight: 600 }}>
                    {evt.funcionalidad ? etiquetaFuncionalidad(evt.funcionalidad) : evt.pantalla || '—'}
                  </span>
                  {evt.funcionalidad && detalle && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>{detalle}</span>
                  )}
                  {!evt.funcionalidad && evt.componenteId && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>
                      [{evt.componenteId}]
                    </span>
                  )}
                </td>
                <td>
                  {resultado ? (
                    <span className={CLASE_RESULTADO[evt.resultado ?? ''] ?? 'badge badge-neutral'}>{resultado}</span>
                  ) : (
                    <span style={{ color: 'var(--text-muted)' }}>—</span>
                  )}
                  {evt.codigoError && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>
                      {evt.codigoError}
                    </span>
                  )}
                </td>
                <td>
                  {etiquetaSistema(evt.sistemaOperativo)}
                  {evt.canal && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>
                      {etiquetaCanal(evt.canal)}
                    </span>
                  )}
                </td>
                <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{evt.appVersion}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  </div>
);
