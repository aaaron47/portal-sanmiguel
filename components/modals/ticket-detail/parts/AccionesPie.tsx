import React, { useEffect, useRef, useState } from 'react';
import { AlertCircle, AlertTriangle, ChevronUp, Info } from 'lucide-react';
import { UserRole } from '@/types/auth.types';
import { AccionCodigo, Ticket } from '@/types/ticket.types';
import { MODO_DEMO } from '@/services/api-client.service';
import { ACCIONES, consecuenciaAccion, esRolDeAtencion, repartirAcciones } from '../acciones.config';
import { AccionReclamo } from '../useAccionReclamo';

/** Lo que se está por perder: lo escrito en la acción (al cancelarla) o el expediente entero (al cerrarlo). */
export type Descarte = null | 'accion' | 'expediente';

interface AccionesPieProps {
  ticket: Ticket;
  rolUsuario: UserRole;
  estado: AccionReclamo;
  /** Id del formulario de la acción: el botón de confirmar lo envía aunque esté fuera de él. */
  formId: string;
  descarte: Descarte;
  onAbrir: (accion: AccionCodigo) => void;
  onCancelar: () => void;
  onCerrar: () => void;
  onSeguirEditando: () => void;
  onDescartar: () => void;
  /** Antes de enviar: el expediente muestra el formulario para que se vean los campos que falten. */
  onAntesDeConfirmar: () => void;
}

const claseBoton = (accion: AccionCodigo, principal: boolean) => {
  const { tono } = ACCIONES[accion];
  if (principal) return `btn ${tono === 'success' ? 'btn-success' : tono === 'danger' ? 'btn-danger' : 'btn-primary'}`;
  return `btn btn-secondary${tono === 'danger' ? ' expediente-btn-peligro' : ''}`;
};

const BotonAccion: React.FC<{ accion: AccionCodigo; principal?: boolean; onAbrir: (a: AccionCodigo) => void }> = ({
  accion,
  principal = false,
  onAbrir,
}) => {
  const Icono = ACCIONES[accion].icon;
  return (
    <button type="button" className={claseBoton(accion, principal)} onClick={() => onAbrir(accion)} data-accion={accion}>
      <Icono size={15} aria-hidden="true" /> {ACCIONES[accion].label}
    </button>
  );
};

/** Menú de las acciones complementarias cuando son más de dos. Se abre hacia arriba, sobre el pie. */
const MenuMasAcciones: React.FC<{ acciones: AccionCodigo[]; onAbrir: (a: AccionCodigo) => void }> = ({ acciones, onAbrir }) => {
  const [abierto, setAbierto] = useState(false);
  const contenedor = useRef<HTMLDivElement>(null);
  const boton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!abierto) return;
    contenedor.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus();
    const alHacerClicFuera = (e: MouseEvent) => {
      if (!contenedor.current?.contains(e.target as Node)) setAbierto(false);
    };
    document.addEventListener('mousedown', alHacerClicFuera);
    return () => document.removeEventListener('mousedown', alHacerClicFuera);
  }, [abierto]);

  const alTeclear = (e: React.KeyboardEvent) => {
    if (!abierto) return;
    if (e.key === 'Escape') {
      // Esc cierra solo el menú, no el expediente.
      e.stopPropagation();
      setAbierto(false);
      boton.current?.focus();
      return;
    }
    if (e.key === 'Tab') {
      setAbierto(false);
      return;
    }
    const items = [...(contenedor.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? [])];
    const actual = items.indexOf(document.activeElement as HTMLElement);
    const destino =
      e.key === 'ArrowDown' ? (actual + 1) % items.length
      : e.key === 'ArrowUp' ? (actual - 1 + items.length) % items.length
      : e.key === 'Home' ? 0
      : e.key === 'End' ? items.length - 1
      : -1;
    if (destino >= 0) {
      e.preventDefault();
      items[destino]?.focus();
    }
  };

  // Las que no se pueden deshacer van al final, separadas del resto.
  const normales = acciones.filter((a) => ACCIONES[a].tono !== 'danger');
  const delicadas = acciones.filter((a) => ACCIONES[a].tono === 'danger');
  const item = (a: AccionCodigo) => {
    const Icono = ACCIONES[a].icon;
    return (
      <button
        key={a}
        type="button"
        role="menuitem"
        className={`expediente-menu-item${ACCIONES[a].tono === 'danger' ? ' expediente-menu-item-peligro' : ''}`}
        data-accion={a}
        onClick={() => {
          setAbierto(false);
          onAbrir(a);
        }}
      >
        <Icono size={15} aria-hidden="true" /> {ACCIONES[a].label}
      </button>
    );
  };

  return (
    <div className="expediente-menu" ref={contenedor} onKeyDown={alTeclear}>
      <button
        ref={boton}
        type="button"
        className="btn btn-secondary"
        aria-haspopup="menu"
        aria-expanded={abierto}
        onClick={() => setAbierto((v) => !v)}
      >
        Más acciones <ChevronUp size={15} aria-hidden="true" style={{ transform: abierto ? 'rotate(180deg)' : undefined }} />
      </button>
      {abierto && (
        <div className="expediente-menu-lista" role="menu" aria-label="Más acciones">
          {normales.map(item)}
          {normales.length > 0 && delicadas.length > 0 && <div className="expediente-menu-separador" role="separator" />}
          {delicadas.map(item)}
        </div>
      )}
    </div>
  );
};

/**
 * Pie del expediente, siempre a la vista. Sigue el modelo Z: lo complementario abajo a la izquierda y la
 * acción que hace avanzar el reclamo abajo a la derecha, donde termina la lectura.
 */
export const AccionesPie: React.FC<AccionesPieProps> = ({
  ticket,
  rolUsuario,
  estado,
  formId,
  descarte,
  onAbrir,
  onCancelar,
  onCerrar,
  onSeguirEditando,
  onDescartar,
  onAntesDeConfirmar,
}) => {
  const { accion } = estado;
  // Cada modo del pie lleva su `key`: así React crea botones nuevos en vez de reutilizar uno para otra cosa.

  // 1. Pregunta antes de perder lo escrito.
  if (descarte && accion !== 'ninguna') {
    return (
      <div key="descarte" className="modal-footer expediente-pie" role="group" aria-labelledby="pregunta-descarte">
        <p id="pregunta-descarte" className="expediente-pie-nota expediente-pie-nota-firme" role="alert">
          <AlertTriangle size={16} aria-hidden="true" />
          <span>
            <strong>¿Descartar lo que escribiste?</strong> Lo de «{ACCIONES[accion].titulo}» no se guardará.
          </span>
        </p>
        <div className="expediente-pie-grupo">
          <button type="button" className="btn btn-secondary" onClick={onSeguirEditando} autoFocus>
            Seguir editando
          </button>
          <button type="button" className="btn btn-danger" onClick={onDescartar}>
            {descarte === 'expediente' ? 'Descartar y cerrar' : 'Descartar'}
          </button>
        </div>
      </div>
    );
  }

  // 2. Hay una acción abierta: qué pasará al confirmar (o por qué falló) y, al final, el botón de confirmar.
  if (accion !== 'ninguna') {
    const def = ACCIONES[accion];
    const Icono = def.icon;
    const consecuencia = consecuenciaAccion(accion, ticket);
    return (
      <div key="accion" className="modal-footer expediente-pie">
        {estado.error ? (
          <p className="expediente-pie-nota expediente-error" role="alert">
            <AlertCircle size={16} aria-hidden="true" />
            <span>{estado.error}</span>
          </p>
        ) : (
          <p className={`expediente-pie-nota${consecuencia.irreversible ? ' expediente-pie-nota-firme' : ''}`}>
            {consecuencia.irreversible ? <AlertTriangle size={16} aria-hidden="true" /> : <Info size={16} aria-hidden="true" />}
            <span>
              <strong>Al confirmar:</strong> {consecuencia.texto}
              {consecuencia.irreversible ? ' No se puede deshacer.' : ''}
            </span>
          </p>
        )}
        <div className="expediente-pie-grupo">
          <button type="button" className="btn btn-secondary" onClick={onCancelar} disabled={estado.enviando}>
            Cancelar
          </button>
          <button
            type="submit"
            form={formId}
            className={claseBoton(accion, true)}
            disabled={estado.bloqueado}
            aria-busy={estado.enviando}
            onClick={(e) => {
              // El botón de confirmar aparece donde estaba el que abrió la acción: el segundo clic de un
              // doble clic no debe confirmar nada (p. ej. aprobar y enviar una respuesta sin querer).
              if (e.detail > 1) e.preventDefault();
              else onAntesDeConfirmar();
            }}
          >
            <Icono size={15} aria-hidden="true" />
            {estado.enviando ? (accion === 'ADJUNTAR_EVIDENCIA' ? 'Subiendo…' : 'Guardando…') : def.confirmar}
          </button>
        </div>
      </div>
    );
  }

  // 3. Sin acción abierta: las acciones que permite el backend, repartidas por importancia.
  const { principal, alternas, complementarias } = repartirAcciones(ticket);
  const hayPasos = Boolean(principal) || alternas.length > 0;
  const nota = !esRolDeAtencion(rolUsuario)
    ? 'Solo lectura: tu perfil no atiende reclamos.'
    : MODO_DEMO && !ticket.accionesPermitidas
      ? 'Modo demo: las acciones necesitan el servidor.'
      : null;

  return (
    <div key="acciones" className="modal-footer expediente-pie">
      <div className="expediente-pie-grupo">
        {complementarias.length > 2 ? (
          <MenuMasAcciones acciones={complementarias} onAbrir={onAbrir} />
        ) : (
          complementarias.map((a) => <BotonAccion key={a} accion={a} onAbrir={onAbrir} />)
        )}
        {complementarias.length === 0 && nota && (
          <p className="expediente-pie-nota">
            <Info size={16} aria-hidden="true" />
            <span>{nota}</span>
          </p>
        )}
      </div>
      <div className="expediente-pie-grupo expediente-pie-final">
        {alternas.map((a) => <BotonAccion key={a} accion={a} onAbrir={onAbrir} />)}
        {principal && <BotonAccion accion={principal} principal onAbrir={onAbrir} />}
        {!hayPasos && (
          <button type="button" className="btn btn-secondary" onClick={onCerrar}>
            Cerrar ventana
          </button>
        )}
      </div>
    </div>
  );
};
