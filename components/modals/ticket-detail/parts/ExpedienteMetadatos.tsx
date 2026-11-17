import React from 'react';
import { ClipboardCheck, FileText, User } from 'lucide-react';
import { Ticket } from '@/types/ticket.types';
import { fechaLegible } from '@/utils/fecha-peru.utils';
import { ETIQUETAS_CATEGORIA, ETIQUETAS_RESULTADO } from '@/utils/ticket.utils';

interface ExpedienteMetadatosProps {
  ticket: Ticket;
}

/** Un dato con su nombre. Sin valor no se muestra, salvo que se indique qué decir cuando falta. */
const Dato: React.FC<{ nombre: string; valor?: string | null; siFalta?: string }> = ({ nombre, valor, siFalta }) =>
  valor || siFalta ? (
    <div className="expediente-dato">
      <dt>{nombre}</dt>
      <dd className={valor ? undefined : 'expediente-dato-vacio'}>{valor || siFalta}</dd>
    </div>
  ) : null;

/** Datos generales en tres grupos: quién reclama, qué reclamo es y quién lo atiende. */
export const ExpedienteMetadatos: React.FC<ExpedienteMetadatosProps> = ({ ticket }) => {
  const categoria = ticket.categoria
    ? ETIQUETAS_CATEGORIA[ticket.categoria as keyof typeof ETIQUETAS_CATEGORIA] ?? ticket.categoria
    : undefined;
  const resultado = ticket.resultado ? ETIQUETAS_RESULTADO[ticket.resultado] ?? ticket.resultado : undefined;

  return (
    <div className="expediente-grupos">
      <section className="expediente-grupo" aria-labelledby="grupo-ciudadano">
        <h3 id="grupo-ciudadano"><User size={14} aria-hidden="true" /> Ciudadano</h3>
        <dl>
          <Dato nombre="Nombre" valor={ticket.ciudadanoNombre} />
          <Dato nombre="DNI" valor={ticket.ciudadanoDni} siFalta="No registrado" />
          <Dato nombre="Correo" valor={ticket.ciudadanoEmail} />
          <Dato nombre="Teléfono" valor={ticket.ciudadanoTelefono} />
        </dl>
      </section>

      <section className="expediente-grupo" aria-labelledby="grupo-reclamo">
        <h3 id="grupo-reclamo"><FileText size={14} aria-hidden="true" /> Reclamo</h3>
        <dl>
          <Dato nombre="Ingreso" valor={fechaLegible(ticket.fechaCreacion)} />
          <Dato nombre="Canal del inconveniente" valor={ticket.canalIncidente} siFalta="No indicado" />
          <Dato nombre="Tipo de reclamo" valor={ticket.tipoReclamo} />
          <Dato nombre="Categoría" valor={categoria} />
        </dl>
      </section>

      <section className="expediente-grupo" aria-labelledby="grupo-atencion">
        <h3 id="grupo-atencion"><ClipboardCheck size={14} aria-hidden="true" /> Atención</h3>
        <dl>
          <Dato nombre="Área responsable" valor={ticket.areaAsignada} siFalta="Sin área asignada" />
          <Dato nombre="Funcionario" valor={ticket.funcionarioAsignadoNombre} siFalta="Sin asignar" />
          <Dato nombre="Fecha límite" valor={ticket.fechaLimite ? fechaLegible(ticket.fechaLimite) : undefined} />
          <Dato nombre="Resultado" valor={resultado} />
          <Dato nombre="N.º de resolución" valor={ticket.numeroResolucion} />
        </dl>
      </section>
    </div>
  );
};
