import { useEffect, useState, useMemo } from 'react';
import { auditoriaController } from '@/controllers/auditoria.controller';
import { AuditoriaLog } from '@/types/auditoria.types';
import { NotifyFn } from '@/types/ui.types';
import { exportarCSV, exportarExcel } from '@/utils/csv.utils';
import { exportarReporteTributarioPdf } from '@/components/roles/control-municipal/tributarios/exportarReportePdf';
import { mensajeErrorApi } from '@/services/api-client.service';

export function useAuditoria(onNotify: NotifyFn) {
  const [logs, setLogs] = useState<AuditoriaLog[]>([]);
  const [query, setQuery] = useState('');
  const [filtroFecha, setFiltroFecha] = useState('');
  const [filtroResponsable, setFiltroResponsable] = useState('todos');
  const [filtroAccion, setFiltroAccion] = useState('todas');

  useEffect(() => {
    auditoriaController
      .getLogs()
      .then(setLogs)
      .catch((err) => onNotify('error', mensajeErrorApi(err, 'No se pudieron cargar los registros de auditoría. Recarga la página.')));
  }, [onNotify]);

  const responsablesDisponibles = useMemo(() => {
    const set = new Set(logs.map((l) => l.adminNombre));
    return Array.from(set).sort();
  }, [logs]);

  const accionesDisponibles = useMemo(() => {
    const set = new Set(logs.map((l) => l.accion));
    return Array.from(set).sort();
  }, [logs]);

  const filtrados = useMemo(() => {
    return logs.filter((l) => {
      if (filtroFecha && !l.fecha.startsWith(filtroFecha)) return false;
      if (filtroResponsable !== 'todos' && l.adminNombre !== filtroResponsable) return false;
      if (filtroAccion !== 'todas' && l.accion !== filtroAccion) return false;
      if (query.trim()) {
        const q = query.toLowerCase();
        return (
          l.adminNombre.toLowerCase().includes(q) ||
          l.accion.toLowerCase().includes(q) ||
          l.detalles.toLowerCase().includes(q) ||
          l.entidadAfectada.toLowerCase().includes(q) ||
          l.ipOrigen.includes(q)
        );
      }
      return true;
    });
  }, [logs, filtroFecha, filtroResponsable, filtroAccion, query]);

  const resetFiltros = () => {
    setQuery('');
    setFiltroFecha('');
    setFiltroResponsable('todos');
    setFiltroAccion('todas');
  };

  const construirTablaExportacion = () => {
    const cabeceras = [
      'ID',
      'Fecha y Hora',
      'Responsable',
      'Correo',
      'Acción',
      'Entidad Afectada',
      'IP Origen',
      'Detalles',
    ];
    const filas = filtrados.map((l) => [
      l.id,
      l.fecha,
      l.adminNombre,
      l.adminEmail,
      l.accion,
      l.entidadAfectada,
      l.ipOrigen,
      l.detalles,
    ]);
    return { cabeceras, filas };
  };

  const descargarCSV = () => {
    const { cabeceras, filas } = construirTablaExportacion();
    exportarCSV('auditoria', cabeceras, filas);
    onNotify('success', `Se exportaron ${filas.length} registros de auditoría a CSV`);
  };

  const descargarExcel = () => {
    const { cabeceras, filas } = construirTablaExportacion();
    exportarExcel('auditoria', cabeceras, filas);
    onNotify('success', `Se exportaron ${filas.length} registros de auditoría a Excel`);
  };

  const descargarPDF = async () => {
    if (filtrados.length === 0) return;
    const { cabeceras, filas } = construirTablaExportacion();
    const resumenFiltros = [
      filtroFecha ? `Fecha: ${filtroFecha}` : '',
      filtroResponsable !== 'todos' ? `Responsable: ${filtroResponsable}` : '',
      filtroAccion !== 'todas' ? `Acción: ${filtroAccion.replace(/_/g, ' ')}` : '',
      query.trim(),
    ]
      .filter(Boolean)
      .join(' | ');

    await exportarReporteTributarioPdf({
      tabla: {
        id: 0,
        nombre: 'Registros de Auditoría y Trazabilidad Administrativa',
        descripcion: 'Bitácora de eventos de seguridad, sesiones, cambios de configuración y acciones administrativas',
        certificadoPor: 'Administración del Sistema y Seguridad TI',
      },
      cabeceras,
      filas,
      busquedaTexto: resumenFiltros,
      subtituloDocumento: 'Reporte Oficial de Auditoría',
    });
    onNotify('success', `Se exportaron ${filas.length} registros de auditoría a PDF`);
  };

  return {
    filtrados,
    query,
    setQuery,
    filtroFecha,
    setFiltroFecha,
    filtroResponsable,
    setFiltroResponsable,
    filtroAccion,
    setFiltroAccion,
    responsablesDisponibles,
    accionesDisponibles,
    resetFiltros,
    descargarCSV,
    descargarExcel,
    descargarPDF,
  };
}
