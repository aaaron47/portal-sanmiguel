import { useEffect, useState } from 'react';
import { ticketsController } from '@/controllers/tickets.controller';
import { Ticket } from '@/types/ticket.types';
import { useAuth } from '@/context/AuthContext';
import { NotifyFn } from '@/types/ui.types';

export function useSupervisorTickets(onNotify: NotifyFn) {
  const { usuario } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filtroArea, setFiltroArea] = useState<string>('todas');

  useEffect(() => {
    cargarTodosLosTickets();
  }, []);

  const cargarTodosLosTickets = async () => {
    try {
      const data = await ticketsController.getTickets();
      setTickets(data);
    } catch {
      onNotify('error', 'Error al cargar los tickets para supervisión');
    }
  };

  const handleAprobar = async (id: string, comentario: string) => {
    try {
      const actualizado = await ticketsController.aprobarTicket(
        id, 
        comentario, 
        usuario?.nombreCompleto || 'Supervisor General'
      );
      setTickets(prev => prev.map(t => t.id === id ? actualizado : t));
      setSelectedTicket(actualizado);
      onNotify('success', `Resolución del expediente ${actualizado.folio} aprobada con éxito`);
    } catch {
      onNotify('error', 'Error al aprobar resolución');
    }
  };

  const handleReasignar = async (id: string, nuevoFuncionarioId: string, nuevoNombre: string, motivo: string) => {
    try {
      const actualizado = await ticketsController.reasignarTicket(
        id, 
        { nuevoFuncionarioId, nuevoFuncionarioNombre: nuevoNombre, motivoReasignacion: motivo }, 
        usuario?.nombreCompleto || 'Supervisor General'
      );
      setTickets(prev => prev.map(t => t.id === id ? actualizado : t));
      setSelectedTicket(actualizado);
      onNotify('success', `Expediente reasignado a ${nuevoNombre}`);
    } catch {
      onNotify('error', 'Error al reasignar expediente');
    }
  };

  return {
    tickets,
    selectedTicket,
    setSelectedTicket,
    searchQuery,
    setSearchQuery,
    filtroArea,
    setFiltroArea,
    handleAprobar,
    handleReasignar,
  };
}
