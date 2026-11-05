import { Ticket, TicketEstado } from '@/types/ticket.types';
import { Usuario } from '@/types/auth.types';

/** Estados en los que el reclamo sigue abierto (no resuelto ni archivado). */
export const ESTADOS_ACTIVOS: TicketEstado[] = [
  'pendiente de validación',
  'en evaluación',
  'derivado',
  'por aprobar',
];

/** Estados en los que el funcionario puede trabajar el reclamo. */
const ESTADOS_EN_ATENCION: TicketEstado[] = ['pendiente de validación', 'en evaluación', 'derivado'];

export const esActivo = (t: Ticket) => ESTADOS_ACTIVOS.includes(t.estado);

// Reglas del Funcionario
export const puedeAtender = (t: Ticket) => ESTADOS_EN_ATENCION.includes(t.estado);
export const puedeDerivar = (t: Ticket) => ESTADOS_EN_ATENCION.includes(t.estado);
export const puedeEvaluarConstancia = (t: Ticket) => t.tieneConstancia && ESTADOS_EN_ATENCION.includes(t.estado);

// Reglas del Supervisor
export const puedeAprobar = (t: Ticket) => t.estado === 'por aprobar';
export const puedeDevolver = (t: Ticket) => t.estado === 'por aprobar';
export const puedeReasignar = (t: Ticket) => esActivo(t);

export const funcionarioTieneAcciones = (t: Ticket) =>
  puedeAtender(t) || puedeDerivar(t) || puedeEvaluarConstancia(t);

/** Funcionario al que se le puede asignar un reclamo. */
export interface FuncionarioOpcion {
  id: string;
  nombre: string;
  area?: string;
  /** false si el usuario está desactivado: no se le puede reasignar nada. */
  activo: boolean;
}

export interface CargaFuncionario extends FuncionarioOpcion {
  activos: number;
  criticos: number; // prioridad ALTA
  porAprobar: number;
}

export const SIN_ASIGNAR_ID = '__sin_asignar__';

/**
 * Funcionarios a partir de los usuarios con rol FUNCIONARIO (activos e inactivos, marcados con `activo`)
 * y de los que aparecen asignados en algún reclamo pero no están en la lista de usuarios
 * (p. ej. si la lista no se pudo cargar). Un usuario conocido nunca se vuelve a agregar desde los reclamos.
 */
export function construirFuncionarios(usuarios: Usuario[], tickets: Ticket[]): FuncionarioOpcion[] {
  const mapa = new Map<string, FuncionarioOpcion>();
  const conocidos = new Set(usuarios.map((u) => u.id));
  usuarios
    .filter((u) => u.rol === 'FUNCIONARIO')
    .forEach((u) => mapa.set(u.id, { id: u.id, nombre: u.nombreCompleto, area: u.area, activo: u.activo }));
  tickets.forEach((t) => {
    if (t.funcionarioAsignadoId && !conocidos.has(t.funcionarioAsignadoId) && !mapa.has(t.funcionarioAsignadoId)) {
      mapa.set(t.funcionarioAsignadoId, {
        id: t.funcionarioAsignadoId,
        nombre: t.funcionarioAsignadoNombre || t.funcionarioAsignadoId,
        area: t.areaAsignada,
        activo: true,
      });
    }
  });
  return [...mapa.values()].sort((a, b) => a.nombre.localeCompare(b.nombre));
}

/** Carga de reclamos activos por funcionario, de mayor a menor. Incluye "Sin asignar" si hay. */
export function calcularCarga(funcionarios: FuncionarioOpcion[], tickets: Ticket[]): CargaFuncionario[] {
  const activos = tickets.filter(esActivo);
  const contar = (lista: Ticket[]) => ({
    activos: lista.length,
    criticos: lista.filter((t) => t.prioridad === 'ALTA').length,
    porAprobar: lista.filter((t) => t.estado === 'por aprobar').length,
  });

  // Los inactivos solo aparecen si todavía tienen reclamos activos (hay que reasignarlos).
  const carga: CargaFuncionario[] = funcionarios
    .map((f) => ({ ...f, ...contar(activos.filter((t) => t.funcionarioAsignadoId === f.id)) }))
    .filter((f) => f.activo || f.activos > 0);

  const sinAsignar = activos.filter((t) => !t.funcionarioAsignadoId);
  if (sinAsignar.length > 0) {
    carga.push({ id: SIN_ASIGNAR_ID, nombre: 'Sin asignar', activo: true, ...contar(sinAsignar) });
  }

  return carga.sort((a, b) => b.activos - a.activos || b.criticos - a.criticos);
}

/** Áreas presentes en los reclamos y en los funcionarios, sin repetir y ordenadas. */
export function listarAreas(tickets: Ticket[], funcionarios: FuncionarioOpcion[]): string[] {
  const areas = new Set<string>();
  tickets.forEach((t) => t.areaAsignada && areas.add(t.areaAsignada));
  funcionarios.forEach((f) => f.area && areas.add(f.area));
  return [...areas].sort((a, b) => a.localeCompare(b));
}

/** Textos de error propios de los reclamos para `mensajeErrorApi`. */
export const MENSAJES_ERROR_RECLAMO: Partial<Record<number, string>> = {
  404: 'No encontramos este reclamo. Recarga la página para ver la lista actualizada.',
  409: 'Otra persona cambió este reclamo mientras lo tenías abierto. Cierra el detalle y vuelve a abrirlo para ver los cambios.',
};
