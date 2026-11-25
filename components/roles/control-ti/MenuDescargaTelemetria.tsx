'use client';

import React, { useState, useEffect, useRef, useId } from 'react';
import { Download, FileSpreadsheet, FileText, MoreHorizontal, RefreshCw } from 'lucide-react';

interface MenuDescargaTelemetriaProps {
  disabled?: boolean;
  exportandoPdf?: boolean;
  label?: string;
  onExportarCsv: () => void;
  onExportarExcel: () => void;
  onExportarPdf: () => void | Promise<void>;
}

/**
 * Botón compacto "..." (38x38px) con menú desplegable para exportar reportes en CSV, Excel y PDF.
 */
export const MenuDescargaTelemetria: React.FC<MenuDescargaTelemetriaProps> = ({
  disabled = false,
  exportandoPdf = false,
  label = 'Opciones de descarga (CSV, Excel, PDF)',
  onExportarCsv,
  onExportarExcel,
  onExportarPdf,
}) => {
  const [menuAbierto, setMenuAbierto] = useState(false);
  const triggerId = useId();
  const menuId = useId();
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const menuPopoverRef = useRef<HTMLDivElement | null>(null);
  const menuFocusGroupRef = useRef<HTMLDivElement | null>(null);
  const entrarAlAbrirRef = useRef(false);
  const aperturaPorPunteroRef = useRef(false);

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

  const cerrarMenu = () => {
    menuPopoverRef.current?.hidePopover?.();
  };

  return (
    <>
      <button
        ref={triggerRef}
        id={triggerId}
        type="button"
        className="btn btn-secondary reporte-acciones-trigger"
        aria-haspopup="menu"
        aria-expanded={menuAbierto}
        aria-label={exportandoPdf ? 'Generando PDF...' : label}
        title={label}
        disabled={disabled || exportandoPdf}
        style={{
          width: '38px',
          height: '38px',
          minWidth: '38px',
          padding: 0,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '8px',
          boxSizing: 'border-box',
        }}
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
            cerrarMenu();
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
            disabled={disabled}
            onPointerMove={(e) => e.currentTarget.focus({ preventScroll: true })}
            onClick={() => {
              cerrarMenu();
              onExportarCsv();
            }}
          >
            <Download size={15} />
            <span>Descargar CSV</span>
          </button>

          <button
            type="button"
            className="reporte-menu-item"
            disabled={disabled}
            onPointerMove={(e) => e.currentTarget.focus({ preventScroll: true })}
            onClick={() => {
              cerrarMenu();
              onExportarExcel();
            }}
          >
            <FileSpreadsheet size={15} />
            <span>Descargar Excel</span>
          </button>

          <button
            type="button"
            className="reporte-menu-item"
            disabled={disabled || exportandoPdf}
            onPointerMove={(e) => e.currentTarget.focus({ preventScroll: true })}
            onClick={() => {
              cerrarMenu();
              void onExportarPdf();
            }}
          >
            <FileText size={15} />
            <span>Descargar PDF</span>
          </button>
        </div>
      </div>
    </>
  );
};
