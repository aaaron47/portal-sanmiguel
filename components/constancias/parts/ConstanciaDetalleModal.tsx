'use client';

import React, { useEffect, useState } from 'react';
import { CheckCircle2, ExternalLink, FileCheck, Info, X, XCircle } from 'lucide-react';
import { constanciasController } from '@/controllers/constancias.controller';
import { MODO_DEMO, codigoErrorApi, mensajeErrorApi } from '@/services/api-client.service';
import { SolicitudConstancia } from '@/types/constancia.types';
import { fechaHoraPeru, fechaPeru } from '@/utils/fecha-peru.utils';
import { importe, motivoNoAprobable, puedeConstancia, tieneDeuda } from '../constancia.utils';
import { MENSAJES_CONSTANCIAS } from '../useConstancias';

interface ConstanciaDetalleModalProps {
  /** La fila de la tabla: se muestra al instante mientras llega el detalle. */
  solicitud: SolicitudConstancia;
  onClose: () => void;
  /** La solicitud cambió (aprobada, desaprobada o ya no estaba en verificación): hay que recargar la lista. */
  onCambio: () => void;
  onExito: (mensaje: string) => void;
}

type Modo = null | 'APROBAR' | 'DESAPROBAR';
const MAXIMO_TEXTO = 255;

const MENSAJES_ACCION = {
  fee_required: 'El contribuyente todavía no pagó la tasa del trámite: no se puede aprobar.',
  outstanding_debts: 'El contribuyente tiene deudas pendientes: no se puede emitir la constancia. Desaprueba la solicitud indicando el motivo.',
  invalid_state: 'Esta solicitud ya fue atendida o cambió de estado. Se actualizaron los datos.',
  403: 'Tu rol no puede aprobar ni desaprobar constancias.',
  ...(MODO_DEMO ? { 0: 'En modo demo no se pueden aprobar ni desaprobar constancias: hace falta el servidor.' } : {}),
};

const seccion: React.CSSProperties = { background: 'var(--bg-card-subtle)', borderRadius: '10px', padding: '0.85rem 1rem' };
const tituloSeccion: React.CSSProperties = { fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.03em', color: 'var(--text-muted)', margin: '0 0 0.5rem' };
const fila: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: '1rem', fontSize: '0.825rem', padding: '0.15rem 0' };
const etiqueta: React.CSSProperties = { color: 'var(--text-muted)' };
const valor: React.CSSProperties = { color: 'var(--text-main)', fontWeight: 600, textAlign: 'right' };
const campoTexto: React.CSSProperties = {
  width: '100%',
  minHeight: '80px',
  padding: '0.55rem 0.75rem',
  borderRadius: '8px',
  border: '1px solid var(--border-color)',
  background: 'var(--bg-card)',
  color: 'var(--text-main)',
  fontSize: '0.85rem',
  fontFamily: 'inherit',
  resize: 'vertical',
  boxSizing: 'border-box',
};

const Dato: React.FC<{ nombre: string; children: React.ReactNode }> = ({ nombre, children }) => (
  <div style={fila}>
    <span style={etiqueta}>{nombre}</span>
    <span style={valor}>{children}</span>
  </div>
);

export const ConstanciaDetalleModal: React.FC<ConstanciaDetalleModalProps> = ({ solicitud, onClose, onCambio, onExito }) => {
  const [detalle, setDetalle] = useState<SolicitudConstancia | null>(null);
  const [errorDetalle, setErrorDetalle] = useState<string | null>(null);
  const [recarga, setRecarga] = useState(0);
  const [modo, setModo] = useState<Modo>(null);
  const [texto, setTexto] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let vigente = true;
    constanciasController
      .obtener(solicitud.id)
      .then((d) => {
        if (vigente) {
          setDetalle(d);
          setErrorDetalle(null);
        }
      })
      .catch((err) => {
        if (vigente) setErrorDetalle(mensajeErrorApi(err, 'No se pudo cargar el detalle de la solicitud.', MENSAJES_CONSTANCIAS));
      });
    return () => {
      vigente = false;
    };
  }, [solicitud.id, recarga]);

  const s = detalle ?? solicitud;
  const puedeAprobar = puedeConstancia(s, 'APROBAR');
  const puedeDesaprobar = puedeConstancia(s, 'DESAPROBAR');
  const noAprobable = motivoNoAprobable(s);
  // El servidor no las ordena: primero la que vence antes.
  const cuotas = [...(s.deuda?.detalle ?? [])].sort((x, y) => (x.venceEl ?? '').localeCompare(y.venceEl ?? ''));
  const motivoFalta = modo === 'DESAPROBAR' && texto.trim().length === 0;

  const elegir = (m: Modo) => {
    setModo(m);
    setTexto('');
    setError(null);
  };

  const confirmar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modo || motivoFalta || enviando) return;
    setEnviando(true);
    setError(null);
    try {
      if (modo === 'APROBAR') {
        await constanciasController.aprobar(s.id, texto);
        onExito(`Constancia emitida para la solicitud ${s.numero}. El ciudadano la recibe en su bandeja.`);
      } else {
        await constanciasController.desaprobar(s.id, texto);
        onExito(`Solicitud ${s.numero} desaprobada. Se avisó al ciudadano con el motivo.`);
      }
      onCambio();
      onClose();
    } catch (err) {
      setError(mensajeErrorApi(err, 'No se pudo guardar la decisión. Inténtalo de nuevo.', MENSAJES_ACCION));
      setEnviando(false);
      // Si la solicitud ya no admite la acción, se vuelven a leer los datos para mostrar su estado real.
      if (['invalid_state', 'fee_required', 'outstanding_debts'].includes(codigoErrorApi(err) ?? '')) {
        setModo(null);
        setRecarga((n) => n + 1);
        onCambio();
      }
    }
  };

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="titulo-constancia">
      <form className="modal-content" style={{ maxWidth: '720px' }} onSubmit={confirmar}>
        <div className="modal-header">
          <div>
            <h3 id="titulo-constancia" style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FileCheck size={18} /> Solicitud {s.numero}
            </h3>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
              {s.estadoEtiqueta} · solicitada el {fechaHoraPeru(s.solicitadoEn)}
            </div>
          </div>
          <button type="button" onClick={onClose} disabled={enviando} aria-label="Cerrar" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {errorDetalle && (
            <p role="alert" style={{ fontSize: '0.8rem', color: 'var(--red-600)', margin: 0 }}>
              {errorDetalle} Se muestran los datos de la lista.
            </p>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '0.85rem' }}>
            <div style={seccion}>
              <p style={tituloSeccion}>Contribuyente</p>
              <Dato nombre="Nombre">{s.contribuyente.nombre}</Dato>
              <Dato nombre="Documento">{s.contribuyente.tipoDocumento} {s.contribuyente.documento}</Dato>
              <Dato nombre="Código">{s.contribuyente.codigo}</Dato>
            </div>
            <div style={seccion}>
              <p style={tituloSeccion}>Predio</p>
              <Dato nombre="Dirección">{s.predio.direccion}</Dato>
              {s.predio.distrito && <Dato nombre="Distrito">{s.predio.distrito}</Dato>}
              <Dato nombre="Código">{s.predio.codigo}</Dato>
            </div>
            <div style={seccion}>
              <p style={tituloSeccion}>Trámite y tasa</p>
              <Dato nombre="Trámite">{s.tramite}</Dato>
              <Dato nombre="Tasa">{importe(s.tasa, s.moneda)}</Dato>
              {s.pago ? (
                <>
                  <Dato nombre="Pagada el">{fechaHoraPeru(s.pago.pagadoEn)}</Dato>
                  <Dato nombre="Operación">{s.pago.numeroOperacion}</Dato>
                </>
              ) : (
                <Dato nombre="Pago">Sin pagar</Dato>
              )}
            </div>
            <div style={seccion}>
              <p style={tituloSeccion}>Deuda del contribuyente</p>
              {tieneDeuda(s) ? (
                <>
                  <Dato nombre="Monto pendiente">{importe(s.deuda?.montoPendiente, s.moneda)}</Dato>
                  <Dato nombre="Cuotas pendientes">{s.deuda?.cuotasPendientes ?? 0}</Dato>
                  <Dato nombre="Cuotas vencidas">{s.deuda?.cuotasVencidas ?? 0}</Dato>
                </>
              ) : (
                <Dato nombre="Estado">Sin deuda</Dato>
              )}
            </div>
          </div>

          {cuotas.length > 0 && (
            <div>
              <p style={tituloSeccion}>Cuotas pendientes</p>
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Concepto</th>
                      <th>Periodo</th>
                      <th>Vence el</th>
                      <th style={{ textAlign: 'right' }}>Total</th>
                      <th>Situación</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cuotas.map((c, i) => (
                      <tr key={c.id ?? i} style={{ fontSize: '0.8rem' }}>
                        <td>{c.concepto}</td>
                        <td>{c.periodo}</td>
                        <td>{c.venceEl ? fechaPeru(c.venceEl) : '—'}</td>
                        <td style={{ textAlign: 'right' }}>{importe(c.total, s.moneda)}</td>
                        <td style={{ fontWeight: c.vencida ? 700 : 400 }}>{c.vencida ? 'Vencida' : 'Por vencer'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {(s.atendidoPor || s.motivoRechazo || s.constancia) && (
            <div style={seccion}>
              <p style={tituloSeccion}>Resolución</p>
              {s.atendidoPor && (
                <Dato nombre="Atendida por">
                  {s.atendidoPor}
                  {s.atendidoEn ? `, ${fechaHoraPeru(s.atendidoEn)}` : ''}
                </Dato>
              )}
              {s.motivoRechazo && <Dato nombre="Motivo">{s.motivoRechazo}</Dato>}
              {s.constancia && (
                <>
                  <Dato nombre="Constancia">{s.constancia.estado === 'VIGENTE' ? 'Vigente' : s.constancia.estado}</Dato>
                  <Dato nombre="Vigente hasta">{fechaPeru(s.constancia.vigenteHasta)}</Dato>
                  <Dato nombre="Código de verificación">
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>{s.constancia.codigoVerificacion}</span>
                  </Dato>
                  {s.constancia.canalEnvio && (
                    <Dato nombre="Enviada">
                      {s.constancia.canalEnvio === 'BANDEJA' ? 'A la bandeja del ciudadano' : s.constancia.canalEnvio}
                      {s.constancia.enviadoEn ? `, ${fechaHoraPeru(s.constancia.enviadoEn)}` : ''}
                    </Dato>
                  )}
                  {s.constancia.urlVerificacion && (
                    <a
                      href={s.constancia.urlVerificacion}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.8rem', marginTop: '0.4rem', color: 'var(--primary-500)' }}
                    >
                      <ExternalLink size={14} /> Verificar la constancia
                    </a>
                  )}
                </>
              )}
            </div>
          )}

          {noAprobable && (
            <p style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start', fontSize: '0.8rem', color: 'var(--text-main)', background: 'var(--bg-card-subtle)', border: '1px solid var(--amber-500)', borderRadius: '8px', padding: '0.6rem 0.75rem', margin: 0 }}>
              <Info size={16} style={{ flexShrink: 0, marginTop: '1px', color: 'var(--amber-700)' }} />
              {noAprobable}
            </p>
          )}

          {modo && (
            <div>
              <label htmlFor="textoDecision" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem' }}>
                {modo === 'APROBAR' ? 'Comentario (opcional)' : 'Motivo de la desaprobación (lo verá el ciudadano)'}
              </label>
              <textarea
                id="textoDecision"
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                maxLength={MAXIMO_TEXTO}
                required={modo === 'DESAPROBAR'}
                autoFocus
                placeholder={modo === 'APROBAR' ? 'Por ejemplo: verificado sin observaciones.' : 'Por ejemplo: registra deuda de arbitrios 2026.'}
                style={campoTexto}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                <span>
                  {modo === 'APROBAR'
                    ? 'Al aprobar se emite la constancia y el ciudadano la recibe en su bandeja. No se puede deshacer.'
                    : 'El ciudadano recibe un aviso con este motivo. No se puede deshacer.'}
                </span>
                <span>{texto.length}/{MAXIMO_TEXTO}</span>
              </div>
            </div>
          )}

          {error && (
            <p role="alert" style={{ fontSize: '0.8rem', color: 'var(--red-600)', margin: 0 }}>{error}</p>
          )}
        </div>

        <div className="modal-footer">
          {modo ? (
            <>
              <button type="button" className="btn btn-secondary" onClick={() => elegir(null)} disabled={enviando}>Volver</button>
              <button type="submit" className={`btn ${modo === 'APROBAR' ? 'btn-success' : 'btn-danger'}`} disabled={motivoFalta || enviando}>
                {enviando ? 'Guardando...' : modo === 'APROBAR' ? 'Confirmar y emitir constancia' : 'Confirmar desaprobación'}
              </button>
            </>
          ) : (
            <>
              <button type="button" className="btn btn-secondary" onClick={onClose}>Cerrar</button>
              {puedeDesaprobar && (
                <button type="button" className="btn btn-danger" onClick={() => elegir('DESAPROBAR')} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                  <XCircle size={15} /> Desaprobar
                </button>
              )}
              {puedeAprobar && (
                <button type="button" className="btn btn-success" onClick={() => elegir('APROBAR')} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                  <CheckCircle2 size={15} /> Aprobar
                </button>
              )}
            </>
          )}
        </div>
      </form>
    </div>
  );
};
