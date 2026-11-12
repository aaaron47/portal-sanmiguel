'use client';

import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import {
  FileSpreadsheet,
  FileArchive,
  Download,
  Search,
  AlertTriangle,
  AlertCircle,
  RefreshCw,
  Layers,
  ShieldCheck,
  Eye,
  EyeOff,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Database,
} from 'lucide-react';
import {
  CATALOGO_REPORTES_OFICIALES,
  ReporteItemInfo,
  TablaCertificadaBi,
} from '@/types/reportes-tributarios.types';
import { iaDashboardsController } from '@/controllers/ia-dashboards.controller';
import { MOCK_ROWS_BY_REPORT } from '@/controllers/reportes.controller';
import { descargarBlobArchivo, exportarCSV } from '@/utils/csv.utils';
import { mensajeErrorApi } from '@/services/api-client.service';

export const ReportesTributariosView: React.FC = () => {
  // Datasets certificados devueltos por GET /api/v1/admin/bi/tablas
  const [tablasBi, setTablasBi] = useState<TablaCertificadaBi[]>([]);
  const [cargandoTablas, setCargandoTablas] = useState<boolean>(true);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);

  // Dataset / reporte seleccionado (id numérico de Superset o código 'R1'-'R11')
  const [seleccionadoKey, setSeleccionadoKey] = useState<string>('');

  // Datos descargados de Superset en memoria (key -> { cabeceras, filas, incompleta })
  const [datosSuperset, setDatosSuperset] = useState<
    Record<string, { cabeceras: string[]; filas: string[][]; incompleta: boolean }>
  >({});

  // Filtros y paginación de la tabla
  const [busquedaTexto, setBusquedaTexto] = useState<string>('');
  const [enmascararPrivacidad, setEnmascararPrivacidad] = useState<boolean>(false);
  const [paginaActual, setPaginaActual] = useState<number>(1);
  const [registrosPorPagina, setRegistrosPorPagina] = useState<number>(10);

  // Estados de descarga individual
  const [descargandoFormato, setDescargandoFormato] = useState<'csv' | 'xlsx' | null>(null);
  const [tablaIncompleta, setTablaIncompleta] = useState<boolean>(false);

  // Estados de descarga masiva ZIP
  const [trabajoZip, setTrabajoZip] = useState<{
    id: string;
    estado: string;
    total: number;
    hechas: number;
    error: string | null;
  } | null>(null);
  const zipPollingRef = useRef<NodeJS.Timeout | null>(null);

  // 1. Carga inicial de datasets certificados desde Superset
  const cargarTablasCertificadas = useCallback(async () => {
    setCargandoTablas(true);
    try {
      const items = await iaDashboardsController.getTablas();
      setTablasBi(items);
      if (items.length > 0) {
        setSeleccionadoKey((prev) => (prev ? prev : `bi-${items[0].id}`));
      } else {
        setSeleccionadoKey((prev) => (prev ? prev : 'cat-R1'));
      }
    } catch {
      setSeleccionadoKey((prev) => (prev ? prev : 'cat-R1'));
    } finally {
      setCargandoTablas(false);
    }
  }, []);

  useEffect(() => {
    let cancelado = false;
    iaDashboardsController
      .getTablas()
      .then((items) => {
        if (cancelado) return;
        setTablasBi(items);
        setCargandoTablas(false);
        if (items.length > 0) {
          setSeleccionadoKey((prev) => (prev ? prev : `bi-${items[0].id}`));
        } else {
          setSeleccionadoKey((prev) => (prev ? prev : 'cat-R1'));
        }
      })
      .catch(() => {
        if (cancelado) return;
        setSeleccionadoKey((prev) => (prev ? prev : 'cat-R1'));
        setCargandoTablas(false);
      });

    return () => {
      cancelado = true;
      if (zipPollingRef.current) clearInterval(zipPollingRef.current);
    };
  }, []);

  // Identificar el dataset certificado activo (si la key seleccionada inicia con 'bi-')
  const tablaCertificadaActiva: TablaCertificadaBi | undefined = useMemo(() => {
    if (!seleccionadoKey.startsWith('bi-')) return undefined;
    const id = seleccionadoKey.replace('bi-', '');
    return tablasBi.find((t) => String(t.id) === id);
  }, [seleccionadoKey, tablasBi]);

  // Identificar el reporte oficial del catálogo (si la key seleccionada inicia con 'cat-')
  const reporteCatalogoActivo: ReporteItemInfo | undefined = useMemo(() => {
    if (!seleccionadoKey.startsWith('cat-')) return undefined;
    const cod = seleccionadoKey.replace('cat-', '');
    return CATALOGO_REPORTES_OFICIALES.find((r) => r.codigo === cod);
  }, [seleccionadoKey]);

  const keyActiva = tablaCertificadaActiva ? `bi-${tablaCertificadaActiva.id}` : null;
  const cargandoPrevisualizacion = Boolean(
    tablaCertificadaActiva && keyActiva && !datosSuperset[keyActiva]
  );

  // 2. Descarga asíncrona bajo demanda para datasets reales de Superset
  useEffect(() => {
    if (!tablaCertificadaActiva) return;
    const key = `bi-${tablaCertificadaActiva.id}`;
    if (datosSuperset[key]) return;

    let cancelado = false;

    iaDashboardsController
      .descargarTabla(tablaCertificadaActiva.id, 'csv')
      .then((res) => {
        if (cancelado) return;
        const c = res.cabeceras.length > 0 ? res.cabeceras : ['Dato 1', 'Dato 2'];
        const f = res.filas;
        setDatosSuperset((prev) => ({
          ...prev,
          [key]: { cabeceras: c, filas: f, incompleta: res.tablaIncompleta },
        }));
      })
      .catch(() => {
        if (cancelado) return;
        setDatosSuperset((prev) => ({
          ...prev,
          [key]: {
            cabeceras: ['Código', 'Contribuyente', 'Tipo', 'Documento', 'Monto Deuda S/'],
            filas: [],
            incompleta: false,
          },
        }));
      });

    return () => {
      cancelado = true;
    };
  }, [tablaCertificadaActiva, datosSuperset]);

  // Columnas derivadas de forma pura
  const cabeceras = useMemo(() => {
    if (tablaCertificadaActiva) {
      return datosSuperset[`bi-${tablaCertificadaActiva.id}`]?.cabeceras || [];
    }
    if (reporteCatalogoActivo) {
      return reporteCatalogoActivo.cabeceras;
    }
    return [];
  }, [tablaCertificadaActiva, reporteCatalogoActivo, datosSuperset]);

  // Filas derivadas de forma pura
  const filas = useMemo(() => {
    if (tablaCertificadaActiva) {
      return datosSuperset[`bi-${tablaCertificadaActiva.id}`]?.filas || [];
    }
    if (reporteCatalogoActivo) {
      return MOCK_ROWS_BY_REPORT[reporteCatalogoActivo.codigo] || [];
    }
    return [];
  }, [tablaCertificadaActiva, reporteCatalogoActivo, datosSuperset]);

  const esDataRealSuperset = Boolean(
    tablaCertificadaActiva && datosSuperset[`bi-${tablaCertificadaActiva.id}`]
  );

  // Enmascaramiento de privacidad (DNI / RUC)
  const enmascararValor = (valor: string, colIdx: number) => {
    if (!enmascararPrivacidad) return valor;
    const colNombre = (cabeceras[colIdx] || '').toLowerCase();
    const esIdentificador =
      colNombre.includes('dni') ||
      colNombre.includes('documento') ||
      colNombre.includes('identidad') ||
      colNombre.includes('ruc');

    if (esIdentificador && valor.length >= 8) {
      return `${valor.slice(0, 2)}****${valor.slice(-2)}`;
    }
    return valor;
  };

  // Filtrado de filas por texto de búsqueda
  const filasFiltradas = useMemo(() => {
    const q = busquedaTexto.trim().toLowerCase();
    if (!q) return filas;
    return filas.filter((fila) =>
      fila.some((celda) => (celda || '').toLowerCase().includes(q))
    );
  }, [filas, busquedaTexto]);

  // Paginación
  const totalRegistros = filasFiltradas.length;
  const totalPaginas = Math.max(1, Math.ceil(totalRegistros / registrosPorPagina));
  const paginaAjustada = Math.min(paginaActual, totalPaginas);
  const indiceInicio = totalRegistros === 0 ? 0 : (paginaAjustada - 1) * registrosPorPagina + 1;
  const indiceFin = Math.min(paginaAjustada * registrosPorPagina, totalRegistros);
  const filasPaginadas = useMemo(() => {
    const inicio = (paginaAjustada - 1) * registrosPorPagina;
    return filasFiltradas.slice(inicio, inicio + registrosPorPagina);
  }, [filasFiltradas, paginaAjustada, registrosPorPagina]);

  // Manejo de descargas individuales (CSV / Excel)
  const handleDescargar = async (formato: 'csv' | 'xlsx') => {
    setDescargandoFormato(formato);
    setErrorCarga(null);
    try {
      if (tablaCertificadaActiva) {
        // Descarga directa oficial de Superset
        const res = await iaDashboardsController.descargarTablaArchivo(
          tablaCertificadaActiva.id,
          formato
        );
        if (res.tablaIncompleta) setTablaIncompleta(true);
      } else if (reporteCatalogoActivo) {
        // Exporta la plantilla o estructura del catálogo oficial
        const nombre = `Reporte_${reporteCatalogoActivo.codigo}_${reporteCatalogoActivo.nombre.replace(/\s+/g, '_')}`;
        exportarCSV(nombre, cabeceras, filas);
      }
    } catch (err) {
      setErrorCarga(mensajeErrorApi(err, 'No se pudo descargar el archivo solicitado.'));
    } finally {
      setDescargandoFormato(null);
    }
  };

  // Manejo de descarga masiva ZIP
  const handleDescargarTodasZip = async () => {
    if (trabajoZip && (trabajoZip.estado === 'EN_COLA' || trabajoZip.estado === 'EJECUTANDO')) {
      return;
    }
    setErrorCarga(null);
    try {
      const trabajoInicial = await iaDashboardsController.iniciarDescargaTodas('csv');
      setTrabajoZip({
        id: trabajoInicial.id,
        estado: trabajoInicial.estado,
        total: trabajoInicial.total,
        hechas: trabajoInicial.hechas,
        error: trabajoInicial.error,
      });

      if (zipPollingRef.current) clearInterval(zipPollingRef.current);

      zipPollingRef.current = setInterval(async () => {
        try {
          const poll = await iaDashboardsController.consultarDescargaTodas(trabajoInicial.id);
          setTrabajoZip({
            id: poll.id,
            estado: poll.estado,
            total: poll.total,
            hechas: poll.hechas,
            error: poll.error,
          });

          if (poll.estado === 'COMPLETADO') {
            if (zipPollingRef.current) clearInterval(zipPollingRef.current);
            const blobZip = await iaDashboardsController.obtenerArchivoDescargaTodas(poll.id);
            descargarBlobArchivo(blobZip, poll.nombreArchivo || 'reportes_tributarios_san_miguel.zip');
            setTimeout(() => setTrabajoZip(null), 3500);
          } else if (poll.estado === 'ERROR') {
            if (zipPollingRef.current) clearInterval(zipPollingRef.current);
            setErrorCarga(poll.error || 'Error al generar el archivo ZIP de las tablas.');
          }
        } catch (errPoll) {
          if (zipPollingRef.current) clearInterval(zipPollingRef.current);
          setErrorCarga(mensajeErrorApi(errPoll, 'Error al consultar el progreso del archivo ZIP.'));
          setTrabajoZip(null);
        }
      }, 2500);
    } catch (err) {
      setErrorCarga(
        mensajeErrorApi(err, 'No se pudo iniciar la generación del archivo ZIP con todas las tablas.')
      );
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div className="card" style={{ padding: '1.25rem' }}>
        {/* 1. Cabecera limpia */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '1rem',
            flexWrap: 'wrap',
            paddingBottom: '0.85rem',
            borderBottom: '1px solid var(--border-color)',
            marginBottom: '1rem',
          }}
        >
          <div>
            <h2
              style={{
                fontSize: '1.1rem',
                fontWeight: 800,
                color: 'var(--text-main)',
                margin: '0 0 0.25rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <FileSpreadsheet size={20} color="var(--sky-600)" />
              Reportes Tributarios y Datasets Oficiales
            </h2>
            <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Previsualización tabular y descarga oficial de los datasets certificados de Apache Superset.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={cargarTablasCertificadas}
              disabled={cargandoTablas}
              className="btn btn-secondary"
              style={{ fontSize: '0.78rem', padding: '0.4rem 0.65rem' }}
              title="Refrescar datasets de Superset"
            >
              <RefreshCw
                size={13}
                style={{ animation: cargandoTablas ? 'spin 1s linear infinite' : 'none' }}
              />
              <span>Actualizar</span>
            </button>

            <button
              type="button"
              onClick={handleDescargarTodasZip}
              disabled={
                trabajoZip !== null &&
                (trabajoZip.estado === 'EN_COLA' || trabajoZip.estado === 'EJECUTANDO')
              }
              className="btn btn-secondary"
              style={{ fontSize: '0.78rem', padding: '0.4rem 0.75rem' }}
              title="Descargar todos los datasets certificados en un archivo ZIP"
            >
              <FileArchive size={14} />
              <span>Bajar todas (ZIP)</span>
            </button>
          </div>
        </div>

        {/* Alerta de progreso de ZIP masivo */}
        {trabajoZip && (
          <div
            style={{
              marginBottom: '1rem',
              padding: '0.7rem 0.9rem',
              borderRadius: '8px',
              border: '1px solid var(--sky-300)',
              background: 'var(--sky-50)',
              color: 'var(--sky-900)',
              fontSize: '0.8rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.5rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} />
              <span>
                Generando archivo ZIP:{' '}
                <strong>
                  {trabajoZip.hechas} de {trabajoZip.total || '—'} tablas procesadas
                </strong>{' '}
                ({trabajoZip.estado === 'EN_COLA' ? 'En cola' : 'Comprimiendo'}...)
              </span>
            </div>
            {trabajoZip.estado === 'COMPLETADO' && (
              <span className="badge badge-success">¡Descarga completada!</span>
            )}
          </div>
        )}

        {/* Alerta de tabla incompleta */}
        {tablaIncompleta && (
          <div
            style={{
              marginBottom: '1rem',
              padding: '0.65rem 0.85rem',
              borderRadius: '8px',
              border: '1px solid var(--amber-300)',
              background: 'var(--amber-50)',
              color: 'var(--amber-900)',
              fontSize: '0.78rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.5rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertTriangle size={15} color="var(--amber-600)" />
              <span>
                <strong>Aviso:</strong> La tabla superó el tope de 100,000 filas del servidor; el archivo descargado puede estar incompleto.
              </span>
            </div>
            <button
              type="button"
              onClick={() => setTablaIncompleta(false)}
              className="btn btn-secondary"
              style={{ padding: '0.2rem 0.4rem', fontSize: '0.7rem' }}
            >
              Cerrar
            </button>
          </div>
        )}

        {/* Alerta de error */}
        {errorCarga && (
          <div
            style={{
              marginBottom: '1rem',
              padding: '0.65rem 0.85rem',
              borderRadius: '8px',
              border: '1px solid var(--red-300)',
              background: 'var(--red-50)',
              color: 'var(--red-900)',
              fontSize: '0.78rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.5rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertCircle size={15} color="var(--red-600)" />
              <span>{errorCarga}</span>
            </div>
            <button
              type="button"
              onClick={() => setErrorCarga(null)}
              className="btn btn-secondary"
              style={{ padding: '0.2rem 0.4rem', fontSize: '0.7rem' }}
            >
              Cerrar
            </button>
          </div>
        )}

        {/* 2. Barra de Selección de Dataset y Controles de la Tabla */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            gap: '0.75rem',
            flexWrap: 'wrap',
            background: 'var(--bg-card-subtle)',
            padding: '0.85rem 1rem',
            borderRadius: '10px',
            border: '1px solid var(--border-color)',
            marginBottom: '1rem',
          }}
        >
          {/* Selector de Dataset */}
          <div style={{ flex: '1 1 300px', minWidth: '240px' }}>
            <label
              style={{
                display: 'block',
                fontSize: '0.74rem',
                fontWeight: 700,
                color: 'var(--text-muted)',
                marginBottom: '0.35rem',
              }}
            >
              <Database size={13} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
              Seleccionar Dataset / Reporte a previsualizar:
            </label>
            <select
              aria-label="Seleccionar Dataset o Reporte"
              value={seleccionadoKey}
              onChange={(e) => {
                setSeleccionadoKey(e.target.value);
                setPaginaActual(1);
                setTablaIncompleta(false);
              }}
              style={{
                width: '100%',
                padding: '0.45rem 0.65rem',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                fontSize: '0.82rem',
                fontWeight: 600,
                background: 'var(--bg-card)',
                color: 'var(--text-main)',
                cursor: 'pointer',
              }}
            >
              {tablasBi.length > 0 && (
                <optgroup label="Datasets Certificados en Superset (Data Real)">
                  {tablasBi.map((t) => (
                    <option key={`bi-${t.id}`} value={`bi-${t.id}`}>
                      ⭐ {t.nombre} {t.descripcion ? `— ${t.descripcion}` : ''}
                    </option>
                  ))}
                </optgroup>
              )}

              <optgroup label="Catálogo Normado de Reportes Municipales">
                {CATALOGO_REPORTES_OFICIALES.map((r) => (
                  <option key={`cat-${r.codigo}`} value={`cat-${r.codigo}`}>
                    [{r.codigo}] {r.nombre}
                  </option>
                ))}
              </optgroup>
            </select>
          </div>

          {/* Buscador dentro de las filas de la tabla */}
          <div style={{ flex: '1 1 220px', minWidth: '180px' }}>
            <label
              style={{
                display: 'block',
                fontSize: '0.74rem',
                fontWeight: 700,
                color: 'var(--text-muted)',
                marginBottom: '0.35rem',
              }}
            >
              <Search size={13} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
              Buscar en la previsualización:
            </label>
            <input
              type="text"
              placeholder="Filtrar registros..."
              value={busquedaTexto}
              onChange={(e) => {
                setBusquedaTexto(e.target.value);
                setPaginaActual(1);
              }}
              style={{
                width: '100%',
                padding: '0.42rem 0.6rem',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                fontSize: '0.8rem',
                background: 'var(--bg-card)',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Acciones de Privacidad y Descargas del dataset actual */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => setEnmascararPrivacidad((prev) => !prev)}
              className="btn btn-secondary"
              style={{
                fontSize: '0.78rem',
                padding: '0.42rem 0.65rem',
                borderColor: enmascararPrivacidad ? 'var(--sky-500)' : undefined,
                background: enmascararPrivacidad ? 'var(--sky-50)' : undefined,
              }}
              title={
                enmascararPrivacidad
                  ? 'Desactivar enmascaramiento de datos personales'
                  : 'Enmascarar DNI / RUC en pantalla (Ley 29733)'
              }
            >
              {enmascararPrivacidad ? <EyeOff size={13} /> : <Eye size={13} />}
              <span>{enmascararPrivacidad ? 'Enmascarado' : 'Enmascarar'}</span>
            </button>

            <button
              type="button"
              onClick={() => handleDescargar('csv')}
              disabled={descargandoFormato !== null}
              className="btn btn-secondary"
              style={{ fontSize: '0.78rem', padding: '0.42rem 0.75rem' }}
              title="Descargar este dataset completo en formato CSV"
            >
              <Download size={13} />
              <span>{descargandoFormato === 'csv' ? 'Descargando...' : 'Descargar CSV'}</span>
            </button>

            <button
              type="button"
              onClick={() => handleDescargar('xlsx')}
              disabled={descargandoFormato !== null}
              className="btn btn-primary"
              style={{ fontSize: '0.78rem', padding: '0.42rem 0.75rem' }}
              title="Descargar este dataset en formato Excel (.xlsx)"
            >
              <FileSpreadsheet size={13} />
              <span>{descargandoFormato === 'xlsx' ? 'Descargando...' : 'Descargar Excel'}</span>
            </button>
          </div>
        </div>

        {/* 3. Indicador de estado del dataset seleccionado */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.75rem',
            marginBottom: '0.75rem',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {esDataRealSuperset ? (
              <span
                className="badge badge-success"
                style={{ fontSize: '0.72rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
              >
                <ShieldCheck size={13} />
                Data Real de Apache Superset (Vistas BD)
              </span>
            ) : (
              <span
                className="badge badge-subtle"
                style={{ fontSize: '0.72rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
              >
                <Layers size={13} />
                Estructura Oficial Normada (Plantilla)
              </span>
            )}

            {tablaCertificadaActiva?.certificadoPor && (
              <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                Certificado por: <strong>{tablaCertificadaActiva.certificadoPor}</strong>
              </span>
            )}
          </div>

          <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', fontWeight: 600 }}>
            {cargandoPrevisualizacion ? (
              <span>Cargando registros...</span>
            ) : (
              <span>
                Mostrando {totalRegistros === 0 ? 0 : `${indiceInicio} - ${indiceFin}`} de {totalRegistros}{' '}
                registro{totalRegistros === 1 ? '' : 's'}
              </span>
            )}
          </div>
        </div>

        {/* 4. Tabla de Previsualización */}
        <div
          className="table-container"
          style={{
            overflowX: 'auto',
            border: '1px solid var(--border-color)',
            borderRadius: '10px',
            minHeight: '220px',
            background: 'var(--bg-app)',
          }}
        >
          {cargandoPrevisualizacion ? (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '220px',
                gap: '0.65rem',
                color: 'var(--text-muted)',
              }}
            >
              <RefreshCw size={22} style={{ animation: 'spin 1s linear infinite' }} color="var(--sky-600)" />
              <span style={{ fontSize: '0.82rem' }}>Descargando y parseando registros del dataset...</span>
            </div>
          ) : filasPaginadas.length === 0 ? (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '200px',
                padding: '2rem 1rem',
                textAlign: 'center',
                color: 'var(--text-muted)',
              }}
            >
              <AlertCircle size={24} style={{ marginBottom: '0.4rem', color: 'var(--slate-400)' }} />
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)' }}>
                {busquedaTexto ? 'No hay registros que coincidan con la búsqueda' : 'Dataset sin filas disponibles'}
              </div>
              <span style={{ fontSize: '0.76rem', marginTop: '0.2rem' }}>
                {busquedaTexto
                  ? 'Intenta con otro término o limpia el buscador.'
                  : 'Este dataset se encuentra registrado pero no contiene filas actualmente en la base de datos.'}
              </span>
            </div>
          ) : (
            <table className="data-table" style={{ fontSize: '0.78rem', width: '100%' }}>
              <thead>
                <tr style={{ background: 'var(--bg-card-subtle)' }}>
                  <th style={{ width: '45px', textAlign: 'center', padding: '0.55rem 0.5rem' }}>#</th>
                  {cabeceras.map((col, idx) => (
                    <th key={idx} style={{ padding: '0.55rem 0.65rem', whiteSpace: 'nowrap' }}>
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filasPaginadas.map((fila, rIdx) => {
                  const numFila = indiceInicio + rIdx;
                  return (
                    <tr key={rIdx} style={{ transition: 'background-color 0.1s ease' }}>
                      <td
                        style={{
                          textAlign: 'center',
                          color: 'var(--text-muted)',
                          fontSize: '0.72rem',
                          fontFamily: 'var(--font-mono)',
                          padding: '0.45rem 0.5rem',
                        }}
                      >
                        {numFila}
                      </td>
                      {fila.map((celda, cIdx) => (
                        <td
                          key={cIdx}
                          style={{
                            padding: '0.45rem 0.65rem',
                            whiteSpace: 'nowrap',
                            color: 'var(--text-main)',
                          }}
                        >
                          {enmascararValor(celda || '—', cIdx)}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* 5. Barra de Paginación */}
        {totalRegistros > 0 && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '0.75rem',
              padding: '0.65rem 0.25rem 0.15rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              <span>Registros por página:</span>
              <select
                aria-label="Registros por página"
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
                }}
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <button
                type="button"
                onClick={() => setPaginaActual(1)}
                disabled={paginaAjustada <= 1}
                className="btn btn-secondary"
                style={{ padding: '0.25rem 0.45rem' }}
                title="Primera página"
              >
                <ChevronsLeft size={13} />
              </button>

              <button
                type="button"
                onClick={() => setPaginaActual((p) => Math.max(1, p - 1))}
                disabled={paginaAjustada <= 1}
                className="btn btn-secondary"
                style={{ padding: '0.25rem 0.45rem' }}
                title="Página anterior"
              >
                <ChevronLeft size={13} />
              </button>

              <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '0 0.4rem' }}>
                Página {paginaAjustada} de {totalPaginas}
              </span>

              <button
                type="button"
                onClick={() => setPaginaActual((p) => Math.min(totalPaginas, p + 1))}
                disabled={paginaAjustada >= totalPaginas}
                className="btn btn-secondary"
                style={{ padding: '0.25rem 0.45rem' }}
                title="Página siguiente"
              >
                <ChevronRight size={13} />
              </button>

              <button
                type="button"
                onClick={() => setPaginaActual(totalPaginas)}
                disabled={paginaAjustada >= totalPaginas}
                className="btn btn-secondary"
                style={{ padding: '0.25rem 0.45rem' }}
                title="Última página"
              >
                <ChevronsRight size={13} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
