import React from 'react';
import { Ban, Check } from 'lucide-react';
import { Ticket, TicketEstado } from '@/types/ticket.types';
import { situacionReclamo } from '../acciones.config';

interface Paso {
  nombre: string;
  situacion: 'hecho' | 'actual' | 'pendiente';
  /** Aclaración bajo el paso actual (p. ej. "Por aprobar"). */
  detalle?: string;
  /** Último paso de un reclamo concluido. */
  cierre?: 'respondido' | 'improcedente';
}

/** El camino normal de un reclamo. Termina al enviar la respuesta: no hay un paso aparte de cierre. */
const CAMINO: { estado: TicketEstado; nombre: string }[] = [
  { estado: 'registrado', nombre: 'Registro' },
  { estado: 'pendiente de validación', nombre: 'Validación' },
  { estado: 'pendiente de asignación', nombre: 'Asignación' },
  { estado: 'en evaluación', nombre: 'Evaluación' },
  { estado: 'respondido', nombre: 'Respuesta' },
];

function pasosDe(t: Ticket): Paso[] {
  // No se sabe en qué paso se declaró improcedente: se muestra de dónde partió y cómo terminó.
  if (t.estado === 'improcedente') {
    return [
      { nombre: 'Registro', situacion: 'hecho' },
      { nombre: 'Improcedente', situacion: 'hecho', detalle: 'Concluido', cierre: 'improcedente' },
    ];
  }
  // "cerrado" es el mismo final que "respondido": la respuesta ya se envió.
  const concluido = t.estado === 'respondido' || t.estado === 'cerrado';
  const actual = concluido ? CAMINO.length - 1 : CAMINO.findIndex((p) => p.estado === t.estado);
  return CAMINO.map((p, i): Paso => {
    if (concluido) return { nombre: p.nombre, situacion: 'hecho', ...(i === actual ? { detalle: 'Enviada · concluido', cierre: 'respondido' } : {}) };
    if (i < actual) return { nombre: p.nombre, situacion: 'hecho' };
    if (i > actual) return { nombre: p.nombre, situacion: 'pendiente' };
    const detalle = t.observacion ? 'Esperando al ciudadano' : t.respuestaPorAprobar ? 'Respuesta por aprobar' : 'En curso';
    return { nombre: p.nombre, situacion: 'actual', detalle };
  });
}

const TEXTO_SITUACION = { hecho: 'completado', actual: 'paso actual', pendiente: 'pendiente' };

/**
 * Estado del reclamo siempre a la vista: en qué paso del flujo está y a quién le toca el siguiente.
 * Los pasos no dependen solo del color: llevan número o ícono y un texto para lectores de pantalla.
 */
export const FlujoPasos: React.FC<{ ticket: Ticket }> = ({ ticket }) => {
  const pasos = pasosDe(ticket);
  return (
    <div className="expediente-estado">
      <ol className="flujo-pasos" aria-label="Avance del reclamo">
        {pasos.map((p, i) => (
          <li
            key={p.nombre}
            className={`flujo-paso flujo-paso-${p.situacion}${p.cierre ? ` flujo-paso-${p.cierre}` : ''}`}
            aria-current={p.situacion === 'actual' ? 'step' : undefined}
          >
            <span className="flujo-paso-marca" aria-hidden="true">
              {p.cierre === 'improcedente' ? <Ban size={13} /> : p.situacion === 'hecho' ? <Check size={13} strokeWidth={3} /> : i + 1}
            </span>
            <span className="flujo-paso-texto">
              <span className="flujo-paso-nombre">{p.nombre}</span>
              {p.detalle && <span className="flujo-paso-detalle">{p.detalle}</span>}
              <span className="solo-lectores"> ({TEXTO_SITUACION[p.situacion]})</span>
            </span>
          </li>
        ))}
      </ol>
      <p className="expediente-situacion" role="status">
        {situacionReclamo(ticket)}
      </p>
    </div>
  );
};
