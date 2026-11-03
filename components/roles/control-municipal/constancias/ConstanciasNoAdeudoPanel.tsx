'use client';

import React, { useState, useMemo } from 'react';
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
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight
} from 'lucide-react';
import { CardHeader, CardAside } from '@/components/shared/ui/CardHeader';
import { exportarCSV } from '@/utils/csv.utils';
import Image from 'next/image';

export interface ConstanciaItem {
  id: string;
  folio: string;
  contribuyenteCodigo: string;
  contribuyenteNombre: string;
  documentoTipo: 'DNI' | 'RUC';
  documentoNumero: string;
  predioCodigo: string;
  direccionPredio: string;
  estadoTributario: 'SIN_DEUDA' | 'REGISTRA_DEUDA';
  deudaMonto: number;
  firmadoDigitalmente: boolean;
  firmanteNombre: string;
  firmanteCargo: string;
  entidadCertificadora: string;
  hashCVD: string;
  fechaEmision: string;
  fechaVencimiento: string;
  qrUrl: string;
}

const MOCK_CONSTANCIAS: ConstanciaItem[] = [
  {
    id: 'c1',
    folio: 'CNA-2026-00382',
    contribuyenteCodigo: 'C-103112',
    contribuyenteNombre: 'RAMIREZ TORRES GUILLERMO',
    documentoTipo: 'DNI',
    documentoNumero: '07894561',
    predioCodigo: 'PRE-019482',
    direccionPredio: 'JR. LIBERTAD 820, DPTO 301, SAN MIGUEL',
    estadoTributario: 'SIN_DEUDA',
    deudaMonto: 0,
    firmadoDigitalmente: true,
    firmanteNombre: 'Abg. Carlos Mendoza Villavicencio',
    firmanteCargo: 'Subgerente de Recaudación y Control Tributario',
    entidadCertificadora: 'RENIEC - Entidad de Certificación del Estado Peruano (EC-EREP)',
    hashCVD: 'c7a9e102-4b89-4a91-99cd-382901aef114',
    fechaEmision: '02/11/2026 10:14:22',
    fechaVencimiento: '02/12/2026',
    qrUrl: 'https://servicios.munisanmiguel.gob.pe/validador?cvd=c7a9e102-4b89-4a91-99cd-382901aef114',
  },
  {
    id: 'c2',
    folio: 'CNA-2026-00383',
    contribuyenteCodigo: 'C-102041',
    contribuyenteNombre: 'CENTRO COMERCIAL PLAZA SAN MIGUEL S.A.',
    documentoTipo: 'RUC',
    documentoNumero: '20109988771',
    predioCodigo: 'PRE-002100',
    direccionPredio: 'AV. LA MARINA 2000, LOTE 01, SAN MIGUEL',
    estadoTributario: 'SIN_DEUDA',
    deudaMonto: 0,
    firmadoDigitalmente: true,
    firmanteNombre: 'Abg. Carlos Mendoza Villavicencio',
    firmanteCargo: 'Subgerente de Recaudación y Control Tributario',
    entidadCertificadora: 'RENIEC - Entidad de Certificación del Estado Peruano (EC-EREP)',
    hashCVD: '8f4b1192-ea31-4101-77cf-554201994b21',
    fechaEmision: '01/11/2026 16:45:00',
    fechaVencimiento: '01/12/2026',
    qrUrl: 'https://servicios.munisanmiguel.gob.pe/validador?cvd=8f4b1192-ea31-4101-77cf-554201994b21',
  },
  {
    id: 'c3',
    folio: 'CNA-2026-00384',
    contribuyenteCodigo: 'C-100455',
    contribuyenteNombre: 'GONZALES PEREZ JUAN CARLOS',
    documentoTipo: 'DNI',
    documentoNumero: '09876543',
    predioCodigo: 'PRE-088192',
    direccionPredio: 'CALLE LOS PATRIOTAS 340, SAN MIGUEL',
    estadoTributario: 'REGISTRA_DEUDA',
    deudaMonto: 7900.00,
    firmadoDigitalmente: false,
    firmanteNombre: 'Subgerencia de Recaudación',
    firmanteCargo: 'Dictamen de Observación Tributaria',
    entidadCertificadora: 'Pendiente de subsanación de pago',
    hashCVD: 'DENEGADO-DEUDA-PENDIENTE',
    fechaEmision: '02/11/2026 11:20:15',
    fechaVencimiento: 'N/A',
    qrUrl: '',
  },
  {
    id: 'c4',
    folio: 'CNA-2026-00385',
    contribuyenteCodigo: 'C-103450',
    contribuyenteNombre: 'VEGA SILVA BEATRIZ ELVIRA',
    documentoTipo: 'DNI',
    documentoNumero: '09456712',
    predioCodigo: 'PRE-044211',
    direccionPredio: 'AV. FEDERICO GALLESE 310, DPTO 402, SAN MIGUEL',
    estadoTributario: 'SIN_DEUDA',
    deudaMonto: 0,
    firmadoDigitalmente: true,
    firmanteNombre: 'Abg. Carlos Mendoza Villavicencio',
    firmanteCargo: 'Subgerente de Recaudación y Control Tributario',
    entidadCertificadora: 'RENIEC - Entidad de Certificación del Estado Peruano (EC-EREP)',
    hashCVD: '33e14a90-8812-4c22-b519-90214811a432',
    fechaEmision: '30/10/2026 09:12:30',
    fechaVencimiento: '30/11/2026',
    qrUrl: 'https://servicios.munisanmiguel.gob.pe/validador?cvd=33e14a90-8812-4c22-b519-90214811a432',
  },
  {
    id: 'c5',
    folio: 'CNA-2026-00386',
    contribuyenteCodigo: 'C-100892',
    contribuyenteNombre: 'CONSTRUCTORA COSTANERA S.R.L.',
    documentoTipo: 'RUC',
    documentoNumero: '20609876541',
    predioCodigo: 'PRE-099230',
    direccionPredio: 'AV. COSTANERA 1250, SAN MIGUEL',
    estadoTributario: 'REGISTRA_DEUDA',
    deudaMonto: 57170.00,
    firmadoDigitalmente: false,
    firmanteNombre: 'Subgerencia de Recaudación',
    firmanteCargo: 'Dictamen de Observación Tributaria',
    entidadCertificadora: 'Pendiente de subsanación de pago',
    hashCVD: 'DENEGADO-DEUDA-PENDIENTE',
    fechaEmision: '29/10/2026 14:05:00',
    fechaVencimiento: 'N/A',
    qrUrl: '',
  },
];

export const ConstanciasNoAdeudoPanel: React.FC = () => {
  const [constancias] = useState<ConstanciaItem[]>(MOCK_CONSTANCIAS);
  const [filtroEstado, setFiltroEstado] = useState<string>('TODOS');
  const [busqueda, setBusqueda] = useState<string>('');
  const [constanciaSeleccionada, setConstanciaSeleccionada] = useState<ConstanciaItem | null>(null);

  // Paginación y Privacidad LPDP
  const [paginaActual, setPaginaActual] = useState(1);
  const [registrosPorPagina, setRegistrosPorPagina] = useState(10);
  const [enmascararPrivacidad, setEnmascararPrivacidad] = useState(false);

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
      c.contribuyenteNombre,
      c.documentoTipo,
      c.documentoNumero,
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', flex: 1 }}>
            <div style={{ minWidth: '260px', flex: 1 }}>
              <div style={{ position: 'relative' }}>
                <Search size={15} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  placeholder="Buscar por DNI, RUC, Folio o Nombre..."
                  value={busqueda}
                  onChange={(e) => {
                    setBusqueda(e.target.value);
                    setPaginaActual(1);
                  }}
                  style={{ width: '100%', padding: '0.45rem 0.75rem 0.45rem 2rem', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '0.85rem' }}
                />
              </div>
            </div>

            <div>
              <select
                value={filtroEstado}
                onChange={(e) => {
                  setFiltroEstado(e.target.value);
                  setPaginaActual(1);
                }}
                style={{ padding: '0.45rem 0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '0.85rem' }}
              >
                <option value="TODOS">Todos los Estados</option>
                <option value="FIRMADO">Firmadas Digitalmente (Aptas)</option>
                <option value="DEUDA">Observadas con Deuda</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
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
              className="btn btn-secondary"
              style={{ fontSize: '0.85rem' }}
            >
              <Download size={15} />
              Exportar Relación (CSV)
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
                        onClick={() => setConstanciaSeleccionada(c)}
                        className="btn btn-secondary"
                        style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem' }}
                        title="Ver constancia oficial con membrete y firma digital"
                      >
                        <Eye size={13} />
                        Ver Constancia
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
              onClick={() => setConstanciaSeleccionada(null)}
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
                onClick={() => setConstanciaSeleccionada(null)}
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
                  onClick={() => alert(`Descargando ${constanciaSeleccionada.folio}.pdf con firma digital PAdES incrustada...`)}
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
