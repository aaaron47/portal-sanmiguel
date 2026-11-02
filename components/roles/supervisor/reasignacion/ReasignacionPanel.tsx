import React, { useState } from 'react';
import { Users, ListChecks } from 'lucide-react';
import { AccionTicket, Ticket } from '@/types/ticket.types';
import { CardHeader, CardAside } from '@/components/shared/ui/CardHeader';
import { CargaFuncionario, SIN_ASIGNAR_ID, esActivo } from '@/utils/ticket.utils';
import { CargaFuncionariosTable } from './parts/CargaFuncionariosTable';
import { SupervisorTable } from '../supervision/parts/SupervisorTable';

interface ReasignacionPanelProps {
  tickets: Ticket[];
  carga: CargaFuncionario[];
  onSelectTicket: (t: Ticket, accion?: AccionTicket) => void;
}

export const ReasignacionPanel: React.FC<ReasignacionPanelProps> = ({ tickets, carga, onSelectTicket }) => {
  const [seleccionadoId, setSeleccionadoId] = useState<string | null>(null);

  // Si el supervisor aún no eligió, se muestra al funcionario con más carga.
  const idEfectivo = seleccionadoId ?? carga.find((c) => c.activos > 0)?.id ?? null;
  const seleccionado = carga.find((c) => c.id === idEfectivo);

  const ticketsDelFuncionario = tickets.filter(
    (t) =>
      esActivo(t) &&
      (idEfectivo === SIN_ASIGNAR_ID ? !t.funcionarioAsignadoId : t.funcionarioAsignadoId === idEfectivo)
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div className="card">
        <CardHeader
          icon={<Users size={20} />}
          title="Carga de trabajo por funcionario"
          aside={<CardAside>Solo cuenta reclamos abiertos (no resueltos ni archivados)</CardAside>}
        />
        <CargaFuncionariosTable carga={carga} seleccionadoId={idEfectivo} onSeleccionar={setSeleccionadoId} />
      </div>

      {seleccionado && (
        <div className="card">
          <CardHeader
            icon={<ListChecks size={20} />}
            title={
              seleccionado.id === SIN_ASIGNAR_ID
                ? 'Reclamos abiertos sin funcionario'
                : `Reclamos abiertos de ${seleccionado.nombre}`
            }
            aside={<CardAside>Usa “Reasignar” para pasar un reclamo a otro funcionario</CardAside>}
          />
          <SupervisorTable
            tickets={ticketsDelFuncionario}
            onSelectTicket={onSelectTicket}
            modoReasignacion
            mensajeVacio="Este funcionario ya no tiene reclamos abiertos."
          />
        </div>
      )}
    </div>
  );
};
