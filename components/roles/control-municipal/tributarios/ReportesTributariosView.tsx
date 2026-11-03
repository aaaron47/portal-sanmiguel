'use client';

import React, { useState, useMemo } from 'react';
import {
  Table,
  Download,
  Search,
  Filter,
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
import { exportarCSV } from '@/utils/csv.utils';

// Datos de prueba representativos para cada reporte oficial R1 a R11
const MOCK_ROWS_BY_REPORT: Record<string, string[][]> = {
  R1: [
    ['C-100234', 'INVERSIONES SAN MIGUEL S.A.C.', 'GENERAL', 'RUC', '20512345678', 'AV. LA MARINA 2100', 'AV. LA MARINA', '2100', '401', '-', 'A', '12', 'SAN MIGUEL', '14500.00', '8200.00', '11600.00', '6560.00', '3200.00', '1800.00', '2880.00', '1620.00', '22660.00', '27700.00', 'HABIDO', 'JURIDICA', 'tributos@sanmiguelsac.pe', '998123456', 'SI'],
    ['C-100455', 'GONZALES PEREZ JUAN CARLOS', 'ORDINARIO', 'DNI', '09876543', 'CALLE LOS PATRIOTAS 340', 'LOS PATRIOTAS', '340', '-', '-', 'B', '04', 'SAN MIGUEL', '4800.00', '3100.00', '3840.00', '2480.00', '1100.00', '850.00', '990.00', '765.00', '8075.00', '9850.00', 'HABIDO', 'NATURAL', 'jgonzales@gmail.com', '987654321', 'NO'],
    ['C-100892', 'CONSTRUCTORA COSTANERA S.R.L.', 'PRICO', 'RUC', '20609876541', 'AV. COSTANERA 1250', 'AV. COSTANERA', '1250', 'OF 12', '-', 'C', '01', 'SAN MIGUEL', '38900.00', '19400.00', '31120.00', '15520.00', '7500.00', '4200.00', '6750.00', '3780.00', '57170.00', '70000.00', 'HABIDO', 'JURIDICA', 'admin@costanerasrl.pe', '945112233', 'SI'],
    ['C-101103', 'MENDOZA RUIZ MARIA ELENA', 'ORDINARIO', 'DNI', '41239876', 'JR. LIBERTAD 512', 'JR. LIBERTAD', '512', '201', '-', 'E', '18', 'SAN MIGUEL', '2100.00', '1400.00', '1680.00', '1120.00', '580.00', '420.00', '522.00', '378.00', '3700.00', '4500.00', 'HABIDO', 'NATURAL', 'maria.mendoza@outlook.com', '971345678', 'SI'],
    ['C-101419', 'CORPORACION GASTRONOMICA DEL PACIFICO', 'PRICO', 'RUC', '20456789123', 'AV. UNIVERSITARIA 1890', 'AV. UNIVERSITARIA', '1890', '-', '-', 'F', '09', 'SAN MIGUEL', '24000.00', '13200.00', '19200.00', '10560.00', '5100.00', '2900.00', '4590.00', '2610.00', '36960.00', '45200.00', 'HABIDO', 'JURIDICA', 'contabilidad@pacificorest.pe', '981223344', 'SI'],
  ],
  R2: [
    ['C-100455', 'GONZALES PEREZ JUAN CARLOS', 'ORDINARIO', 'DNI', '09876543', 'CALLE LOS PATRIOTAS 340', '7900.00'],
    ['C-101902', 'ALVAREZ QUISPE CARMEN ROSA', 'ORDINARIO', 'DNI', '10293847', 'AV. BRIGIDA SILVA 450', '5650.00'],
    ['C-102311', 'DISTRIBUIDORA SAN MIGUEL S.A.C.', 'GENERAL', 'RUC', '20491827364', 'CALLE MANTARO 125', '18400.00'],
    ['C-102874', 'PAREDES SALAZAR ROBERTO', 'ORDINARIO', 'DNI', '08765412', 'PASAJE SAN MARTIN 118', '4120.00'],
  ],
  R3: [
    ['C-100001', 'CONSOLIDADO ANUAL IMPUESTO PREDIAL', 'GENERAL', 'RESUMEN', 'PREDIAL-2026', 'SAN MIGUEL', '18500000.00', '2026', 'IMPUESTO PREDIAL', '78.5%', '82.1%', '21.5%'],
    ['C-100002', 'CONSOLIDADO ANUAL ARBITRIOS LIMPIEZA', 'GENERAL', 'RESUMEN', 'ARB-LIMPIEZA', 'SAN MIGUEL', '12400000.00', '2026', 'LIMPIEZA PUBLICA', '68.2%', '72.4%', '31.8%'],
    ['C-100003', 'CONSOLIDADO ANUAL ARBITRIOS SERENAZGO', 'GENERAL', 'RESUMEN', 'ARB-SERENAZGO', 'SAN MIGUEL', '9800000.00', '2026', 'SEGURIDAD CIUDADANA', '71.0%', '75.2%', '29.0%'],
    ['C-100004', 'CONSOLIDADO ANUAL PARQUES Y JARDINES', 'GENERAL', 'RESUMEN', 'ARB-PARQUES', 'SAN MIGUEL', '6200000.00', '2026', 'PARQUES Y JARDINES', '69.4%', '73.1%', '30.6%'],
  ],
  R4: [
    ['2026', 'OP-2026-00412', 'ORDEN DE PAGO', 'C-100234', '2025', '001', 'LOTE 01', 'INVERSIONES SAN MIGUEL S.A.C.', 'AV. LA MARINA 2100', '20512345678', 'JURIDICA', '22700.00', '5000.00', '17700.00'],
    ['2026', 'RD-2026-00108', 'RESOLUCION DE DETERMINACION', 'C-100892', '2024', '002', 'LOTE 03', 'CONSTRUCTORA COSTANERA S.R.L.', 'AV. COSTANERA 1250', '20609876541', 'JURIDICA', '58300.00', '12000.00', '46300.00'],
    ['2026', 'OP-2026-00891', 'ORDEN DE PAGO', 'C-101419', '2025', '001', 'LOTE 09', 'CORPORACION GASTRONOMICA DEL PACIFICO', 'AV. UNIVERSITARIA 1890', '20456789123', 'JURIDICA', '37200.00', '8000.00', '29200.00'],
  ],
  R5: [
    ['C-100892', 'CONSTRUCTORA COSTANERA S.R.L.', 'PRICO', 'RUC', '20609876541', 'AV. COSTANERA 1250', 'AV. COSTANERA', '1250', 'OF 12', '-', 'C', '01', 'SAN MIGUEL', '142.50', '45000.00', '22000.00', '38900.00', '19400.00', '31120.00', '15520.00', 'HABIDO', 'JURIDICA', 'admin@costanerasrl.pe', '945112233'],
    ['C-101419', 'CORPORACION GASTRONOMICA DEL PACIFICO', 'PRICO', 'RUC', '20456789123', 'AV. UNIVERSITARIA 1890', 'AV. UNIVERSITARIA', '1890', '-', '-', 'F', '09', 'SAN MIGUEL', '88.20', '32000.00', '16500.00', '24000.00', '13200.00', '19200.00', '10560.00', 'HABIDO', 'JURIDICA', 'contabilidad@pacificorest.pe', '981223344'],
    ['C-102041', 'CENTRO COMERCIAL PLAZA SAN MIGUEL S.A.', 'PRICO', 'RUC', '20109988771', 'AV. LA MARINA 2000', 'AV. LA MARINA', '2000', '-', '-', 'M', '01', 'SAN MIGUEL', '410.00', '180000.00', '95000.00', '0.00', '0.00', '0.00', '0.00', 'HABIDO', 'JURIDICA', 'tributario@plazasanmiguel.pe', '999887766'],
  ],
  R6: [
    ['C-102041', 'CENTRO COMERCIAL PLAZA SAN MIGUEL S.A.', 'PRICO', 'RUC', '20109988771', 'AV. LA MARINA 2000', '180000.00', '95000.00', '180000.00', '95000.00'],
    ['C-103112', 'RAMIREZ TORRES GUILLERMO', 'ORDINARIO', 'DNI', '07894561', 'JR. LIBERTAD 820', '3200.00', '2100.00', '3200.00', '2100.00'],
    ['C-103450', 'VEGA SILVA BEATRIZ ELVIRA', 'ORDINARIO', 'DNI', '09456712', 'AV. FEDERICO GALLESE 310', '2800.00', '1950.00', '2800.00', '1950.00'],
    ['C-103890', 'CLINICA SAN MIGUEL S.A.C.', 'PRICO', 'RUC', '20498761234', 'AV. Elmer Faucett 450', '42000.00', '24000.00', '42000.00', '24000.00'],
  ],
  R7: [
    ['IMPUESTO PREDIAL', '2026', 'ANEXO-01', '14200000.00', '11147000.00', '3053000.00', '78.5%'],
    ['IMPUESTO PREDIAL', '2025', 'ANEXO-01', '13800000.00', '12420000.00', '1380000.00', '90.0%'],
    ['ARBITRIOS MUNICIPALES', '2026', 'ANEXO-02', '18900000.00', '13135500.00', '5764500.00', '69.5%'],
    ['ARBITRIOS MUNICIPALES', '2025', 'ANEXO-02', '17500000.00', '14875000.00', '2625000.00', '85.0%'],
  ],
  R8: [
    ['IMPUESTO PREDIAL', '2021', 'ANEXO-01', '840000.00', '5 AÑOS'],
    ['IMPUESTO PREDIAL', '2022', 'ANEXO-01', '980000.00', '4 AÑOS'],
    ['IMPUESTO PREDIAL', '2023', 'ANEXO-01', '1250000.00', '3 AÑOS'],
    ['IMPUESTO PREDIAL', '2024', 'ANEXO-01', '1680000.00', '2 AÑOS'],
    ['IMPUESTO PREDIAL', '2025', 'ANEXO-01', '2100000.00', '1 AÑO'],
  ],
  R9: [
    ['2026-T1', 'IMPUESTO PREDIAL', '28/02/2026', '26/02/2026', '4500000.00', 'OPORTUNO', '8450', '1200', '87.5%'],
    ['2026-T2', 'IMPUESTO PREDIAL', '31/05/2026', '29/05/2026', '4200000.00', 'OPORTUNO', '8100', '1550', '83.9%'],
    ['2026-T3', 'IMPUESTO PREDIAL', '31/08/2026', '30/08/2026', '3950000.00', 'OPORTUNO', '7800', '1850', '80.8%'],
    ['2026-T1', 'ARBITRIOS', '28/02/2026', '15/03/2026', '2800000.00', 'CON ATRASO', '5600', '2900', '65.8%'],
  ],
  R10: [
    ['IMPUESTO PREDIAL', '2026', 'CUOTA 1 (FEBRERO)', '28/02/2026', '4500000.00', '465.00'],
    ['IMPUESTO PREDIAL', '2026', 'CUOTA 2 (MAYO)', '31/05/2026', '4200000.00', '435.00'],
    ['IMPUESTO PREDIAL', '2026', 'CUOTA 3 (AGOSTO)', '31/08/2026', '3950000.00', '410.00'],
    ['ARBITRIOS MUNICIPALES', '2026', 'CUOTAS 1-9 CONSOLIDADAS', '30/09/2026', '14200000.00', '185.00'],
  ],
  R11: [
    ['2026', 'ARBITRIOS', '28/02/2026', '20/04/2026', '51 DIAS', 'INCUMPLIDO REINCIDENTE', '62.0%', '4 CUOTAS', '3 AÑOS CONSECUTIVOS'],
    ['2026', 'IMPUESTO PREDIAL', '31/05/2026', '15/08/2026', '76 DIAS', 'INCUMPLIDO OBSERVADO', '58.5%', '2 CUOTAS', '2 AÑOS CONSECUTIVOS'],
    ['2025', 'ARBITRIOS', '31/08/2025', '30/11/2025', '91 DIAS', 'INCUMPLIDO COACTIVO', '44.0%', '6 CUOTAS', '4 AÑOS CONSECUTIVOS'],
  ],
};

export const ReportesTributariosView: React.FC = () => {
  const [reporteSeleccionadoCodigo, setReporteSeleccionadoCodigo] = useState<string>('R1');
  const [tributoFiltro, setTributoFiltro] = useState<string>('TODOS');
  const [periodoFiltro, setPeriodoFiltro] = useState<string>('2026');
  const [busquedaTexto, setBusquedaTexto] = useState<string>('');
  const [enmascararPrivacidad, setEnmascararPrivacidad] = useState<boolean>(false);

  // Paginación
  const [paginaActual, setPaginaActual] = useState(1);
  const [registrosPorPagina, setRegistrosPorPagina] = useState(10);

  // Reporte activo del catálogo oficial R1 a R11
  const reporteActual: ReporteItemInfo = useMemo(() => {
    return CATALOGO_REPORTES_OFICIALES.find((r) => r.codigo === reporteSeleccionadoCodigo)
      || CATALOGO_REPORTES_OFICIALES[0];
  }, [reporteSeleccionadoCodigo]);

  // Filas del reporte filtradas por texto de búsqueda
  const filasFiltradas = useMemo(() => {
    const rawRows = MOCK_ROWS_BY_REPORT[reporteActual.codigo] || [];
    if (!busquedaTexto.trim()) return rawRows;

    const query = busquedaTexto.toLowerCase();
    return rawRows.filter((fila) => fila.some((celda) => celda.toLowerCase().includes(query)));
  }, [reporteActual.codigo, busquedaTexto]);

  // Cálculo de Paginación
  const totalPaginas = Math.max(1, Math.ceil(filasFiltradas.length / registrosPorPagina));
  const paginaAjustada = Math.min(paginaActual, totalPaginas);
  const indiceInicio = filasFiltradas.length === 0 ? 0 : (paginaAjustada - 1) * registrosPorPagina + 1;
  const indiceFin = Math.min(paginaAjustada * registrosPorPagina, filasFiltradas.length);
  const filasPaginadas = filasFiltradas.slice(
    (paginaAjustada - 1) * registrosPorPagina,
    paginaAjustada * registrosPorPagina
  );

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

  // Exportación a Excel / CSV formal
  const handleExportar = () => {
    exportarCSV(
      `Reporte_${reporteActual.codigo}_${reporteActual.nombre.replace(/\s+/g, '_')}_${periodoFiltro}`,
      reporteActual.cabeceras,
      filasFiltradas
    );
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
              Exportar Tabla Oficial (CSV/Excel)
            </button>
          </div>
        </div>

        {/* Barra de Filtros */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: '1rem',
          background: 'var(--bg-card-subtle)',
          padding: '1rem',
          borderRadius: '10px',
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

          {/* Búsqueda rápida por texto */}
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
              <Search size={13} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
              Buscar en la Tabla:
            </label>
            <input
              type="text"
              placeholder="DNI, RUC, Razón Social..."
              value={busquedaTexto}
              onChange={(e) => setBusquedaTexto(e.target.value)}
              style={{ width: '100%', padding: '0.45rem 0.65rem', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '0.85rem' }}
            />
          </div>
        </div>

        {/* Ficha descriptiva del reporte seleccionado */}
        <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem' }}>
          <div>
            <span className="badge badge-primary" style={{ marginRight: '0.5rem', fontWeight: 700 }}>
              {reporteActual.codigo}
            </span>
            <strong style={{ fontSize: '0.9rem', color: 'var(--text-main)' }}>{reporteActual.nombre}</strong>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginLeft: '0.5rem' }}>
              — {reporteActual.descripcion}
            </span>
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Registros encontrados: <strong>{filasFiltradas.length}</strong> | Columnas normativas: <strong>{reporteActual.cabeceras.length}</strong>
          </div>
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
              {filasFiltradas.length === 0 ? (
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
        {filasFiltradas.length > 0 && (
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
                Mostrando <strong>{indiceInicio}</strong> – <strong>{indiceFin}</strong> de <strong>{filasFiltradas.length}</strong> registros
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
