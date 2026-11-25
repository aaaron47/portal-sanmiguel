'use client';

import React, { useSyncExternalStore } from 'react';
import { capturaDePestanaDisponible } from '@/utils/superset-pdf/captura-pestana';
import { ExportarPdfDashboard } from './ExportarPdfDashboard';
import { ExportarPdfServidor } from './ExportarPdfServidor';
import type { ControlDashboardSuperset } from './SupersetSdkDashboard';

const sinSuscripcion = () => () => {};

interface BotonExportarPdfProps {
  /** true si el dashboard se muestra embebido con el SDK (la captura necesita el iframe) */
  embebido: boolean;
  control: ControlDashboardSuperset | null;
  supersetId: number | null | undefined;
  titulo: string;
  descripcion?: string;
  modulo?: string;
}

/**
 * Elige cómo exportar a PDF:
 * - Chrome o Edge de escritorio con el dashboard embebido: captura de la pestaña (sale con los filtros de pantalla;
 *   pide permiso).
 * - Cualquier otro caso (Firefox, Safari, sin embebido): PDF generado en el servidor (sin permiso; estado guardado).
 */
export const BotonExportarPdf: React.FC<BotonExportarPdfProps> = ({
  embebido,
  control,
  supersetId,
  titulo,
  descripcion,
  modulo,
}) => {
  // En el servidor (y en el primer render) no hay navegador: se asume que no hay captura.
  const captura = useSyncExternalStore(sinSuscripcion, capturaDePestanaDisponible, () => false);
  if (embebido && captura) {
    return <ExportarPdfDashboard control={control} titulo={titulo} descripcion={descripcion} modulo={modulo} />;
  }
  return (
    <ExportarPdfServidor
      variante="boton"
      supersetId={supersetId}
      titulo={titulo}
      descripcion={descripcion}
      modulo={modulo}
    />
  );
};
