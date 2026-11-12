/** Fechas y horas en hora de Perú (America/Lima), sin depender de la zona horaria del navegador. */
export const ZONA_PERU = 'America/Lima';

/** Fecha de hoy en Perú, `YYYY-MM-DD`. */
export function hoyEnPeru(): string {
  // en-CA da el formato AAAA-MM-DD.
  return new Intl.DateTimeFormat('en-CA', { timeZone: ZONA_PERU }).format(new Date());
}

/** Suma (o resta) días a una fecha `YYYY-MM-DD`. */
export function sumarDias(fecha: string, dias: number): string {
  const d = new Date(`${fecha}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + dias);
  return d.toISOString().slice(0, 10);
}

/** Instante actual como `AAAA-MM-DD HH:mm:ss` en hora de Perú (el formato de fechas del backend). */
export function fechaHoraPeruIso(instante: Date = new Date()): string {
  // sv-SE da el formato AAAA-MM-DD HH:mm:ss.
  return new Intl.DateTimeFormat('sv-SE', {
    timeZone: ZONA_PERU,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(instante);
}

/**
 * "11/11/2026, 10:45" en hora de Perú. Acepta un instante ISO con zona ("…Z") o la fecha del backend
 * `AAAA-MM-DD HH:mm:ss`, que ya está en hora de Perú y no se convierte.
 */
export function fechaHoraPeru(fecha: string): string {
  const local = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::\d{2}(?:\.\d+)?)?$/.exec(fecha);
  if (local) return `${local[3]}/${local[2]}/${local[1]}, ${local[4]}:${local[5]}`;
  const d = new Date(fecha);
  if (Number.isNaN(d.getTime())) return fecha;
  return new Intl.DateTimeFormat('es-PE', {
    timeZone: ZONA_PERU,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(d);
}

/** "30/10/2026": día en Perú de un instante ISO ("2026-10-31T00:41:27Z") o de una fecha `AAAA-MM-DD` (sin convertir). */
export function fechaPeru(fecha: string): string {
  const soloFecha = /^(\d{4})-(\d{2})-(\d{2})$/.exec(fecha);
  if (soloFecha) return `${soloFecha[3]}/${soloFecha[2]}/${soloFecha[1]}`;
  return fechaHoraPeru(fecha).split(',')[0];
}

/** "lun 10/11" para una fecha `YYYY-MM-DD` (es un día calendario, no un instante). */
export function diaCorto(fecha: string): string {
  const d = new Date(`${fecha}T12:00:00Z`);
  const dia = new Intl.DateTimeFormat('es-PE', { weekday: 'short', timeZone: 'UTC' }).format(d).replace('.', '');
  return `${dia} ${fecha.slice(8, 10)}/${fecha.slice(5, 7)}`;
}
