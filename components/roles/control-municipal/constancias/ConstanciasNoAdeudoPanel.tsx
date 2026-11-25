'use client';

import React, { useState, useMemo, useEffect, useRef, useId, useCallback } from 'react';
import {
  FileCheck,
  FileSpreadsheet,
  Search,
  Download,
  MoreHorizontal,
  RefreshCw,
  Eye,
  EyeOff,
  ShieldCheck,
  AlertTriangle,
  Printer,
  X,
  FileText,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ChevronDown,
  ChevronUp,
  Check,
  Copy,
  CheckCircle2,
  Info
} from 'lucide-react';
import { CardHeader, CardAside } from '@/components/shared/ui/CardHeader';
import { exportarCSV, descargarBlobArchivo } from '@/utils/csv.utils';
import {
  ConstanciaItem,
  ConstanciaPdfResponse,
} from '@/types/reportes-tributarios.types';
import { MOCK_CONSTANCIAS, reportesController } from '@/controllers/reportes.controller';
import { exportarReporteTributarioPdf } from '../tributarios/exportarReportePdf';
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

  // Paginación, Privacidad LPDP y Menú compacto de exportación
  const [paginaActual, setPaginaActual] = useState(1);
  const [registrosPorPagina, setRegistrosPorPagina] = useState(10);
  const [enmascararPrivacidad, setEnmascararPrivacidad] = useState(false);
  const [exportandoPdfLista, setExportandoPdfLista] = useState(false);
  const [menuAbierto, setMenuAbierto] = useState(false);
  const triggerId = useId();
  const menuId = useId();
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const menuPopoverRef = useRef<HTMLDivElement | null>(null);
  const menuFocusGroupRef = useRef<HTMLDivElement | null>(null);
  const entrarAlAbrirRef = useRef<boolean>(false);
  const aperturaPorPunteroRef = useRef<boolean>(false);

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

  const [pdfBlobUrl, setPdfBlobUrl] = useState<string>('');
  const pdfIframeRef = useRef<HTMLIFrameElement | null>(null);

  useEffect(() => {
    return () => {
      if (pdfBlobUrl) URL.revokeObjectURL(pdfBlobUrl);
    };
  }, [pdfBlobUrl]);

  const base64ToPdfBlobUrl = (base64Raw: string): string => {
    try {
      const limpio = base64Raw.replace(/^data:application\/pdf;base64,/, '').trim();
      const bytesStr = window.atob(limpio);
      const bytes = new Uint8Array(bytesStr.length);
      for (let i = 0; i < bytesStr.length; i++) {
        bytes[i] = bytesStr.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: 'application/pdf' });
      return URL.createObjectURL(blob);
    } catch {
      return base64Raw.startsWith('data:')
        ? base64Raw
        : `data:application/pdf;base64,${base64Raw}`;
    }
  };

  const handleVerConstancia = async (item: ConstanciaItem) => {
    setConstanciaSeleccionada(item);
    setPdfData(null);
    if (pdfBlobUrl) {
      URL.revokeObjectURL(pdfBlobUrl);
      setPdfBlobUrl('');
    }
    setCargandoPdf(true);
    setMostrarVisorPdf(false);
    try {
      const respPdf = await reportesController.getConstanciaPdf(item.id);
      setPdfData(respPdf);
      if (respPdf.detalle) {
        setConstanciaSeleccionada(respPdf.detalle);
      }
      if (respPdf.pdfBase64) {
        setPdfBlobUrl(base64ToPdfBlobUrl(respPdf.pdfBase64));
      }
    } catch {
      setPdfData(null);
    } finally {
      setCargandoPdf(false);
    }
  };

  const [copiadoCvd, setCopiadoCvd] = useState(false);
  const [mostrarVisorPdf, setMostrarVisorPdf] = useState(false);

  const handleCerrarModalPdf = useCallback(() => {
    setConstanciaSeleccionada(null);
    setPdfData(null);
    setPdfBlobUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return '';
    });
    setCopiadoCvd(false);
    setMostrarVisorPdf(false);
  }, []);

  // Heurística 3 de Nielsen: Control y libertad del usuario (cerrar con tecla Escape)
  useEffect(() => {
    if (!constanciaSeleccionada) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleCerrarModalPdf();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [constanciaSeleccionada, handleCerrarModalPdf]);

  // Heurística 7 de Nielsen: Eficiencia de uso (copiar hash CVD con feedback visual)
  const handleCopiarCvd = async (cvd: string) => {
    try {
      await navigator.clipboard.writeText(cvd);
      setCopiadoCvd(true);
      setTimeout(() => setCopiadoCvd(false), 2000);
    } catch {
      // Ignorar si el portapapeles no está disponible
    }
  };

  const pdfEmbedSrc = useMemo(() => {
    if (pdfData?.pdfUrl) return pdfData.pdfUrl;
    if (pdfBlobUrl) return pdfBlobUrl;
    if (pdfData?.pdfBase64) {
      return pdfData.pdfBase64.startsWith('data:')
        ? pdfData.pdfBase64
        : `data:application/pdf;base64,${pdfData.pdfBase64}`;
    }
    return '';
  }, [pdfData, pdfBlobUrl]);

  const handleImprimirConstancia = () => {
    // Si la constancia tiene el PDF oficial emitido (el mismo de la App Móvil),
    // imprime directamente ese archivo PDF para que coincida con "Descargar PDF Firmado".
    if (pdfEmbedSrc) {
      const iframeWin = pdfIframeRef.current?.contentWindow;
      if (iframeWin) {
        try {
          iframeWin.focus();
          iframeWin.print();
          return;
        } catch {
          // Si es cross-origin, abrimos el PDF en una ventana para imprimirlo
        }
      }
      const printWin = window.open(pdfEmbedSrc, '_blank', 'noopener,noreferrer');
      if (printWin) return;
    }
    window.print();
  };

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

  const construirDatosExportacion = () => {
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
      c.deudaMonto.toFixed(2),
      c.firmadoDigitalmente ? 'FIRMADO DIGITALMENTE' : 'NO EMITIDO / OBSERVADO',
      c.entidadCertificadora,
      c.hashCVD,
      c.fechaEmision,
      c.fechaVencimiento,
    ]);

    return { cabeceras, filas };
  };

  // Exportar relación a CSV
  const handleExportarRelacionCsv = () => {
    menuPopoverRef.current?.hidePopover?.();
    const { cabeceras, filas } = construirDatosExportacion();
    exportarCSV('Relacion_Constancias_NoAdeudo_2026', cabeceras, filas);
  };

  // Exportar relación a Excel
  const handleExportarRelacionExcel = () => {
    menuPopoverRef.current?.hidePopover?.();
    const { cabeceras, filas } = construirDatosExportacion();
    const contenido = [cabeceras.join('\t'), ...filas.map((f) => f.join('\t'))].join('\n');
    const blob = new Blob(['\ufeff' + contenido], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    descargarBlobArchivo(blob, 'Relacion_Constancias_NoAdeudo_2026.xls');
  };

  // Exportar relación a PDF oficial con membrete de San Miguel
  const handleExportarRelacionPdf = async () => {
    menuPopoverRef.current?.hidePopover?.();
    if (constanciasFiltradas.length === 0) return;
    setExportandoPdfLista(true);
    try {
      const { cabeceras, filas } = construirDatosExportacion();
      const filtroPartes = [
        filtroEstado !== 'TODOS' ? `Estado: ${filtroEstado}` : '',
        busqueda.trim(),
      ].filter(Boolean);

      await exportarReporteTributarioPdf({
        tabla: {
          id: 0,
          nombre: 'Constancias de No Adeudo Tributario',
          descripcion: 'Expedientes y auditoría de firmas digitales PAdES y validez tributaria',
          certificadoPor: 'Gerencia de Administración Tributaria',
        },
        cabeceras,
        filas,
        busquedaTexto: filtroPartes.join(' | '),
        enmascararPrivacidad,
        tablaIncompleta: false,
        enmascararValor: (valor) => valor,
      });
    } finally {
      setExportandoPdfLista(false);
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
              aria-label={
                enmascararPrivacidad
                  ? 'Mostrar datos sensibles completos'
                  : 'Enmascarar datos de personas según Ley 29733 de Protección de Datos Personales'
              }
              title="Enmascarar datos de personas según Ley 29733 de Protección de Datos Personales"
            >
              {enmascararPrivacidad ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>

            <button
              ref={triggerRef}
              id={triggerId}
              type="button"
              className="btn btn-secondary reporte-acciones-trigger"
              aria-haspopup="menu"
              aria-expanded={menuAbierto}
              aria-label={exportandoPdfLista ? 'Generando PDF...' : 'Opciones de descarga'}
              title="Opciones de descarga (CSV, Excel, PDF)"
              disabled={constanciasFiltradas.length === 0 || exportandoPdfLista}
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
              {exportandoPdfLista ? (
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
                  disabled={constanciasFiltradas.length === 0}
                  onPointerMove={(e) => e.currentTarget.focus({ preventScroll: true })}
                  onClick={handleExportarRelacionCsv}
                >
                  <Download size={15} />
                  <span>Descargar CSV</span>
                </button>

                <button
                  type="button"
                  className="reporte-menu-item"
                  disabled={constanciasFiltradas.length === 0}
                  onPointerMove={(e) => e.currentTarget.focus({ preventScroll: true })}
                  onClick={handleExportarRelacionExcel}
                >
                  <FileSpreadsheet size={15} />
                  <span>Descargar Excel</span>
                </button>

                <button
                  type="button"
                  className="reporte-menu-item"
                  disabled={constanciasFiltradas.length === 0 || exportandoPdfLista}
                  onPointerMove={(e) => e.currentTarget.focus({ preventScroll: true })}
                  onClick={handleExportarRelacionPdf}
                >
                  <FileText size={15} />
                  <span>Descargar PDF</span>
                </button>
              </div>
            </div>
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
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--primary-500)' }}>
                      {c.folio}
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
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--primary-500)' }}>
                      {c.predioCodigo}
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
                    <td style={{ fontSize: '0.8rem' }}>
                      {c.firmadoDigitalmente ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-main)' }}>
                          <FileCheck size={14} style={{ color: 'var(--primary-600)' }} /> PAdES RENIEC
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>
                          No emitida
                        </span>
                      )}
                    </td>
                    <td style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>
                      {c.fechaEmision}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button
                        onClick={() => handleVerConstancia(c)}
                        className="btn btn-primary"
                        style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', whiteSpace: 'nowrap' }}
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
        <div
          className="modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="titulo-constancia-modal"
          onClick={(e) => {
            if (e.target === e.currentTarget) handleCerrarModalPdf();
          }}
        >
          {/* Reglas de impresión: al imprimir se oculta el modal y el portal, imprimiendo únicamente la hoja oficial de la constancia */}
          <style>{`
            @media print {
              body * {
                visibility: hidden !important;
              }
              #hoja-oficial-constancia,
              #hoja-oficial-constancia * {
                visibility: visible !important;
              }
              #hoja-oficial-constancia {
                position: fixed !important;
                left: 0 !important;
                top: 0 !important;
                width: 100% !important;
                max-width: 100% !important;
                margin: 0 !important;
                padding: 1.5cm 2cm !important;
                border: none !important;
                box-shadow: none !important;
                background: #ffffff !important;
                color: #000000 !important;
              }
              .no-imprimir {
                display: none !important;
              }
              * {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
            }
          `}</style>

          <div className="modal-content" style={{ maxWidth: '780px' }}>
            {/* Cabecera estándar del Modal alineada con los demás paneles */}
            <div className="modal-header">
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.25rem' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary-500)', fontFamily: 'var(--font-mono)' }}>
                    {constanciaSeleccionada.folio}
                  </span>
                  {constanciaSeleccionada.estadoTributario === 'SIN_DEUDA' ? (
                    <span className="badge badge-success" style={{ fontSize: '0.725rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                      <CheckCircle2 size={12} /> Sin deuda
                    </span>
                  ) : (
                    <span className="badge badge-danger" style={{ fontSize: '0.725rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                      <AlertTriangle size={12} /> Registra deuda
                    </span>
                  )}
                </div>
                <h3
                  id="titulo-constancia-modal"
                  style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.45rem' }}
                >
                  <FileCheck size={18} /> Constancia de No Adeudo
                </h3>
              </div>

              <button
                type="button"
                onClick={handleCerrarModalPdf}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                  padding: '0.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                aria-label="Cerrar modal"
              >
                <X size={20} />
              </button>
            </div>

            {/* Cuerpo del Certificado */}
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Notificación de carga / sincronización si aplica */}
              {cargandoPdf && (
                <div
                  className="no-imprimir"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    background: 'var(--sky-50, rgba(2, 132, 199, 0.08))',
                    border: '1px solid var(--sky-200, rgba(2, 132, 199, 0.25))',
                    borderRadius: '8px',
                    padding: '0.6rem 0.85rem',
                    fontSize: '0.775rem',
                    color: 'var(--sky-800, #0369a1)',
                  }}
                >
                  <Info size={16} /> Consultando expediente y firma digital en el servidor...
                </div>
              )}

              {/* Hoja Oficial del Certificado Municipal (Imprimible) */}
              <div
                id="hoja-oficial-constancia"
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '12px',
                  padding: '1.75rem',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                }}
              >
                {/* Membrete Oficial Municipal */}
                <div
                  style={{
                    textAlign: 'center',
                    borderBottom: '2px solid var(--sky-700, #0369a1)',
                    paddingBottom: '1rem',
                    marginBottom: '1.25rem',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      gap: '0.75rem',
                      marginBottom: '0.4rem',
                    }}
                  >
                    <Image
                      src="/logo-san-miguel-light.png"
                      alt="Municipalidad de San Miguel"
                      width={130}
                      height={40}
                      style={{ objectFit: 'contain' }}
                    />
                  </div>
                  <h4
                    style={{
                      margin: 0,
                      fontSize: '0.85rem',
                      fontWeight: 800,
                      letterSpacing: '0.5px',
                      color: 'var(--text-main)',
                      textTransform: 'uppercase',
                    }}
                  >
                    Municipalidad Distrital de San Miguel
                  </h4>
                  <p
                    style={{
                      margin: '0.2rem 0 0',
                      fontSize: '0.725rem',
                      color: 'var(--text-muted)',
                      letterSpacing: '0.3px',
                    }}
                  >
                    GERENCIA DE ADMINISTRACIÓN TRIBUTARIA • SUBGERENCIA DE RECAUDACIÓN Y CONTROL
                  </p>
                </div>

                {/* Título Oficial de la Constancia */}
                <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
                  <h2
                    style={{
                      fontSize: '1.15rem',
                      fontWeight: 900,
                      color: 'var(--sky-800, #0369a1)',
                      margin: 0,
                      letterSpacing: '0.5px',
                    }}
                  >
                    CONSTANCIA DE NO ADEUDO TRIBUTARIO
                  </h2>
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      fontSize: '0.825rem',
                      fontWeight: 700,
                      color: 'var(--text-muted)',
                      marginTop: '0.25rem',
                      fontFamily: 'var(--font-mono, monospace)',
                    }}
                  >
                    N° {constanciaSeleccionada.folio}
                  </div>
                </div>

                {/* Ficha Técnica Estructurada (Heurística 6: Reconocimiento antes que recuerdo) */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                    gap: '0.75rem',
                    marginBottom: '1.25rem',
                  }}
                >
                  {/* Caja 1: Contribuyente */}
                  <div
                    style={{
                      background: 'var(--bg-card-subtle)',
                      borderRadius: '10px',
                      padding: '0.75rem 1rem',
                      border: '1px solid var(--border-color)',
                      fontSize: '0.8rem',
                    }}
                  >
                    <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                      Datos del Contribuyente
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Nombre / Razón:</span>
                        <strong style={{ color: 'var(--text-main)', textAlign: 'right' }}>{constanciaSeleccionada.contribuyenteNombre}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Documento:</span>
                        <span style={{ fontWeight: 600 }}>{constanciaSeleccionada.documentoTipo} {constanciaSeleccionada.documentoNumero}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Código Contribuyente:</span>
                        <span style={{ fontFamily: 'var(--font-mono, monospace)', fontWeight: 600 }}>{constanciaSeleccionada.contribuyenteCodigo}</span>
                      </div>
                    </div>
                  </div>

                  {/* Caja 2: Predio y Vigencia */}
                  <div
                    style={{
                      background: 'var(--bg-card-subtle)',
                      borderRadius: '10px',
                      padding: '0.75rem 1rem',
                      border: '1px solid var(--border-color)',
                      fontSize: '0.8rem',
                    }}
                  >
                    <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                      Predio y Vigencia Legal
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Código Predio:</span>
                        <strong style={{ fontFamily: 'var(--font-mono, monospace)', color: 'var(--text-main)' }}>{constanciaSeleccionada.predioCodigo}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Ubicación:</span>
                        <span style={{ fontWeight: 600, textAlign: 'right', fontSize: '0.775rem' }}>{constanciaSeleccionada.direccionPredio}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Vigente hasta:</span>
                        <span style={{ color: 'var(--primary-700, #0369a1)', fontWeight: 700 }}>{constanciaSeleccionada.fechaVencimiento}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Dictamen Legal (Heurística 2 y 9: Lenguaje claro del dominio tributario) */}
                {constanciaSeleccionada.estadoTributario === 'SIN_DEUDA' ? (
                  <div
                    style={{
                      fontSize: '0.825rem',
                      lineHeight: '1.6',
                      color: 'var(--text-main)',
                      marginBottom: '1.25rem',
                      textAlign: 'justify',
                    }}
                  >
                    <p style={{ margin: '0 0 0.5rem' }}>
                      La <strong>Subgerencia de Recaudación y Control Tributario</strong> de la Municipalidad Distrital de San Miguel, en mérito al Texto Único Ordenado de la Ley de Tributación Municipal (D.S. N° 156-2004-EF) y a los registros del Sistema Integrado de Administración Tributaria:
                    </p>
                    <p style={{ fontWeight: 800, textAlign: 'center', fontSize: '0.9rem', margin: '0.75rem 0', color: 'var(--text-main)' }}>
                      CERTIFICA QUE:
                    </p>
                    <p style={{ margin: 0 }}>
                      El(La) contribuyente <strong>{constanciaSeleccionada.contribuyenteNombre}</strong>, respecto al predio con Código Registral <strong>{constanciaSeleccionada.predioCodigo}</strong>, <strong>NO REGISTRA DEUDA TRIBUTARIA PENDIENTE DE PAGO</strong> por concepto de <strong>IMPUESTO PREDIAL</strong> ni <strong>ARBITRIOS MUNICIPALES</strong> (Limpieza Pública, Parques y Jardines, y Seguridad Ciudadana) hasta el Ejercicio Fiscal 2026.
                    </p>
                  </div>
                ) : (
                  <div
                    style={{
                      background: 'var(--amber-50, rgba(245, 158, 11, 0.08))',
                      border: '1px solid var(--amber-300, rgba(245, 158, 11, 0.35))',
                      padding: '1rem',
                      borderRadius: '10px',
                      color: 'var(--amber-950, #78350f)',
                      marginBottom: '1.25rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontWeight: 800, fontSize: '0.85rem' }}>
                      <AlertTriangle size={18} color="var(--amber-700, #b45309)" /> DICTAMEN: NO PROCEDE EMISIÓN DE CONSTANCIA
                    </div>
                    <p style={{ margin: '0.4rem 0 0', fontSize: '0.8rem', lineHeight: '1.5' }}>
                      El contribuyente registra un saldo deudor tributario pendiente por el monto total de <strong>S/ {constanciaSeleccionada.deudaMonto.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</strong> por concepto de Impuesto Predial y Arbitrios respecto al predio solicitado. Para subsanar, deberá cancelar la deuda o acogerse a un convenio de fraccionamiento tributario.
                    </p>
                  </div>
                )}

                {/* Sello Reglamentario de Firma Digital PAdES / RENIEC (Heurística 2, 7 y 8: Minimalismo sin elementos decorativos falsos como QR estático) */}
                {constanciaSeleccionada.firmadoDigitalmente && (
                  <div
                    style={{
                      border: '1px solid var(--border-color)',
                      borderLeft: '4px solid var(--green-600, #16a34a)',
                      background: 'var(--bg-card-subtle)',
                      borderRadius: '10px',
                      padding: '1rem 1.15rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      flexWrap: 'wrap',
                      gap: '1rem',
                    }}
                  >
                    <div style={{ flex: 1, minWidth: '240px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.35rem' }}>
                        <ShieldCheck size={17} color="var(--green-600, #16a34a)" />
                        <span style={{ fontSize: '0.725rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '0.3px' }}>
                          DOCUMENTO FIRMADO DIGITALMENTE (LEY N° 27269)
                        </span>
                      </div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)' }}>
                        {constanciaSeleccionada.firmanteNombre}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {constanciaSeleccionada.firmanteCargo} · Entidad Certificadora: {constanciaSeleccionada.entidadCertificadora}
                      </div>
                    </div>

                    {/* Código de Verificación Digital (CVD) con botón interactivo de copiar (Heurística 7) */}
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.45rem',
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '8px',
                        padding: '0.35rem 0.65rem',
                        fontSize: '0.75rem',
                      }}
                    >
                      <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>CVD:</span>
                      <code style={{ fontFamily: 'var(--font-mono, monospace)', fontWeight: 700, color: 'var(--text-main)' }}>
                        {constanciaSeleccionada.hashCVD}
                      </code>
                      <button
                        type="button"
                        className="no-imprimir"
                        onClick={() => handleCopiarCvd(constanciaSeleccionada.hashCVD)}
                        title="Copiar CVD al portapapeles"
                        style={{
                          background: 'none',
                          border: 'none',
                          color: copiadoCvd ? 'var(--green-600, #16a34a)' : 'var(--primary-500)',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.2rem',
                          padding: '0.1rem 0.25rem',
                          fontWeight: 600,
                        }}
                      >
                        {copiadoCvd ? (
                          <>
                            <Check size={12} /> ¡Copiado!
                          </>
                        ) : (
                          <>
                            <Copy size={12} /> Copiar
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Sección Desplegable: Archivo PDF Original Emitido por el Servidor */}
              {pdfEmbedSrc && (
                <div
                  className="no-imprimir"
                  style={{
                    border: '1px solid var(--border-color)',
                    borderRadius: '10px',
                    overflow: 'hidden',
                    background: 'var(--bg-card)',
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setMostrarVisorPdf((prev) => !prev)}
                    style={{
                      width: '100%',
                      background: 'var(--bg-card-subtle)',
                      padding: '0.65rem 1rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontSize: '0.8rem',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'var(--text-main)',
                      fontWeight: 600,
                    }}
                  >
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}>
                      <FileText size={16} color="var(--primary-600, #0284c7)" />
                      {mostrarVisorPdf ? 'Ocultar visor de archivo PDF original' : 'Ver archivo PDF original emitido por el servidor'}
                    </span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.725rem', color: 'var(--text-muted)' }}>
                      {mostrarVisorPdf ? (
                        <>
                          Plegar <ChevronUp size={15} />
                        </>
                      ) : (
                        <>
                          Desplegar <ChevronDown size={15} />
                        </>
                      )}
                    </span>
                  </button>

                  {/* Iframe oculto siempre montado cuando hay PDF para que el botón "Imprimir" imprima el PDF oficial de la app móvil incluso si el acordeón está cerrado */}
                  {!mostrarVisorPdf && (
                    <iframe
                      ref={pdfIframeRef}
                      src={pdfEmbedSrc}
                      title={`Impresión PDF ${constanciaSeleccionada.folio}`}
                      style={{ position: 'fixed', width: 0, height: 0, border: 0, opacity: 0, pointerEvents: 'none' }}
                      aria-hidden="true"
                      tabIndex={-1}
                    />
                  )}

                  {mostrarVisorPdf && (
                    <div>
                      <div
                        style={{
                          padding: '0.4rem 1rem',
                          background: 'var(--bg-card)',
                          display: 'flex',
                          justifyContent: 'flex-end',
                          alignItems: 'center',
                          borderTop: '1px solid var(--border-color)',
                          borderBottom: '1px solid var(--border-color)',
                          fontSize: '0.725rem',
                        }}
                      >
                        <a
                          href={pdfEmbedSrc}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                            color: 'var(--primary-600, #0284c7)',
                            textDecoration: 'none',
                            fontWeight: 600,
                          }}
                        >
                          <ExternalLink size={12} /> Abrir archivo en pestaña nueva
                        </a>
                      </div>
                      <iframe
                        ref={pdfIframeRef}
                        src={pdfEmbedSrc}
                        title={`PDF ${constanciaSeleccionada.folio}`}
                        style={{ width: '100%', height: '480px', border: 'none', display: 'block' }}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Pie de Acciones del Modal (Heurística 3: Control y libertad, Heurística 7: Flexibilidad) */}
            <div
              className="modal-footer no-imprimir"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.9rem 1.5rem',
                borderTop: '1px solid var(--border-color)',
                background: 'var(--bg-card-subtle)',
                gap: '0.75rem',
                flexWrap: 'wrap',
              }}
            >
              <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
                * Validez legal de 30 días calendario contados a partir de su emisión.
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={handleCerrarModalPdf}
                  className="btn btn-secondary"
                  style={{ fontSize: '0.8rem', padding: '0.4rem 0.85rem' }}
                >
                  Cerrar
                </button>

                <button
                  type="button"
                  onClick={handleImprimirConstancia}
                  className="btn btn-secondary"
                  style={{ fontSize: '0.8rem', padding: '0.4rem 0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                >
                  <Printer size={14} /> Imprimir / Guardar
                </button>

                {constanciaSeleccionada.firmadoDigitalmente && (
                  <button
                    type="button"
                    onClick={handleDescargarPdfFirmado}
                    className="btn btn-primary"
                    style={{ fontSize: '0.8rem', padding: '0.4rem 0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                  >
                    <Download size={14} /> Descargar PDF Firmado
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
