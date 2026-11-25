'use client';

import React, { useState } from 'react';
import { FileDown, RefreshCw } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { ROLE_LABELS } from '@/types/auth.types';
import { NotifyFn, NotifyType } from '@/types/ui.types';
import { formatearErrorIaBackend, iaDashboardsController } from '@/controllers/ia-dashboards.controller';

interface ExportarPdfServidorProps {
  /** Id numérico del dashboard en Superset; sin él no se muestra el botón */
  supersetId: number | null | undefined;
  titulo: string;
  descripcion?: string;
  /** Ej. "Control Municipal" */
  modulo?: string;
  /** "icono": botón chico para la lista de dashboards; "boton": con texto, para la barra del visor */
  variante?: 'icono' | 'boton';
  onNotify?: NotifyFn;
}

/**
 * Descarga el PDF generado en el servidor (servicio superset-pdf, vía el backend). No pide permisos al navegador
 * y no necesita el dashboard abierto; exporta su estado guardado, sin los filtros que se movieron en pantalla.
 */
export const ExportarPdfServidor: React.FC<ExportarPdfServidorProps> = ({
  supersetId,
  titulo,
  descripcion,
  modulo,
  variante = 'icono',
  onNotify,
}) => {
  const { usuario, rol } = useAuth();
  const [generando, setGenerando] = useState(false);

  if (supersetId === null || supersetId === undefined) return null;

  const avisar = (tipo: NotifyType, mensaje: string) => {
    if (onNotify) onNotify(tipo, mensaje);
    else if (tipo !== 'success') alert(mensaje);
  };

  const exportar = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (generando) return;
    setGenerando(true);
    try {
      const res = await iaDashboardsController.exportarPdfDashboard(supersetId, {
        descripcion,
        modulo,
        generadoPor: usuario ? `${usuario.nombreCompleto}${rol ? ` (${ROLE_LABELS[rol]})` : ''}` : undefined,
      });
      if (res.graficosFallidos > 0) {
        avisar(
          'info',
          `El PDF se generó, pero ${res.graficosFallidos === 1 ? '1 gráfico no se pudo dibujar' : `${res.graficosFallidos} gráficos no se pudieron dibujar`} (aparece un aviso en su lugar).`
        );
      } else {
        avisar('success', `PDF de "${titulo}" descargado.`);
      }
    } catch (err) {
      avisar('error', formatearErrorIaBackend(err, 'No se pudo exportar el dashboard a PDF.'));
    } finally {
      setGenerando(false);
    }
  };

  const ayuda = generando
    ? 'Generando el PDF...'
    : `Descargar "${titulo}" en PDF (estado guardado del dashboard, sin los filtros de pantalla)`;

  if (variante === 'boton') {
    return (
      <button
        type="button"
        onClick={exportar}
        disabled={generando}
        className="btn btn-secondary"
        style={{ fontSize: '0.8rem', padding: '0.4rem 0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
        title={ayuda}
      >
        <FileDown size={14} />
        <span>{generando ? 'Generando PDF...' : 'PDF'}</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={exportar}
      disabled={generando}
      className={`dashboard-action-btn ${generando ? 'is-loading' : ''}`}
      style={{
        border: 'none',
        background: 'transparent',
        color: 'var(--text-muted)',
        cursor: generando ? 'progress' : 'pointer',
        padding: '0.15rem',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
      title={ayuda}
      aria-label={`Exportar ${titulo} a PDF`}
      aria-busy={generando}
    >
      {generando ? <RefreshCw size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <FileDown size={13} />}
    </button>
  );
};
