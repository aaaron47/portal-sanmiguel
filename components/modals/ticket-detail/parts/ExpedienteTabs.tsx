import React from 'react';
import { FileText, Route } from 'lucide-react';

export type PestanaExpediente = 'datos' | 'flujo';

const PESTANAS: { id: PestanaExpediente; label: string; icon: typeof FileText }[] = [
  { id: 'datos', label: 'Datos generales', icon: FileText },
  { id: 'flujo', label: 'Flujo del reclamo', icon: Route },
];

interface ExpedienteTabsProps {
  activa: PestanaExpediente;
  onCambiar: (pestana: PestanaExpediente) => void;
  /** Hay un formulario abierto en "Flujo del reclamo": se avisa en la pestaña para no perderlo de vista. */
  enEdicion: boolean;
}

/** Pestañas del expediente. Con el teclado: flechas izquierda y derecha, Inicio y Fin. */
export const ExpedienteTabs: React.FC<ExpedienteTabsProps> = ({ activa, onCambiar, enEdicion }) => {
  const alTeclear = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const i = PESTANAS.findIndex((p) => p.id === activa);
    const destino =
      e.key === 'ArrowRight' ? (i + 1) % PESTANAS.length
      : e.key === 'ArrowLeft' ? (i - 1 + PESTANAS.length) % PESTANAS.length
      : e.key === 'Home' ? 0
      : e.key === 'End' ? PESTANAS.length - 1
      : -1;
    if (destino < 0) return;
    e.preventDefault();
    onCambiar(PESTANAS[destino].id);
    e.currentTarget.querySelector<HTMLElement>(`#pestana-${PESTANAS[destino].id}`)?.focus();
  };

  return (
    <div className="expediente-tabs" role="tablist" aria-label="Secciones del expediente" onKeyDown={alTeclear}>
      {PESTANAS.map(({ id, label, icon: Icono }) => (
        <button
          key={id}
          id={`pestana-${id}`}
          type="button"
          role="tab"
          aria-selected={activa === id}
          aria-controls={`panel-${id}`}
          tabIndex={activa === id ? 0 : -1}
          className="expediente-tab"
          onClick={() => onCambiar(id)}
        >
          <Icono size={15} aria-hidden="true" /> {label}
          {id === 'flujo' && enEdicion && <span className="expediente-tab-marca">En edición</span>}
        </button>
      ))}
    </div>
  );
};
