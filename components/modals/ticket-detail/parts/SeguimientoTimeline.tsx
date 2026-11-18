import React from 'react';
import { TicketSeguimiento } from '@/types/ticket.types';
import { fechaLegible } from '@/utils/fecha-peru.utils';

interface SeguimientoTimelineProps {
  seguimientos: TicketSeguimiento[];
}

/** Historial del reclamo: quién hizo qué y cuándo, en el orden en que lo envía el servidor. */
export const SeguimientoTimeline: React.FC<SeguimientoTimelineProps> = ({ seguimientos }) => (
  <section className="expediente-seccion">
    <h3 className="expediente-titulo">
      Historial{seguimientos.length > 0 ? ` (${seguimientos.length})` : ''}
    </h3>
    {seguimientos.length === 0 ? (
      <p className="expediente-ayuda">Todavía no hay movimientos en este reclamo.</p>
    ) : (
      <ol className="expediente-historial">
        {seguimientos.map((seg) => (
          <li key={seg.id}>
            <div className="expediente-historial-cabecera">
              <span>
                <strong>{seg.autorNombre}</strong> <span className="expediente-historial-rol">({seg.autorRol})</span>
              </span>
              <time>{fechaLegible(seg.fecha)}</time>
            </div>
            <p>{seg.comentario}</p>
          </li>
        ))}
      </ol>
    )}
  </section>
);
