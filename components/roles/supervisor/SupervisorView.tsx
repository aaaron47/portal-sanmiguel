'use client';

import React, { useState } from 'react';
import { Layers, CheckCircle2, RotateCcw, Building2 } from 'lucide-react';
import { RoleViewProps } from '@/types/ui.types';
import { TabsBar, TabItem } from '@/components/shared/ui/TabsBar';
import { CardHeader, CardAside } from '@/components/shared/ui/CardHeader';
import { TicketDetailModal } from '@/components/modals/TicketDetailModal';
import { useSupervisorTickets } from './useSupervisorTickets';
import { SupervisorKpis } from './supervision/parts/SupervisorKpis';
import { SupervisorFiltros } from './supervision/parts/SupervisorFiltros';
import { SupervisorTable } from './supervision/parts/SupervisorTable';

type SupervisorTab = 'panorama' | 'aprobaciones' | 'reasignaciones';

export const SupervisorView: React.FC<RoleViewProps> = ({ 
  initialTab = 'supervisor-panorama', 
  onNotify 
}) => {
  const [subTab, setSubTab] = useState<SupervisorTab>(
    initialTab === 'supervisor-aprobaciones' 
      ? 'aprobaciones' 
      : initialTab === 'supervisor-reasignaciones' 
      ? 'reasignaciones' 
      : 'panorama'
  );

  const s = useSupervisorTickets(onNotify);

  const tabs: TabItem<SupervisorTab>[] = [
    { id: 'panorama', label: `Panorama Integral (${s.tickets.length})`, icon: Layers },
    {
      id: 'aprobaciones',
      label: `Por Aprobar (${s.tickets.filter((t) => t.estado === 'por aprobar').length})`,
      icon: CheckCircle2,
    },
    { id: 'reasignaciones', label: 'Reasignación de Carga', icon: RotateCcw },
  ];

  const ticketsFiltrados = s.tickets.filter((t) => {
    if (subTab === 'aprobaciones' && t.estado !== 'por aprobar') return false;
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
      <SupervisorKpis tickets={s.tickets} />

      <TabsBar tabs={tabs} active={subTab} onChange={setSubTab} marginBottom="1.25rem" />

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
          filtroArea={s.filtroArea}
          onAreaChange={s.setFiltroArea}
        />

        <SupervisorTable
          tickets={ticketsFiltrados}
          onSelectTicket={s.setSelectedTicket}
        />
      </div>

      {s.selectedTicket && (
        <TicketDetailModal
          ticket={s.selectedTicket}
          rolUsuario="SUPERVISOR"
          onClose={() => s.setSelectedTicket(null)}
          onAtender={async () => {}}
          onDerivar={async () => {}}
          onAprobar={s.handleAprobar}
          onReasignar={s.handleReasignar}
          onEvaluarConstancia={async () => {}}
        />
      )}
    </div>
  );
};
