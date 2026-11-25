import { useEffect, useMemo, useState } from 'react';
import { ticketsController } from '@/controllers/tickets.controller';
import { AccionCodigo, AccionTicket, DatosAccion, Ticket, TicketFiltroEstado, TicketPrioridad } from '@/types/ticket.types';
import { useAuth } from '@/context/AuthContext';
import { NotifyFn } from '@/types/ui.types';
import { exportarCSV, exportarExcel } from '@/utils/csv.utils';
import { exportarReporteTributarioPdf } from '@/components/roles/control-municipal/tributarios/exportarReportePdf';
import { mensajeErrorApi } from '@/services/api-client.service';
import { MENSAJES_ERROR_RECLAMO, cumpleFiltroEstado, mensajeExitoAccion, textoEstado } from '@/utils/ticket.utils';


export function useFuncionarioTickets(onNotify: NotifyFn) {
  const { usuario } = useAuth();
  const [ticketsRaw, setTicketsRaw] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [modalAction, setModalAction] = useState<AccionTicket>('ninguna');
  const [filtroEstado, setFiltroEstado] = useState<TicketFiltroEstado | 'todos'>('todos');
  const [filtroPrioridad, setFiltroPrioridad] = useState<TicketPrioridad | 'todos'>('todos');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    let cancelado = false;
    ticketsController
      .getTickets()
      .then((data) => {
        if (!cancelado) setTicketsRaw(data);
      })
      .catch(() => {
        if (!cancelado) onNotify('error', 'No se pudieron cargar tus reclamos asignados. Recarga la página.');
      });
    return () => {
      cancelado = true;
    };
  }, [onNotify]);

  // El funcionario solo visualiza los reclamos que le han sido asignados a él.
  const tickets = useMemo(
    () =>
      ticketsRaw.filter((t) => {
        if (!usuario) return false;
        if (t.funcionarioAsignadoId) {
          return t.funcionarioAsignadoId === usuario.id;
        }
        if (t.funcionarioAsignadoNombre && usuario.nombreCompleto) {
          return t.funcionarioAsignadoNombre.toLowerCase() === usuario.nombreCompleto.toLowerCase();
        }
        return false;
      }),
    [ticketsRaw, usuario]
  );

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
      setTicketsRaw((prev) => prev.map((t) => (t.id === actualizado.id ? actualizado : t)));
      setSelectedTicket(actualizado);
      setModalAction('ninguna');
      onNotify('success', mensajeExitoAccion(accion, actualizado, datos));
    } catch (err) {
      onNotify('error', mensajeErrorApi(err, 'No se pudo guardar la acción. Inténtalo de nuevo.', MENSAJES_ERROR_RECLAMO));
      throw err; // El formulario queda abierto con lo escrito.
    }
  };

  const ticketsFiltrados = tickets.filter((t) => {
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

  const construirTablaExportacion = () => {
    const cabeceras = [
      'Folio',
      'Ciudadano',
      'DNI',
      'Asunto',
      'Estado',
      'Prioridad',
      'Fecha Ingreso',
      'Área Asignada',
      'Funcionario Asignado',
    ];
    const filas = ticketsFiltrados.map((t) => [
      t.folio,
      t.ciudadanoNombre,
      t.ciudadanoDni,
      t.asunto,
      textoEstado(t),
      t.prioridad,
      t.fechaCreacion,
      t.areaAsignada || 'Sin área',
      t.funcionarioAsignadoNombre || usuario?.nombreCompleto || '—',
    ]);
    return { cabeceras, filas };
  };

  const descargarCSV = () => {
    const { cabeceras, filas } = construirTablaExportacion();
    exportarCSV('reclamos_funcionario', cabeceras, filas);
    onNotify('success', 'Archivo CSV descargado con éxito');
  };

  const descargarExcel = () => {
    const { cabeceras, filas } = construirTablaExportacion();
    exportarExcel('reclamos_funcionario', cabeceras, filas);
    onNotify('success', 'Archivo Excel descargado con éxito');
  };

  const descargarPDF = async () => {
    if (ticketsFiltrados.length === 0) return;
    const { cabeceras, filas } = construirTablaExportacion();
    const filtrosActivosTexto = [
      filtroEstado !== 'todos' ? `Estado: ${filtroEstado}` : '',
      filtroPrioridad !== 'todos' ? `Prioridad: ${filtroPrioridad}` : '',
      searchQuery.trim(),
    ]
      .filter(Boolean)
      .join(' | ');

    await exportarReporteTributarioPdf({
      tabla: {
        id: 0,
        nombre: 'Bandeja Operativa de Reclamos',
        descripcion: usuario?.nombreCompleto
          ? `Reclamos asignados a ${usuario.nombreCompleto}${usuario.area ? ` — Área: ${usuario.area}` : ''}`
          : 'Atención y gestión operativa de reclamos vecinales asignados',
        certificadoPor: usuario?.area || 'Atención de Quejas y Reclamos',
      },
      cabeceras,
      filas,
      busquedaTexto: filtrosActivosTexto,
      subtituloDocumento: 'Reporte Oficial Municipal',
    });
    onNotify('success', 'Reporte PDF descargado con éxito');
  };

  const limpiarFiltros = () => {
    setSearchQuery('');
    setFiltroEstado('todos');
    setFiltroPrioridad('todos');
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
    limpiarFiltros,
    handleAccion,
    descargarCSV,
    descargarExcel,
    descargarPDF,
  };
}
