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
import {
  FilterSelectWrapper,
  FilterResetButton,
  ESTILO_SELECT_FILTRO,
  ESTILO_LABEL_FILTRO,
} from '@/components/shared/ui/FilterControls';
import { ConstanciaPdfModal } from './parts/ConstanciaPdfModal';

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
              Modo Privacidad
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

      {/* 5. Modal de Vista Previa Oficial y Visor PDF de la Constancia */}
      {constanciaSeleccionada && (
        <ConstanciaPdfModal
          constancia={constanciaSeleccionada}
          pdfData={pdfData}
          cargandoPdf={cargandoPdf}
          onClose={handleCerrarModalPdf}
        />
      )}
    </div>
  );
};
