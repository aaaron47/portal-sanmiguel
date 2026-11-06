import React from 'react';
import { Ticket } from '@/types/ticket.types';
import { ETIQUETAS_CATEGORIA, ETIQUETAS_RESULTADO } from '@/utils/ticket.utils';

const estiloTitulo: React.CSSProperties = {
  fontSize: '0.85rem',
  color: 'var(--text-muted)',
  textTransform: 'uppercase',
  marginBottom: '0.5rem',
  letterSpacing: '0.03em',
};

const estiloCaja: React.CSSProperties = {
  background: 'var(--bg-card-subtle)',
  border: '1px solid var(--border-color)',
  borderRadius: '8px',
  padding: '0.75rem 1rem',
  fontSize: '0.825rem',
  color: 'var(--text-main)',
  lineHeight: 1.45,
  marginBottom: '0.5rem',
};

const ESTADO_RESPUESTA: Record<string, string> = {
  BORRADOR: 'Borrador',
  EN_REVISION: 'Por aprobar',
  OBSERVADA: 'Observada',
  APROBADA: 'Aprobada',
};

const Dato: React.FC<{ etiqueta: string; valor?: string | null }> = ({ etiqueta, valor }) =>
  valor ? (
    <div>
      <div style={{ color: 'var(--text-muted)' }}>{etiqueta}</div>
      <div style={{ fontWeight: 600, color: 'var(--text-main)', marginTop: '2px' }}>{valor}</div>
    </div>
  ) : null;

/** Datos del flujo de atención: clasificación, pedido, observación pendiente, evaluaciones y respuestas. */
export const ExpedienteFlujo: React.FC<{ ticket: Ticket }> = ({ ticket }) => {
  const categoria = ticket.categoria
    ? ETIQUETAS_CATEGORIA[ticket.categoria as keyof typeof ETIQUETAS_CATEGORIA] ?? ticket.categoria
    : undefined;
  const resultado = ticket.resultado ? ETIQUETAS_RESULTADO[ticket.resultado] ?? ticket.resultado : undefined;
  const evaluaciones = ticket.evaluaciones ?? [];
  const respuestas = ticket.respuestas ?? [];

  return (
    <>
      {(ticket.tipoReclamo || categoria || ticket.funcionarioAsignadoNombre || ticket.fechaLimite || resultado) && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '0.75rem',
            fontSize: '0.825rem',
            marginBottom: '1.25rem',
          }}
        >
          <Dato etiqueta="Tipo de reclamo" valor={ticket.tipoReclamo} />
          <Dato etiqueta="Categoría" valor={categoria} />
          <Dato etiqueta="Funcionario" valor={ticket.funcionarioAsignadoNombre} />
          <Dato etiqueta="Fecha límite" valor={ticket.fechaLimite} />
          <Dato etiqueta="Resultado" valor={resultado} />
          <Dato etiqueta="N.º de resolución" valor={ticket.numeroResolucion} />
        </div>
      )}

      {ticket.pedido && ticket.pedido !== ticket.asunto && (
        <div style={{ marginBottom: '1.25rem' }}>
          <h4 style={estiloTitulo}>Pedido del ciudadano</h4>
          <div style={estiloCaja}>{ticket.pedido}</div>
        </div>
      )}

      {ticket.observacion && (
        <div role="status" style={{ ...estiloCaja, borderLeft: '4px solid var(--amber-700)', marginBottom: '1.25rem' }}>
          <strong>Información pedida al ciudadano</strong>
          {ticket.plazoSubsanacion ? ` (plazo: ${ticket.plazoSubsanacion})` : ''}: {ticket.observacion}
        </div>
      )}

      {ticket.respuestaFinal && (
        <div style={{ marginBottom: '1.25rem' }}>
          <h4 style={estiloTitulo}>Respuesta enviada al ciudadano</h4>
          <div style={{ ...estiloCaja, borderLeft: '4px solid var(--green-600)' }}>{ticket.respuestaFinal}</div>
        </div>
      )}

      {evaluaciones.length > 0 && (
        <div style={{ marginBottom: '1.25rem' }}>
          <h4 style={estiloTitulo}>Evaluación del área</h4>
          {evaluaciones.map((e) => (
            <div key={e.id} style={estiloCaja}>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
                {e.evaluadoPor} · {e.fecha}
              </div>
              <p><strong>Antecedentes:</strong> {e.antecedentes}</p>
              <p><strong>Hallazgos:</strong> {e.hallazgos}</p>
              {e.conclusion && <p><strong>Conclusión:</strong> {e.conclusion}</p>}
            </div>
          ))}
        </div>
      )}

      {respuestas.length > 0 && !ticket.respuestaFinal && (
        <div style={{ marginBottom: '1.25rem' }}>
          <h4 style={estiloTitulo}>Versiones de la respuesta</h4>
          {respuestas.map((r) => (
            <div key={r.id} style={estiloCaja}>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
                Versión {r.numeroVersion} · {ESTADO_RESPUESTA[r.estado] ?? r.estado} · {r.elaboradoPor} · {r.fecha}
              </div>
              <p>{r.respuesta}</p>
              {r.comentarioRevision && (
                <p style={{ marginTop: '0.25rem' }}>
                  <strong>Observación de {r.revisadoPor || 'el supervisor'}:</strong> {r.comentarioRevision}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  );
};
