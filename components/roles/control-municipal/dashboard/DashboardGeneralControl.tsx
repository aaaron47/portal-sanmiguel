'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef, useId } from 'react';
import {
  BarChart3,
  Building,
  Calendar,
  Download,
  FileSpreadsheet,
  FileText,
  MoreHorizontal,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';
import { CardHeader, CardAside } from '@/components/shared/ui/CardHeader';
import { KpisReporte, ReportePorArea } from '@/controllers/reportes.controller';
import { ControlMunicipalKpis } from '../reportes/parts/ControlMunicipalKpis';
import { CumplimientoAreasTable } from '../reportes/parts/CumplimientoAreasTable';
import { ControlDashboardSuperset, SupersetSdkDashboard } from '@/components/superset/SupersetSdkDashboard';
import { BotonExportarPdf } from '@/components/superset/BotonExportarPdf';
import { iaDashboardsController } from '@/controllers/ia-dashboards.controller';
import { NOMBRE_MODULO, SupersetDashboardInfo, idSupersetDe } from '@/types/superset.types';
import { mensajeErrorApi } from '@/services/api-client.service';
import { exportarCSV, descargarBlobArchivo } from '@/utils/csv.utils';
import { exportarReporteTributarioPdf } from '../tributarios/exportarReportePdf';

const NOMBRES_MESES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Setiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

const NOMBRES_TRIMESTRES = ['Primer', 'Segundo', 'Tercer', 'Cuarto'];

function generarOpcionesPeriodo(): { value: string; label: string }[] {
  const ahora = new Date();
  const opciones: { value: string; label: string }[] = [];

  // Mes en curso y los 2 meses anteriores
  for (let i = 0; i < 3; i++) {
    const fecha = new Date(ahora.getFullYear(), ahora.getMonth() - i, 1);
    const anio = fecha.getFullYear();
    const mesIndex = fecha.getMonth();
    const mes = String(mesIndex + 1).padStart(2, '0');
    const sufijo = i === 0 ? ' (En Curso)' : '';
    opciones.push({
      value: `${anio}-${mes}`,
      label: `${NOMBRES_MESES[mesIndex]} ${anio}${sufijo}`,
    });
  }

  // Trimestre en curso y trimestre anterior
  const trimestreActual = Math.floor(ahora.getMonth() / 3) + 1;
  const anioActual = ahora.getFullYear();
  opciones.push({
    value: `${anioActual}-T${trimestreActual}`,
    label: `${NOMBRES_TRIMESTRES[trimestreActual - 1]} Trimestre ${anioActual} (En Curso)`,
  });

  const trimestreAnterior = trimestreActual === 1 ? 4 : trimestreActual - 1;
  const anioTrimestreAnterior = trimestreActual === 1 ? anioActual - 1 : anioActual;
  opciones.push({
    value: `${anioTrimestreAnterior}-T${trimestreAnterior}`,
    label: `${NOMBRES_TRIMESTRES[trimestreAnterior - 1]} Trimestre ${anioTrimestreAnterior}`,
  });

  return opciones;
}

interface DashboardGeneralControlProps {
  kpis: KpisReporte | null;
  areas: ReportePorArea[];
  periodo: string;
  cargando?: boolean;
  onPeriodoChange: (periodo: string) => void;
  onActualizar?: () => void;
  onDescargarReporte: () => void;
}

export const DashboardGeneralControl: React.FC<DashboardGeneralControlProps> = ({
  kpis,
  areas,
  periodo,
  cargando = false,
  onPeriodoChange,
  onActualizar,
  onDescargarReporte,
}) => {
  const [dashboardTributario, setDashboardTributario] = useState<SupersetDashboardInfo | null>(null);
  const [cargandoDashboard, setCargandoDashboard] = useState<boolean>(true);
  const [errorDashboard, setErrorDashboard] = useState<string | null>(null);
  const [recargaKey, setRecargaKey] = useState<number>(0);
  /** Dashboard de Superset ya montado (para exportarlo a PDF) */
  const [controlSdk, setControlSdk] = useState<ControlDashboardSuperset | null>(null);
  const [exportandoPdf, setExportandoPdf] = useState<boolean>(false);
  const [menuAbierto, setMenuAbierto] = useState<boolean>(false);
  const triggerId = useId();
  const menuId = useId();
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const menuPopoverRef = useRef<HTMLDivElement | null>(null);
  const menuFocusGroupRef = useRef<HTMLDivElement | null>(null);
  const entrarAlAbrirRef = useRef<boolean>(false);
  const aperturaPorPunteroRef = useRef<boolean>(false);

  const opcionesPeriodo = useMemo(() => generarOpcionesPeriodo(), []);
  const opcionActiva = useMemo(
    () => opcionesPeriodo.find((op) => op.value === periodo),
    [opcionesPeriodo, periodo]
  );
  const etiquetaPeriodo = opcionActiva?.label || periodo;
  const esPeriodoEnCurso = Boolean(opcionActiva?.label.includes('(En Curso)'));

  const reintentar = useCallback(() => {
    setCargandoDashboard(true);
    setErrorDashboard(null);
    setRecargaKey((k) => k + 1);
  }, []);

  const handleActualizarEnCurso = () => {
    onActualizar?.();
    reintentar();
  };

  const construirTablaInforme = () => {
    const cabeceras = [
      'Gerencia / Área',
      'Total Recibidos',
      'Resueltos',
      'En Trámite',
      'Efectividad (%)',
    ];
    const filas = areas.map((a) => [
      a.area,
      String(a.totalReclamos),
      String(a.resueltos),
      String(a.enProceso),
      `${a.porcentajeCumplimiento}%`,
    ]);
    return { cabeceras, filas };
  };

  const handleExportarCsv = () => {
    menuPopoverRef.current?.hidePopover?.();
    const { cabeceras, filas } = construirTablaInforme();
    exportarCSV(`Informe_Control_Municipal_${periodo}`, cabeceras, filas);
    onDescargarReporte();
  };

  const handleExportarExcel = () => {
    menuPopoverRef.current?.hidePopover?.();
    const { cabeceras, filas } = construirTablaInforme();
    const contenido = [cabeceras.join('\t'), ...filas.map((f) => f.join('\t'))].join('\n');
    const blob = new Blob(['\ufeff' + contenido], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    descargarBlobArchivo(blob, `Informe_Control_Municipal_${periodo}.xls`);
    onDescargarReporte();
  };

  const handleExportarPdf = async () => {
    menuPopoverRef.current?.hidePopover?.();
    if (areas.length === 0) return;
    setExportandoPdf(true);
    try {
      const { cabeceras, filas } = construirTablaInforme();
      const resumenKpis = kpis
        ? `Periodo: ${etiquetaPeriodo} • Tasa de resolución: ${kpis.tasaResolucionPorcentaje}% • Tiempo promedio: ${kpis.tiempoPromedioResolucionDias} días • Constancias emitidas: ${kpis.totalConstanciasEmitidas} • Reclamos atendidos: ${kpis.totalReclamosPeriodo}`
        : `Periodo de evaluación: ${etiquetaPeriodo}`;

      await exportarReporteTributarioPdf({
        tabla: {
          id: 0,
          nombre: 'Informe de Control Municipal',
          descripcion: resumenKpis,
          certificadoPor: 'Órgano de Control Institucional (OCI)',
        },
        cabeceras,
        filas,
        busquedaTexto: '',
        enmascararPrivacidad: false,
        tablaIncompleta: false,
        enmascararValor: (valor) => valor,
      });
      onDescargarReporte();
    } finally {
      setExportandoPdf(false);
    }
  };

  useEffect(() => {
    const popoverEl = menuPopoverRef.current;
    const focusGroupEl = menuFocusGroupRef.current;
    if (!popoverEl || !focusGroupEl) return;

    const obtenerItemsHabilitados = () =>
      Array.from(focusGroupEl.querySelectorAll<HTMLButtonElement>('button')).filter(
        (btn) => !btn.disabled && btn.getAttribute('aria-disabled') !== 'true'
      );

    let limpiarFallbackTeclado: (() => void) | undefined;
    if (!('focusGroup' in HTMLElement.prototype)) {
      focusGroupEl.setAttribute('role', 'menu');
      focusGroupEl.querySelectorAll('button:not([role])').forEach((btn) => {
        btn.setAttribute('role', 'menuitem');
      });
      const onKeyDownFallback = (event: KeyboardEvent) => {
        if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
        const items = obtenerItemsHabilitados();
        if (items.length === 0) return;
        const actual = items.indexOf(document.activeElement as HTMLButtonElement);
        if (actual < 0) return;
        const siguiente =
          event.key === 'Home'
            ? 0
            : event.key === 'End'
              ? items.length - 1
              : (actual + (event.key === 'ArrowUp' ? -1 : 1) + items.length) % items.length;
        event.preventDefault();
        event.stopImmediatePropagation();
        items[siguiente]?.focus({ preventScroll: true });
      };
      focusGroupEl.addEventListener('keydown', onKeyDownFallback, true);
      limpiarFallbackTeclado = () =>
        focusGroupEl.removeEventListener('keydown', onKeyDownFallback, true);
    }

    const posicionarFallback = () => {
      if (CSS.supports('position-area: block-end') || !triggerRef.current) return;
      const triggerRect = triggerRef.current.getBoundingClientRect();
      const menuRect = popoverEl.getBoundingClientRect();
      const margen = 8;
      const espacioAbajo = window.innerHeight - triggerRect.bottom - 6;
      const top =
        espacioAbajo >= menuRect.height || triggerRect.top < menuRect.height
          ? Math.min(triggerRect.bottom + 6, window.innerHeight - menuRect.height - margen)
          : Math.max(margen, triggerRect.top - menuRect.height - 6);
      const leftDeseado = triggerRect.right - menuRect.width;
      const left = Math.max(
        margen,
        Math.min(leftDeseado, window.innerWidth - menuRect.width - margen)
      );
      popoverEl.style.top = `${Math.round(top)}px`;
      popoverEl.style.left = `${Math.round(left)}px`;
    };

    const onToggle = (event: Event) => {
      const toggleEvent = event as ToggleEvent;
      const abierto = toggleEvent.newState === 'open';
      setMenuAbierto(abierto);
      if (abierto) {
        posicionarFallback();
        if (entrarAlAbrirRef.current) {
          entrarAlAbrirRef.current = false;
          aperturaPorPunteroRef.current = false;
          obtenerItemsHabilitados()[0]?.focus({ preventScroll: true });
        } else if (aperturaPorPunteroRef.current) {
          aperturaPorPunteroRef.current = false;
          triggerRef.current?.focus({ preventScroll: true });
        }
      } else {
        entrarAlAbrirRef.current = false;
        aperturaPorPunteroRef.current = false;
      }
    };

    popoverEl.addEventListener('toggle', onToggle);
    return () => {
      popoverEl.removeEventListener('toggle', onToggle);
      limpiarFallbackTeclado?.();
    };
  }, []);

  useEffect(() => {
    if (!menuAbierto) return;
    const onFocusIn = (event: FocusEvent) => {
      const objetivo = event.target as Node | null;
      if (!objetivo) return;
      if (triggerRef.current?.contains(objetivo) || menuPopoverRef.current?.contains(objetivo)) {
        return;
      }
      menuPopoverRef.current?.hidePopover?.();
    };
    document.addEventListener('focusin', onFocusIn);
    return () => document.removeEventListener('focusin', onFocusIn);
  }, [menuAbierto]);

  useEffect(() => {
    let cancelado = false;

    iaDashboardsController
      .getDashboardOficialTributario('CONTROL_MUNICIPAL')
      .then((dash) => {
        if (cancelado) return;
        setDashboardTributario(dash);
        setErrorDashboard(null);
      })
      .catch((err) => {
        if (cancelado) return;
        setErrorDashboard(
          mensajeErrorApi(err, 'No se pudo cargar el dashboard de Reportes Tributarios desde la API.')
        );
      })
      .finally(() => {
        if (!cancelado) setCargandoDashboard(false);
      });

    return () => {
      cancelado = true;
    };
  }, [recargaKey]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* 1. Selector de Periodo y Acciones Compactadas */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Calendar size={18} color="var(--sky-600)" />
          <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>Periodo de Evaluación:</span>
          <select
            value={periodo}
            onChange={(e) => onPeriodoChange(e.target.value)}
            style={{ padding: '0.4rem 0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '0.85rem' }}
          >
            {opcionesPeriodo.map((op) => (
              <option key={op.value} value={op.value}>
                {op.label}
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {esPeriodoEnCurso && (
            <button
              type="button"
              onClick={handleActualizarEnCurso}
              disabled={cargando || cargandoDashboard}
              className="btn btn-secondary"
              style={{ fontSize: '0.85rem' }}
              aria-label="Actualizar indicadores del periodo en curso"
              title="Actualizar indicadores del periodo en curso"
            >
              <RefreshCw
                size={15}
                style={{
                  animation: cargando || cargandoDashboard ? 'spin 1s linear infinite' : 'none',
                }}
              />
            </button>
          )}

          <button
            ref={triggerRef}
            id={triggerId}
            type="button"
            className="btn btn-secondary reporte-acciones-trigger"
            aria-haspopup="menu"
            aria-expanded={menuAbierto}
            aria-label={exportandoPdf ? 'Generando PDF...' : 'Exportar Informe de Control'}
            title="Exportar Informe de Control (CSV, Excel, PDF)"
            disabled={areas.length === 0 || exportandoPdf}
            {...({ commandfor: menuId, command: 'toggle-popover' } as Record<string, string>)}
            onPointerDown={() => {
              aperturaPorPunteroRef.current = true;
              entrarAlAbrirRef.current = false;
            }}
            onClick={() => {
              if (!('commandForElement' in HTMLButtonElement.prototype)) {
                const popoverEl = menuPopoverRef.current as
                  | (HTMLDivElement & {
                      togglePopover?: (opts?: { source?: HTMLElement | null }) => void;
                    })
                  | null;
                popoverEl?.togglePopover?.({ source: triggerRef.current });
              }
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                entrarAlAbrirRef.current = true;
                aperturaPorPunteroRef.current = false;
              } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                entrarAlAbrirRef.current = true;
                aperturaPorPunteroRef.current = false;
                if (!menuAbierto) {
                  triggerRef.current?.click();
                } else {
                  const primero = menuFocusGroupRef.current?.querySelector<HTMLButtonElement>(
                    'button:not(:disabled)'
                  );
                  primero?.focus({ preventScroll: true });
                }
              }
            }}
          >
            {exportandoPdf ? (
              <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} />
            ) : (
              <MoreHorizontal size={16} />
            )}
          </button>

          <div
            ref={menuPopoverRef}
            id={menuId}
            popover="auto"
            className="reporte-menu-popover"
            onKeyDown={(e) => {
              if (e.key === 'Tab') {
                menuPopoverRef.current?.hidePopover?.();
              }
            }}
          >
            <div
              ref={menuFocusGroupRef}
              className="reporte-menu-list"
              aria-labelledby={triggerId}
              {...({ focusgroup: 'menu nomemory' } as Record<string, string>)}
            >
              <button
                type="button"
                className="reporte-menu-item"
                disabled={areas.length === 0}
                onPointerMove={(e) => e.currentTarget.focus({ preventScroll: true })}
                onClick={handleExportarCsv}
              >
                <Download size={15} />
                <span>Descargar CSV</span>
              </button>

              <button
                type="button"
                className="reporte-menu-item"
                disabled={areas.length === 0}
                onPointerMove={(e) => e.currentTarget.focus({ preventScroll: true })}
                onClick={handleExportarExcel}
              >
                <FileSpreadsheet size={15} />
                <span>Descargar Excel</span>
              </button>

              <button
                type="button"
                className="reporte-menu-item"
                disabled={areas.length === 0 || exportandoPdf}
                onPointerMove={(e) => e.currentTarget.focus({ preventScroll: true })}
                onClick={handleExportarPdf}
              >
                <FileText size={15} />
                <span>Descargar PDF</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. KPIs Ejecutivos del Portal y Cumplimiento */}
      {kpis && <ControlMunicipalKpis kpis={kpis} />}

      {/* 3. Cumplimiento de Atención por Gerencia Municipal (OCI) */}
      <div className="card">
        <CardHeader
          icon={<Building size={20} />}
          title="Cumplimiento de Atención por Gerencia Municipal"
          aside={<CardAside>Indicador de efectividad y tiempo de respuesta</CardAside>}
        />
        <CumplimientoAreasTable areas={areas} />
      </div>

      {/* 4. Sección Embebida: Dashboard de Apache Superset (Obtenido vía API: Reportes Tributarios) */}
      <div className="card" style={{ padding: '0.75rem', borderRadius: '16px' }}>
        {cargandoDashboard ? (
          <div
            style={{
              height: '420px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.75rem',
              color: 'var(--text-muted)',
            }}
          >
            <RefreshCw size={26} style={{ animation: 'spin 1s linear infinite' }} color="var(--sky-600)" />
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-main)' }}>
              Cargando Dashboard Oficial de Reportes Tributarios...
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Consultando dashboards publicados vía API
            </span>
          </div>
        ) : errorDashboard ? (
          <div
            style={{
              minHeight: '220px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.75rem',
              padding: '2rem',
              textAlign: 'center',
            }}
          >
            <AlertTriangle size={28} color="var(--red-600)" />
            <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-main)' }}>
              {errorDashboard}
            </div>
            <button
              type="button"
              onClick={reintentar}
              className="btn btn-secondary"
              style={{ fontSize: '0.8rem', padding: '0.4rem 0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <RefreshCw size={14} />
              <span>Reintentar</span>
            </button>
          </div>
        ) : dashboardTributario?.embedUuid ? (
          <>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '0.75rem',
                flexWrap: 'wrap',
                padding: '0.25rem 0.25rem 0.75rem',
              }}
            >
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <BarChart3 size={18} color="var(--sky-600)" />
                {dashboardTributario.titulo}
              </h3>
              <BotonExportarPdf
                embebido={!!dashboardTributario.embedUuid}
                control={controlSdk}
                supersetId={idSupersetDe(dashboardTributario)}
                titulo={dashboardTributario.titulo}
                descripcion={dashboardTributario.descripcion}
                modulo={NOMBRE_MODULO.CONTROL_MUNICIPAL}
              />
            </div>
            <SupersetSdkDashboard dashboardId={dashboardTributario.embedUuid} onControl={setControlSdk} />
          </>
        ) : (
          <div
            style={{
              minHeight: '220px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              padding: '2rem',
              textAlign: 'center',
            }}
          >
            <AlertTriangle size={28} color="var(--amber-600)" />
            <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-main)' }}>
              El dashboard &quot;{dashboardTributario?.titulo || 'Reportes Tributarios'}&quot; no tiene embebido habilitado en Superset.
            </div>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              El identificador de embebido (embedUuid) devuelto por la API es nulo.
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
