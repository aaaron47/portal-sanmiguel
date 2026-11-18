import React from 'react';
import { Ticket } from '@/types/ticket.types';
import { fechaLegible } from '@/utils/fecha-peru.utils';
import { ETIQUETAS_RESULTADO } from '@/utils/ticket.utils';

const ESTADO_RESPUESTA: Record<string, string> = {
  BORRADOR: 'Borrador',
  EN_REVISION: 'Por aprobar',
  OBSERVADA: 'Observada',
  APROBADA: 'Aprobada',
};

/** Lo que ya se hizo en el reclamo: información pedida, respuesta final, versiones de la respuesta y evaluaciones. */
export const ExpedienteFlujo: React.FC<{ ticket: Ticket }> = ({ ticket }) => {
  const evaluaciones = ticket.evaluaciones ?? [];
  const respuestas = ticket.respuestas ?? [];
  const resultado = ticket.resultado ? ETIQUETAS_RESULTADO[ticket.resultado] ?? ticket.resultado : undefined;

  return (
    <>
      {ticket.observacion && (
        <section className="expediente-seccion">
          <h3 className="expediente-titulo">
            Información pedida al ciudadano
            {ticket.plazoSubsanacion ? ` · plazo: ${fechaLegible(ticket.plazoSubsanacion)}` : ''}
          </h3>
          <div className="expediente-caja expediente-caja-espera">{ticket.observacion}</div>
        </section>
      )}

      {ticket.respuestaFinal && (
        <section className="expediente-seccion">
          <h3 className="expediente-titulo">Respuesta enviada al ciudadano</h3>
          <div className="expediente-caja expediente-caja-final">
            {(resultado || ticket.numeroResolucion) && (
              <p className="expediente-caja-pie">
                {[resultado, ticket.numeroResolucion && `Resolución ${ticket.numeroResolucion}`].filter(Boolean).join(' · ')}
              </p>
            )}
            <p>{ticket.respuestaFinal}</p>
          </div>
        </section>
      )}

      {respuestas.length > 0 && !ticket.respuestaFinal && (
        <section className="expediente-seccion">
          <h3 className="expediente-titulo">Versiones de la respuesta</h3>
          {respuestas.map((r) => (
            <div key={r.id} className="expediente-caja">
              <p className="expediente-caja-pie">
                Versión {r.numeroVersion} · {ESTADO_RESPUESTA[r.estado] ?? r.estado} · {r.elaboradoPor} · {fechaLegible(r.fecha)}
              </p>
              <p>{r.respuesta}</p>
              {r.comentarioRevision && (
                <p style={{ marginTop: '0.25rem' }}>
                  <strong>Observación de {r.revisadoPor || 'el supervisor'}:</strong> {r.comentarioRevision}
                </p>
              )}
            </div>
          ))}
        </section>
      )}

      {evaluaciones.length > 0 && (
        <section className="expediente-seccion">
          <h3 className="expediente-titulo">Evaluación del área</h3>
          {evaluaciones.map((e) => (
            <div key={e.id} className="expediente-caja">
              <p className="expediente-caja-pie">
                {e.evaluadoPor} · {fechaLegible(e.fecha)}
              </p>
              <p><strong>Antecedentes:</strong> {e.antecedentes}</p>
              <p><strong>Hallazgos:</strong> {e.hallazgos}</p>
              {e.conclusion && <p><strong>Conclusión:</strong> {e.conclusion}</p>}
            </div>
          ))}
        </section>
      )}
    </>
  );
};
