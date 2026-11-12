import { SolicitudConstancia } from '@/types/constancia.types';

/** "S/ 463.86" a partir del importe en texto que manda el backend. */
export function importe(monto: string | number | null | undefined, moneda = 'PEN'): string {
  const n = Number(monto);
  if (monto === null || monto === undefined || Number.isNaN(n)) return '—';
  try {
    return new Intl.NumberFormat('es-PE', { style: 'currency', currency: moneda || 'PEN' }).format(n);
  } catch {
    return `${moneda} ${n.toFixed(2)}`;
  }
}

export const tieneDeuda = (s: SolicitudConstancia): boolean => Number(s.deuda?.montoPendiente ?? 0) > 0;

export const puedeConstancia = (s: SolicitudConstancia, accion: 'APROBAR' | 'DESAPROBAR'): boolean =>
  (s.accionesPermitidas as string[]).includes(accion);

/**
 * Por qué no se puede aprobar una solicitud en verificación (el backend no manda APROBAR), para explicarlo en pantalla.
 * Devuelve null si se puede aprobar o si la solicitud no está en verificación.
 */
export function motivoNoAprobable(s: SolicitudConstancia): string | null {
  if (s.estado !== 'EN_VERIFICACION' || puedeConstancia(s, 'APROBAR')) return null;
  const razones: string[] = [];
  if (!s.pago) razones.push('la tasa del trámite todavía no está pagada');
  if (tieneDeuda(s)) {
    const cuotas = s.deuda?.cuotasPendientes ?? 0;
    razones.push(`el contribuyente registra una deuda de ${importe(s.deuda?.montoPendiente, s.moneda)}${cuotas ? ` (${cuotas} cuota${cuotas === 1 ? '' : 's'})` : ''}`);
  }
  const porque = razones.length ? razones.join(' y ') : 'el servidor no lo permite en este momento';
  return `No se puede aprobar: ${porque}.${puedeConstancia(s, 'DESAPROBAR') ? ' Puedes desaprobarla indicando el motivo.' : ''}`;
}
