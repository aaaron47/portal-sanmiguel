'use client';

import React, { useEffect, useId, useRef, useState } from 'react';
import { Download, FileSpreadsheet, FileText, MoreHorizontal, RefreshCw } from 'lucide-react';

interface ReporteExportMenuProps {
  onExportCsv: () => void | Promise<void>;
  onExportExcel: () => void | Promise<void>;
  onExportPdf: () => void | Promise<void>;
  disabled?: boolean;
  disabledCsv?: boolean;
  disabledExcel?: boolean;
  disabledPdf?: boolean;
  cargando?: boolean;
  title?: string;
  ariaLabel?: string;
}

/**
 * Menú compacto de exportación (...) con el mismo comportamiento accesible,
 * popover nativo y estilo de Control Municipal (Descargar CSV, Excel y PDF).
 */
export const ReporteExportMenu: React.FC<ReporteExportMenuProps> = ({
  onExportCsv,
  onExportExcel,
  onExportPdf,
  disabled = false,
  disabledCsv = false,
  disabledExcel = false,
  disabledPdf = false,
  cargando = false,
  title = 'Opciones de descarga (CSV, Excel, PDF)',
  ariaLabel,
}) => {
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [procesandoInterno, setProcesandoInterno] = useState<'csv' | 'xlsx' | 'pdf' | null>(null);
  const triggerId = useId();
  const menuId = useId();
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const menuPopoverRef = useRef<HTMLDivElement | null>(null);
  const menuFocusGroupRef = useRef<HTMLDivElement | null>(null);
  const entrarAlAbrirRef = useRef<boolean>(false);
  const aperturaPorPunteroRef = useRef<boolean>(false);

  const estaOcupado = cargando || procesandoInterno !== null;

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

  const ejecutarAccion = async (
    tipo: 'csv' | 'xlsx' | 'pdf',
    fn: () => void | Promise<void>
  ) => {
    menuPopoverRef.current?.hidePopover?.();
    setProcesandoInterno(tipo);
    try {
      await fn();
    } finally {
      setProcesandoInterno(null);
    }
  };

  return (
    <>
      <button
        ref={triggerRef}
        id={triggerId}
        type="button"
        className="btn btn-secondary reporte-acciones-trigger"
        style={{ height: '38px', boxSizing: 'border-box' }}
        aria-haspopup="menu"
        aria-expanded={menuAbierto}
        aria-label={
          estaOcupado
            ? 'Generando reporte...'
            : ariaLabel || 'Opciones de descarga'
        }
        title={title}
        disabled={disabled || estaOcupado}
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
        {estaOcupado ? (
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
            disabled={disabled || disabledCsv || estaOcupado}
            onPointerMove={(e) => e.currentTarget.focus({ preventScroll: true })}
            onClick={() => void ejecutarAccion('csv', onExportCsv)}
          >
            <Download size={15} />
            <span>Descargar CSV</span>
          </button>

          <button
            type="button"
            className="reporte-menu-item"
            disabled={disabled || disabledExcel || estaOcupado}
            onPointerMove={(e) => e.currentTarget.focus({ preventScroll: true })}
            onClick={() => void ejecutarAccion('xlsx', onExportExcel)}
          >
            <FileSpreadsheet size={15} />
            <span>Descargar Excel</span>
          </button>

          <button
            type="button"
            className="reporte-menu-item"
            disabled={disabled || disabledPdf || estaOcupado}
            onPointerMove={(e) => e.currentTarget.focus({ preventScroll: true })}
            onClick={() => void ejecutarAccion('pdf', onExportPdf)}
          >
            <FileText size={15} />
            <span>Descargar PDF</span>
          </button>
        </div>
      </div>
    </>
  );
};
