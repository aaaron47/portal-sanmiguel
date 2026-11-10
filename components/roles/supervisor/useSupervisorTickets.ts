import { useEffect, useMemo, useState } from 'react';
import { ticketsController } from '@/controllers/tickets.controller';
import { usuariosController } from '@/controllers/usuarios.controller';
import { AccionCodigo, AccionTicket, DatosAccion, Ticket, TicketFiltroEstado, TicketPrioridad } from '@/types/ticket.types';
import { Usuario } from '@/types/auth.types';
import { NotifyFn } from '@/types/ui.types';
import {
  calcularCarga,
  construirFuncionarios,
  listarAreas,
  mensajeExitoAccion,
  MENSAJES_ERROR_RECLAMO,
} from '@/utils/ticket.utils';
import { mensajeErrorApi } from '@/services/api-client.service';

export function useSupervisorTickets(onNotify: NotifyFn) {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [modalAction, setModalAction] = useState<AccionTicket>('ninguna');
  const [searchQuery, setSearchQuery] = useState('');
  const [filtroArea, setFiltroArea] = useState<string>('todas');
  const [filtroFuncionario, setFiltroFuncionario] = useState<string>('todos');
  const [filtroEstado, setFiltroEstado] = useState<TicketFiltroEstado | 'todos'>('todos');
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

  const abrirTicket = (ticket: Ticket, accion: AccionTicket = 'ninguna') => {
    setSelectedTicket(ticket);
    setModalAction(accion);
    // La lista no trae evaluaciones ni versiones de la respuesta: se pide el detalle.
    ticketsController
      .getTicketById(ticket.id)
      .then((detalle) => setSelectedTicket((actual) => (actual?.id === detalle.id ? detalle : actual)))
      .catch(() => {
        // Se queda con lo de la lista; las acciones igual comprueban la versión en el servidor.
      });
  };

  const cerrarModal = () => {
    setSelectedTicket(null);
    setModalAction('ninguna');
  };

  const handleAccion = async (ticket: Ticket, accion: AccionCodigo, datos: DatosAccion) => {
    try {
      const actualizado = await ticketsController.ejecutarAccion(ticket, accion, datos);
      setTickets((prev) => prev.map((t) => (t.id === actualizado.id ? actualizado : t)));
      setSelectedTicket(actualizado);
      setModalAction('ninguna');
      onNotify('success', mensajeExitoAccion(accion, actualizado, datos));
    } catch (err) {
      onNotify('error', mensajeErrorApi(err, 'No se pudo guardar la acción. Inténtalo de nuevo.', MENSAJES_ERROR_RECLAMO));
      throw err; // El formulario queda abierto con lo escrito.
    }
  };

  const limpiarFiltros = () => {
    setSearchQuery('');
    setFiltroArea('todas');
    setFiltroFuncionario('todos');
    setFiltroEstado('todos');
    setFiltroPrioridad('todos');
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
    filtroFuncionario,
    setFiltroFuncionario,
    filtroEstado,
    setFiltroEstado,
    filtroPrioridad,
    setFiltroPrioridad,
    limpiarFiltros,
    handleAccion,
  };
}
