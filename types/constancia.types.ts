/**
 * Solicitudes de constancia de no adeudo (Req 2). Contrato del backend: `docs/Constancias_contrato.md` de su repositorio
 * (`GET /constancias`, `GET /constancias/{id}`, `POST /constancias/{id}/aprobar` y `/desaprobar`).
 * Las fechas `…En` son instantes ISO en UTC; `vigenteHasta` es un día (`AAAA-MM-DD`). Los importes llegan como texto.
 */

/** Estados conocidos; el texto que se muestra es `estadoEtiqueta`, así que un estado nuevo también se ve bien. */
export type EstadoSolicitudConstancia = 'EN_VERIFICACION' | 'PENDIENTE_PAGO' | 'EMITIDA' | 'RECHAZADA';

export type AccionConstancia = 'APROBAR' | 'DESAPROBAR';

export interface CuotaPendiente {
  [campo: string]: string | number | null | undefined;
}

export interface SolicitudConstancia {
  id: string;
  numero: string;
  estado: EstadoSolicitudConstancia | string;
  estadoEtiqueta: string;
  solicitadoEn: string;
  contribuyente: {
    id: string;
    codigo: string;
    nombre: string;
    tipoDocumento: string;
    /** Enmascarado por el backend (`00***003`). */
    documento: string;
    correo?: string | null;
  };
  predio: { id: string; codigo: string; direccion: string; distrito?: string | null };
  tramite: string;
  tasa: string;
  moneda: string;
  /** `null` si la tasa todavía no se pagó. */
  pago: { numeroOperacion: string; pagadoEn: string; importe: string } | null;
  deuda: { montoPendiente: string; cuotasPendientes: number; cuotasVencidas: number; detalle: CuotaPendiente[] } | null;
  motivoRechazo: string | null;
  atendidoPor: string | null;
  atendidoEn: string | null;
  /** La constancia emitida, si se aprobó. */
  constancia: {
    id: string;
    codigoVerificacion: string;
    emitidoEn: string;
    vigenteHasta: string;
    estado: string;
    canalEnvio?: string | null;
    enviadoEn?: string | null;
    urlVerificacion?: string | null;
  } | null;
  accionesPermitidas: AccionConstancia[] | string[];
}

export interface ListadoSolicitudesConstancia {
  items: SolicitudConstancia[];
  totalRegistros: number;
  paginaActual: number;
  totalPaginas: number;
}

export interface FiltrosSolicitudes {
  estado?: EstadoSolicitudConstancia;
  busqueda?: string;
  pagina?: number;
  tamano?: number;
}
