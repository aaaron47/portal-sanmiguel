import { useEffect, useState } from 'react';
import { ticketsController } from '@/controllers/tickets.controller';
import { EstadoAtencion, Ticket, TicketEstado, TicketPrioridad } from '@/types/ticket.types';
import { useAuth } from '@/context/AuthContext';
import { NotifyFn } from '@/types/ui.types';
import { exportarCSV } from '@/utils/csv.utils';

export type FiltroConstancia = 'todos' | 'con_constancia' | 'sin_constancia' | 'por_evaluar' | 'aprobada' | 'observada';

export function useFuncionarioTickets(onNotify: NotifyFn) {
  const { usuario } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [modalAction, setModalAction] = useState<'ninguna' | 'atender' | 'derivar' | 'constancia'>('ninguna');
  const [filtroEstado, setFiltroEstado] = useState<TicketEstado | 'todos'>('todos');
  const [filtroPrioridad, setFiltroPrioridad] = useState<TicketPrioridad | 'todos'>('todos');
  const [filtroConstancia, setFiltroConstancia] = useState<FiltroConstancia>('todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [soloAsignadosAMi, setSoloAsignadosAMi] = useState(false);

  const area = usuario?.area;

  useEffect(() => {
    let cancelado = false;
    ticketsController
      .getTickets({ area })
      .then((data) => {
        if (!cancelado) setTickets(data);
      })
      .catch(() => {
        if (!cancelado) onNotify('error', 'No se pudieron cargar los reclamos de tu área. Recarga la página.');
      });
    return () => {
      cancelado = true;
    };
    // Se recarga solo si cambia el área; onNotify cambia en cada render del padre.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [area]);

  const abrirTicket = (ticket: Ticket, accion: 'ninguna' | 'atender' | 'derivar' | 'constancia' = 'ninguna') => {
    setSelectedTicket(ticket);
    setModalAction(accion);
  };

  const cerrarModal = () => {
    setSelectedTicket(null);
    setModalAction('ninguna');
  };

  const handleAtender = async (id: string, comentario: string, nuevoEstado: EstadoAtencion) => {
    try {
      const actualizado = await ticketsController.atenderTicket(
        id, 
        { comentarioRespuesta: comentario, nuevoEstado }, 
        usuario?.nombreCompleto || 'Funcionario'
      );
      setTickets(prev => prev.map(t => t.id === id ? actualizado : t));
      setSelectedTicket(actualizado);
      onNotify(
        'success',
        nuevoEstado === 'por aprobar'
          ? `Expediente ${actualizado.folio} enviado al supervisor para aprobación`
          : `Avance registrado en el expediente ${actualizado.folio}`
      );
    } catch {
      onNotify('error', 'Error al registrar atención');
    }
  };

  const handleDerivar = async (id: string, areaDestino: string, motivo: string) => {
    try {
      const actualizado = await ticketsController.derivarTicket(
        id, 
        { areaDestino, motivoDerivacion: motivo }, 
        usuario?.nombreCompleto || 'Funcionario'
      );
      setTickets(prev => prev.map(t => t.id === id ? actualizado : t));
      setSelectedTicket(actualizado);
      onNotify('success', `Expediente derivado a ${areaDestino} correctamente`);
    } catch {
      onNotify('error', 'Error al derivar expediente');
    }
  };

  const handleEvaluarConstancia = async (id: string, estado: 'aprobada' | 'observada', observaciones: string) => {
    try {
      const actualizado = await ticketsController.evaluarConstancia(
        id, 
        estado, 
        observaciones, 
        usuario?.nombreCompleto || 'Funcionario'
      );
      setTickets(prev => prev.map(t => t.id === id ? actualizado : t));
      setSelectedTicket(actualizado);
      onNotify('success', `Constancia formal ${estado} exitosamente`);
    } catch {
      onNotify('error', 'Error al evaluar constancia');
    }
  };

  const ticketsFiltrados = tickets.filter(t => {
    if (soloAsignadosAMi && t.funcionarioAsignadoId !== usuario?.id) return false;
    if (filtroEstado !== 'todos' && t.estado !== filtroEstado) return false;
    if (filtroPrioridad !== 'todos' && t.prioridad !== filtroPrioridad) return false;
    if (filtroConstancia !== 'todos') {
      if (filtroConstancia === 'con_constancia' && !t.tieneConstancia) return false;
      if (filtroConstancia === 'sin_constancia' && t.tieneConstancia) return false;
      if (filtroConstancia === 'aprobada' && (!t.tieneConstancia || t.estadoConstancia !== 'aprobada')) return false;
      if (filtroConstancia === 'observada' && (!t.tieneConstancia || t.estadoConstancia !== 'observada')) return false;
      if (filtroConstancia === 'por_evaluar' && (!t.tieneConstancia || (t.estadoConstancia && t.estadoConstancia !== 'sin_evaluar'))) return false;
    }
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
      'Constancia',
      'Dictamen Constancia',
      'Fecha Ingreso',
      'Área Asignada',
    ];
    const filas = ticketsFiltrados.map((t) => [
      t.folio,
      t.ciudadanoNombre,
      t.ciudadanoDni,
      t.asunto,
      t.estado,
      t.prioridad,
      t.tieneConstancia ? 'Solicitada' : 'No Requerida',
      t.tieneConstancia
        ? t.estadoConstancia === 'aprobada'
          ? 'Aprobada'
          : t.estadoConstancia === 'observada'
          ? 'Observada'
          : 'Por Evaluar'
        : 'N/A',
      t.fechaCreacion,
      t.areaAsignada,
    ]);

    exportarCSV('reclamos_funcionario', cabeceras, filas);
    onNotify('success', 'Archivo CSV descargado con éxito');
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
    filtroConstancia,
    setFiltroConstancia,
    searchQuery,
    setSearchQuery,
    soloAsignadosAMi,
    setSoloAsignadosAMi,
    handleAtender,
    handleDerivar,
    handleEvaluarConstancia,
    descargarCSV,
  };
}
