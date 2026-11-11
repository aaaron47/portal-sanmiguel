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

/** "11/11/2026, 10:45" en hora de Perú, a partir de un instante ISO. */
export function fechaHoraPeru(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
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

/** "lun 10/11" para una fecha `YYYY-MM-DD` (es un día calendario, no un instante). */
export function diaCorto(fecha: string): string {
  const d = new Date(`${fecha}T12:00:00Z`);
  const dia = new Intl.DateTimeFormat('es-PE', { weekday: 'short', timeZone: 'UTC' }).format(d).replace('.', '');
  return `${dia} ${fecha.slice(8, 10)}/${fecha.slice(5, 7)}`;
}
