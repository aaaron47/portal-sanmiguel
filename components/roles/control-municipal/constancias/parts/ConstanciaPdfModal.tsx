'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Image from 'next/image';
import {
  X,
  FileCheck,
  FileText,
  ShieldCheck,
  AlertTriangle,
  CheckCircle,
  ExternalLink,
  Printer,
  Download,
  QrCode,
  Copy,
  Check,
} from 'lucide-react';
import {
  ConstanciaItem,
  ConstanciaPdfResponse,
} from '@/types/reportes-tributarios.types';

interface ConstanciaPdfModalProps {
  constancia: ConstanciaItem;
  pdfData: ConstanciaPdfResponse | null;
  cargandoPdf: boolean;
  onClose: () => void;
}

export const ConstanciaPdfModal: React.FC<ConstanciaPdfModalProps> = ({
  constancia,
  pdfData,
  cargandoPdf,
  onClose,
}) => {
  const [tabSeleccionada, setTabSeleccionada] = useState<'pdf' | 'certificado' | null>(null);
  const [copiadoCvd, setCopiadoCvd] = useState(false);

  // Determinar fuente del PDF (URL o Base64 Data URI)
  const pdfEmbedSrc = useMemo(() => {
    if (!pdfData) return '';
    if (pdfData.pdfUrl) return pdfData.pdfUrl;
    if (pdfData.pdfBase64) {
      return pdfData.pdfBase64.startsWith('data:')
        ? pdfData.pdfBase64
        : `data:application/pdf;base64,${pdfData.pdfBase64}`;
    }
    return '';
  }, [pdfData]);

  // Vista activa derivada: si el usuario seleccionó una, se respeta; sino por defecto según disponibilidad
  const vistaModal = tabSeleccionada ?? (pdfEmbedSrc ? 'pdf' : 'certificado');

  // Cerrar al presionar la tecla Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleCopiarCvd = async () => {
    if (!constancia.hashCVD) return;
    try {
      await navigator.clipboard.writeText(constancia.hashCVD);
      setCopiadoCvd(true);
      setTimeout(() => setCopiadoCvd(false), 2000);
    } catch {
      // Ignorar error de portapapeles en caso de no permisos
    }
  };

  const handleDescargarPdf = () => {
    const nombreArchivo =
      pdfData?.nombreArchivo || `${constancia.folio}.pdf`;
    if (pdfEmbedSrc) {
      const link = document.createElement('a');
      link.href = pdfEmbedSrc;
      link.download = nombreArchivo;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return;
    }
    window.print();
  };

  const handleAbrirPestanaNueva = () => {
    if (!pdfEmbedSrc) return;
    window.open(pdfEmbedSrc, '_blank', 'noopener,noreferrer');
  };

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="titulo-constancia-pdf"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      style={{ zIndex: 1000 }}
    >
      <div
        className="modal-content"
        style={{
          maxWidth: '880px',
          maxHeight: '92vh',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* 1. Encabezado del Modal */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '8px',
                background: 'var(--primary-100)',
                color: 'var(--primary-700)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <FileCheck size={22} />
            </div>
            <div>
              <h3
                id="titulo-constancia-pdf"
                style={{
                  margin: 0,
                  fontSize: '1.05rem',
                  fontWeight: 700,
                  color: 'var(--text-main)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                Constancia de No Adeudo Tributario
              </h3>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                Folio Oficial: <strong style={{ color: 'var(--text-main)', fontFamily: 'var(--font-mono)' }}>{constancia.folio}</strong>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {/* Badges de Estado */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
              {constancia.estadoTributario === 'SIN_DEUDA' ? (
                <span
                  className="badge badge-success"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem' }}
                >
                  <CheckCircle size={12} /> Sin Deuda
                </span>
              ) : (
                <span
                  className="badge badge-danger"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem' }}
                >
                  <AlertTriangle size={12} /> Registra Deuda
                </span>
              )}

              {constancia.firmadoDigitalmente ? (
                <span
                  className="badge badge-primary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem' }}
                >
                  <ShieldCheck size={12} /> PAdES RENIEC
                </span>
              ) : (
                <span
                  className="badge badge-neutral"
                  style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}
                >
                  No Emitida
                </span>
              )}
            </div>

            {/* Botón Cerrar */}
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar modal"
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: '0.35rem',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* 2. Cuerpo del Modal (Scrolleable) */}
        <div className="modal-body" style={{ overflowY: 'auto', padding: '1.25rem', flex: 1 }}>
          {/* Ficha Resumen Ejecutivo de Metadatos */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
              gap: '0.65rem',
              marginBottom: '1rem',
            }}
          >
            {/* Contribuyente */}
            <div
              style={{
                background: 'var(--bg-card-subtle)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '0.65rem 0.85rem',
              }}
            >
              <div
                style={{
                  fontSize: '0.675rem',
                  color: 'var(--text-muted)',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                Contribuyente
              </div>
              <div
                style={{
                  fontSize: '0.825rem',
                  fontWeight: 700,
                  color: 'var(--text-main)',
                  marginTop: '0.15rem',
                  lineHeight: 1.3,
                }}
              >
                {constancia.contribuyenteNombre}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                {constancia.documentoTipo}: <strong style={{ color: 'var(--text-main)' }}>{constancia.documentoNumero}</strong> · Cód. {constancia.contribuyenteCodigo}
              </div>
            </div>

            {/* Predio */}
            <div
              style={{
                background: 'var(--bg-card-subtle)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '0.65rem 0.85rem',
              }}
            >
              <div
                style={{
                  fontSize: '0.675rem',
                  color: 'var(--text-muted)',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                Predio Registrado
              </div>
              <div
                style={{
                  fontSize: '0.825rem',
                  fontWeight: 700,
                  color: 'var(--text-main)',
                  marginTop: '0.15rem',
                  lineHeight: 1.3,
                  fontFamily: 'var(--font-mono)',
                }}
              >
                {constancia.predioCodigo}
              </div>
              <div
                style={{
                  fontSize: '0.75rem',
                  color: 'var(--text-muted)',
                  marginTop: '0.2rem',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
                title={constancia.direccionPredio}
              >
                {constancia.direccionPredio}
              </div>
            </div>

            {/* Emisión y Vigencia */}
            <div
              style={{
                background: 'var(--bg-card-subtle)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '0.65rem 0.85rem',
              }}
            >
              <div
                style={{
                  fontSize: '0.675rem',
                  color: 'var(--text-muted)',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                Emisión y Vigencia
              </div>
              <div
                style={{
                  fontSize: '0.825rem',
                  fontWeight: 700,
                  color: 'var(--text-main)',
                  marginTop: '0.15rem',
                  lineHeight: 1.3,
                }}
              >
                {constancia.fechaEmision}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                Vigencia: 30 días calendario
              </div>
            </div>

            {/* Firma Digital y CVD */}
            <div
              style={{
                background: 'var(--bg-card-subtle)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '0.65rem 0.85rem',
              }}
            >
              <div
                style={{
                  fontSize: '0.675rem',
                  color: 'var(--text-muted)',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                Firma Digital & CVD
              </div>
              <div
                style={{
                  fontSize: '0.825rem',
                  fontWeight: 700,
                  color: 'var(--text-main)',
                  marginTop: '0.15rem',
                  lineHeight: 1.3,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                }}
              >
                {constancia.firmadoDigitalmente ? (
                  <>
                    <ShieldCheck size={14} color="var(--green-600)" />
                    <span>PAdES Verificado</span>
                  </>
                ) : (
                  <span style={{ color: 'var(--text-muted)' }}>Sin Firma</span>
                )}
              </div>
              <div
                style={{
                  fontSize: '0.7rem',
                  color: 'var(--text-muted)',
                  marginTop: '0.2rem',
                  fontFamily: 'var(--font-mono)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                }}
              >
                {constancia.hashCVD ? (
                  <>
                    <span title={constancia.hashCVD}>
                      CVD: {constancia.hashCVD.slice(0, 10)}...
                    </span>
                    <button
                      type="button"
                      onClick={handleCopiarCvd}
                      title="Copiar Código de Verificación Digital (CVD)"
                      style={{
                        background: 'none',
                        border: 'none',
                        color: copiadoCvd ? 'var(--green-600)' : 'var(--text-muted)',
                        cursor: 'pointer',
                        padding: 0,
                        display: 'inline-flex',
                        alignItems: 'center',
                      }}
                    >
                      {copiadoCvd ? <Check size={12} /> : <Copy size={12} />}
                    </button>
                  </>
                ) : (
                  'No generado'
                )}
              </div>
            </div>
          </div>

          {/* Selector de Pestañas / Vista */}
          <div
            style={{
              display: 'flex',
              gap: '0.5rem',
              borderBottom: '1px solid var(--border-color)',
              marginBottom: '1rem',
            }}
          >
            <button
              type="button"
              onClick={() => setTabSeleccionada('pdf')}
              style={{
                padding: '0.5rem 0.85rem',
                fontSize: '0.825rem',
                fontWeight: vistaModal === 'pdf' ? 700 : 500,
                color: vistaModal === 'pdf' ? 'var(--sky-600)' : 'var(--text-muted)',
                border: 'none',
                borderBottom: vistaModal === 'pdf' ? '2px solid var(--sky-600)' : '2px solid transparent',
                background: 'none',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                transition: 'all 0.15s ease',
              }}
            >
              <FileText size={15} /> Documento Oficial (PDF)
            </button>

            <button
              type="button"
              onClick={() => setTabSeleccionada('certificado')}
              style={{
                padding: '0.5rem 0.85rem',
                fontSize: '0.825rem',
                fontWeight: vistaModal === 'certificado' ? 700 : 500,
                color: vistaModal === 'certificado' ? 'var(--sky-600)' : 'var(--text-muted)',
                border: 'none',
                borderBottom: vistaModal === 'certificado' ? '2px solid var(--sky-600)' : '2px solid transparent',
                background: 'none',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                transition: 'all 0.15s ease',
              }}
            >
              <FileCheck size={15} /> Ficha y Transcripción Legal
            </button>
          </div>

          {/* VISTA 1: Visor del PDF Oficial */}
          {vistaModal === 'pdf' && (
            <div>
              {cargandoPdf && (
                <div
                  style={{
                    textAlign: 'center',
                    padding: '3rem 1rem',
                    fontSize: '0.85rem',
                    color: 'var(--text-muted)',
                    background: 'var(--bg-card-subtle)',
                    borderRadius: '10px',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  <div style={{ marginBottom: '0.5rem' }}>Consultando documento PDF oficial en el servidor...</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Validando firma digital PAdES / RENIEC</div>
                </div>
              )}

              {!cargandoPdf && pdfEmbedSrc && (
                <div>
                  {/* Barra de herramientas superior del visor */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: 'var(--bg-card-subtle)',
                      padding: '0.5rem 0.85rem',
                      borderRadius: '8px 8px 0 0',
                      border: '1px solid var(--border-color)',
                      borderBottom: 'none',
                    }}
                  >
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <ShieldCheck size={14} color="var(--green-600)" />
                      Documento PDF emitido con firma digital de validez jurídica.
                    </span>

                    <button
                      type="button"
                      onClick={handleAbrirPestanaNueva}
                      className="btn btn-secondary"
                      style={{ padding: '0.25rem 0.55rem', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                      title="Abrir en pestaña nueva"
                    >
                      <ExternalLink size={13} /> Abrir en nueva pestaña
                    </button>
                  </div>

                  {/* Iframe del PDF (Limpio, sin texto duplicado debajo) */}
                  <div
                    style={{
                      border: '1px solid var(--border-color)',
                      borderRadius: '0 0 10px 10px',
                      overflow: 'hidden',
                      background: 'var(--slate-100)',
                    }}
                  >
                    <iframe
                      src={pdfEmbedSrc}
                      title={`PDF ${constancia.folio}`}
                      style={{
                        width: '100%',
                        height: '560px',
                        border: 'none',
                        display: 'block',
                      }}
                    />
                  </div>
                </div>
              )}

              {!cargandoPdf && !pdfEmbedSrc && (
                <div
                  style={{
                    textAlign: 'center',
                    padding: '2.5rem 1.5rem',
                    background: 'var(--bg-card-subtle)',
                    border: '1px dashed var(--border-color)',
                    borderRadius: '10px',
                  }}
                >
                  <FileText size={40} style={{ color: 'var(--text-muted)', marginBottom: '0.75rem' }} />
                  <h4 style={{ margin: '0 0 0.5rem', fontSize: '0.95rem', color: 'var(--text-main)' }}>
                    El archivo PDF oficial aún no está disponible en el visor
                  </h4>
                  <p style={{ margin: '0 0 1.25rem', fontSize: '0.8rem', color: 'var(--text-muted)', maxWidth: '480px', marginLeft: 'auto', marginRight: 'auto' }}>
                    Esta constancia se encuentra registrada en el sistema. Puedes visualizar la transcripción completa oficial y el sello de firma digital en la pestaña adyacente.
                  </p>
                  <button
                    type="button"
                    onClick={() => setTabSeleccionada('certificado')}
                    className="btn btn-primary"
                    style={{ fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                  >
                    <FileCheck size={14} /> Ver Ficha y Transcripción Legal
                  </button>
                </div>
              )}
            </div>
          )}

          {/* VISTA 2: Ficha y Transcripción Legal (Hoja Membretada) */}
          {vistaModal === 'certificado' && (
            <div
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: '12px',
                padding: '1.75rem 2rem',
                boxShadow: '0 4px 14px rgba(0,0,0,0.04)',
              }}
            >
              {/* Membrete Oficial Municipal */}
              <div
                style={{
                  textAlign: 'center',
                  borderBottom: '2px solid var(--sky-700)',
                  paddingBottom: '1rem',
                  marginBottom: '1.25rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                  <Image
                    src="/logo-san-miguel-light.png"
                    alt="Municipalidad de San Miguel"
                    width={140}
                    height={42}
                    style={{ objectFit: 'contain' }}
                  />
                </div>
                <h4 style={{ margin: 0, fontSize: '0.85rem', fontWeight: 800, letterSpacing: '0.5px', color: 'var(--text-main)' }}>
                  MUNICIPALIDAD DISTRITAL DE SAN MIGUEL
                </h4>
                <p style={{ margin: '0.15rem 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  GERENCIA DE ADMINISTRACIÓN TRIBUTARIA • SUBGERENCIA DE RECAUDACIÓN Y CONTROL
                </p>
              </div>

              {/* Título de la Constancia */}
              <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--sky-800)', margin: 0, textTransform: 'uppercase' }}>
                  CONSTANCIA DE NO ADEUDO TRIBUTARIO
                </h2>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                  N° {constancia.folio}
                </div>
              </div>

              {/* Cuerpo del Certificado */}
              {constancia.estadoTributario === 'SIN_DEUDA' ? (
                <div style={{ fontSize: '0.85rem', lineHeight: '1.6', color: 'var(--text-main)', marginBottom: '1.5rem', textAlign: 'justify' }}>
                  <p>
                    La <strong>Subgerencia de Recaudación y Control Tributario</strong> de la Municipalidad Distrital de San Miguel, en mérito al Texto Único Ordenado de la Ley de Tributación Municipal (D.S. N° 156-2004-EF) y a los registros obrantes en el Sistema Integrado de Administración Tributaria:
                  </p>

                  <p style={{ fontWeight: 800, textAlign: 'center', fontSize: '0.95rem', margin: '0.85rem 0', color: 'var(--text-main)' }}>
                    CERTIFICA QUE:
                  </p>

                  <p>
                    El(La) contribuyente <strong>{constancia.contribuyenteNombre}</strong>, identificado(a) con <strong>{constancia.documentoTipo} N° {constancia.documentoNumero}</strong> y código tributario <strong>{constancia.contribuyenteCodigo}</strong>, respecto al predio con Código Registral <strong>{constancia.predioCodigo}</strong> ubicado en:
                  </p>

                  <div
                    style={{
                      background: 'var(--bg-card-subtle)',
                      padding: '0.75rem 1rem',
                      borderRadius: '8px',
                      margin: '0.75rem 0',
                      border: '1px solid var(--border-color)',
                      fontWeight: 600,
                    }}
                  >
                    {constancia.direccionPredio}
                  </div>

                  <p>
                    A la fecha y hora de emisión del presente documento, <strong>NO REGISTRA DEUDA TRIBUTARIA PENDIENTE DE PAGO</strong> por concepto de <strong>IMPUESTO PREDIAL</strong> ni <strong>ARBITRIOS MUNICIPALES</strong> (Limpieza Pública, Parques y Jardines, y Seguridad Ciudadana) hasta el Ejercicio Fiscal 2026.
                  </p>

                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.75rem' }}>
                    * Se expide la presente a solicitud del interesado para los fines que estime conveniente. Validez legal de 30 días calendario contados a partir de su emisión.
                  </p>
                </div>
              ) : (
                <div style={{ fontSize: '0.85rem', lineHeight: '1.6', color: 'var(--text-main)', marginBottom: '1.5rem', textAlign: 'justify' }}>
                  <div
                    style={{
                      background: 'var(--amber-50)',
                      border: '1px solid var(--amber-300)',
                      padding: '1rem',
                      borderRadius: '10px',
                      color: 'var(--amber-900)',
                      marginBottom: '1rem',
                    }}
                  >
                    <strong style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <AlertTriangle size={16} /> DICTAMEN: NO PROCEDE EMISIÓN DE CONSTANCIA
                    </strong>
                    <p style={{ margin: '0.5rem 0 0', fontSize: '0.8rem' }}>
                      El contribuyente registra obligaciones tributarias pendientes respecto al predio solicitado por concepto de Impuesto Predial y/o Arbitrios Municipales. Conforme al D.S. N° 156-2004-EF, no procede la expedición de la constancia de no adeudo hasta la regularización de las obligaciones pendientes.
                    </p>
                  </div>
                </div>
              )}

              {/* Recuadro Oficial de Firma Digital PAdES / RENIEC */}
              {constancia.firmadoDigitalmente && (
                <div
                  style={{
                    border: '1.5px dashed var(--green-600)',
                    background: 'var(--green-50)',
                    borderRadius: '10px',
                    padding: '1rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '1rem',
                  }}
                >
                  <div style={{ flex: 1, minWidth: '220px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                      <ShieldCheck size={18} color="var(--green-700)" />
                      <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--green-900)' }}>
                        DOCUMENTO FIRMADO DIGITALMENTE (LEY N° 27269)
                      </span>
                    </div>
                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--green-950)' }}>
                      {constancia.firmanteNombre}
                    </div>
                    <div style={{ fontSize: '0.725rem', color: 'var(--green-800)' }}>
                      {constancia.firmanteCargo}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--green-700)', marginTop: '0.2rem' }}>
                      Entidad: {constancia.entidadCertificadora}
                    </div>
                    <div style={{ fontSize: '0.675rem', color: 'var(--green-800)', marginTop: '0.2rem', fontFamily: 'var(--font-mono)' }}>
                      CVD: {constancia.hashCVD}
                    </div>
                  </div>

                  <div style={{ textAlign: 'center', background: 'white', padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--green-300)' }}>
                    <QrCode size={56} color="var(--green-800)" />
                    <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--green-800)', marginTop: '0.2rem' }}>
                      VALIDAR QR
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 3. Pie del Modal (Acciones) */}
        <div className="modal-footer">
          <button
            type="button"
            onClick={onClose}
            className="btn btn-secondary"
            style={{ fontSize: '0.85rem' }}
          >
            Cerrar
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="btn btn-secondary"
            style={{ fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
          >
            <Printer size={15} /> Imprimir
          </button>

          {constancia.firmadoDigitalmente && (
            <button
              type="button"
              onClick={handleDescargarPdf}
              className="btn btn-primary"
              style={{ fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
            >
              <Download size={15} /> Descargar PDF Firmado
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
