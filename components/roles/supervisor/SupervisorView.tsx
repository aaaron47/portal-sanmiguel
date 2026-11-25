'use client';

import React from 'react';
import { Building2 } from 'lucide-react';
import { RoleViewProps } from '@/types/ui.types';
import { CardHeader, CardAside } from '@/components/shared/ui/CardHeader';
import { TicketDetailModal } from '@/components/modals/TicketDetailModal';
import { useSupervisorTickets } from './useSupervisorTickets';
import { SupervisorKpis } from './supervision/parts/SupervisorKpis';
import { SupervisorFiltros } from './supervision/parts/SupervisorFiltros';
import { SupervisorTable } from './supervision/parts/SupervisorTable';
import { ReasignacionPanel } from './reasignacion/ReasignacionPanel';
import { ConstanciasPanel } from '@/components/constancias/ConstanciasPanel';
import { cumpleFiltroEstado, puedeAprobar, textoEstado } from '@/utils/ticket.utils';
import { exportarCSV, exportarExcel } from '@/utils/csv.utils';
import { exportarReporteTributarioPdf } from '@/components/roles/control-municipal/tributarios/exportarReportePdf';

type SupervisorTab = 'panorama' | 'aprobaciones' | 'reasignaciones' | 'constancias';

const tabDesdeMenu = (initialTab: string): SupervisorTab =>
  initialTab === 'supervisor-aprobaciones'
    ? 'aprobaciones'
    : initialTab === 'supervisor-reasignaciones'
      ? 'reasignaciones'
      : initialTab === 'supervisor-constancias'
        ? 'constancias'
        : 'panorama';

export const SupervisorView: React.FC<RoleViewProps> = ({
  initialTab = 'supervisor-panorama',
  onNotify,
}) => {
  // La pestaña activa proviene exclusivamente del menú lateral (Sidebar)
  const subTab = tabDesdeMenu(initialTab);

  const s = useSupervisorTickets(onNotify);

  const ticketsFiltrados = s.tickets.filter((t) => {
    if (subTab === 'aprobaciones' && !puedeAprobar(t)) return false;
    if (subTab === 'panorama' && !cumpleFiltroEstado(t, s.filtroEstado)) return false;
    if (s.filtroPrioridad !== 'todos' && t.prioridad !== s.filtroPrioridad) return false;
    if (s.filtroArea !== 'todas' && t.areaAsignada !== s.filtroArea) return false;
    if (s.filtroFuncionario !== 'todos') {
      if (s.filtroFuncionario === 'sin_asignar') {
        if (t.funcionarioAsignadoId) return false;
      } else if (t.funcionarioAsignadoId !== s.filtroFuncionario) {
        return false;
      }
    }
    if (s.searchQuery) {
      const q = s.searchQuery.toLowerCase();
      return (
        t.folio.toLowerCase().includes(q) ||
        t.asunto.toLowerCase().includes(q) ||
        t.ciudadanoNombre.toLowerCase().includes(q) ||
        t.areaAsignada.toLowerCase().includes(q) ||
        (t.funcionarioAsignadoNombre || '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  const esAprobaciones = subTab === 'aprobaciones';
  const nombreBaseArchivo = esAprobaciones
    ? 'revision_aprobacion_reclamos'
    : 'panorama_integral_reclamos';

  const construirTablaSupervision = () => {
    const cabeceras = [
      'Folio',
      'Ciudadano',
      'DNI',
      'Área Municipal',
      'Funcionario Asignado',
      'Asunto',
      'Estado',
      'Prioridad',
      'Fecha Ingreso',
    ];
    const filas = ticketsFiltrados.map((t) => [
      t.folio,
      t.ciudadanoNombre,
      t.ciudadanoDni,
      t.areaAsignada || 'Sin área',
      t.funcionarioAsignadoNombre || 'Sin asignar',
      t.asunto,
      textoEstado(t),
      t.prioridad,
      t.fechaCreacion,
    ]);
    return { cabeceras, filas };
  };

  const handleExportCsv = () => {
    const { cabeceras, filas } = construirTablaSupervision();
    exportarCSV(nombreBaseArchivo, cabeceras, filas);
    onNotify('success', 'Reporte CSV descargado con éxito');
  };

  const handleExportExcel = () => {
    const { cabeceras, filas } = construirTablaSupervision();
    exportarExcel(nombreBaseArchivo, cabeceras, filas);
    onNotify('success', 'Reporte Excel descargado con éxito');
  };

  const handleExportPdf = async () => {
    if (ticketsFiltrados.length === 0) return;
    const { cabeceras, filas } = construirTablaSupervision();
    const nombreFuncionario =
      s.filtroFuncionario === 'todos'
        ? ''
        : s.filtroFuncionario === 'sin_asignar'
          ? 'Sin asignar'
          : s.funcionarios.find((f) => f.id === s.filtroFuncionario)?.nombre || s.filtroFuncionario;

    const resumenFiltros = [
      s.filtroArea !== 'todas' ? `Área: ${s.filtroArea}` : '',
      nombreFuncionario ? `Asignado: ${nombreFuncionario}` : '',
      !esAprobaciones && s.filtroEstado !== 'todos' ? `Estado: ${s.filtroEstado}` : '',
      s.filtroPrioridad !== 'todos' ? `Prioridad: ${s.filtroPrioridad}` : '',
      s.searchQuery.trim(),
    ]
      .filter(Boolean)
      .join(' | ');

    await exportarReporteTributarioPdf({
      tabla: {
        id: 0,
        nombre: esAprobaciones
          ? 'Revisión y Aprobación de Respuestas'
          : 'Panorama Integral de Reclamos Vecinales',
        descripcion: esAprobaciones
          ? 'Reclamos vecinales en evaluación con proyecto de respuesta pendiente de aprobación'
          : 'Control transversal y estado de atención de reclamos en toda la municipalidad',
        certificadoPor: 'Supervisión General Municipal',
      },
      cabeceras,
      filas,
      busquedaTexto: resumenFiltros,
      subtituloDocumento: 'Reporte Oficial de Supervisión',
    });
    onNotify('success', 'Reporte PDF descargado con éxito');
  };

  return (
    <div>
      {subTab !== 'reasignaciones' && subTab !== 'constancias' && <SupervisorKpis tickets={s.tickets} />}

      {subTab === 'constancias' ? (
        <ConstanciasPanel onNotify={onNotify} />
      ) : subTab === 'reasignaciones' ? (
        <ReasignacionPanel
          tickets={s.tickets}
          carga={s.carga}
          areas={s.areas}
          onSelectTicket={s.abrirTicket}
          onNotify={onNotify}
        />
      ) : (
        <div className="card">
          <CardHeader
            icon={<Building2 size={20} />}
            title={
              subTab === 'aprobaciones'
                ? 'Respuestas por aprobar'
                : 'Supervisión de Reclamos Vecinales'
            }
            aside={
              <CardAside>Vista de control transversal para toda la municipalidad</CardAside>
            }
          />

          <SupervisorFiltros
            searchQuery={s.searchQuery}
            onSearchChange={s.setSearchQuery}
            areas={s.areas}
            filtroArea={s.filtroArea}
            onAreaChange={s.setFiltroArea}
            funcionarios={s.funcionarios}
            filtroFuncionario={s.filtroFuncionario}
            onFuncionarioChange={s.setFiltroFuncionario}
            mostrarEstado={subTab === 'panorama'}
            filtroEstado={s.filtroEstado}
            onEstadoChange={s.setFiltroEstado}
            filtroPrioridad={s.filtroPrioridad}
            onPrioridadChange={s.setFiltroPrioridad}
            onLimpiarFiltros={s.limpiarFiltros}
            onExportCsv={handleExportCsv}
            onExportExcel={handleExportExcel}
            onExportPdf={handleExportPdf}
            sinRegistros={ticketsFiltrados.length === 0}
          />

          <SupervisorTable
            tickets={ticketsFiltrados}
            onSelectTicket={s.abrirTicket}
            mensajeVacio={
              subTab === 'aprobaciones'
                ? 'No hay respuestas esperando tu aprobación.'
                : undefined
            }
          />
        </div>
      )}

      {s.selectedTicket && (
        <TicketDetailModal
          ticket={s.selectedTicket}
          rolUsuario="SUPERVISOR"
          initialAction={s.modalAction}
          funcionarios={s.funcionarios}
          onClose={s.cerrarModal}
          onAccion={s.handleAccion}
        />
      )}
    </div>
  );
};
