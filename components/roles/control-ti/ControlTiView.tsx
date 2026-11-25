'use client';

import React, { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { RoleViewProps } from '@/types/ui.types';
import { PERIODOS_USO, useControlTi } from './useControlTi';
import { TelemetriaKpis } from './dashboard/parts/TelemetriaKpis';
import { DispositivosCard } from './dashboard/parts/DispositivosCard';
import { TopPantallasTable } from './dashboard/parts/TopPantallasTable';
import { EventosAnonimosTable } from './eventos/parts/EventosAnonimosTable';
import { UsoFiltros } from './dashboard/parts/UsoFiltros';
import {
  etiquetaCanal,
  etiquetaFuncionalidad,
  etiquetaSistema,
  usoDelResumen,
} from '@/utils/telemetria.utils';
import { UsoSistemaPanel } from './dashboard/parts/UsoSistemaPanel';
import { PrivacidadOnboardingPanel } from './onboarding/PrivacidadOnboardingPanel';
import {
  exportarTelemetriaCsv,
  exportarTelemetriaExcel,
  exportarTelemetriaPdf,
} from './exportarTelemetriaReportes';

export const ControlTiView: React.FC<RoleViewProps> = ({
  initialTab = 'ti-telemetria',
  onNotify,
}) => {
  const t = useControlTi(onNotify);
  const [exportandoPdf, setExportandoPdf] = useState(false);

  const esOnboarding = initialTab === 'ti-onboarding';
  // Uso del sistema (Req 4) con los filtros elegidos; undefined si el servidor no lo envía.
  const uso = t.resumen ? usoDelResumen(t.resumen) : undefined;

  const etiquetaPeriodoActual =
    PERIODOS_USO.find((p) => p.valor === t.seleccion.periodo)?.etiqueta ?? t.seleccion.periodo;

  const construirDescripcionFiltros = () => {
    const partes = [
      `Período: ${etiquetaPeriodoActual}`,
      t.seleccion.canal ? `Canal: ${etiquetaCanal(t.seleccion.canal)}` : null,
      t.seleccion.funcionalidad ? `Funcionalidad: ${etiquetaFuncionalidad(t.seleccion.funcionalidad)}` : null,
      t.seleccion.sistemaOperativo ? `SO: ${etiquetaSistema(t.seleccion.sistemaOperativo)}` : null,
      t.seleccion.appVersion ? `Versión: ${t.seleccion.appVersion}` : null,
    ].filter(Boolean);
    return partes.join(' | ');
  };

  const handleExportarCsv = () => {
    if (!t.resumen) return;
    exportarTelemetriaCsv({
      resumen: t.resumen,
      uso,
      eventos: t.eventos,
      descripcionFiltros: construirDescripcionFiltros(),
      periodoCodigo: t.seleccion.periodo,
    });
    onNotify('success', 'Reporte completo de telemetría exportado en CSV.');
  };

  const handleExportarExcel = () => {
    if (!t.resumen) return;
    exportarTelemetriaExcel({
      resumen: t.resumen,
      uso,
      eventos: t.eventos,
      descripcionFiltros: construirDescripcionFiltros(),
      periodoCodigo: t.seleccion.periodo,
    });
    onNotify('success', 'Reporte completo de telemetría exportado en Excel.');
  };

  const handleExportarPdf = async () => {
    if (!t.resumen) return;
    setExportandoPdf(true);
    try {
      await exportarTelemetriaPdf({
        resumen: t.resumen,
        uso,
        eventos: t.eventos,
        descripcionFiltros: construirDescripcionFiltros(),
        periodoCodigo: t.seleccion.periodo,
      });
      onNotify('success', 'Reporte completo de telemetría exportado en PDF.');
    } finally {
      setExportandoPdf(false);
    }
  };

  return (
    <div>
      {/* Filtros del dashboard de uso: una fila sobre todo lo que filtran, con el botón de actualizar y descarga a la derecha */}
      {!esOnboarding && (
        <UsoFiltros
          seleccion={t.seleccion}
          disponibles={uso?.filtrosDisponibles}
          actualizadoEn={uso?.actualizadoEn}
          actualizando={t.isLoading}
          exportandoPdf={exportandoPdf}
          descargaDeshabilitada={!t.resumen}
          onCambiar={t.cambiarFiltro}
          onLimpiar={t.limpiarFiltros}
          onActualizar={t.cargarTelemetria}
          onExportarCsv={handleExportarCsv}
          onExportarExcel={handleExportarExcel}
          onExportarPdf={handleExportarPdf}
        />
      )}

      {/* Sin datos: se explica por qué en lugar de dejar la pantalla en blanco */}
      {!t.resumen && !t.isLoading && t.errorCarga && (
        <div className="card" style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
          <AlertCircle size={22} color="var(--amber-600)" style={{ flexShrink: 0 }} />
          <div>
            <div style={{ fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.25rem' }}>
              No hay métricas para mostrar
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{t.errorCarga}</div>
          </div>
        </div>
      )}

      {/* Vista 1: Dashboard de Telemetría (si se seleccionó ti-telemetria en Sidebar) */}
      {!esOnboarding && t.resumen && (
        // Mientras se vuelve a pedir, se mantiene lo anterior atenuado (sin saltos de diseño).
        <div style={{ opacity: t.isLoading ? 0.55 : 1, transition: 'opacity 150ms' }} aria-busy={t.isLoading}>
          {uso ? (
            <UsoSistemaPanel uso={uso} />
          ) : (
            <div className="card" style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
              <AlertCircle size={20} color="var(--amber-600)" style={{ flexShrink: 0 }} />
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                <strong style={{ color: 'var(--text-main)' }}>El servidor todavía no envía los datos de uso</strong> (usuarios
                únicos, sesiones, actividad por día y hora y consultas completadas). Se mostrarán aquí cuando estén
                disponibles.
              </div>
            </div>
          )}

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '1.25rem',
              marginTop: '1.25rem',
            }}
          >
            <DispositivosCard stats={t.resumen.dispositivos} />
            <TopPantallasTable pantallas={t.resumen.topPantallas} />
          </div>

          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)', margin: '1.75rem 0 0.25rem' }}>
            Estado general de la app
          </h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0 0 1rem' }}>
            El onboarding, la analítica y los eventos de 24 horas no dependen de los filtros; la tasa de errores sí.
          </p>
          <TelemetriaKpis resumen={t.resumen} />

          <EventosAnonimosTable eventos={t.eventos} />
        </div>
      )}

      {/* Vista 2: Privacidad y Onboarding (si se seleccionó ti-onboarding en Sidebar) */}
      {esOnboarding && t.resumen && (
        <PrivacidadOnboardingPanel
          stats={t.resumen.onboarding}
          actualizando={t.isLoading}
          onActualizar={t.cargarTelemetria}
          onNotify={onNotify}
        />
      )}
    </div>
  );
};
