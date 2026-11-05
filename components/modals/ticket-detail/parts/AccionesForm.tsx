import React, { useState } from 'react';
import { Send, CornerDownRight, CheckCircle, RotateCcw, FileCheck2, Undo2 } from 'lucide-react';
import { UserRole } from '@/types/auth.types';
import { useAreas } from '@/components/shared/hooks/useAreas';
import { AccionTicket, EstadoAtencion, Ticket } from '@/types/ticket.types';
import {
  FuncionarioOpcion,
  esActivo,
  puedeAprobar,
  puedeAtender,
  puedeDerivar,
  puedeDevolver,
  puedeEvaluarConstancia,
  puedeReasignar,
} from '@/utils/ticket.utils';

interface AccionesFormProps {
  ticket: Ticket;
  rolUsuario: UserRole;
  initialAction?: AccionTicket;
  funcionarios?: FuncionarioOpcion[];
  onAtender: (id: string, comentario: string, nuevoEstado: EstadoAtencion) => Promise<void>;
  onDerivar: (id: string, areaDestino: string, motivo: string) => Promise<void>;
  onAprobar: (id: string, comentario: string) => Promise<void>;
  onDevolver?: (id: string, motivo: string) => Promise<void>;
  onReasignar: (id: string, nuevoFuncionarioId: string, nuevoNombre: string, motivo: string) => Promise<void>;
  onEvaluarConstancia: (id: string, estado: 'aprobada' | 'observada', observaciones: string) => Promise<void>;
}

/** Indica si la acción está permitida para el rol y el estado actual del reclamo. */
function accionPermitida(accion: AccionTicket, rol: UserRole, ticket: Ticket, hayDevolver: boolean): boolean {
  if (rol === 'FUNCIONARIO') {
    if (accion === 'atender') return puedeAtender(ticket);
    if (accion === 'derivar') return puedeDerivar(ticket);
    if (accion === 'constancia') return puedeEvaluarConstancia(ticket);
  }
  if (rol === 'SUPERVISOR') {
    if (accion === 'aprobar') return puedeAprobar(ticket);
    if (accion === 'devolver') return hayDevolver && puedeDevolver(ticket);
    if (accion === 'reasignar') return puedeReasignar(ticket);
  }
  return false;
}

const TITULOS: Record<Exclude<AccionTicket, 'ninguna'>, string> = {
  atender: 'Atender reclamo',
  derivar: 'Derivar a otra área municipal',
  constancia: 'Evaluar constancia',
  aprobar: 'Aprobar resolución definitiva',
  devolver: 'Devolver al funcionario para corregir',
  reasignar: 'Reasignar a otro funcionario',
};

/** Primera área distinta de la actual del reclamo (no se deriva al área donde ya está); vacío si aún no cargan. */
const areaDestinoInicial = (t: Ticket, nombres: string[]) => nombres.find((a) => a !== t.areaAsignada) ?? '';

const estiloCampo: React.CSSProperties = {
  width: '100%',
  padding: '0.5rem',
  borderRadius: '6px',
  border: '1px solid var(--border-color)',
  background: 'var(--bg-card)',
  color: 'var(--text-main)',
};

const estiloEtiqueta: React.CSSProperties = {
  display: 'block',
  fontSize: '0.8rem',
  fontWeight: 600,
  color: 'var(--text-main)',
  marginBottom: '0.25rem',
};

const estiloOpcion: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.35rem',
  fontSize: '0.85rem',
  cursor: 'pointer',
  color: 'var(--text-main)',
};

export const AccionesForm: React.FC<AccionesFormProps> = ({
  ticket,
  rolUsuario,
  initialAction = 'ninguna',
  funcionarios = [],
  onAtender,
  onDerivar,
  onAprobar,
  onDevolver,
  onReasignar,
  onEvaluarConstancia,
}) => {
  const permitida = (accion: AccionTicket) => accionPermitida(accion, rolUsuario, ticket, Boolean(onDevolver));

  // El modal monta este formulario con una `key` por reclamo y acción inicial,
  // así que basta con inicializar el estado (sin efectos).
  const [activeAction, setActiveAction] = useState<AccionTicket>(
    initialAction !== 'ninguna' && permitida(initialAction) ? initialAction : 'ninguna'
  );
  const [textoComentario, setTextoComentario] = useState('');
  // Áreas reales de la BD (GET /areas), no una lista fija.
  const { areas } = useAreas();
  const nombresAreas = areas.map((a) => a.nombre);
  const [areaDestino, setAreaDestino] = useState('');
  const [nuevoFuncionarioId, setNuevoFuncionarioId] = useState('');
  const [estadoAtencion, setEstadoAtencion] = useState<EstadoAtencion>('en evaluación');
  const [estadoConstanciaDecision, setEstadoConstanciaDecision] = useState<'aprobada' | 'observada'>('aprobada');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Solo funcionarios activos y distintos del que ya lo tiene.
  const funcionariosDisponibles = funcionarios.filter((f) => f.activo && f.id !== ticket.funcionarioAsignadoId);

  const cerrarAccion = () => {
    setActiveAction('ninguna');
    setTextoComentario('');
    setNuevoFuncionarioId('');
  };

  // Al abrir una acción, sus campos parten del reclamo tal como está ahora (pudo cambiar tras otra acción).
  const abrirAccion = (accion: AccionTicket) => {
    setAreaDestino(areaDestinoInicial(ticket, nombresAreas));
    setEstadoAtencion('en evaluación');
    setActiveAction(accion);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!textoComentario.trim() && activeAction !== 'constancia') return;

    setIsSubmitting(true);
    try {
      if (activeAction === 'atender') {
        await onAtender(ticket.id, textoComentario, estadoAtencion);
      } else if (activeAction === 'derivar') {
        await onDerivar(ticket.id, areaDestino, textoComentario);
      } else if (activeAction === 'aprobar') {
        await onAprobar(ticket.id, textoComentario);
      } else if (activeAction === 'devolver' && onDevolver) {
        await onDevolver(ticket.id, textoComentario);
      } else if (activeAction === 'reasignar') {
        const elegido = funcionariosDisponibles.find((f) => f.id === nuevoFuncionarioId);
        if (!elegido) return;
        await onReasignar(ticket.id, elegido.id, elegido.nombre, textoComentario);
      } else if (activeAction === 'constancia') {
        await onEvaluarConstancia(ticket.id, estadoConstanciaDecision, textoComentario || 'Evaluación conforme');
      }
      cerrarAccion();
    } catch {
      // La vista ya mostró el aviso; el formulario queda abierto con lo escrito para reintentar.
    } finally {
      setIsSubmitting(false);
    }
  };

  const textoConfirmar = (): string => {
    if (activeAction === 'atender') {
      return estadoAtencion === 'por aprobar' ? 'Enviar al supervisor' : 'Registrar avance';
    }
    if (activeAction === 'derivar') return `Derivar a ${areaDestino}`;
    if (activeAction === 'aprobar') return 'Aprobar resolución';
    if (activeAction === 'devolver') return 'Devolver al funcionario';
    if (activeAction === 'reasignar') return 'Reasignar';
    return 'Guardar evaluación';
  };

  if (activeAction !== 'ninguna') {
    return (
      <form onSubmit={handleSubmit} style={{ background: 'var(--bg-card-subtle)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '1.25rem', marginTop: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)' }}>
            {TITULOS[activeAction]}
          </h4>
          <button
            type="button"
            onClick={cerrarAccion}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '0.8rem' }}
          >
            Cancelar acción
          </button>
        </div>

        {activeAction === 'atender' && (
          <div style={{ marginBottom: '0.75rem' }}>
            <span style={estiloEtiqueta}>¿Qué quieres hacer?</span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginTop: '0.25rem' }}>
              <label style={estiloOpcion}>
                <input
                  type="radio"
                  name="estadoAtencion"
                  checked={estadoAtencion === 'en evaluación'}
                  onChange={() => setEstadoAtencion('en evaluación')}
                />
                Registrar avance (sigue en evaluación)
              </label>
              <label style={estiloOpcion}>
                <input
                  type="radio"
                  name="estadoAtencion"
                  checked={estadoAtencion === 'por aprobar'}
                  onChange={() => setEstadoAtencion('por aprobar')}
                />
                Enviar al supervisor para aprobación
              </label>
            </div>
          </div>
        )}

        {activeAction === 'derivar' && (
          <div style={{ marginBottom: '0.75rem' }}>
            <label htmlFor="areaDestino" style={estiloEtiqueta}>Área municipal de destino:</label>
            <select
              id="areaDestino"
              value={areaDestino}
              onChange={(e) => setAreaDestino(e.target.value)}
              required
              style={estiloCampo}
            >
              <option value="">Elige el área de destino</option>
              {nombresAreas.filter((a) => a !== ticket.areaAsignada).map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>
        )}

        {activeAction === 'reasignar' && (
          <div style={{ marginBottom: '0.75rem' }}>
            <label htmlFor="nuevoFuncionario" style={estiloEtiqueta}>Nuevo funcionario asignado:</label>
            {funcionariosDisponibles.length === 0 ? (
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                No hay otros funcionarios activos a quienes reasignar este reclamo.
              </p>
            ) : (
              <select
                id="nuevoFuncionario"
                value={nuevoFuncionarioId}
                onChange={(e) => setNuevoFuncionarioId(e.target.value)}
                style={estiloCampo}
                required
              >
                <option value="" disabled>Elige un funcionario</option>
                {funcionariosDisponibles.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.nombre}{f.area ? ` (${f.area})` : ''}
                  </option>
                ))}
              </select>
            )}
            {ticket.funcionarioAsignadoNombre && (
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                Asignado ahora: {ticket.funcionarioAsignadoNombre || 'nadie todavía'}
              </p>
            )}
          </div>
        )}

        {activeAction === 'constancia' && (
          <div style={{ marginBottom: '0.75rem' }}>
            <span style={estiloEtiqueta}>Dictamen de la constancia:</span>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '0.25rem' }}>
              <label style={estiloOpcion}>
                <input
                  type="radio"
                  name="dictamenConstancia"
                  checked={estadoConstanciaDecision === 'aprobada'}
                  onChange={() => setEstadoConstanciaDecision('aprobada')}
                />
                Aprobar constancia
              </label>
              <label style={estiloOpcion}>
                <input
                  type="radio"
                  name="dictamenConstancia"
                  checked={estadoConstanciaDecision === 'observada'}
                  onChange={() => setEstadoConstanciaDecision('observada')}
                />
                Observar constancia
              </label>
            </div>
          </div>
        )}

        <div style={{ marginBottom: '0.75rem' }}>
          <label htmlFor="comentarioAccion" style={estiloEtiqueta}>
            {activeAction === 'derivar' && 'Motivo de la derivación y hallazgos:'}
            {activeAction === 'devolver' && 'Qué debe corregir el funcionario:'}
            {activeAction === 'reasignar' && 'Motivo de la reasignación:'}
            {activeAction === 'constancia' && 'Observaciones (opcional):'}
            {(activeAction === 'atender' || activeAction === 'aprobar') && 'Detalle o comentarios:'}
          </label>
          <textarea
            id="comentarioAccion"
            rows={3}
            value={textoComentario}
            onChange={(e) => setTextoComentario(e.target.value)}
            placeholder="Escribe las observaciones, coordinaciones o el fundamento técnico..."
            style={{ ...estiloCampo, resize: 'vertical', minHeight: '80px', maxHeight: '180px' }}
            required={activeAction !== 'constancia'}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
          <button type="button" onClick={cerrarAccion} className="btn btn-secondary" style={{ fontSize: '0.8rem' }}>
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting || (activeAction === 'reasignar' && funcionariosDisponibles.length === 0)}
            className={activeAction === 'aprobar' ? 'btn btn-success' : 'btn btn-primary'}
            style={{ fontSize: '0.8rem' }}
          >
            {isSubmitting ? 'Guardando...' : textoConfirmar()}
          </button>
        </div>
      </form>
    );
  }

  const esRolAtencion = rolUsuario === 'FUNCIONARIO' || rolUsuario === 'SUPERVISOR';
  const acciones: { id: AccionTicket; label: string; icon: React.ReactNode; className: string }[] = [
    { id: 'atender', label: 'Atender', icon: <Send size={15} />, className: 'btn btn-primary' },
    { id: 'derivar', label: 'Derivar a otra área', icon: <CornerDownRight size={15} />, className: 'btn btn-secondary' },
    { id: 'constancia', label: 'Evaluar constancia', icon: <FileCheck2 size={15} />, className: 'btn btn-secondary' },
    { id: 'aprobar', label: 'Aprobar resolución', icon: <CheckCircle size={15} />, className: 'btn btn-success' },
    { id: 'devolver', label: 'Devolver al funcionario', icon: <Undo2 size={15} />, className: 'btn btn-secondary' },
    { id: 'reasignar', label: 'Reasignar funcionario', icon: <RotateCcw size={15} />, className: 'btn btn-secondary' },
  ];
  const disponibles = acciones.filter((a) => permitida(a.id));

  let mensaje: string | null = null;
  if (!esRolAtencion) {
    mensaje = `Modo solo lectura para el perfil ${rolUsuario}.`;
  } else if (!esActivo(ticket)) {
    mensaje = 'Este reclamo ya está cerrado; no tiene acciones pendientes.';
  } else if (rolUsuario === 'FUNCIONARIO' && ticket.estado === 'por aprobar') {
    mensaje = 'Esperando la aprobación del supervisor.';
  }

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
      {disponibles.map((a) => (
        <button key={a.id} onClick={() => abrirAccion(a.id)} className={a.className} style={{ fontSize: '0.825rem' }}>
          {a.icon} {a.label}
        </button>
      ))}
      {mensaje && (
        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>{mensaje}</span>
      )}
    </div>
  );
};
