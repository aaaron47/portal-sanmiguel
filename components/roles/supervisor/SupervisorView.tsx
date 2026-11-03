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
import { puedeAprobar } from '@/utils/ticket.utils';

type SupervisorTab = 'panorama' | 'aprobaciones' | 'reasignaciones';

const tabDesdeMenu = (initialTab: string): SupervisorTab =>
  initialTab === 'supervisor-aprobaciones'
    ? 'aprobaciones'
    : initialTab === 'supervisor-reasignaciones'
      ? 'reasignaciones'
      : 'panorama';

const sinAccion = async () => { };

export const SupervisorView: React.FC<RoleViewProps> = ({
  initialTab = 'supervisor-panorama',
  onNotify,
}) => {
  // La pestaña activa proviene exclusivamente del menú lateral (Sidebar)
  const subTab = tabDesdeMenu(initialTab);

  const s = useSupervisorTickets(onNotify);

  const ticketsFiltrados = s.tickets.filter((t) => {
    if (subTab === 'aprobaciones' && !puedeAprobar(t)) return false;
    if (subTab === 'panorama' && s.filtroEstado !== 'todos' && t.estado !== s.filtroEstado) return false;
    if (s.filtroPrioridad !== 'todos' && t.prioridad !== s.filtroPrioridad) return false;
    if (s.filtroArea !== 'todas' && t.areaAsignada !== s.filtroArea) return false;
    if (s.searchQuery) {
      const q = s.searchQuery.toLowerCase();
      return (
        t.folio.toLowerCase().includes(q) ||
        t.asunto.toLowerCase().includes(q) ||
        t.ciudadanoNombre.toLowerCase().includes(q) ||
        t.areaAsignada.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div>
      {subTab !== 'reasignaciones' && <SupervisorKpis tickets={s.tickets} />}

      {subTab === 'reasignaciones' ? (
        <ReasignacionPanel tickets={s.tickets} carga={s.carga} onSelectTicket={s.abrirTicket} />
      ) : (
        <div className="card">
          <CardHeader
            icon={<Building2 size={20} />}
            title={
              subTab === 'aprobaciones'
                ? 'Revisión y Aprobación de Resoluciones'
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
            mostrarEstado={subTab === 'panorama'}
            filtroEstado={s.filtroEstado}
            onEstadoChange={s.setFiltroEstado}
            filtroPrioridad={s.filtroPrioridad}
            onPrioridadChange={s.setFiltroPrioridad}
          />

          <SupervisorTable
            tickets={ticketsFiltrados}
            onSelectTicket={s.abrirTicket}
            mensajeVacio={
              subTab === 'aprobaciones'
                ? 'No hay resoluciones esperando tu aprobación.'
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
          onAtender={sinAccion}
          onDerivar={sinAccion}
          onAprobar={s.handleAprobar}
          onDevolver={s.handleDevolver}
          onReasignar={s.handleReasignar}
          onEvaluarConstancia={sinAccion}
        />
      )}
    </div>
  );
};
