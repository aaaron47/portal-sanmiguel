import {
  AccionCodigo,
  CategoriaReclamo,
  DatosAccion,
  ResultadoReclamo,
  Ticket,
  TicketEstado,
  TicketFiltroEstado,
} from '@/types/ticket.types';
import { Usuario } from '@/types/auth.types';

/** Estados en los que el reclamo sigue abierto (aún no se responde al ciudadano). */
export const ESTADOS_ACTIVOS: TicketEstado[] = [
  'registrado',
  'pendiente de validación',
  'pendiente de asignación',
  'en evaluación',
];

/** Todos los estados, en el orden del flujo. */
export const ESTADOS: TicketEstado[] = [...ESTADOS_ACTIVOS, 'respondido', 'cerrado', 'improcedente'];

export const esActivo = (t: Ticket) => ESTADOS_ACTIVOS.includes(t.estado);

/** El backend dice qué puede hacer quien consulta (`accionesPermitidas`) y lo vuelve a comprobar al guardar. */
export const puede = (t: Ticket, accion: AccionCodigo) => Boolean(t.accionesPermitidas?.includes(accion));

/** Acciones que avanzan el reclamo (todas menos la nota interna). */
export const tieneAccionesPendientes = (t: Ticket) => Boolean(t.accionesPermitidas?.some((a) => a !== 'NOTA'));

export const puedeAprobar = (t: Ticket) => puede(t, 'APROBAR_RESPUESTA');
export const puedeReasignar = (t: Ticket) => puede(t, 'REASIGNAR');
export const puedeAsignar = (t: Ticket) => puede(t, 'ASIGNAR');

/** Estado o filtro "por aprobar". */
export const cumpleFiltroEstado = (t: Ticket, filtro: TicketFiltroEstado | 'todos') =>
  filtro === 'todos' || (filtro === 'por aprobar' ? Boolean(t.respuestaPorAprobar) : t.estado === filtro);

/** Texto del estado para mostrar: "en evaluación · por aprobar" si hay una respuesta esperando. */
export const textoEstado = (t: Ticket) => (t.respuestaPorAprobar ? `${t.estado} · por aprobar` : t.estado);

export const ETIQUETAS_CATEGORIA: Record<CategoriaReclamo, string> = {
  INFORMACION_TRIBUTARIA: 'Información tributaria',
  TRAMITES: 'Trámites',
  ATENCION_CIUDADANO: 'Atención al ciudadano',
};

export const ETIQUETAS_RESULTADO: Record<ResultadoReclamo, string> = {
  FUNDADO: 'Fundado',
  FUNDADO_EN_PARTE: 'Fundado en parte',
  INFUNDADO: 'Infundado',
};

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
  alta: number;
  media: number;
  baja: number;
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

/** Carga de reclamos activos por funcionario, ordenados por defecto de mayor a menor número de casos. Incluye "Sin asignar" si hay. */
export function calcularCarga(funcionarios: FuncionarioOpcion[], tickets: Ticket[]): CargaFuncionario[] {
  const activos = tickets.filter(esActivo);
  const contar = (lista: Ticket[]) => ({
    activos: lista.length,
    alta: lista.filter((t) => t.prioridad === 'ALTA').length,
    media: lista.filter((t) => t.prioridad === 'MEDIA').length,
    baja: lista.filter((t) => t.prioridad === 'BAJA').length,
    porAprobar: lista.filter((t) => t.respuestaPorAprobar).length,
  });

  // Los inactivos solo aparecen si todavía tienen reclamos activos (hay que reasignarlos).
  const carga: CargaFuncionario[] = funcionarios
    .map((f) => ({ ...f, ...contar(activos.filter((t) => t.funcionarioAsignadoId === f.id)) }))
    .filter((f) => f.activo || f.activos > 0);

  const sinAsignar = activos.filter((t) => !t.funcionarioAsignadoId);
  if (sinAsignar.length > 0) {
    carga.push({ id: SIN_ASIGNAR_ID, nombre: 'Sin asignar', activo: true, ...contar(sinAsignar) });
  }

  return carga.sort((a, b) => b.activos - a.activos || b.alta - a.alta);
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

/** Aviso tras una acción del flujo, con el estado en que quedó el reclamo. */
export function mensajeExitoAccion(accion: AccionCodigo, t: Ticket, datos: DatosAccion): string {
  switch (accion) {
    case 'RECIBIR':
      return `Reclamo ${t.folio} recibido; queda pendiente de validación`;
    case 'VALIDAR':
      return `Reclamo ${t.folio} validado; queda pendiente de asignación`;
    case 'OBSERVAR':
      return `Se pidió información al ciudadano del reclamo ${t.folio}`;
    case 'ASIGNAR':
      return `Reclamo ${t.folio} asignado a ${t.funcionarioAsignadoNombre || 'el funcionario'} (${t.areaAsignada})`;
    case 'REASIGNAR':
      return `Reclamo ${t.folio} reasignado a ${datos.funcionarioNombre || t.funcionarioAsignadoNombre || 'otro funcionario'}`;
    case 'DEVOLVER_PARA_REASIGNAR':
      return `Reclamo ${t.folio} devuelto al supervisor para reasignar`;
    case 'EVALUAR':
      return `Evaluación registrada en el reclamo ${t.folio}`;
    case 'ELABORAR_RESPUESTA':
      return t.respuestaPorAprobar
        ? `Respuesta del reclamo ${t.folio} enviada al supervisor para su aprobación`
        : `Respuesta enviada al ciudadano; el reclamo ${t.folio} quedó respondido`;
    case 'APROBAR_RESPUESTA':
      return `Respuesta aprobada y enviada al ciudadano (${t.numeroResolucion || t.folio})`;
    case 'OBSERVAR_RESPUESTA':
      return `Respuesta del reclamo ${t.folio} devuelta al funcionario con tus observaciones`;
    case 'CERRAR':
      return `Reclamo ${t.folio} cerrado`;
    case 'DECLARAR_IMPROCEDENTE':
      return `Reclamo ${t.folio} declarado improcedente; se avisó al ciudadano`;
    case 'NOTA':
      return `Nota agregada al reclamo ${t.folio}`;
  }
}
