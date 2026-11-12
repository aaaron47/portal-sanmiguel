import { TelemetriaResumen, UsoSistema } from '@/types/telemetria.types';

/** El backend envía códigos (`DEUDAS`, `ANDROID`, `MOVIL`...); aquí están los textos que ve el usuario. */
const FUNCIONALIDADES: Record<string, string> = {
  AUTENTICACION: 'Inicio de sesión',
  INICIO: 'Pantalla de inicio',
  DEUDAS: 'Consulta de deuda',
  LIQUIDACION: 'Liquidación',
  PAGOS: 'Pagos',
  RECIBOS: 'Recibos',
  CONSTANCIAS: 'Constancias de no adeudo',
  RECLAMOS: 'Reclamos',
  BANDEJA: 'Bandeja del ciudadano',
  PERFIL: 'Perfil',
  PRIVACIDAD: 'Privacidad',
  ONBOARDING: 'Introducción (onboarding)',
  REPORTES: 'Reportes',
  DASHBOARD: 'Dashboard',
  ADMINISTRACION: 'Administración',
  OTRA: 'Otra',
};

const SISTEMAS: Record<string, string> = {
  ANDROID: 'Android',
  IOS: 'iOS',
  WINDOWS: 'Windows',
  MACOS: 'macOS',
  LINUX: 'Linux',
  OTRO: 'Otro',
};

const CANALES: Record<string, string> = { MOVIL: 'App móvil', WEB: 'Portal web' };

const TIPOS_EVENTO: Record<string, string> = {
  PANTALLA: 'Pantalla vista',
  CONSULTA: 'Consulta',
  ACCION: 'Acción',
  INICIO_SESION: 'Inicio de sesión',
  CIERRE_SESION: 'Cierre de sesión',
};

const RESULTADOS: Record<string, string> = {
  INICIADA: 'Iniciada',
  COMPLETADA: 'Completada',
  FALLIDA: 'Fallida',
};

/** "CAMBIO_CLAVE" → "Cambio clave": para códigos nuevos del backend que todavía no tienen etiqueta. */
function legible(codigo: string): string {
  const texto = codigo.replace(/_/g, ' ').toLowerCase();
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

const etiqueta = (tabla: Record<string, string>) => (codigo?: string | null) =>
  codigo ? tabla[codigo.toUpperCase()] ?? legible(codigo) : '—';

export const etiquetaFuncionalidad = etiqueta(FUNCIONALIDADES);
export const etiquetaCanal = etiqueta(CANALES);
export const etiquetaTipoEvento = etiqueta(TIPOS_EVENTO);
/** Los sistemas llegan como código en los filtros (`ANDROID`) y ya escritos en los eventos ("Android"). */
export const etiquetaSistema = (codigo?: string | null) => (codigo ? SISTEMAS[codigo.toUpperCase()] ?? codigo : '—');
/** Vacío si el evento no es una operación (`NO_APLICA`) o no trae resultado. */
export const etiquetaResultado = (codigo?: string | null) => (codigo ? RESULTADOS[codigo] ?? '' : '');

/**
 * Uso del sistema (Req 4) a partir de la respuesta de `GET /telemetria/resumen`.
 * Devuelve `undefined` si el servidor no envía sesiones ni consultas, para que el dashboard lo avise.
 */
export function usoDelResumen(resumen: TelemetriaResumen): UsoSistema | undefined {
  const { sesiones, consultas } = resumen;
  if (!sesiones || !consultas) return undefined;
  return {
    usuariosUnicos: sesiones.usuariosUnicos,
    sesiones: sesiones.total,
    consultasIniciadas: consultas.iniciadas,
    consultasCompletadas: consultas.completadas,
    consultasFallidas: consultas.fallidas,
    porcentajeCompletadas: consultas.porcentajeCompletadas,
    actividadPorDia: resumen.actividadPorDia ?? [],
    actividadPorHora: resumen.actividadPorHora ?? [],
    funcionalidades: resumen.funcionalidades ?? [],
    filtrosDisponibles: resumen.opcionesFiltro ?? { funcionalidades: [], sistemasOperativos: [], versiones: [] },
    actualizadoEn: resumen.ultimaActualizacion ?? undefined,
  };
}
