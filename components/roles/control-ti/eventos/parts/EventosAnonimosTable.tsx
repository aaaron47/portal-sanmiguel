import React from 'react';
import { Cpu } from 'lucide-react';
import { TelemetriaEvento } from '@/types/telemetria.types';
import { CardHeader, CardAside } from '@/components/shared/ui/CardHeader';

export const EventosAnonimosTable: React.FC<{ eventos: TelemetriaEvento[] }> = ({ eventos }) => (
  <div className="card">
    <CardHeader
      icon={<Cpu size={18} />}
      title={
        <>
          Tabla <code>telemetria_eventos</code> (Ingesta Asíncrona)
        </>
      }
      aside={
        <CardAside color="var(--green-600)" bold>
          ● Conectado a canal anónimo
        </CardAside>
      }
    />

    <div className="table-container">
      <table className="data-table">
        <thead>
          <tr>
            <th>Fecha / Hora</th>
            <th>ID Dispositivo Anónimo</th>
            <th>Tipo Evento</th>
            <th>Pantalla / Componente</th>
            <th>Plataforma</th>
            <th>Versión</th>
          </tr>
        </thead>
        <tbody>
          {eventos.map((evt) => (
            <tr key={evt.id}>
              <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--slate-500)' }}>
                {evt.fechaRegistro}
              </td>
              <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--sky-700)' }}>
                {evt.dispositivoAnonimoId}
              </td>
              <td>
                <span
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    background: 'var(--slate-100)',
                    padding: '0.2rem 0.4rem',
                    borderRadius: '4px',
                    border: '1px solid var(--slate-300)',
                  }}
                >
                  {evt.tipoEvento}
                </span>
              </td>
              <td>
                <span style={{ fontWeight: 600 }}>{evt.pantalla}</span>
                {evt.componenteId && (
                  <span style={{ fontSize: '0.75rem', color: 'var(--slate-500)', display: 'block' }}>
                    [{evt.componenteId}]
                  </span>
                )}
              </td>
              <td>{evt.sistemaOperativo}</td>
              <td style={{ fontSize: '0.8rem', color: 'var(--slate-500)' }}>{evt.appVersion}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);
