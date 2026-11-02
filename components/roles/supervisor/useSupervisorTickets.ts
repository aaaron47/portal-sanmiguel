import { useEffect, useMemo, useState } from 'react';
import { ticketsController } from '@/controllers/tickets.controller';
import { usuariosController } from '@/controllers/usuarios.controller';
import { AccionTicket, Ticket, TicketEstado, TicketPrioridad } from '@/types/ticket.types';
import { Usuario } from '@/types/auth.types';
import { useAuth } from '@/context/AuthContext';
import { NotifyFn } from '@/types/ui.types';
import { calcularCarga, construirFuncionarios, listarAreas, MENSAJES_ERROR_RECLAMO } from '@/utils/ticket.utils';
import { mensajeErrorApi } from '@/services/api-client.service';

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
    // Por separado: si falla la lista de usuarios (p. ej. 403 porque es solo para Admin), los reclamos
    // igual se muestran y la reasignación usa los funcionarios que aparecen asignados en ellos.
    Promise.allSettled([ticketsController.getTickets(), usuariosController.getUsuarios()]).then(
      ([resTickets, resUsuarios]) => {
        if (cancelado) return;
        if (resTickets.status === 'fulfilled') {
          setTickets(resTickets.value);
        } else {
          onNotify(
            'error',
            mensajeErrorApi(resTickets.reason, 'No se pudieron cargar los reclamos para supervisión. Recarga la página.')
          );
        }
        if (resUsuarios.status === 'fulfilled') {
          setUsuarios(resUsuarios.value);
        } else if (resTickets.status === 'fulfilled') {
          onNotify(
            'info',
            'No se pudo cargar la lista de funcionarios; para reasignar solo aparecen los que ya tienen reclamos.'
          );
        }
      }
    );
    return () => {
      cancelado = true;
    };
  }, [onNotify]);

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
    } catch (err) {
      onNotify('error', mensajeErrorApi(err, 'No se pudo aprobar la resolución. Inténtalo de nuevo.', MENSAJES_ERROR_RECLAMO));
      throw err; // El formulario queda abierto con lo escrito.
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
    } catch (err) {
      onNotify('error', mensajeErrorApi(err, 'No se pudo devolver el expediente. Inténtalo de nuevo.', MENSAJES_ERROR_RECLAMO));
      throw err;
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
    } catch (err) {
      onNotify('error', mensajeErrorApi(err, 'No se pudo reasignar el expediente. Inténtalo de nuevo.', MENSAJES_ERROR_RECLAMO));
      throw err;
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
