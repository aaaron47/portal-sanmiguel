'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { 
  FileCheck, 
  Search, 
  Download, 
  Eye, 
  EyeOff,
  ShieldCheck, 
  AlertTriangle, 
  QrCode, 
  Printer, 
  X,
  FileText,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight
} from 'lucide-react';
import { CardHeader, CardAside } from '@/components/shared/ui/CardHeader';
import { exportarCSV } from '@/utils/csv.utils';
import {
  ConstanciaItem,
  ConstanciaPdfResponse,
} from '@/types/reportes-tributarios.types';
import { MOCK_CONSTANCIAS, reportesController } from '@/controllers/reportes.controller';
import Image from 'next/image';
import {
  FilterSelectWrapper,
  FilterResetButton,
  ESTILO_SELECT_FILTRO,
  ESTILO_LABEL_FILTRO,
} from '@/components/shared/ui/FilterControls';

export type { ConstanciaItem };

export const ConstanciasNoAdeudoPanel: React.FC = () => {
  const [constancias, setConstancias] = useState<ConstanciaItem[]>(MOCK_CONSTANCIAS);
  const [filtroEstado, setFiltroEstado] = useState<string>('TODOS');
  const [busqueda, setBusqueda] = useState<string>('');
  const [constanciaSeleccionada, setConstanciaSeleccionada] = useState<ConstanciaItem | null>(null);
  const [pdfData, setPdfData] = useState<ConstanciaPdfResponse | null>(null);
  const [cargandoPdf, setCargandoPdf] = useState<boolean>(false);

  // Paginación y Privacidad LPDP
  const [paginaActual, setPaginaActual] = useState(1);
  const [registrosPorPagina, setRegistrosPorPagina] = useState(10);
  const [enmascararPrivacidad, setEnmascararPrivacidad] = useState(false);

  useEffect(() => {
    let cancelado = false;
    reportesController
      .getConstancias({
        estado: filtroEstado,
        busqueda,
        pagina: paginaActual,
        tamano: registrosPorPagina,
        enmascararPrivacidad,
      })
      .then((res) => {
        if (!cancelado && res.items) {
          setConstancias(res.items);
        }
      })
      .catch(() => {
        // En caso de error de red fuera de demo, mantiene estado actual
      });

    return () => {
      cancelado = true;
    };
  }, [filtroEstado, busqueda, paginaActual, registrosPorPagina, enmascararPrivacidad]);

  const handleVerConstancia = async (item: ConstanciaItem) => {
    setConstanciaSeleccionada(item);
    setPdfData(null);
    setCargandoPdf(true);
    try {
      const respPdf = await reportesController.getConstanciaPdf(item.id);
      setPdfData(respPdf);
      if (respPdf.detalle) {
        setConstanciaSeleccionada(respPdf.detalle);
      }
    } catch {
      setPdfData(null);
    } finally {
      setCargandoPdf(false);
    }
  };

  const handleCerrarModalPdf = () => {
    setConstanciaSeleccionada(null);
    setPdfData(null);
  };

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

  const handleDescargarPdfFirmado = () => {
    if (!constanciaSeleccionada) return;
    const nombreArchivo = pdfData?.nombreArchivo || `${constanciaSeleccionada.folio}.pdf`;
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

  // Filtrado reactivo
  const constanciasFiltradas = useMemo(() => {
    return constancias.filter((item) => {
      const matchEstado =
        filtroEstado === 'TODOS' ||
        (filtroEstado === 'FIRMADO' && item.firmadoDigitalmente) ||
        (filtroEstado === 'DEUDA' && item.estadoTributario === 'REGISTRA_DEUDA');

      const matchTexto =
        !busqueda.trim() ||
        item.folio.toLowerCase().includes(busqueda.toLowerCase()) ||
        item.contribuyenteNombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        item.documentoNumero.includes(busqueda) ||
        item.predioCodigo.toLowerCase().includes(busqueda.toLowerCase());

      return matchEstado && matchTexto;
    });
  }, [constancias, filtroEstado, busqueda]);

  // Cálculo de paginación
  const totalPaginas = Math.max(1, Math.ceil(constanciasFiltradas.length / registrosPorPagina));
  const paginaAjustada = Math.min(paginaActual, totalPaginas);
  const indiceInicio = constanciasFiltradas.length === 0 ? 0 : (paginaAjustada - 1) * registrosPorPagina + 1;
  const indiceFin = Math.min(paginaAjustada * registrosPorPagina, constanciasFiltradas.length);
  const constanciasPaginadas = constanciasFiltradas.slice(
    (paginaAjustada - 1) * registrosPorPagina,
    paginaAjustada * registrosPorPagina
  );

  const enmascararTexto = (texto: string) => {
    if (!enmascararPrivacidad) return texto;
    const palabras = texto.split(' ');
    return palabras
      .map((p) => (p.length > 2 ? `${p[0]}${'*'.repeat(Math.min(4, p.length - 1))}` : p))
      .join(' ');
  };

  // Exportar relación a CSV
  const handleExportarRelacion = () => {
    const cabeceras = [
      'Folio Trámite',
      'Código Contribuyente',
      'Razón Social / Nombres',
      'Tipo Doc',
      'Número Documento',
      'Código Predio',
      'Dirección Predial',
      'Estado Tributario',
      'Monto Deuda (S/)',
      'Firma Digital PAdES',
      'Entidad Certificadora',
      'Código Verificación Digital (CVD)',
      'Fecha Emisión',
      'Fecha Vencimiento',
    ];

    const filas = constanciasFiltradas.map((c) => [
      c.folio,
      c.contribuyenteCodigo,
      enmascararPrivacidad ? enmascararTexto(c.contribuyenteNombre) : c.contribuyenteNombre,
      c.documentoTipo,
      enmascararPrivacidad && c.documentoNumero.length > 4
        ? `${c.documentoNumero.slice(0, 2)}****${c.documentoNumero.slice(-2)}`
        : c.documentoNumero,
      c.predioCodigo,
      c.direccionPredio,
      c.estadoTributario === 'SIN_DEUDA' ? 'SIN DEUDA AL DIA' : 'REGISTRA DEUDA',
      c.deudaMonto.toString(),
      c.firmadoDigitalmente ? 'FIRMADO DIGITALMENTE' : 'NO EMITIDO / OBSERVADO',
      c.entidadCertificadora,
      c.hashCVD,
      c.fechaEmision,
      c.fechaVencimiento,
    ]);

    exportarCSV('Relacion_Constancias_NoAdeudo_2026', cabeceras, filas);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* 1. Filtros, Búsqueda y Modo Privacidad */}
      <div className="card" style={{ padding: '1rem 1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', flex: 1, alignItems: 'flex-end' }}>
            <div style={{ minWidth: '240px', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <label style={ESTILO_LABEL_FILTRO}>Búsqueda</label>
              <div style={{ position: 'relative' }}>
                <Search size={15} style={{ position: 'absolute', left: '10px', top: '12px', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  placeholder="Buscar por DNI, RUC, Folio o Nombre..."
                  value={busqueda}
                  onChange={(e) => {
                    setBusqueda(e.target.value);
                    setPaginaActual(1);
                  }}
                  style={{ width: '100%', height: '38px', padding: '0.45rem 0.75rem 0.45rem 2rem', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '0.85rem', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            <FilterSelectWrapper label="Estado">
              <select
                aria-label="Filtrar por estado"
                value={filtroEstado}
                onChange={(e) => {
                  setFiltroEstado(e.target.value);
                  setPaginaActual(1);
                }}
                style={ESTILO_SELECT_FILTRO}
              >
                <option value="TODOS">Todo</option>
                <option value="FIRMADO">Firmadas</option>
                <option value="DEUDA">Con Deuda</option>
              </select>
            </FilterSelectWrapper>

            <FilterResetButton
              onReset={() => {
                setBusqueda('');
                setFiltroEstado('TODOS');
                setPaginaActual(1);
              }}
              activo={Boolean(busqueda.trim() || filtroEstado !== 'TODOS')}
              title="Eliminar filtros de constancias"
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', paddingBottom: '0.1rem' }}>
            <button
              type="button"
              onClick={() => setEnmascararPrivacidad(!enmascararPrivacidad)}
              className={`btn ${enmascararPrivacidad ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '0.85rem' }}
              title="Enmascarar datos de personas según Ley 29733 de Protección de Datos Personales"
            >
              {enmascararPrivacidad ? <EyeOff size={15} /> : <Eye size={15} />}
              {enmascararPrivacidad ? 'Privacidad: Nombres Enmascarados' : 'Modo Privacidad LPDP'}
            </button>

            <button
              onClick={handleExportarRelacion}
              className="btn btn-primary"
              style={{ fontSize: '0.85rem' }}
            >
              <Download size={15} />
              Exportar CSV
            </button>
          </div>
        </div>
      </div>

      {/* 2. Tabla de Expedientes de Constancias de No Adeudo */}
      <div className="card">
        <CardHeader
          icon={<FileCheck size={20} />}
          title="Expedientes de Constancias de No Adeudo Tributario"
          aside={<CardAside>Auditoría de firmas y validez tributaria</CardAside>}
        />

        <div className="table-container" style={{ overflowX: 'auto', marginTop: '0.5rem' }}>
          <table className="data-table" style={{ fontSize: '0.85rem' }}>
            <thead>
              <tr>
                <th>Folio</th>
                <th>Contribuyente</th>
                <th>Doc. Identidad</th>
                <th>Código Predio</th>
                <th>Dirección</th>
                <th>Estado Tributario</th>
                <th>Firma Digital</th>
                <th>Fecha Emisión</th>
                <th style={{ textAlign: 'center' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {constanciasFiltradas.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                    No se encontraron constancias con los filtros aplicados.
                  </td>
                </tr>
              ) : (
                constanciasPaginadas.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <span className="badge badge-neutral" style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                        {c.folio}
                      </span>
                    </td>
                    <td>
                      <strong style={{ color: 'var(--text-main)', fontSize: '0.85rem' }}>
                        {enmascararTexto(c.contribuyenteNombre)}
                      </strong>
                      <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>Cód: {c.contribuyenteCodigo}</div>
                    </td>
                    <td>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
                        {c.documentoTipo}: {enmascararPrivacidad ? `${c.documentoNumero.slice(0, 2)}****${c.documentoNumero.slice(-2)}` : c.documentoNumero}
                      </span>
                    </td>
                    <td>
                      <span className="badge badge-neutral" style={{ fontFamily: 'var(--font-mono)' }}>
                        {c.predioCodigo}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.75rem', maxWidth: '200px', color: 'var(--text-muted)' }} title={c.direccionPredio}>
                      {c.direccionPredio}
                    </td>
                    <td>
                      {c.estadoTributario === 'SIN_DEUDA' ? (
                        <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                          <ShieldCheck size={12} /> Sin Deuda
                        </span>
                      ) : (
                        <span className="badge badge-danger" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                          <AlertTriangle size={12} /> Deuda S/ {c.deudaMonto.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                        </span>
                      )}
                    </td>
                    <td>
                      {c.firmadoDigitalmente ? (
                        <span className="badge badge-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                          <FileCheck size={12} /> PAdES RENIEC
                        </span>
                      ) : (
                        <span className="badge badge-neutral" style={{ color: 'var(--text-muted)' }}>
                          No Emitida
                        </span>
                      )}
                    </td>
                    <td style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>
                      {c.fechaEmision}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button
                        onClick={() => handleVerConstancia(c)}
                        className="btn btn-secondary"
                        style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}
                        title="Ver constancia oficial (PDF)"
                      >
                        <ExternalLink size={14} /> Ver
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Barra de Paginación */}
        {constanciasFiltradas.length > 0 && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '0.75rem',
              padding: '0.75rem 0.5rem 0.25rem',
              fontSize: '0.75rem',
              color: 'var(--text-muted)',
              borderTop: '1px solid var(--border-color)',
              marginTop: '0.5rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <span>
                Mostrando <strong>{indiceInicio}</strong> – <strong>{indiceFin}</strong> de <strong>{constanciasFiltradas.length}</strong> constancias
              </span>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span>Por página:</span>
                <select
                  value={registrosPorPagina}
                  onChange={(e) => {
                    setRegistrosPorPagina(Number(e.target.value));
                    setPaginaActual(1);
                  }}
                  style={{
                    padding: '0.2rem 0.4rem',
                    borderRadius: '6px',
                    border: '1px solid var(--border-color)',
                    fontSize: '0.75rem',
                    background: 'var(--bg-card)',
                    color: 'var(--text-main)',
                  }}
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <button
                onClick={() => setPaginaActual(1)}
                disabled={paginaAjustada === 1}
                className="btn btn-secondary"
                style={{ padding: '0.25rem 0.45rem', fontSize: '0.75rem' }}
                title="Primera Página"
              >
                <ChevronsLeft size={14} />
              </button>

              <button
                onClick={() => setPaginaActual((prev) => Math.max(1, prev - 1))}
                disabled={paginaAjustada === 1}
                className="btn btn-secondary"
                style={{ padding: '0.25rem 0.45rem', fontSize: '0.75rem' }}
                title="Página Anterior"
              >
                <ChevronLeft size={14} />
              </button>

              <span style={{ margin: '0 0.5rem', fontWeight: 600, color: 'var(--text-main)' }}>
                Página {paginaAjustada} de {totalPaginas}
              </span>

              <button
                onClick={() => setPaginaActual((prev) => Math.min(totalPaginas, prev + 1))}
                disabled={paginaAjustada === totalPaginas}
                className="btn btn-secondary"
                style={{ padding: '0.25rem 0.45rem', fontSize: '0.75rem' }}
                title="Página Siguiente"
              >
                <ChevronRight size={14} />
              </button>

              <button
                onClick={() => setPaginaActual(totalPaginas)}
                disabled={paginaAjustada === totalPaginas}
                className="btn btn-secondary"
                style={{ padding: '0.25rem 0.45rem', fontSize: '0.75rem' }}
                title="Última Página"
              >
                <ChevronsRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 5. Modal de Vista Previa Oficial del Certificado con Firma Digital PAdES */}
      {constanciaSeleccionada && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.65)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '1.5rem',
        }}>
          <div style={{
            background: 'var(--bg-card)',
            color: 'var(--text-main)',
            borderRadius: '14px',
            maxWidth: '720px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '2rem',
            boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
            position: 'relative',
            border: '1px solid var(--border-color)',
          }}>
            {/* Botón Cerrar */}
            <button
              onClick={handleCerrarModalPdf}
              style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
              }}
            >
              <X size={20} />
            </button>

            {cargandoPdf && (
              <div style={{ textAlign: 'center', padding: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Consultando documento PDF en el servidor...
              </div>
            )}

            {/* Si el endpoint GET /reportes/constancias/:id/pdf devuelve pdfUrl o pdfBase64, se incrusta el visor PDF */}
            {pdfEmbedSrc && (
              <div style={{ marginBottom: '1.25rem', border: '1px solid var(--border-color)', borderRadius: '10px', overflow: 'hidden' }}>
                <iframe
                  src={pdfEmbedSrc}
                  title={`PDF ${constanciaSeleccionada.folio}`}
                  style={{ width: '100%', height: '520px', border: 'none', display: 'block' }}
                />
              </div>
            )}

            {/* Membrete Oficial Municipal */}
            <div style={{ textAlign: 'center', borderBottom: '2px solid var(--sky-700)', paddingBottom: '1rem', marginBottom: '1.25rem' }}>
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
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 900, color: 'var(--sky-800)', margin: 0, textTransform: 'uppercase' }}>
                CONSTANCIA DE NO ADEUDO TRIBUTARIO
              </h2>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                N° {constanciaSeleccionada.folio}
              </div>
            </div>

            {/* Cuerpo del Certificado */}
            {constanciaSeleccionada.estadoTributario === 'SIN_DEUDA' ? (
              <div style={{ fontSize: '0.85rem', lineHeight: '1.6', color: 'var(--text-main)', marginBottom: '1.5rem', textAlign: 'justify' }}>
                <p>
                  La <strong>Subgerencia de Recaudación y Control Tributario</strong> de la Municipalidad Distrital de San Miguel, en mérito al Texto Único Ordenado de la Ley de Tributación Municipal (D.S. N° 156-2004-EF) y a los registros obrantes en el Sistema Integrado de Administración Tributaria:
                </p>

                <p style={{ fontWeight: 800, textAlign: 'center', fontSize: '0.95rem', margin: '1rem 0', color: 'var(--text-main)' }}>
                  CERTIFICA QUE:
                </p>

                <p>
                  El(La) contribuyente <strong>{constanciaSeleccionada.contribuyenteNombre}</strong>, identificado(a) con <strong>{constanciaSeleccionada.documentoTipo} N° {constanciaSeleccionada.documentoNumero}</strong> y código tributario <strong>{constanciaSeleccionada.contribuyenteCodigo}</strong>, respecto al predio con Código Registral <strong>{constanciaSeleccionada.predioCodigo}</strong> ubicado en:
                </p>

                <div style={{ background: 'var(--bg-card-subtle)', padding: '0.75rem 1rem', borderRadius: '8px', margin: '0.75rem 0', border: '1px solid var(--border-color)', fontWeight: 600 }}>
                  {constanciaSeleccionada.direccionPredio}
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
                <div style={{ background: 'var(--amber-50)', border: '1px solid var(--amber-300)', padding: '1rem', borderRadius: '10px', color: 'var(--amber-900)', marginBottom: '1rem' }}>
                  <strong style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <AlertTriangle size={16} /> DICTAMEN: NO PROCEDE EMISIÓN DE CONSTANCIA
                  </strong>
                  <p style={{ margin: '0.5rem 0 0', fontSize: '0.8rem' }}>
                    El contribuyente registra un saldo deudor tributario pendiente de pago por el monto total de <strong>S/ {constanciaSeleccionada.deudaMonto.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</strong> por concepto de Impuesto Predial y Arbitrios. Para subsanar y obtener la constancia, deberá cancelar la deuda o acogerse a un convenio de fraccionamiento tributario.
                  </p>
                </div>
              </div>
            )}

            {/* Recuadro Oficial de Firma Digital PAdES / RENIEC */}
            {constanciaSeleccionada.firmadoDigitalmente && (
              <div style={{
                border: '1.5px dashed var(--green-600)',
                background: 'var(--green-50)',
                borderRadius: '10px',
                padding: '1rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '1rem',
                marginBottom: '1.5rem',
              }}>
                <div style={{ flex: 1, minWidth: '220px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                    <ShieldCheck size={18} color="var(--green-700)" />
                    <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--green-900)' }}>
                      DOCUMENTO FIRMADO DIGITALMENTE (LEY N° 27269)
                    </span>
                  </div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--green-950)' }}>
                    {constanciaSeleccionada.firmanteNombre}
                  </div>
                  <div style={{ fontSize: '0.725rem', color: 'var(--green-800)' }}>
                    {constanciaSeleccionada.firmanteCargo}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--green-700)', marginTop: '0.2rem' }}>
                    Entidad: {constanciaSeleccionada.entidadCertificadora}
                  </div>
                  <div style={{ fontSize: '0.675rem', color: 'var(--green-800)', marginTop: '0.2rem', fontFamily: 'var(--font-mono)' }}>
                    CVD: {constanciaSeleccionada.hashCVD}
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

            {/* Botones de Acción */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
              <button
                onClick={handleCerrarModalPdf}
                className="btn btn-secondary"
                style={{ fontSize: '0.85rem' }}
              >
                Cerrar
              </button>

              <button
                onClick={() => window.print()}
                className="btn btn-secondary"
                style={{ fontSize: '0.85rem' }}
              >
                <Printer size={15} /> Imprimir
              </button>

              {constanciaSeleccionada.firmadoDigitalmente && (
                <button
                  onClick={handleDescargarPdfFirmado}
                  className="btn btn-primary"
                  style={{ fontSize: '0.85rem' }}
                >
                  <FileText size={15} /> Descargar PDF Firmado
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
