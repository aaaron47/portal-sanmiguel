'use client';

import React from 'react';
import { RoleViewProps } from '@/types/ui.types';
import { TicketDetailModal } from '@/components/modals/TicketDetailModal';
import { useFuncionarioTickets } from './useFuncionarioTickets';
import { BandejaPanel } from './bandeja/BandejaPanel';
import { ConstanciasPanel } from './constancias/ConstanciasPanel';

export const FuncionarioView: React.FC<RoleViewProps> = ({ initialTab = 'funcionario-bandeja', onNotify }) => {
  const f = useFuncionarioTickets(onNotify);

  const esModoConstancias = initialTab === 'funcionario-constancias';

  return (
    <div>
      {esModoConstancias ? (
        <ConstanciasPanel
          tickets={f.tickets}
          onSelectTicket={f.abrirTicket}
          onNotify={onNotify}
        />
      ) : (
        <BandejaPanel
          tickets={f.tickets}
          ticketsFiltrados={f.ticketsFiltrados}
          area={f.usuario?.area}
          searchQuery={f.searchQuery}
          onSearchChange={f.setSearchQuery}
          filtroEstado={f.filtroEstado}
          onEstadoChange={f.setFiltroEstado}
          filtroPrioridad={f.filtroPrioridad}
          onPrioridadChange={f.setFiltroPrioridad}
          filtroConstancia={f.filtroConstancia}
          onConstanciaChange={f.setFiltroConstancia}
          soloAsignadosAMi={f.soloAsignadosAMi}
          onSoloAsignadosChange={f.setSoloAsignadosAMi}
          onSelectTicket={f.abrirTicket}
          onDescargarCSV={f.descargarCSV}
        />
      )}

      {f.selectedTicket && (
        <TicketDetailModal
          ticket={f.selectedTicket}
          rolUsuario="FUNCIONARIO"
          initialAction={f.modalAction}
          onClose={f.cerrarModal}
          onAtender={f.handleAtender}
          onDerivar={f.handleDerivar}
          onAprobar={async () => {}}
          onReasignar={async () => {}}
          onEvaluarConstancia={f.handleEvaluarConstancia}
        />
      )}
    </div>
  );
};

