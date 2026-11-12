import { apiClient, usarDatosDemo } from '@/services/api-client.service';
import {
  EstadoSolicitudConstancia,
  FiltrosSolicitudes,
  ListadoSolicitudesConstancia,
  SolicitudConstancia,
} from '@/types/constancia.types';

// Datos simulados (solo sin conexión y en modo demo). Las acciones no se simulan: necesitan el servidor.
const base = {
  tramite: 'Trámite 45 - Constancia de no adeudo',
  tasa: '10.20',
  moneda: 'PEN',
  motivoRechazo: null,
  atendidoPor: null,
  atendidoEn: null,
  constancia: null,
};
const sinDeuda = { montoPendiente: '0.00', cuotasPendientes: 0, cuotasVencidas: 0, detalle: [] };

const MOCK_SOLICITUDES: SolicitudConstancia[] = [
  {
    ...base,
    id: 'sol-demo-1',
    numero: 'SOL-2026-000101',
    estado: 'EN_VERIFICACION',
    estadoEtiqueta: 'En verificación',
    solicitadoEn: '2026-11-11T14:05:00Z',
    contribuyente: { id: 'c1', codigo: 'SM-2026-00011', nombre: 'Rosa Elena Quispe', tipoDocumento: 'DNI', documento: '41***512' },
    predio: { id: 'p1', codigo: 'P-0458-1', direccion: 'Av. La Marina 1520', distrito: 'San Miguel, Lima' },
    pago: { numeroOperacion: 'OPR-2026-000311', pagadoEn: '2026-11-11T14:07:10Z', importe: '10.20' },
    deuda: sinDeuda,
    accionesPermitidas: ['APROBAR', 'DESAPROBAR'],
  },
  {
    ...base,
    id: 'sol-demo-2',
    numero: 'SOL-2026-000102',
    estado: 'EN_VERIFICACION',
    estadoEtiqueta: 'En verificación',
    solicitadoEn: '2026-11-11T15:20:00Z',
    contribuyente: { id: 'c2', codigo: 'SM-2026-00027', nombre: 'Jorge Luis Paredes', tipoDocumento: 'DNI', documento: '07***834' },
    predio: { id: 'p2', codigo: 'P-1290-2', direccion: 'Jr. Cusco 245', distrito: 'San Miguel, Lima' },
    pago: { numeroOperacion: 'OPR-2026-000318', pagadoEn: '2026-11-11T15:22:40Z', importe: '10.20' },
    deuda: {
      montoPendiente: '463.86',
      cuotasPendientes: 3,
      cuotasVencidas: 1,
      detalle: [
        { id: 'q1', concepto: 'Impuesto Predial', periodo: '2026 - 3er Trimestre', venceEl: '2026-08-31', total: '154.62', vencida: true },
        { id: 'q2', concepto: 'Arbitrios Municipales', periodo: '2026 - 3er Trimestre', venceEl: '2026-08-31', total: '154.62', vencida: false },
        { id: 'q3', concepto: 'Arbitrios Municipales', periodo: '2026 - 4to Trimestre', venceEl: '2026-11-30', total: '154.62', vencida: false },
      ],
    },
    accionesPermitidas: ['DESAPROBAR'],
  },
  {
    ...base,
    id: 'sol-demo-3',
    numero: 'SOL-2026-000098',
    estado: 'EMITIDA',
    estadoEtiqueta: 'Aprobada (emitida)',
    solicitadoEn: '2026-11-10T09:12:00Z',
    contribuyente: { id: 'c3', codigo: 'SM-2026-00003', nombre: 'Carlos Alberto Mendoza', tipoDocumento: 'DNI', documento: '00***001' },
    predio: { id: 'p3', codigo: 'P-0101-1', direccion: 'Calle Los Olivos 101', distrito: 'San Miguel, Lima' },
    pago: { numeroOperacion: 'OPR-2026-000290', pagadoEn: '2026-11-10T09:15:00Z', importe: '10.20' },
    deuda: sinDeuda,
    atendidoPor: 'Lic. Mariana Rios',
    atendidoEn: '2026-11-10T11:40:00Z',
    constancia: {
      id: 'cna-demo-3',
      codigoVerificacion: '0691a625-cb23-466a-a470-654d3c46556b',
      emitidoEn: '2026-11-10T11:40:00Z',
      vigenteHasta: '2026-12-10',
      estado: 'VIGENTE',
      canalEnvio: 'BANDEJA',
      enviadoEn: '2026-11-10T11:40:00Z',
      urlVerificacion: null,
    },
    accionesPermitidas: [],
  },
  {
    ...base,
    id: 'sol-demo-4',
    numero: 'SOL-2026-000095',
    estado: 'RECHAZADA',
    estadoEtiqueta: 'Desaprobada',
    solicitadoEn: '2026-11-09T16:30:00Z',
    contribuyente: { id: 'c4', codigo: 'SM-2026-00019', nombre: 'Luis Fernando Rojas', tipoDocumento: 'DNI', documento: '00***003' },
    predio: { id: 'p4', codigo: 'P-0303-1', direccion: 'Calle Academia 303', distrito: 'San Miguel, Lima' },
    pago: { numeroOperacion: 'OPR-2026-000271', pagadoEn: '2026-11-09T16:33:00Z', importe: '10.20' },
    deuda: { montoPendiente: '463.86', cuotasPendientes: 3, cuotasVencidas: 0, detalle: [] },
    motivoRechazo: 'Registra deudas pendientes de arbitrios 2026.',
    atendidoPor: 'Lic. Mariana Rios',
    atendidoEn: '2026-11-09T17:05:00Z',
    accionesPermitidas: [],
  },
  {
    ...base,
    id: 'sol-demo-5',
    numero: 'SOL-2026-000103',
    estado: 'PENDIENTE_PAGO',
    estadoEtiqueta: 'Pendiente de pago',
    solicitadoEn: '2026-11-11T16:45:00Z',
    contribuyente: { id: 'c5', codigo: 'SM-2026-00034', nombre: 'Ana María Torres', tipoDocumento: 'DNI', documento: '45***210' },
    predio: { id: 'p5', codigo: 'P-0877-3', direccion: 'Av. Universitaria 880', distrito: 'San Miguel, Lima' },
    pago: null,
    deuda: sinDeuda,
    accionesPermitidas: [],
  },
];

function listarDemo(filtros: FiltrosSolicitudes): ListadoSolicitudesConstancia {
  const q = (filtros.busqueda || '').trim().toLowerCase();
  const todas = MOCK_SOLICITUDES.filter(
    (s) =>
      (!filtros.estado || s.estado === filtros.estado) &&
      (!q || [s.numero, s.contribuyente.nombre, s.contribuyente.codigo, s.predio.codigo, s.predio.direccion].some((v) => v.toLowerCase().includes(q)))
  );
  const tamano = filtros.tamano || 10;
  const totalPaginas = Math.max(1, Math.ceil(todas.length / tamano));
  const pagina = Math.min(filtros.pagina || 1, totalPaginas);
  return { items: todas.slice((pagina - 1) * tamano, pagina * tamano), totalRegistros: todas.length, paginaActual: pagina, totalPaginas };
}

export class ConstanciasController {
  /** Endpoint backend: `GET /constancias?estado=&busqueda=&pagina=&tamano=` (FUNCIONARIO y SUPERVISOR). */
  async listar(filtros: FiltrosSolicitudes = {}): Promise<ListadoSolicitudesConstancia> {
    const busqueda = filtros.busqueda?.trim() || undefined;
    try {
      return await apiClient<ListadoSolicitudesConstancia>('/constancias', {
        params: { estado: filtros.estado, busqueda, pagina: filtros.pagina, tamano: filtros.tamano },
      });
    } catch (err) {
      if (!usarDatosDemo(err)) throw err;
      return listarDemo({ ...filtros, busqueda });
    }
  }

  /** Cuántas solicitudes hay en un estado (lee solo `totalRegistros`). */
  async contar(estado?: EstadoSolicitudConstancia): Promise<number> {
    return (await this.listar({ estado, pagina: 1, tamano: 1 })).totalRegistros;
  }

  /** Endpoint backend: `GET /constancias/{id}`; trae las cuotas pendientes del contribuyente. */
  async obtener(id: string): Promise<SolicitudConstancia> {
    try {
      return await apiClient<SolicitudConstancia>(`/constancias/${encodeURIComponent(id)}`);
    } catch (err) {
      if (!usarDatosDemo(err)) throw err;
      const s = MOCK_SOLICITUDES.find((x) => x.id === id);
      if (!s) throw err;
      return { ...s };
    }
  }

  /**
   * Endpoint backend: `POST /constancias/{id}/aprobar` (comentario opcional). Emite la constancia y deja un mensaje en
   * la bandeja del ciudadano. 409: `invalid_state`, `fee_required` (tasa sin pagar), `outstanding_debts` (con deuda).
   */
  async aprobar(id: string, comentario?: string): Promise<void> {
    const texto = comentario?.trim();
    await apiClient<unknown>(`/constancias/${encodeURIComponent(id)}/aprobar`, {
      method: 'POST',
      body: JSON.stringify(texto ? { comentario: texto } : {}),
    });
  }

  /** Endpoint backend: `POST /constancias/{id}/desaprobar` con `motivo` (obligatorio, máximo 255). Avisa al ciudadano. */
  async desaprobar(id: string, motivo: string): Promise<void> {
    await apiClient<unknown>(`/constancias/${encodeURIComponent(id)}/desaprobar`, {
      method: 'POST',
      body: JSON.stringify({ motivo: motivo.trim() }),
    });
  }
}

export const constanciasController = new ConstanciasController();
