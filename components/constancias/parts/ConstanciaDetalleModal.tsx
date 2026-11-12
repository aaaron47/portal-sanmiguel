'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, FileCheck, FileText, Info, ShieldCheck, Eye, X, XCircle } from 'lucide-react';
import { constanciasController } from '@/controllers/constancias.controller';
import { reportesController } from '@/controllers/reportes.controller';
import { MODO_DEMO, codigoErrorApi, mensajeErrorApi } from '@/services/api-client.service';
import { SolicitudConstancia } from '@/types/constancia.types';
import { ConstanciaItem, ConstanciaPdfResponse } from '@/types/reportes-tributarios.types';
import { fechaHoraPeru, fechaPeru } from '@/utils/fecha-peru.utils';
import { importe, motivoNoAprobable, puedeConstancia, tieneDeuda } from '../constancia.utils';
import { MENSAJES_CONSTANCIAS } from '../useConstancias';
import { ConstanciaPdfModal } from '@/components/roles/control-municipal/constancias/parts/ConstanciaPdfModal';

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
  const [mostrarPdf, setMostrarPdf] = useState(false);
  const [pdfData, setPdfData] = useState<ConstanciaPdfResponse | null>(null);
  const [cargandoPdf, setCargandoPdf] = useState(false);

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

  const constanciaItemModal: ConstanciaItem = useMemo(() => ({
    id: s.constancia?.id || s.id,
    folio: s.constancia?.codigoVerificacion ? `CNA-${s.numero.replace(/\D/g, '')}` : (s.numero || 'CNA-2026-0001'),
    contribuyenteCodigo: s.contribuyente.codigo,
    contribuyenteNombre: s.contribuyente.nombre,
    documentoTipo: s.contribuyente.tipoDocumento === 'RUC' ? 'RUC' : 'DNI',
    documentoNumero: s.contribuyente.documento,
    predioCodigo: s.predio.codigo,
    direccionPredio: s.predio.direccion,
    estadoTributario: tieneDeuda(s) ? 'REGISTRA_DEUDA' : 'SIN_DEUDA',
    deudaMonto: 0,
    firmadoDigitalmente: s.estado === 'EMITIDA' || !!s.constancia,
    firmanteNombre: s.atendidoPor || 'Abg. Carlos Mendoza Villavicencio',
    firmanteCargo: 'Subgerente de Recaudación y Control Tributario',
    entidadCertificadora: 'RENIEC - Entidad de Certificación del Estado Peruano (EC-EREP)',
    hashCVD: s.constancia?.codigoVerificacion || 'c7a9e102-4b89-4a91-99cd-382901aef114',
    fechaEmision: s.constancia?.emitidoEn ? fechaHoraPeru(s.constancia.emitidoEn) : (s.solicitadoEn ? fechaHoraPeru(s.solicitadoEn) : 'Pendiente'),
    fechaVencimiento: s.constancia?.vigenteHasta ? fechaPeru(s.constancia.vigenteHasta) : '30 días calendario',
    qrUrl: s.constancia?.urlVerificacion || 'https://servicios.munisanmiguel.gob.pe/validador',
  }), [s]);

  const handleVerPdf = async () => {
    setMostrarPdf(true);
    setPdfData(null);
    setCargandoPdf(true);
    try {
      const resp = await reportesController.getConstanciaPdf(s.constancia?.id || s.id);
      setPdfData(resp);
    } catch {
      setPdfData(null);
    } finally {
      setCargandoPdf(false);
    }
  };

  const elegir = (m: Modo) => {
    setModo(m);
    setTexto(m === 'DESAPROBAR' ? 'El predio registra obligaciones tributarias pendientes en el sistema.' : '');
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
      <form className="modal-content" style={{ maxWidth: '640px', width: '100%' }} onSubmit={confirmar}>
        {/* Encabezado: Heurística 1 (Visibilidad del estado del sistema) */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: 'var(--primary-100)',
                color: 'var(--primary-700)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <FileCheck size={20} />
            </div>
            <div>
              <h3 id="titulo-constancia" style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>
                Solicitud {s.numero}
              </h3>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                Ingresada el {fechaHoraPeru(s.solicitadoEn)}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {s.estado === 'EMITIDA' ? (
              <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem' }}>
                <CheckCircle2 size={12} /> Emitida
              </span>
            ) : s.estado === 'RECHAZADA' ? (
              <span className="badge badge-danger" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem' }}>
                <XCircle size={12} /> Desaprobada
              </span>
            ) : (
              <span className="badge badge-neutral" style={{ fontSize: '0.75rem' }}>
                {s.estadoEtiqueta}
              </span>
            )}

            <button
              type="button"
              onClick={onClose}
              disabled={enviando}
              aria-label="Cerrar modal"
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '0.25rem', borderRadius: '6px' }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Cuerpo: Heurística 8 (Diseño estético y minimalista, sin sobrecarga ni exposición de deudas personales) */}
        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', padding: '1.25rem' }}>
          {errorDetalle && (
            <p role="alert" style={{ fontSize: '0.775rem', color: 'var(--red-600)', margin: 0 }}>
              {errorDetalle}
            </p>
          )}

          {/* Bloque 1: Resumen de Identificación del Trámite */}
          <div style={{ background: 'var(--bg-card-subtle)', borderRadius: '10px', padding: '0.85rem 1rem', border: '1px solid var(--border-color)' }}>
            <p style={tituloSeccion}>Datos de la Solicitud</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <Dato nombre="Contribuyente">
                {s.contribuyente.nombre} ({s.contribuyente.tipoDocumento} {s.contribuyente.documento})
              </Dato>
              <Dato nombre="Código contribuyente">{s.contribuyente.codigo}</Dato>
              <Dato nombre="Predio consultado">
                {s.predio.direccion} {s.predio.distrito ? `· ${s.predio.distrito}` : ''}
              </Dato>
              <Dato nombre="Código predio">{s.predio.codigo}</Dato>
              <Dato nombre="Tasa administrativa">
                {importe(s.tasa, s.moneda)} · {s.pago ? (
                  <span style={{ color: 'var(--green-700)', fontWeight: 600 }}>
                    <CheckCircle2 size={12} style={{ display: 'inline', verticalAlign: '-1px' }} /> Pagada (Op: {s.pago.numeroOperacion})
                  </span>
                ) : (
                  <span style={{ color: 'var(--amber-700)', fontWeight: 600 }}>Sin pagar</span>
                )}
              </Dato>
            </div>
          </div>

          {/* Bloque 2: Evaluación de Requisitos Legales (Heurística 2 y LPDP: solo condición de aptitud, sin cifras de deuda personal) */}
          <div>
            {tieneDeuda(s) ? (
              <div
                style={{
                  background: 'var(--amber-50)',
                  border: '1px solid var(--amber-300)',
                  borderRadius: '10px',
                  padding: '0.85rem 1rem',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.6rem',
                }}
              >
                <AlertTriangle size={18} color="var(--amber-800)" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <div style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--amber-950)' }}>
                    No cumple con el requisito de no adeudo
                  </div>
                  <div style={{ fontSize: '0.775rem', color: 'var(--amber-900)', marginTop: '0.2rem', lineHeight: 1.4 }}>
                    El sistema registra obligaciones tributarias pendientes respecto al predio solicitado. Conforme al D.S. N° 156-2004-EF, no procede la emisión de la constancia.
                  </div>
                </div>
              </div>
            ) : !s.pago ? (
              <div
                style={{
                  background: 'var(--amber-50)',
                  border: '1px solid var(--amber-300)',
                  borderRadius: '10px',
                  padding: '0.85rem 1rem',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.6rem',
                }}
              >
                <AlertTriangle size={18} color="var(--amber-800)" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <div style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--amber-950)' }}>
                    Tasa del trámite pendiente de pago
                  </div>
                  <div style={{ fontSize: '0.775rem', color: 'var(--amber-900)', marginTop: '0.2rem', lineHeight: 1.4 }}>
                    El contribuyente no registra obligaciones pendientes de predial ni arbitrios, pero debe cancelarse la tasa administrativa para emitir la constancia.
                  </div>
                </div>
              </div>
            ) : (
              <div
                style={{
                  background: 'var(--green-50)',
                  border: '1px solid var(--green-300)',
                  borderRadius: '10px',
                  padding: '0.85rem 1rem',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.6rem',
                }}
              >
                <CheckCircle2 size={18} color="var(--green-700)" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <div style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--green-950)' }}>
                    Cumple con los requisitos para emisión
                  </div>
                  <div style={{ fontSize: '0.775rem', color: 'var(--green-900)', marginTop: '0.2rem', lineHeight: 1.4 }}>
                    Sin obligaciones tributarias pendientes y tasa pagada. Apto para emisión con firma digital oficial.
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Detalle de Cuotas Pendientes cuando registra deuda */}
          {tieneDeuda(s) && cuotas.length > 0 && (
            <div style={{ background: 'var(--bg-card-subtle)', borderRadius: '10px', padding: '0.85rem 1rem', border: '1px solid var(--border-color)' }}>
              <p style={tituloSeccion}>Cuotas pendientes ({cuotas.length})</p>
              <div className="table-container" style={{ overflowX: 'auto' }}>
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

          {noAprobable && (
            <p style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start', fontSize: '0.775rem', color: 'var(--text-main)', background: 'var(--bg-card-subtle)', border: '1px solid var(--amber-500)', borderRadius: '8px', padding: '0.6rem 0.75rem', margin: 0 }}>
              <Info size={16} style={{ flexShrink: 0, marginTop: '1px', color: 'var(--amber-700)' }} />
              {noAprobable}
            </p>
          )}

          {/* Bloque 3: Estado de Resolución / Constancia Emitida (si aplica) */}
          {s.constancia && (
            <div
              style={{
                background: 'var(--bg-card-subtle)',
                border: '1px solid var(--border-color)',
                borderRadius: '10px',
                padding: '0.85rem 1rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '0.75rem',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.2rem' }}>
                  <ShieldCheck size={16} color="var(--green-700)" />
                  <strong style={{ fontSize: '0.825rem', color: 'var(--text-main)' }}>
                    Constancia Oficial Emitida con Firma Digital PAdES
                  </strong>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Código CVD: <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{s.constancia.codigoVerificacion}</span> · Vigente hasta el {fechaPeru(s.constancia.vigenteHasta)}
                </div>
                {s.atendidoPor && (
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '0.15rem' }}>
                    Atendida por {s.atendidoPor} {s.atendidoEn ? `el ${fechaHoraPeru(s.atendidoEn)}` : ''}
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={handleVerPdf}
                className="btn btn-primary"
                style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <FileText size={15} /> Ver Constancia Oficial (PDF)
              </button>
            </div>
          )}

          {s.motivoRechazo && (
            <div
              style={{
                background: 'var(--red-50)',
                border: '1px solid var(--red-200)',
                borderRadius: '8px',
                padding: '0.75rem 1rem',
              }}
            >
              <strong style={{ fontSize: '0.775rem', color: 'var(--red-900)' }}>Motivo de la desaprobación:</strong>
              <p style={{ margin: '0.2rem 0 0', fontSize: '0.775rem', color: 'var(--red-800)' }}>{s.motivoRechazo}</p>
              {s.atendidoPor && (
                <div style={{ fontSize: '0.7rem', color: 'var(--red-700)', marginTop: '0.25rem' }}>
                  Atendida por {s.atendidoPor} {s.atendidoEn ? `el ${fechaHoraPeru(s.atendidoEn)}` : ''}
                </div>
              )}
            </div>
          )}

          {/* Bloque 4: Formulario de Acción (Solo si se seleccionó Aprobar o Desaprobar) */}
          {modo && (
            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.85rem' }}>
              <label htmlFor="textoDecision" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                {modo === 'APROBAR' ? 'Comentario institucional (opcional)' : 'Motivo formal de desaprobación (se notificará al ciudadano)'}
              </label>
              <textarea
                id="textoDecision"
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                maxLength={MAXIMO_TEXTO}
                required={modo === 'DESAPROBAR'}
                autoFocus
                placeholder={modo === 'APROBAR' ? 'Por ejemplo: Verificado conforme sin observaciones.' : 'Por ejemplo: El predio registra obligaciones tributarias pendientes.'}
                style={campoTexto}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.725rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                <span>
                  {modo === 'APROBAR'
                    ? 'Al aprobar, se aplicará la Firma Digital PAdES / RENIEC oficial y se emitirá el documento PDF con código CVD para el ciudadano.'
                    : 'El ciudadano recibirá esta notificación formal en su buzón. Esta acción no se puede deshacer.'}
                </span>
                <span>{texto.length}/{MAXIMO_TEXTO}</span>
              </div>
            </div>
          )}

          {error && (
            <p role="alert" style={{ fontSize: '0.775rem', color: 'var(--red-600)', margin: 0 }}>{error}</p>
          )}
        </div>

        {/* Pie del modal: Heurística 3 y 7 (Control y Libertad del Usuario) */}
        <div className="modal-footer">
          {modo ? (
            <>
              <button type="button" className="btn btn-secondary" onClick={() => elegir(null)} disabled={enviando}>
                Volver
              </button>
              <button
                type="submit"
                className={`btn ${modo === 'APROBAR' ? 'btn-success' : 'btn-danger'}`}
                disabled={motivoFalta || enviando}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
              >
                {enviando ? 'Guardando...' : modo === 'APROBAR' ? (
                  <>
                    <ShieldCheck size={15} /> Confirmar y emitir con firma digital
                  </>
                ) : (
                  'Confirmar desaprobación'
                )}
              </button>
            </>
          ) : (
            <>
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                Cerrar
              </button>
              {puedeAprobar && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleVerPdf}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                >
                  <Eye size={15} /> Vista previa del certificado
                </button>
              )}
              {puedeDesaprobar && (
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={() => elegir('DESAPROBAR')}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                >
                  <XCircle size={15} /> Desaprobar
                </button>
              )}
              {puedeAprobar && (
                <button
                  type="button"
                  className="btn btn-success"
                  onClick={() => elegir('APROBAR')}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                >
                  <CheckCircle2 size={15} /> Aprobar
                </button>
              )}
            </>
          )}
        </div>
      </form>

      {/* Modal Visor Oficial de la Constancia en PDF con Firma Digital */}
      {mostrarPdf && (
        <ConstanciaPdfModal
          constancia={constanciaItemModal}
          pdfData={pdfData}
          cargandoPdf={cargandoPdf}
          onClose={() => setMostrarPdf(false)}
        />
      )}
    </div>
  );
};
