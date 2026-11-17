'use client';

import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import {
  FileSpreadsheet,
  FileArchive,
  Download,
  AlertTriangle,
  AlertCircle,
  RefreshCw,
  ShieldCheck,
  Eye,
  EyeOff,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';
import { SearchInput } from '@/components/shared/ui/SearchInput';
import {
  FilterSelectWrapper,
  FilterResetButton,
  ESTILO_SELECT_FILTRO,
  ESTILO_LABEL_FILTRO,
} from '@/components/shared/ui/FilterControls';
import { TablaCertificadaBi } from '@/types/reportes-tributarios.types';
import { iaDashboardsController } from '@/controllers/ia-dashboards.controller';
import { descargarBlobArchivo } from '@/utils/csv.utils';
import { mensajeErrorApi } from '@/services/api-client.service';

export const ReportesTributariosView: React.FC = () => {
  // Datasets certificados devueltos por GET /api/v1/admin/bi/tablas (son los reportes oficiales)
  const [tablasBi, setTablasBi] = useState<TablaCertificadaBi[]>([]);
  const [cargandoTablas, setCargandoTablas] = useState<boolean>(true);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);

  // ID del reporte certificado seleccionado
  const [selectedTablaId, setSelectedTablaId] = useState<number | null>(null);

  // Filas y columnas descargadas de Superset en memoria (id -> { cabeceras, filas, incompleta })
  const [datosSuperset, setDatosSuperset] = useState<
    Record<number, { cabeceras: string[]; filas: string[][]; incompleta: boolean }>
  >({});

  // Filtros y paginación
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
    setErrorCarga(null);
    try {
      const items = await iaDashboardsController.getTablas();
      setTablasBi(items);
      if (items.length > 0) {
        setSelectedTablaId((prev) =>
          prev !== null && items.some((t) => t.id === prev) ? prev : items[0].id
        );
      } else {
        setSelectedTablaId(null);
      }
    } catch (err) {
      setErrorCarga(
        mensajeErrorApi(err, 'No se pudieron cargar los reportes certificados desde Superset.')
      );
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
          setSelectedTablaId((prev) =>
            prev !== null && items.some((t) => t.id === prev) ? prev : items[0].id
          );
        }
      })
      .catch((err) => {
        if (cancelado) return;
        setErrorCarga(
          mensajeErrorApi(err, 'No se pudieron cargar los reportes certificados desde Superset.')
        );
        setCargandoTablas(false);
      });

    return () => {
      cancelado = true;
      if (zipPollingRef.current) clearInterval(zipPollingRef.current);
    };
  }, []);

  // Identificar el reporte certificado activo
  const tablaActiva: TablaCertificadaBi | undefined = useMemo(() => {
    if (selectedTablaId === null) return tablasBi[0];
    return tablasBi.find((t) => t.id === selectedTablaId) || tablasBi[0];
  }, [selectedTablaId, tablasBi]);

  const cargandoPrevisualizacion = Boolean(
    tablaActiva && !datosSuperset[tablaActiva.id]
  );

  // 2. Descarga asíncrona en memoria para previsualizar los registros reales del reporte
  useEffect(() => {
    if (!tablaActiva) return;
    if (datosSuperset[tablaActiva.id]) return;

    let cancelado = false;

    iaDashboardsController
      .descargarTabla(tablaActiva.id, 'csv')
      .then((res) => {
        if (cancelado) return;
        const c = res.cabeceras.length > 0 ? res.cabeceras : ['Columna 1'];
        const f = res.filas;
        setDatosSuperset((prev) => ({
          ...prev,
          [tablaActiva.id]: { cabeceras: c, filas: f, incompleta: res.tablaIncompleta },
        }));
      })
      .catch(() => {
        if (cancelado) return;
        setDatosSuperset((prev) => ({
          ...prev,
          [tablaActiva.id]: {
            cabeceras: ['Columna 1'],
            filas: [],
            incompleta: false,
          },
        }));
      });

    return () => {
      cancelado = true;
    };
  }, [tablaActiva, datosSuperset]);

  // Columnas y filas del reporte activo
  const cabeceras = useMemo(() => {
    if (!tablaActiva) return [];
    return datosSuperset[tablaActiva.id]?.cabeceras || [];
  }, [tablaActiva, datosSuperset]);

  const filas = useMemo(() => {
    if (!tablaActiva) return [];
    return datosSuperset[tablaActiva.id]?.filas || [];
  }, [tablaActiva, datosSuperset]);

  // Enmascaramiento de privacidad de DNI / RUC según la Ley 29733
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

  // Descarga del reporte actual (CSV o Excel)
  const handleDescargar = async (formato: 'csv' | 'xlsx') => {
    if (!tablaActiva) return;
    setDescargandoFormato(formato);
    setErrorCarga(null);
    try {
      const res = await iaDashboardsController.descargarTablaArchivo(tablaActiva.id, formato);
      if (res.tablaIncompleta) setTablaIncompleta(true);
    } catch (err) {
      setErrorCarga(mensajeErrorApi(err, 'No se pudo descargar el archivo solicitado.'));
    } finally {
      setDescargandoFormato(null);
    }
  };

  // Descarga masiva en ZIP
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
            setErrorCarga(poll.error || 'Error al generar el archivo ZIP de los reportes.');
          }
        } catch (errPoll) {
          if (zipPollingRef.current) clearInterval(zipPollingRef.current);
          setErrorCarga(mensajeErrorApi(errPoll, 'Error al consultar el progreso del archivo ZIP.'));
          setTrabajoZip(null);
        }
      }, 2500);
    } catch (err) {
      setErrorCarga(
        mensajeErrorApi(err, 'No se pudo iniciar la generación del archivo ZIP con todos los reportes.')
      );
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div className="card" style={{ padding: '1.25rem' }}>
        {/* 1. Cabecera */}
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
              Reportes Tributarios Oficiales
            </h2>
            <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Previsualización de registros en vivo y descarga oficial de los datasets certificados de Apache Superset.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={cargarTablasCertificadas}
              disabled={cargandoTablas}
              className="btn btn-secondary"
              style={{ fontSize: '0.78rem', padding: '0.4rem 0.65rem' }}
              title="Refrescar reportes certificados desde Superset"
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
                tablasBi.length === 0 ||
                (trabajoZip !== null &&
                  (trabajoZip.estado === 'EN_COLA' || trabajoZip.estado === 'EJECUTANDO'))
              }
              className="btn btn-secondary"
              style={{ fontSize: '0.78rem', padding: '0.4rem 0.75rem' }}
              title="Descargar todos los reportes certificados en un archivo ZIP"
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
              <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} />
              <span>
                Generando archivo ZIP:{' '}
                <strong>
                  {trabajoZip.hechas} de {trabajoZip.total || '—'} reportes procesados
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
                <strong>Aviso:</strong> El reporte superó el límite de 100,000 filas del servidor; el archivo descargado puede estar incompleto.
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

        {/* 2. Barra de Selección de Reporte Certificado y Filtros */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.75rem',
            alignItems: 'flex-end',
            marginBottom: '1.25rem',
          }}
        >
          {/* Selector de Reporte Certificado */}
          <FilterSelectWrapper label="Reporte Oficial Certificado" width="320px">
            <select
              aria-label="Seleccionar reporte certificado"
              value={selectedTablaId ?? ''}
              onChange={(e) => {
                setSelectedTablaId(Number(e.target.value));
                setPaginaActual(1);
                setTablaIncompleta(false);
              }}
              disabled={tablasBi.length === 0}
              style={{
                ...ESTILO_SELECT_FILTRO,
                width: '100%',
                fontWeight: 600,
                cursor: tablasBi.length > 0 ? 'pointer' : 'not-allowed',
              }}
            >
              {tablasBi.length === 0 ? (
                <option value="">(Sin reportes certificados disponibles)</option>
              ) : (
                tablasBi.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.nombre} {t.descripcion ? `— ${t.descripcion}` : ''}
                  </option>
                ))
              )}
            </select>
          </FilterSelectWrapper>

          {/* Buscador dentro de los registros */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.25rem',
              flex: 1,
              minWidth: '220px',
              maxWidth: '380px',
            }}
          >
            <label style={ESTILO_LABEL_FILTRO}>Buscar en la tabla</label>
            <SearchInput
              value={busquedaTexto}
              onChange={(val) => {
                setBusquedaTexto(val);
                setPaginaActual(1);
              }}
              placeholder="Filtrar por contribuyente, DNI, detalle..."
            />
          </div>

          {/* Botón para limpiar filtro de búsqueda */}
          <FilterResetButton
            onReset={() => {
              setBusquedaTexto('');
              setPaginaActual(1);
            }}
            activo={Boolean(busquedaTexto.trim())}
            title="Limpiar búsqueda"
          />

          {/* Botones de acción: Privacidad (ojo) + Descargas CSV / Excel */}
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-end',
              gap: '0.5rem',
              marginLeft: 'auto',
              flexWrap: 'wrap',
            }}
          >
            {/* Botón de ojo (solo icono) para privacidad */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.25rem',
                justifyContent: 'flex-end',
              }}
            >
              <span style={{ ...ESTILO_LABEL_FILTRO, visibility: 'hidden' }}>&nbsp;</span>
              <button
                type="button"
                onClick={() => setEnmascararPrivacidad((prev) => !prev)}
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
                  borderColor: enmascararPrivacidad ? 'var(--sky-500)' : undefined,
                  background: enmascararPrivacidad ? 'var(--sky-50)' : undefined,
                  color: enmascararPrivacidad ? 'var(--sky-700)' : 'var(--text-main)',
                  boxSizing: 'border-box',
                }}
                aria-label={
                  enmascararPrivacidad
                    ? 'Mostrar datos sensibles completos'
                    : 'Ocultar datos sensibles (DNI / RUC)'
                }
                title={
                  enmascararPrivacidad
                    ? 'Mostrar datos sensibles completos'
                    : 'Ocultar / enmascarar datos personales (DNI / RUC)'
                }
              >
                {enmascararPrivacidad ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {/* Descargar CSV */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.25rem',
                justifyContent: 'flex-end',
              }}
            >
              <span style={{ ...ESTILO_LABEL_FILTRO, visibility: 'hidden' }}>&nbsp;</span>
              <button
                type="button"
                onClick={() => handleDescargar('csv')}
                disabled={!tablaActiva || descargandoFormato !== null}
                className="btn btn-secondary"
                style={{
                  height: '38px',
                  padding: '0 0.85rem',
                  fontSize: '0.8rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  boxSizing: 'border-box',
                }}
                title="Descargar este reporte completo en formato CSV"
              >
                <Download size={14} />
                <span>{descargandoFormato === 'csv' ? 'Descargando...' : 'Descargar CSV'}</span>
              </button>
            </div>

            {/* Descargar Excel */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.25rem',
                justifyContent: 'flex-end',
              }}
            >
              <span style={{ ...ESTILO_LABEL_FILTRO, visibility: 'hidden' }}>&nbsp;</span>
              <button
                type="button"
                onClick={() => handleDescargar('xlsx')}
                disabled={!tablaActiva || descargandoFormato !== null}
                className="btn btn-primary"
                style={{
                  height: '38px',
                  padding: '0 0.85rem',
                  fontSize: '0.8rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  boxSizing: 'border-box',
                }}
                title="Descargar este reporte en formato Excel (.xlsx)"
              >
                <FileSpreadsheet size={14} />
                <span>{descargandoFormato === 'xlsx' ? 'Descargando...' : 'Descargar Excel'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* 3. Indicador de estado del reporte seleccionado */}
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
            <span
              className="badge badge-success"
              style={{ fontSize: '0.72rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
            >
              <ShieldCheck size={13} />
              Reporte Oficial Certificado
            </span>

            {tablaActiva?.certificadoPor && (
              <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                Certificado por: <strong>{tablaActiva.certificadoPor}</strong>
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
              <span style={{ fontSize: '0.82rem' }}>Cargando registros del reporte...</span>
            </div>
          ) : tablasBi.length === 0 ? (
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
                No hay reportes certificados disponibles
              </div>
              <span style={{ fontSize: '0.76rem', marginTop: '0.2rem' }}>
                Cuando se certifiquen reportes tributarios en Superset para tu área, aparecerán aquí automáticamente.
              </span>
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
                {busquedaTexto ? 'No hay registros que coincidan con la búsqueda' : 'Reporte sin filas disponibles'}
              </div>
              <span style={{ fontSize: '0.76rem', marginTop: '0.2rem' }}>
                {busquedaTexto
                  ? 'Intenta con otro término o limpia el buscador.'
                  : 'Este reporte está certificado pero actualmente no contiene registros en la base de datos.'}
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
