import React from 'react';
import { Inbox } from 'lucide-react';
import { Ticket, TicketEstado, TicketPrioridad } from '@/types/ticket.types';
import { FiltroConstancia } from '../useFuncionarioTickets';
import { CardHeader, CardAside } from '@/components/shared/ui/CardHeader';
import { FuncionarioKpis } from './parts/FuncionarioKpis';
import { ReclamosFiltros } from './parts/ReclamosFiltros';
import { ReclamosTable } from './parts/ReclamosTable';

interface BandejaPanelProps {
  tickets: Ticket[];
  ticketsFiltrados: Ticket[];
  area?: string;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  filtroEstado: TicketEstado | 'todos';
  onEstadoChange: (estado: TicketEstado | 'todos') => void;
  filtroPrioridad: TicketPrioridad | 'todos';
  onPrioridadChange: (prioridad: TicketPrioridad | 'todos') => void;
  filtroConstancia: FiltroConstancia;
  onConstanciaChange: (constancia: FiltroConstancia) => void;
  soloAsignadosAMi: boolean;
  onSoloAsignadosChange: (val: boolean) => void;
  onSelectTicket: (ticket: Ticket, action?: 'atender' | 'derivar' | 'constancia') => void;
  onDescargarCSV: () => void;
}

export const BandejaPanel: React.FC<BandejaPanelProps> = ({
  tickets,
  ticketsFiltrados,
  area,
  searchQuery,
  onSearchChange,
  filtroEstado,
  onEstadoChange,
  filtroPrioridad,
  onPrioridadChange,
  filtroConstancia,
  onConstanciaChange,
  soloAsignadosAMi,
  onSoloAsignadosChange,
  onSelectTicket,
  onDescargarCSV,
}) => (
  <div>
    <FuncionarioKpis tickets={tickets} area={area} />

    <div className="card">
      <CardHeader
        icon={<Inbox size={20} />}
        title={`Bandeja Operativa de Reclamos (${area || 'Sector Asignado'})`}
        aside={
          <CardAside>
            Directiva: Derivaciones y hallazgos registrados en campo <code>comentario</code>
          </CardAside>
        }
      />

      <ReclamosFiltros
        searchQuery={searchQuery}
        onSearchChange={onSearchChange}
        filtroEstado={filtroEstado}
        onEstadoChange={onEstadoChange}
        filtroPrioridad={filtroPrioridad}
        onPrioridadChange={onPrioridadChange}
        filtroConstancia={filtroConstancia}
        onConstanciaChange={onConstanciaChange}
        soloAsignadosAMi={soloAsignadosAMi}
        onSoloAsignadosChange={onSoloAsignadosChange}
        onDescargarCSV={onDescargarCSV}
      />

      <ReclamosTable
        tickets={ticketsFiltrados}
        onSelectTicket={(t) => onSelectTicket(t, 'atender')}
      />
    </div>
  </div>
);

