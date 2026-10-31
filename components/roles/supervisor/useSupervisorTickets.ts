import { useEffect, useMemo, useState } from 'react';
import { ticketsController } from '@/controllers/tickets.controller';
import { usuariosController } from '@/controllers/usuarios.controller';
import { AccionTicket, Ticket, TicketEstado, TicketPrioridad } from '@/types/ticket.types';
import { Usuario } from '@/types/auth.types';
import { useAuth } from '@/context/AuthContext';
import { NotifyFn } from '@/types/ui.types';
import { calcularCarga, construirFuncionarios, listarAreas } from '@/utils/ticket.utils';

export function useSupervisorTickets(onNotify: NotifyFn) {
  const { usuario } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [modalAction, setModalAction] = useState<AccionTicket>('ninguna');
  const [searchQuery, setSearchQuery] = useState('');
  const [filtroArea, setFiltroArea] = useState<string>('todas');
  const [filtroEstado, setFiltroEstado] = useState<TicketEstado | 'todos'>('todos');
  const [filtroPrioridad, setFiltroPrioridad] = useState<TicketPrioridad | 'todos'>('todos');

  useEffect(() => {
    let cancelado = false;
    Promise.all([ticketsController.getTickets(), usuariosController.getUsuarios()])
      .then(([listaTickets, listaUsuarios]) => {
        if (cancelado) return;
        setTickets(listaTickets);
        setUsuarios(listaUsuarios);
      })
      .catch(() => {
        if (!cancelado) onNotify('error', 'No se pudieron cargar los reclamos para supervisión. Recarga la página.');
      });
    return () => {
      cancelado = true;
    };
    // Solo al montar la vista; onNotify cambia en cada render del padre.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const funcionarios = useMemo(() => construirFuncionarios(usuarios, tickets), [usuarios, tickets]);
  const carga = useMemo(() => calcularCarga(funcionarios, tickets), [funcionarios, tickets]);
  const areas = useMemo(() => listarAreas(tickets, funcionarios), [tickets, funcionarios]);

  const supervisorNombre = usuario?.nombreCompleto || 'Supervisor General';

  const abrirTicket = (ticket: Ticket, accion: AccionTicket = 'ninguna') => {
    setSelectedTicket(ticket);
    setModalAction(accion);
  };

  const cerrarModal = () => {
    setSelectedTicket(null);
    setModalAction('ninguna');
  };

  const reemplazar = (actualizado: Ticket) => {
    setTickets((prev) => prev.map((t) => (t.id === actualizado.id ? actualizado : t)));
    setSelectedTicket(actualizado);
  };

  const handleAprobar = async (id: string, comentario: string) => {
    try {
      const actualizado = await ticketsController.aprobarTicket(id, comentario, supervisorNombre);
      reemplazar(actualizado);
      onNotify('success', `Resolución del expediente ${actualizado.folio} aprobada con éxito`);
    } catch {
      onNotify('error', 'No se pudo aprobar la resolución. Inténtalo de nuevo.');
    }
  };

  const handleDevolver = async (id: string, motivo: string) => {
    try {
      const actualizado = await ticketsController.devolverTicket(id, { motivoDevolucion: motivo }, supervisorNombre);
      reemplazar(actualizado);
      onNotify(
        'success',
        `Expediente ${actualizado.folio} devuelto a ${actualizado.funcionarioAsignadoNombre || 'su funcionario'} para corregir`
      );
    } catch {
      onNotify('error', 'No se pudo devolver el expediente. Inténtalo de nuevo.');
    }
  };

  const handleReasignar = async (id: string, nuevoFuncionarioId: string, nuevoNombre: string, motivo: string) => {
    try {
      const actualizado = await ticketsController.reasignarTicket(
        id,
        { nuevoFuncionarioId, nuevoFuncionarioNombre: nuevoNombre, motivoReasignacion: motivo },
        supervisorNombre
      );
      reemplazar(actualizado);
      onNotify('success', `Expediente reasignado a ${nuevoNombre}`);
    } catch {
      onNotify('error', 'No se pudo reasignar el expediente. Inténtalo de nuevo.');
    }
  };

  return {
    tickets,
    funcionarios,
    carga,
    areas,
    selectedTicket,
    modalAction,
    abrirTicket,
    cerrarModal,
    searchQuery,
    setSearchQuery,
    filtroArea,
    setFiltroArea,
    filtroEstado,
    setFiltroEstado,
    filtroPrioridad,
    setFiltroPrioridad,
    handleAprobar,
    handleDevolver,
    handleReasignar,
  };
}
