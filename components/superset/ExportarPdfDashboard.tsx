'use client';

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { FileDown, X, MonitorUp, CheckCircle2, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { ROLE_LABELS } from '@/types/auth.types';
import { fechaHoraPeru, hoyEnPeru } from '@/utils/fecha-peru.utils';
import { ErrorExportacionPdf, pedirCapturaPestana } from '@/utils/superset-pdf/captura-pestana';
import {
  ALTO_BARRA_EXPORTACION,
  ExportacionCancelada,
  ProgresoExportacion,
  exportarDashboardPdf,
} from '@/utils/superset-pdf/exportar-dashboard';
import type { ControlDashboardSuperset } from './SupersetSdkDashboard';

interface ExportarPdfDashboardProps {
  /** Dashboard montado; mientras sea null el botón queda deshabilitado */
  control: ControlDashboardSuperset | null;
  titulo: string;
  descripcion?: string;
  /** Ej. "Control Municipal" */
  modulo?: string;
  /** "boton": botón de barra; "menu": ítem dentro de un menú popover (reporte-menu-item) */
  variante?: 'boton' | 'menu';
  /** Callback ejecutado antes de abrir el modal (ej. cerrar un menú popover padre) */
  onAccion?: () => void;
}

type Fase = 'inactivo' | 'aviso' | 'exportando';

/**
 * Botón "Exportar PDF" del visor de Superset: explica el permiso que pedirá el navegador, muestra el avance
 * mientras captura y descarga el PDF con el formato del portal.
 */
export const ExportarPdfDashboard: React.FC<ExportarPdfDashboardProps> = ({
  control,
  titulo,
  descripcion,
  modulo,
  variante = 'boton',
  onAccion,
}) => {
  const { usuario, rol } = useAuth();
  const { theme } = useTheme();
  const [fase, setFase] = useState<Fase>('inactivo');
  const [progreso, setProgreso] = useState<ProgresoExportacion>({ etapa: '', porcentaje: 0 });
  const [error, setError] = useState<string | null>(null);
  const [descargado, setDescargado] = useState(false);
  const cancelacionRef = useRef<AbortController | null>(null);
  const botonRef = useRef<HTMLButtonElement>(null);
  const continuarRef = useRef<HTMLButtonElement>(null);

  // La barra de avance se abre en la capa superior en cuanto se monta
  const abrirBarra = (el: HTMLDivElement | null) => {
    if (el && typeof el.showPopover === 'function' && !el.matches(':popover-open')) el.showPopover();
  };

  // Foco en "Continuar" al abrir el aviso; Esc cierra el aviso o cancela la exportación
  useEffect(() => {
    if (fase === 'inactivo') return;
    if (fase === 'aviso') continuarRef.current?.focus();
    const alPresionar = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      e.preventDefault();
      if (fase === 'aviso') {
        setFase('inactivo');
        botonRef.current?.focus();
      } else {
        cancelacionRef.current?.abort();
      }
    };
    window.addEventListener('keydown', alPresionar);
    return () => window.removeEventListener('keydown', alPresionar);
  }, [fase]);

  useEffect(() => {
    if (!descargado) return;
    const t = setTimeout(() => setDescargado(false), 4000);
    return () => clearTimeout(t);
  }, [descargado]);

  const abrirAviso = () => {
    onAccion?.();
    setError(null);
    setDescargado(false);
    setFase('aviso');
  };

  const cerrarAviso = () => {
    setFase('inactivo');
    if (variante !== 'menu') botonRef.current?.focus();
  };

  // El permiso de captura se pide en este mismo clic: el navegador lo exige
  const continuar = () => {
    if (!control) return;
    const permiso = pedirCapturaPestana();
    const cancelacion = new AbortController();
    cancelacionRef.current = cancelacion;
    setProgreso({ etapa: 'Esperando el permiso del navegador', porcentaje: 0 });
    setFase('exportando');

    const ahora = new Date();
    const generadoPor = usuario
      ? `${usuario.nombreCompleto}${rol ? ` (${ROLE_LABELS[rol]})` : ''}`
      : undefined;

    permiso
      .then((stream) =>
        exportarDashboardPdf({
          stream,
          iframe: control.iframe,
          dashboard: control.dashboard,
          datos: {
            titulo,
            descripcion,
            modulo,
            generadoPor,
            fechaHora: fechaHoraPeru(ahora.toISOString()),
          },
          fechaIso: hoyEnPeru(),
          temaOscuro: theme === 'dark',
          senal: cancelacion.signal,
          onProgreso: setProgreso,
        })
      )
      .then(() => {
        setFase('inactivo');
        setDescargado(true);
      })
      .catch((err: unknown) => {
        if (err instanceof ExportacionCancelada) {
          setFase('inactivo');
        } else {
          setError(
            err instanceof ErrorExportacionPdf
              ? err.message
              : 'No se pudo generar el PDF. Recarga el dashboard con "Actualizar" y vuelve a intentarlo.'
          );
          setFase('aviso');
        }
      })
      .finally(() => {
        cancelacionRef.current = null;
        botonRef.current?.focus();
      });
  };

  return (
    <>
      {variante === 'menu' ? (
        <button
          ref={botonRef}
          type="button"
          onClick={abrirAviso}
          disabled={!control || fase !== 'inactivo'}
          className="reporte-menu-item"
          onPointerMove={(e) => e.currentTarget.focus({ preventScroll: true })}
          title={control ? 'Descargar este dashboard en PDF con el formato del portal' : 'Espera a que cargue el dashboard'}
        >
          {descargado ? <CheckCircle2 size={15} color="var(--green-600)" /> : <FileDown size={15} />}
          <span>{descargado ? 'PDF descargado' : 'Exportar PDF'}</span>
        </button>
      ) : (
        <button
          ref={botonRef}
          type="button"
          onClick={abrirAviso}
          disabled={!control || fase !== 'inactivo'}
          className="btn btn-secondary"
          style={{ fontSize: '0.8rem', padding: '0.4rem 0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
          title={control ? 'Descargar este dashboard en PDF con el formato del portal' : 'Espera a que cargue el dashboard'}
        >
          {descargado ? <CheckCircle2 size={14} color="var(--green-600)" /> : <FileDown size={14} />}
          <span>{descargado ? 'PDF descargado' : 'Exportar PDF'}</span>
        </button>
      )}
      <span role="status" aria-live="polite" className="sr-only">
        {descargado ? 'El PDF del dashboard se descargó.' : ''}
      </span>

      {fase === 'aviso' &&
        createPortal(
          <div className="modal-overlay" onClick={cerrarAviso}>
            <div
              className="modal-content"
              role="dialog"
              aria-modal="true"
              aria-labelledby="exportar-pdf-titulo"
              style={{ maxWidth: '500px' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <h3 id="exportar-pdf-titulo" style={{ fontSize: '1.05rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                  <FileDown size={20} color="var(--sky-600)" />
                  Exportar dashboard a PDF
                </h3>
                <button
                  type="button"
                  onClick={cerrarAviso}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                  aria-label="Cerrar"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {error && (
                  <div
                    role="alert"
                    style={{
                      display: 'flex',
                      gap: '0.5rem',
                      alignItems: 'flex-start',
                      padding: '0.65rem 0.75rem',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                      background: 'var(--bg-card-subtle)',
                      color: 'var(--text-main)',
                      fontSize: '0.85rem',
                      lineHeight: 1.45,
                    }}
                  >
                    <AlertTriangle size={16} color="var(--amber-600)" style={{ flexShrink: 0, marginTop: '0.1rem' }} />
                    <span>{error}</span>
                  </div>
                )}
                <p style={{ margin: 0, color: 'var(--text-main)', fontSize: '0.9rem', lineHeight: 1.5 }}>
                  Se descargará <strong>{titulo}</strong> tal como lo ves, con los filtros aplicados, en hojas A4
                  con el logo, la fecha y tu nombre.
                </p>
                <div
                  style={{
                    display: 'flex',
                    gap: '0.6rem',
                    alignItems: 'flex-start',
                    padding: '0.7rem 0.8rem',
                    borderRadius: '8px',
                    background: 'var(--bg-card-subtle)',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  <MonitorUp size={18} color="var(--sky-600)" style={{ flexShrink: 0, marginTop: '0.1rem' }} />
                  <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.83rem', lineHeight: 1.5 }}>
                    El navegador te pedirá permiso para <strong>ver esta pestaña</strong>: elige{' '}
                    <strong>&quot;Permitir&quot;</strong> (o &quot;Esta pestaña&quot;). La imagen se usa solo para armar
                    el PDF y no sale de tu computadora. Durante unos segundos la pantalla mostrará solo el dashboard.
                  </p>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={cerrarAviso} className="btn btn-secondary">
                  Cancelar
                </button>
                <button ref={continuarRef} type="button" onClick={continuar} className="btn btn-primary" disabled={!control}>
                  {error ? 'Volver a intentar' : 'Continuar'}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {fase === 'exportando' &&
        createPortal(
          <>
            {/* Barra en la capa superior (popover): queda encima del dashboard mientras se captura */}
            <div
              ref={abrirBarra}
              popover="manual"
              data-barra-exportacion-pdf=""
              role="status"
              aria-live="polite"
              style={{
                position: 'fixed',
                inset: '0 0 auto 0',
                margin: 0,
                width: '100%',
                height: `${ALTO_BARRA_EXPORTACION}px`,
                boxSizing: 'border-box',
                overflow: 'hidden',
                borderStyle: 'solid',
                borderColor: 'var(--border-color)',
                borderWidth: '0 0 1px 0',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                padding: '0 1.25rem',
                background: 'var(--bg-card)',
                color: 'var(--text-main)',
              }}
            >
              <FileDown size={18} color="var(--sky-600)" style={{ flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  Generando el PDF: {progreso.etapa || 'preparando'}...
                </div>
                <div
                  style={{ marginTop: '0.35rem', height: '6px', borderRadius: '999px', background: 'var(--border-color)', overflow: 'hidden' }}
                  role="progressbar"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={progreso.porcentaje}
                  aria-label="Avance de la exportación"
                >
                  <div
                    style={{
                      width: `${progreso.porcentaje}%`,
                      height: '100%',
                      background: 'var(--sky-600)',
                      transition: 'width 0.3s ease',
                    }}
                  />
                </div>
              </div>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>No cambies de pestaña</span>
              <button
                type="button"
                onClick={() => cancelacionRef.current?.abort()}
                className="btn btn-secondary"
                style={{ fontSize: '0.8rem', padding: '0.35rem 0.7rem' }}
              >
                Cancelar (Esc)
              </button>
            </div>
          </>,
          document.body
        )}
    </>
  );
};
