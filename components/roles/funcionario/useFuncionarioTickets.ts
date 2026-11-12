import { useEffect, useState } from 'react';
import { ticketsController } from '@/controllers/tickets.controller';
import { AccionCodigo, AccionTicket, DatosAccion, Ticket, TicketFiltroEstado, TicketPrioridad } from '@/types/ticket.types';
import { useAuth } from '@/context/AuthContext';
import { NotifyFn } from '@/types/ui.types';
import { exportarCSV } from '@/utils/csv.utils';
import { mensajeErrorApi } from '@/services/api-client.service';
import { MENSAJES_ERROR_RECLAMO, cumpleFiltroEstado, mensajeExitoAccion, textoEstado } from '@/utils/ticket.utils';


export function useFuncionarioTickets(onNotify: NotifyFn) {
  const { usuario } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [modalAction, setModalAction] = useState<AccionTicket>('ninguna');
  const [filtroEstado, setFiltroEstado] = useState<TicketFiltroEstado | 'todos'>('todos');
  const [filtroPrioridad, setFiltroPrioridad] = useState<TicketPrioridad | 'todos'>('todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [soloAsignadosAMi, setSoloAsignadosAMi] = useState(false);

  useEffect(() => {
    let cancelado = false;
    // Sin filtro de área: el backend ya devuelve los de su área y los que aún no tienen área (por validar).
    ticketsController
      .getTickets()
      .then((data) => {
        if (!cancelado) setTickets(data);
      })
      .catch(() => {
        if (!cancelado) onNotify('error', 'No se pudieron cargar los reclamos de tu área. Recarga la página.');
      });
    return () => {
      cancelado = true;
    };
  }, [onNotify]);

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

  const ticketsFiltrados = tickets.filter(t => {
    if (soloAsignadosAMi && t.funcionarioAsignadoId !== usuario?.id) return false;
    if (!cumpleFiltroEstado(t, filtroEstado)) return false;
    if (filtroPrioridad !== 'todos' && t.prioridad !== filtroPrioridad) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        t.folio.toLowerCase().includes(q) ||
        t.asunto.toLowerCase().includes(q) ||
        t.ciudadanoNombre.toLowerCase().includes(q) ||
        t.ciudadanoDni.includes(q)
      );
    }
    return true;
  });

  const descargarCSV = () => {
    const cabeceras = [
      'Folio',
      'Ciudadano',
      'DNI',
      'Asunto',
      'Estado',
      'Prioridad',
      'Fecha Ingreso',
      'Área Asignada',
    ];
    const filas = ticketsFiltrados.map((t) => [
      t.folio,
      t.ciudadanoNombre,
      t.ciudadanoDni,
      t.asunto,
      textoEstado(t),
      t.prioridad,
      t.fechaCreacion,
      t.areaAsignada,
    ]);

    exportarCSV('reclamos_funcionario', cabeceras, filas);
    onNotify('success', 'Archivo CSV descargado con éxito');
  };

  const limpiarFiltros = () => {
    setSearchQuery('');
    setFiltroEstado('todos');
    setFiltroPrioridad('todos');
    setSoloAsignadosAMi(false);
  };

  return {
    usuario,
    tickets,
    ticketsFiltrados,
    selectedTicket,
    setSelectedTicket,
    modalAction,
    setModalAction,
    abrirTicket,
    cerrarModal,
    filtroEstado,
    setFiltroEstado,
    filtroPrioridad,
    setFiltroPrioridad,
    searchQuery,
    setSearchQuery,
    soloAsignadosAMi,
    setSoloAsignadosAMi,
    limpiarFiltros,
    handleAccion,
    descargarCSV,
  };
}
