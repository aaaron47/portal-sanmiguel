import { apiClient, esSinConexion } from '@/services/api-client.service';
import { 
  Ticket, 
  TicketFiltros, 
  TicketSeguimiento, 
  RespuestaPayload, 
  DerivacionPayload, 
  DevolucionPayload,
  ReasignacionPayload 
} from '@/types/ticket.types';

// Mock dataset representativo de la base de datos municipal para pruebas de flujos
const MOCK_TICKETS: Ticket[] = [
  {
    id: 'REC-001',
    folio: 'REC-2026-0104',
    ciudadanoDni: '44891234',
    ciudadanoNombre: 'Juan Pérez Alva',
    ciudadanoEmail: 'juan.perez@gmail.com',
    ciudadanoTelefono: '998123456',
    asunto: 'Exceso de ruido por local comercial nocturno en Av. La Marina',
    descripcion: 'El establecimiento opera con música a alto volumen fuera del horario de licencia comercial permitido, perturbando la tranquilidad del vecindario.',
    areaAsignada: 'Fiscalización y Control',
    funcionarioAsignadoId: 'USR-FUN-02',
    funcionarioAsignadoNombre: 'Lic. Mariana Rios',
    estado: 'en evaluación',
    prioridad: 'ALTA',
    tieneConstancia: true,
    estadoConstancia: 'sin_evaluar',
    fechaCreacion: '2026-10-28 09:15',
    fechaActualizacion: '2026-10-29 11:30',
    seguimientos: [
      {
        id: 'SEG-001',
        reclamoId: 'REC-001',
        autorId: 'CIUDADANO',
        autorNombre: 'Juan Pérez Alva',
        autorRol: 'Ciudadano',
        fecha: '2026-10-28 09:15',
        tipoAccion: 'CREACION',
        comentario: 'Reclamo ingresado vía App Móvil San Miguel con evidencia fotográfica.',
      },
      {
        id: 'SEG-002',
        reclamoId: 'REC-001',
        autorId: 'USR-FUN-02',
        autorNombre: 'Lic. Mariana Rios',
        autorRol: 'Funcionario',
        fecha: '2026-10-29 11:30',
        tipoAccion: 'ATENCION',
        comentario: 'Se coordinó inspección nocturna in situ con el equipo de Serenazgo para verificación de decibeles.',
      }
    ],
  },
  {
    id: 'REC-002',
    folio: 'REC-2026-0105',
    ciudadanoDni: '72349102',
    ciudadanoNombre: 'Carmen Silva Prado',
    ciudadanoEmail: 'carmen.silva@outlook.com',
    ciudadanoTelefono: '987654321',
    asunto: 'Bache de gran profundidad en Jr. Tacna cruce con Sucre',
    descripcion: 'Hueco de considerable tamaño que daña vehículos e impide el libre tránsito peatonal en zona escolar.',
    areaAsignada: 'Obras Públicas',
    funcionarioAsignadoId: 'USR-FUN-09',
    funcionarioAsignadoNombre: 'Ing. Fernando Rojas',
    estado: 'por aprobar',
    prioridad: 'URGENTE',
    tieneConstancia: true,
    estadoConstancia: 'aprobada',
    fechaCreacion: '2026-10-26 14:00',
    fechaActualizacion: '2026-10-30 10:15',
    seguimientos: [
      {
        id: 'SEG-003',
        reclamoId: 'REC-002',
        autorId: 'CIUDADANO',
        autorNombre: 'Carmen Silva Prado',
        autorRol: 'Ciudadano',
        fecha: '2026-10-26 14:00',
        tipoAccion: 'CREACION',
        comentario: 'Reclamo vecinal registrado con solicitud de constancia de recepción formal.',
      },
      {
        id: 'SEG-004',
        reclamoId: 'REC-002',
        autorId: 'USR-FUN-09',
        autorNombre: 'Ing. Fernando Rojas',
        autorRol: 'Funcionario',
        fecha: '2026-10-30 10:15',
        tipoAccion: 'ATENCION',
        comentario: 'Trabajos de bacheo y pavimentación programados en el lote 4. Se eleva al supervisor para visto bueno final.',
      }
    ],
  },
  {
    id: 'REC-003',
    folio: 'REC-2026-0106',
    ciudadanoDni: '10459823',
    ciudadanoNombre: 'Marcos Vilchez C.',
    ciudadanoEmail: 'm.vilchez@gmail.com',
    asunto: 'Arborización sin podar obstruyendo cableado eléctrico',
    descripcion: 'Ramas secas tocan cables de media tensión en parque Virgen del Carmen.',
    areaAsignada: 'Parques y Jardines',
    funcionarioAsignadoId: 'USR-FUN-04',
    funcionarioAsignadoNombre: 'Bach. Laura Paredes',
    estado: 'pendiente de validación',
    prioridad: 'MEDIA',
    tieneConstancia: false,
    fechaCreacion: '2026-10-30 16:45',
    fechaActualizacion: '2026-10-30 16:45',
    seguimientos: [
      {
        id: 'SEG-005',
        reclamoId: 'REC-003',
        autorId: 'CIUDADANO',
        autorNombre: 'Marcos Vilchez C.',
        autorRol: 'Ciudadano',
        fecha: '2026-10-30 16:45',
        tipoAccion: 'CREACION',
        comentario: 'Registro automático de incidencia desde canal móvil vecinal.',
      }
    ],
  },
  {
    id: 'REC-004',
    folio: 'REC-2026-0107',
    ciudadanoDni: '08349281',
    ciudadanoNombre: 'Lucía Garay Méndez',
    ciudadanoEmail: 'lucia.garay@hotmail.com',
    asunto: 'Solicitud de anulación de papeleta por presunta infracción',
    descripcion: 'Vehículo se encontraba en zona de descarga permitida según señalética.',
    areaAsignada: 'Fiscalización y Control',
    funcionarioAsignadoId: 'USR-FUN-02',
    funcionarioAsignadoNombre: 'Lic. Mariana Rios',
    estado: 'derivado',
    prioridad: 'MEDIA',
    tieneConstancia: true,
    estadoConstancia: 'sin_evaluar',
    fechaCreacion: '2026-10-27 11:20',
    fechaActualizacion: '2026-10-29 17:00',
    seguimientos: [
      {
        id: 'SEG-006',
        reclamoId: 'REC-004',
        autorId: 'USR-FUN-02',
        autorNombre: 'Lic. Mariana Rios',
        autorRol: 'Funcionario',
        fecha: '2026-10-29 17:00',
        tipoAccion: 'DERIVACION',
        comentario: 'Derivación enriquecida: Se traslada expediente a Subgerencia de Tránsito y Transporte para evaluación técnica de actas.',
      }
    ],
  },
  {
    id: 'REC-005',
    folio: 'REC-2026-0108',
    ciudadanoDni: '41992011',
    ciudadanoNombre: 'Pedro Castillo Moreno',
    ciudadanoEmail: 'pedro.cm@yahoo.com',
    asunto: 'Acumulación de desmonte en vía pública',
    descripcion: 'Vecinos de la cuadra 3 arrojaron desmonte de construcción en la acera.',
    areaAsignada: 'Limpieza Pública',
    funcionarioAsignadoId: 'USR-FUN-08',
    funcionarioAsignadoNombre: 'Sr. Walter Quispe',
    estado: 'resuelto',
    prioridad: 'ALTA',
    tieneConstancia: false,
    fechaCreacion: '2026-10-25 08:30',
    fechaActualizacion: '2026-10-28 15:40',
    seguimientos: [
      {
        id: 'SEG-007',
        reclamoId: 'REC-005',
        autorId: 'USR-SUP-03',
        autorNombre: 'Dr. Roberto Salas',
        autorRol: 'Supervisor',
        fecha: '2026-10-28 15:40',
        tipoAccion: 'APROBACION',
        comentario: 'Inspección aprobada y desmonte retirado por cuadrilla municipal. Caso concluido.',
      }
    ],
  }
];

export class TicketsController {
  async getTickets(filtros?: TicketFiltros): Promise<Ticket[]> {
    try {
      const tickets = await apiClient<Ticket[]>('/tickets', {
        params: filtros as Record<string, string | number | boolean | undefined>,
      });
      return tickets;
    } catch (err) {
      // Datos simulados solo sin conexión; si el backend respondió con error, se avisa a la vista.
      if (!esSinConexion(err)) throw err;
      // Filtrado local sobre mock
      let resultado = [...MOCK_TICKETS];
      if (filtros?.estado && filtros.estado !== 'todos') {
        resultado = resultado.filter(t => t.estado === filtros.estado);
      }
      if (filtros?.prioridad && filtros.prioridad !== 'todos') {
        resultado = resultado.filter(t => t.prioridad === filtros.prioridad);
      }
      if (filtros?.area) {
        resultado = resultado.filter(t => t.areaAsignada.toLowerCase().includes(filtros.area!.toLowerCase()));
      }
      if (filtros?.busqueda) {
        const query = filtros.busqueda.toLowerCase();
        resultado = resultado.filter(t => 
          t.folio.toLowerCase().includes(query) ||
          t.asunto.toLowerCase().includes(query) ||
          t.ciudadanoDni.includes(query) ||
          t.ciudadanoNombre.toLowerCase().includes(query)
        );
      }
      return resultado;
    }
  }

  async getTicketById(id: string): Promise<Ticket> {
    try {
      return await apiClient<Ticket>(`/tickets/${id}`);
    } catch (err) {
      // Datos simulados solo sin conexión; si el backend respondió con error, se avisa a la vista.
      if (!esSinConexion(err)) throw err;
      const ticket = MOCK_TICKETS.find(t => t.id === id);
      if (!ticket) throw new Error(`Reclamo ${id} no encontrado`);
      return ticket;
    }
  }

  async atenderTicket(id: string, payload: RespuestaPayload, usuarioNombre: string): Promise<Ticket> {
    try {
      return await apiClient<Ticket>(`/tickets/${id}/atender`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    } catch (err) {
      // Datos simulados solo sin conexión; si el backend respondió con error, se avisa a la vista.
      if (!esSinConexion(err)) throw err;
      const ticketIndex = MOCK_TICKETS.findIndex(t => t.id === id);
      if (ticketIndex === -1) throw new Error('Reclamo no encontrado');

      const nuevoSeguimiento: TicketSeguimiento = {
        id: `SEG-${Date.now()}`,
        reclamoId: id,
        autorId: 'CURRENT_USER',
        autorNombre: usuarioNombre,
        autorRol: 'Funcionario',
        fecha: new Date().toISOString().replace('T', ' ').substring(0, 16),
        tipoAccion: 'ATENCION',
        comentario: payload.comentarioRespuesta,
      };

      MOCK_TICKETS[ticketIndex] = {
        ...MOCK_TICKETS[ticketIndex],
        estado: payload.nuevoEstado,
        fechaActualizacion: nuevoSeguimiento.fecha,
        seguimientos: [...MOCK_TICKETS[ticketIndex].seguimientos, nuevoSeguimiento],
      };

      return MOCK_TICKETS[ticketIndex];
    }
  }

  async derivarTicket(id: string, payload: DerivacionPayload, usuarioNombre: string): Promise<Ticket> {
    try {
      return await apiClient<Ticket>(`/tickets/${id}/derivar`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    } catch (err) {
      // Datos simulados solo sin conexión; si el backend respondió con error, se avisa a la vista.
      if (!esSinConexion(err)) throw err;
      const ticketIndex = MOCK_TICKETS.findIndex(t => t.id === id);
      if (ticketIndex === -1) throw new Error('Reclamo no encontrado');

      const nuevoSeguimiento: TicketSeguimiento = {
        id: `SEG-${Date.now()}`,
        reclamoId: id,
        autorId: 'CURRENT_USER',
        autorNombre: usuarioNombre,
        autorRol: 'Funcionario',
        fecha: new Date().toISOString().replace('T', ' ').substring(0, 16),
        tipoAccion: 'DERIVACION',
        // Se guarda en el campo comentario según directiva de "Cero Sobreingeniería"
        comentario: `DERIVACIÓN A [${payload.areaDestino}]: ${payload.motivoDerivacion}`,
      };

      MOCK_TICKETS[ticketIndex] = {
        ...MOCK_TICKETS[ticketIndex],
        estado: 'derivado',
        areaAsignada: payload.areaDestino,
        fechaActualizacion: nuevoSeguimiento.fecha,
        seguimientos: [...MOCK_TICKETS[ticketIndex].seguimientos, nuevoSeguimiento],
      };

      return MOCK_TICKETS[ticketIndex];
    }
  }

  async aprobarTicket(id: string, comentarioAprobacion: string, supervisorNombre: string): Promise<Ticket> {
    try {
      return await apiClient<Ticket>(`/tickets/${id}/aprobar`, {
        method: 'POST',
        body: JSON.stringify({ comentarioAprobacion }),
      });
    } catch (err) {
      // Datos simulados solo sin conexión; si el backend respondió con error, se avisa a la vista.
      if (!esSinConexion(err)) throw err;
      const ticketIndex = MOCK_TICKETS.findIndex(t => t.id === id);
      if (ticketIndex === -1) throw new Error('Reclamo no encontrado');

      const nuevoSeguimiento: TicketSeguimiento = {
        id: `SEG-${Date.now()}`,
        reclamoId: id,
        autorId: 'CURRENT_USER',
        autorNombre: supervisorNombre,
        autorRol: 'Supervisor',
        fecha: new Date().toISOString().replace('T', ' ').substring(0, 16),
        tipoAccion: 'APROBACION',
        comentario: `APROBACIÓN DE RESOLUCIÓN: ${comentarioAprobacion}`,
      };

      MOCK_TICKETS[ticketIndex] = {
        ...MOCK_TICKETS[ticketIndex],
        estado: 'resuelto',
        fechaActualizacion: nuevoSeguimiento.fecha,
        seguimientos: [...MOCK_TICKETS[ticketIndex].seguimientos, nuevoSeguimiento],
      };

      return MOCK_TICKETS[ticketIndex];
    }
  }

  async devolverTicket(id: string, payload: DevolucionPayload, supervisorNombre: string): Promise<Ticket> {
    try {
      return await apiClient<Ticket>(`/tickets/${id}/devolver`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    } catch (err) {
      // Datos simulados solo sin conexión; si el backend respondió con error, se avisa a la vista.
      if (!esSinConexion(err)) throw err;
      const ticketIndex = MOCK_TICKETS.findIndex(t => t.id === id);
      if (ticketIndex === -1) throw new Error('Reclamo no encontrado');

      const nuevoSeguimiento: TicketSeguimiento = {
        id: `SEG-${Date.now()}`,
        reclamoId: id,
        autorId: 'CURRENT_USER',
        autorNombre: supervisorNombre,
        autorRol: 'Supervisor',
        fecha: new Date().toISOString().replace('T', ' ').substring(0, 16),
        tipoAccion: 'DEVOLUCION',
        comentario: `DEVOLUCIÓN PARA CORREGIR: ${payload.motivoDevolucion}`,
      };

      MOCK_TICKETS[ticketIndex] = {
        ...MOCK_TICKETS[ticketIndex],
        estado: 'en evaluación',
        fechaActualizacion: nuevoSeguimiento.fecha,
        seguimientos: [...MOCK_TICKETS[ticketIndex].seguimientos, nuevoSeguimiento],
      };

      return MOCK_TICKETS[ticketIndex];
    }
  }

  async reasignarTicket(id: string, payload: ReasignacionPayload, supervisorNombre: string): Promise<Ticket> {
    try {
      return await apiClient<Ticket>(`/tickets/${id}/reasignar`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    } catch (err) {
      // Datos simulados solo sin conexión; si el backend respondió con error, se avisa a la vista.
      if (!esSinConexion(err)) throw err;
      const ticketIndex = MOCK_TICKETS.findIndex(t => t.id === id);
      if (ticketIndex === -1) throw new Error('Reclamo no encontrado');

      const nuevoSeguimiento: TicketSeguimiento = {
        id: `SEG-${Date.now()}`,
        reclamoId: id,
        autorId: 'CURRENT_USER',
        autorNombre: supervisorNombre,
        autorRol: 'Supervisor',
        fecha: new Date().toISOString().replace('T', ' ').substring(0, 16),
        tipoAccion: 'REASIGNACION',
        comentario: `REASIGNADO A ${payload.nuevoFuncionarioNombre}: ${payload.motivoReasignacion}`,
      };

      MOCK_TICKETS[ticketIndex] = {
        ...MOCK_TICKETS[ticketIndex],
        funcionarioAsignadoId: payload.nuevoFuncionarioId,
        funcionarioAsignadoNombre: payload.nuevoFuncionarioNombre,
        fechaActualizacion: nuevoSeguimiento.fecha,
        seguimientos: [...MOCK_TICKETS[ticketIndex].seguimientos, nuevoSeguimiento],
      };

      return MOCK_TICKETS[ticketIndex];
    }
  }

  async evaluarConstancia(id: string, estado: 'aprobada' | 'observada', observaciones: string, funcionarioNombre: string): Promise<Ticket> {
    try {
      return await apiClient<Ticket>(`/tickets/${id}/evaluar-constancia`, {
        method: 'POST',
        body: JSON.stringify({ estado, observaciones }),
      });
    } catch (err) {
      // Datos simulados solo sin conexión; si el backend respondió con error, se avisa a la vista.
      if (!esSinConexion(err)) throw err;
      const ticketIndex = MOCK_TICKETS.findIndex(t => t.id === id);
      if (ticketIndex === -1) throw new Error('Reclamo no encontrado');

      const nuevoSeguimiento: TicketSeguimiento = {
        id: `SEG-${Date.now()}`,
        reclamoId: id,
        autorId: 'CURRENT_USER',
        autorNombre: funcionarioNombre,
        autorRol: 'Funcionario',
        fecha: new Date().toISOString().replace('T', ' ').substring(0, 16),
        tipoAccion: 'EVALUACION_CONSTANCIA',
        comentario: `EVALUACIÓN DE CONSTANCIA [${estado.toUpperCase()}]: ${observaciones}`,
      };

      MOCK_TICKETS[ticketIndex] = {
        ...MOCK_TICKETS[ticketIndex],
        estadoConstancia: estado,
        fechaActualizacion: nuevoSeguimiento.fecha,
        seguimientos: [...MOCK_TICKETS[ticketIndex].seguimientos, nuevoSeguimiento],
      };

      return MOCK_TICKETS[ticketIndex];
    }
  }
}

export const ticketsController = new TicketsController();
