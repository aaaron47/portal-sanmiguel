'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  Table,
  Download,
  Search,
  Filter,
  FilterX,
  Eye,
  EyeOff,
  Calendar,
  Layers,
  CheckCircle2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight
} from 'lucide-react';
import { CATALOGO_REPORTES_OFICIALES, ReporteItemInfo } from '@/types/reportes-tributarios.types';
import { reportesController } from '@/controllers/reportes.controller';
import { exportarCSV } from '@/utils/csv.utils';

export const ReportesTributariosView: React.FC = () => {
  const [reporteSeleccionadoCodigo, setReporteSeleccionadoCodigo] = useState<string>('R1');
  const [tributoFiltro, setTributoFiltro] = useState<string>('TODOS');
  const [periodoFiltro, setPeriodoFiltro] = useState<string>('2026');
  const [busquedaTexto, setBusquedaTexto] = useState<string>('');
  const [enmascararPrivacidad, setEnmascararPrivacidad] = useState<boolean>(false);

  // Paginación y datos traídos desde el endpoint GET /reportes/tributarios/:codigo
  const [paginaActual, setPaginaActual] = useState(1);
  const [registrosPorPagina, setRegistrosPorPagina] = useState(10);
  const [filasPaginadas, setFilasPaginadas] = useState<string[][]>([]);
  const [totalRegistros, setTotalRegistros] = useState<number>(0);
  const [totalPaginasServidor, setTotalPaginasServidor] = useState<number>(1);
  // Consulta que respondió por última vez; mientras no coincida con la actual, la tabla está cargando.
  const [consultaCargada, setConsultaCargada] = useState<string | null>(null);

  // Reporte activo del catálogo oficial R1 a R11
  const reporteActual: ReporteItemInfo = useMemo(() => {
    return CATALOGO_REPORTES_OFICIALES.find((r) => r.codigo === reporteSeleccionadoCodigo)
      || CATALOGO_REPORTES_OFICIALES[0];
  }, [reporteSeleccionadoCodigo]);

  const consultaActual = JSON.stringify([
    reporteActual.codigo,
    tributoFiltro,
    periodoFiltro,
    busquedaTexto,
    paginaActual,
    registrosPorPagina,
    enmascararPrivacidad,
  ]);
  const cargando = consultaCargada !== consultaActual;

  useEffect(() => {
    let cancelado = false;

    reportesController
      .getReporteTributario({
        codigo: reporteActual.codigo,
        tributo: tributoFiltro,
        periodo: periodoFiltro,
        busqueda: busquedaTexto,
        pagina: paginaActual,
        tamano: registrosPorPagina,
        enmascararPrivacidad,
      })
      .then((res) => {
        if (cancelado) return;
        setConsultaCargada(consultaActual);
        setFilasPaginadas(res.filas);
        setTotalRegistros(res.totalRegistros);
        setTotalPaginasServidor(Math.max(1, res.totalPaginas));
      })
      .catch(() => {
        if (cancelado) return;
        setConsultaCargada(consultaActual);
        setFilasPaginadas([]);
        setTotalRegistros(0);
        setTotalPaginasServidor(1);
      });

    return () => {
      cancelado = true;
    };
  }, [
    consultaActual,
    reporteActual.codigo,
    tributoFiltro,
    periodoFiltro,
    busquedaTexto,
    paginaActual,
    registrosPorPagina,
    enmascararPrivacidad,
  ]);

  // Cálculo de Paginación
  const totalPaginas = Math.max(1, totalPaginasServidor);
  const paginaAjustada = Math.min(paginaActual, totalPaginas);
  const indiceInicio = totalRegistros === 0 ? 0 : (paginaAjustada - 1) * registrosPorPagina + 1;
  const indiceFin = Math.min(paginaAjustada * registrosPorPagina, totalRegistros);

  const enmascararValor = (valor: string, colIdx: number) => {
    if (!enmascararPrivacidad) return valor;
    const cabecera = (reporteActual.cabeceras[colIdx] || '').toLowerCase();
    if (
      cabecera.includes('contribuyente') ||
      cabecera.includes('razon') ||
      cabecera.includes('nombre') ||
      cabecera.includes('titular')
    ) {
      return valor
        .split(' ')
        .map((p) => (p.length > 2 ? `${p[0]}${'*'.repeat(Math.min(4, p.length - 1))}` : p))
        .join(' ');
    }
    if (
      cabecera.includes('documento') ||
      cabecera.includes('dni') ||
      cabecera.includes('ruc')
    ) {
      return valor.length > 4 ? `${valor.slice(0, 2)}****${valor.slice(-2)}` : valor;
    }
    return valor;
  };

  // Exportación a CSV con respeto al Modo Privacidad LPDP
  const handleExportar = async () => {
    try {
      const resCompleta = await reportesController.getReporteTributario({
        codigo: reporteActual.codigo,
        tributo: tributoFiltro,
        periodo: periodoFiltro,
        busqueda: busquedaTexto,
        pagina: 1,
        tamano: 10000,
        enmascararPrivacidad,
      });

      const filasBase = resCompleta.filas.length > 0 ? resCompleta.filas : filasPaginadas;
      const filasAExportar = enmascararPrivacidad
        ? filasBase.map((fila) =>
            fila.map((celda, colIdx) => enmascararValor(celda, colIdx))
          )
        : filasBase;

      exportarCSV(
        `Reporte_${reporteActual.codigo}_${reporteActual.nombre.replace(/\s+/g, '_')}_${periodoFiltro}`,
        reporteActual.cabeceras,
        filasAExportar
      );
    } catch {
      const filasAExportar = enmascararPrivacidad
        ? filasPaginadas.map((fila) =>
            fila.map((celda, colIdx) => enmascararValor(celda, colIdx))
          )
        : filasPaginadas;

      exportarCSV(
        `Reporte_${reporteActual.codigo}_${reporteActual.nombre.replace(/\s+/g, '_')}_${periodoFiltro}`,
        reporteActual.cabeceras,
        filasAExportar
      );
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* 1. Header con Filtros de Solicitud de Información Municipal */}
      <div className="card" style={{ padding: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Table size={22} color="var(--sky-600)" />
              Reportes Tributarios
            </h2>
            <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', margin: '0.25rem 0 0' }}>
              Base tabular de fiscalización municipal para Impuesto Predial y Arbitrios requerida por la Municipalidad.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => setEnmascararPrivacidad(!enmascararPrivacidad)}
              className={`btn ${enmascararPrivacidad ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '0.85rem' }}
              title="Enmascarar nombres de personas según la Ley de Protección de Datos Personales"
            >
              {enmascararPrivacidad ? <EyeOff size={15} /> : <Eye size={15} />}
              {enmascararPrivacidad ? 'Nombres Enmascarados (LPDP)' : 'Modo Privacidad'}
            </button>

            <button
              onClick={handleExportar}
              className="btn btn-primary"
              style={{ fontSize: '0.85rem' }}
            >
              <Download size={16} />
              Exportar CSV
            </button>
          </div>
        </div>

        {/* Barra de Filtros */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: '1rem',
        }}>
          {/* Selector de Reporte R1 - R11 */}
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
              <Layers size={13} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
              Reporte Oficial Solicitado:
            </label>
            <select
              value={reporteSeleccionadoCodigo}
              onChange={(e) => setReporteSeleccionadoCodigo(e.target.value)}
              style={{ width: '100%', padding: '0.45rem 0.65rem', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '0.85rem', fontWeight: 600 }}
            >
              {CATALOGO_REPORTES_OFICIALES.map((rep) => (
                <option key={rep.codigo} value={rep.codigo}>
                  [{rep.codigo}] {rep.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Selector de Tributo */}
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
              <Filter size={13} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
              Tributo Municipal:
            </label>
            <select
              value={tributoFiltro}
              onChange={(e) => setTributoFiltro(e.target.value)}
              style={{ width: '100%', padding: '0.45rem 0.65rem', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '0.85rem' }}
            >
              <option value="TODOS">Predial y Arbitrios (Consolidado)</option>
              <option value="PREDIAL">Solo Impuesto Predial</option>
              <option value="ARBITRIOS">Solo Arbitrios Municipales</option>
            </select>
          </div>

          {/* Selector de Periodo */}
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
              <Calendar size={13} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
              Periodo / Ejercicio Fiscal:
            </label>
            <select
              value={periodoFiltro}
              onChange={(e) => setPeriodoFiltro(e.target.value)}
              style={{ width: '100%', padding: '0.45rem 0.65rem', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '0.85rem' }}
            >
              <option value="2026">Ejercicio Fiscal 2026 (En Curso)</option>
              <option value="2025">Ejercicio Fiscal 2025</option>
              <option value="2022-2025">Cuatrienio 2022 - 2025</option>
              <option value="HISTORICO">Histórico (1900 - 2025)</option>
            </select>
          </div>

          {/* Búsqueda rápida por texto y Limpiar Filtros */}
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
              <Search size={13} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
              Buscar en la Tabla:
            </label>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <input
                type="text"
                placeholder="DNI, RUC, Razón Social..."
                value={busquedaTexto}
                onChange={(e) => setBusquedaTexto(e.target.value)}
                style={{ width: '100%', height: '38px', padding: '0.45rem 0.65rem', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '0.85rem', boxSizing: 'border-box' }}
              />
              <button
                type="button"
                onClick={() => {
                  setBusquedaTexto('');
                  setTributoFiltro('TODOS');
                  setPeriodoFiltro('2026');
                }}
                disabled={!busquedaTexto.trim() && tributoFiltro === 'TODOS' && periodoFiltro === '2026'}
                className="btn btn-secondary"
                style={{
                  width: '38px',
                  height: '38px',
                  minWidth: '38px',
                  padding: 0,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '8px',
                  opacity: (busquedaTexto.trim() || tributoFiltro !== 'TODOS' || periodoFiltro !== '2026') ? 1 : 0.45,
                  cursor: (busquedaTexto.trim() || tributoFiltro !== 'TODOS' || periodoFiltro !== '2026') ? 'pointer' : 'default',
                  boxSizing: 'border-box',
                }}
                title="Eliminar filtros del reporte"
                aria-label="Eliminar filtros del reporte"
              >
                <FilterX size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Ficha descriptiva del reporte seleccionado */}
        <div style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
          <span className="badge badge-primary" style={{ marginRight: '0.5rem', fontWeight: 700 }}>
            {reporteActual.codigo}
          </span>
          <strong style={{ fontSize: '0.9rem', color: 'var(--text-main)' }}>{reporteActual.nombre}</strong>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginLeft: '0.5rem' }}>
            — {reporteActual.descripcion}
          </span>
        </div>
      </div>

      {/* 2. Tabla de Datos Oficiales */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Eye size={18} color="var(--sky-600)" />
            Vista Tabular de Datos Requerida por la Municipalidad
          </h3>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
            Columnas según requerimiento tributario oficial de la Municipalidad de San Miguel
          </span>
        </div>

        <div className="table-container" style={{ overflowX: 'auto', maxHeight: '550px' }}>
          <table className="data-table" style={{ fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
            <thead>
              <tr style={{ background: 'var(--bg-card-subtle)', position: 'sticky', top: 0, zIndex: 1 }}>
                <th style={{ width: '40px' }}>#</th>
                {reporteActual.cabeceras.map((cab, idx) => (
                  <th key={idx} style={{ padding: '0.6rem 0.75rem', textAlign: 'left', fontWeight: 700 }}>
                    {cab}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cargando ? (
                <tr>
                  <td colSpan={reporteActual.cabeceras.length + 1} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                    Cargando registros del reporte {reporteActual.codigo}...
                  </td>
                </tr>
              ) : filasPaginadas.length === 0 ? (
                <tr>
                  <td colSpan={reporteActual.cabeceras.length + 1} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                    No se encontraron registros con los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                filasPaginadas.map((fila, fIdx) => {
                  const numeroFila = (paginaAjustada - 1) * registrosPorPagina + fIdx + 1;
                  return (
                    <tr key={fIdx}>
                      <td style={{ color: 'var(--text-muted)', fontWeight: 600 }}>{numeroFila}</td>
                      {fila.map((celdaRaw, cIdx) => {
                        const celda = enmascararValor(celdaRaw, cIdx);
                        const esMoneda = celdaRaw.includes('.') && !isNaN(Number(celdaRaw)) && Number(celdaRaw) > 0;
                        const esPorcentaje = celdaRaw.endsWith('%');
                        const esEstadoPositivo = celdaRaw === 'HABIDO' || celdaRaw === 'SI' || celdaRaw === 'OPORTUNO';
                        const esEstadoNegativo = celdaRaw === 'NO' || celdaRaw.includes('ATRASO') || celdaRaw.includes('INCUMPLIDO');

                        return (
                          <td key={cIdx} style={{ padding: '0.55rem 0.75rem' }}>
                            {esEstadoPositivo ? (
                              <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                                <CheckCircle2 size={11} /> {celda}
                              </span>
                            ) : esEstadoNegativo ? (
                              <span className="badge badge-danger" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                                <AlertCircle size={11} /> {celda}
                              </span>
                            ) : esMoneda ? (
                              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--text-main)' }}>
                                S/ {Number(celdaRaw).toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                              </span>
                            ) : esPorcentaje ? (
                              <span style={{ fontWeight: 700, color: 'var(--sky-700)' }}>
                                {celda}
                              </span>
                            ) : (
                              <span>{celda}</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Barra de Paginación */}
        {totalRegistros > 0 && (
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
                Mostrando <strong>{indiceInicio}</strong> – <strong>{indiceFin}</strong> de <strong>{totalRegistros}</strong> registros
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
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
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
    </div>
  );
};
