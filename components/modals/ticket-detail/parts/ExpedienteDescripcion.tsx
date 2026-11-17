import React from 'react';
import { Ticket } from '@/types/ticket.types';

interface ExpedienteDescripcionProps {
  ticket: Ticket;
}

/** Lo que escribió el ciudadano: su descripción y, si lo indicó aparte, lo que pide. */
export const ExpedienteDescripcion: React.FC<ExpedienteDescripcionProps> = ({ ticket }) => (
  <>
    <section className="expediente-seccion">
      <h3 className="expediente-titulo">Descripción del vecino</h3>
      <div className="expediente-caja expediente-caja-texto">{ticket.descripcion}</div>
    </section>

    {ticket.pedido && ticket.pedido !== ticket.asunto && (
      <section className="expediente-seccion">
        <h3 className="expediente-titulo">Pedido del ciudadano</h3>
        <div className="expediente-caja expediente-caja-texto">{ticket.pedido}</div>
      </section>
    )}
  </>
);
