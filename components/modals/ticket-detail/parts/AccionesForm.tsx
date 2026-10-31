import React, { useState, useEffect } from 'react';
import { Send, CornerDownRight, CheckCircle, RotateCcw, FileCheck2 } from 'lucide-react';
import { UserRole } from '@/types/auth.types';
import { Ticket } from '@/types/ticket.types';

interface AccionesFormProps {
  ticket: Ticket;
  rolUsuario: UserRole;
  initialAction?: 'ninguna' | 'atender' | 'derivar' | 'aprobar' | 'reasignar' | 'constancia';
  onAtender: (id: string, comentario: string, nuevoEstado: 'por aprobar' | 'resuelto' | 'en evaluación') => Promise<void>;
  onDerivar: (id: string, areaDestino: string, motivo: string) => Promise<void>;
  onAprobar: (id: string, comentario: string) => Promise<void>;
  onReasignar: (id: string, nuevoFuncionarioId: string, nuevoNombre: string, motivo: string) => Promise<void>;
  onEvaluarConstancia: (id: string, estado: 'aprobada' | 'observada', observaciones: string) => Promise<void>;
}

export const AccionesForm: React.FC<AccionesFormProps> = ({
  ticket,
  rolUsuario,
  initialAction = 'ninguna',
  onAtender,
  onDerivar,
  onAprobar,
  onReasignar,
  onEvaluarConstancia,
}) => {
  const [activeAction, setActiveAction] = useState<'ninguna' | 'atender' | 'derivar' | 'aprobar' | 'reasignar' | 'constancia'>(initialAction);
  const [textoComentario, setTextoComentario] = useState('');
  const [areaDestino, setAreaDestino] = useState('Obras Públicas');
  const [nuevoFuncionarioNombre, setNuevoFuncionarioNombre] = useState('Ing. Fernando Rojas');
  const [estadoConstanciaDecision, setEstadoConstanciaDecision] = useState<'aprobada' | 'observada'>('aprobada');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialAction) {
      setActiveAction(initialAction);
    }
  }, [initialAction, ticket.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!textoComentario.trim() && activeAction !== 'constancia') return;

    setIsSubmitting(true);
    try {
      if (activeAction === 'atender') {
        await onAtender(ticket.id, textoComentario, 'por aprobar');
      } else if (activeAction === 'derivar') {
        await onDerivar(ticket.id, areaDestino, textoComentario);
      } else if (activeAction === 'aprobar') {
        await onAprobar(ticket.id, textoComentario);
      } else if (activeAction === 'reasignar') {
        await onReasignar(ticket.id, 'USR-FUN-09', nuevoFuncionarioNombre, textoComentario);
      } else if (activeAction === 'constancia') {
        await onEvaluarConstancia(ticket.id, estadoConstanciaDecision, textoComentario || 'Evaluación conforme');
      }
      setActiveAction('ninguna');
      setTextoComentario('');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (activeAction !== 'ninguna') {
    return (
      <form onSubmit={handleSubmit} style={{ background: 'var(--bg-card-subtle)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '1.25rem', marginTop: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)' }}>
            {activeAction === 'atender' && 'Atender Reclamo y Elevar Respuesta'}
            {activeAction === 'derivar' && 'Derivar a otra Área Municipal (Directiva Ágil)'}
            {activeAction === 'aprobar' && 'Aprobar Resolución Definitiva'}
            {activeAction === 'reasignar' && 'Reasignar Caso a otro Funcionario'}
            {activeAction === 'constancia' && 'Evaluar Constancia Formal'}
          </h4>
          <button
            type="button"
            onClick={() => setActiveAction('ninguna')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '0.8rem' }}
          >
            Cancelar acción
          </button>
        </div>

        {activeAction === 'derivar' && (
          <div style={{ marginBottom: '0.75rem' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.25rem' }}>
              Área Municipal de Destino:
            </label>
            <select
              value={areaDestino}
              onChange={(e) => setAreaDestino(e.target.value)}
              style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-main)' }}
            >
              <option value="Obras Públicas">Obras Públicas</option>
              <option value="Fiscalización y Control">Fiscalización y Control</option>
              <option value="Limpieza Pública">Limpieza Pública</option>
              <option value="Parques y Jardines">Parques y Jardines</option>
              <option value="Tránsito y Transporte">Tránsito y Transporte</option>
              <option value="Seguridad Ciudadana">Seguridad Ciudadana</option>
            </select>
          </div>
        )}

        {activeAction === 'reasignar' && (
          <div style={{ marginBottom: '0.75rem' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.25rem' }}>
              Nuevo Funcionario Asignado:
            </label>
            <select
              value={nuevoFuncionarioNombre}
              onChange={(e) => setNuevoFuncionarioNombre(e.target.value)}
              style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-main)' }}
            >
              <option value="Ing. Fernando Rojas">Ing. Fernando Rojas (Obras)</option>
              <option value="Lic. Mariana Rios">Lic. Mariana Rios (Fiscalización)</option>
              <option value="Bach. Laura Paredes">Bach. Laura Paredes (Parques)</option>
              <option value="Sr. Walter Quispe">Sr. Walter Quispe (Limpieza)</option>
            </select>
          </div>
        )}

        {activeAction === 'constancia' && (
          <div style={{ marginBottom: '0.75rem' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.25rem' }}>
              Dictamen de Constancia:
            </label>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '0.25rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.85rem', cursor: 'pointer', color: 'var(--text-main)' }}>
                <input
                  type="radio"
                  name="dictamenConstancia"
                  checked={estadoConstanciaDecision === 'aprobada'}
                  onChange={() => setEstadoConstanciaDecision('aprobada')}
                />
                Aprobar Constancia
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.85rem', cursor: 'pointer', color: 'var(--text-main)' }}>
                <input
                  type="radio"
                  name="dictamenConstancia"
                  checked={estadoConstanciaDecision === 'observada'}
                  onChange={() => setEstadoConstanciaDecision('observada')}
                />
                Observar Constancia
              </label>
            </div>
          </div>
        )}

        <div style={{ marginBottom: '0.75rem' }}>
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.25rem' }}>
            {activeAction === 'derivar' 
              ? 'Motivo y Hallazgos (Directiva Ágil sin tablas extra):' 
              : 'Detalle o Comentarios de la Acción:'}
          </label>
          <textarea
            rows={3}
            value={textoComentario}
            onChange={(e) => setTextoComentario(e.target.value)}
            placeholder="Ingrese las observaciones, coordinaciones o fundamento técnico..."
            style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-main)', resize: 'vertical' }}
            required={activeAction !== 'constancia'}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
          <button
            type="button"
            onClick={() => setActiveAction('ninguna')}
            className="btn btn-secondary"
            style={{ fontSize: '0.8rem' }}
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn btn-primary"
            style={{ fontSize: '0.8rem' }}
          >
            {isSubmitting ? 'Guardando...' : 'Confirmar y Guardar'}
          </button>
        </div>
      </form>
    );
  }

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
      {/* Acciones para FUNCIONARIO */}
      {rolUsuario === 'FUNCIONARIO' && (
        <>
          <button
            onClick={() => setActiveAction('atender')}
            className="btn btn-primary"
            style={{ fontSize: '0.825rem' }}
          >
            <Send size={15} /> Atender y Responder
          </button>
          <button
            onClick={() => setActiveAction('derivar')}
            className="btn btn-secondary"
            style={{ fontSize: '0.825rem' }}
          >
            <CornerDownRight size={15} /> Derivar Caso
          </button>
          {ticket.tieneConstancia && (
            <button
              onClick={() => setActiveAction('constancia')}
              className="btn btn-secondary"
              style={{ fontSize: '0.825rem' }}
            >
              <FileCheck2 size={15} /> Evaluar Constancia
            </button>
          )}
        </>
      )}

      {/* Acciones para SUPERVISOR */}
      {rolUsuario === 'SUPERVISOR' && (
        <>
          <button
            onClick={() => setActiveAction('aprobar')}
            className="btn btn-success"
            style={{ fontSize: '0.825rem' }}
          >
            <CheckCircle size={15} /> Aprobar Resolución
          </button>
          <button
            onClick={() => setActiveAction('reasignar')}
            className="btn btn-secondary"
            style={{ fontSize: '0.825rem' }}
          >
            <RotateCcw size={15} /> Reasignar Funcionario
          </button>
        </>
      )}

      {/* Para Control Municipal o TI */}
      {(rolUsuario === 'CONTROL_MUNICIPAL' || rolUsuario === 'CONTROL_TI' || rolUsuario === 'ADMIN') && (
        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span>Modo solo lectura para el perfil {rolUsuario}.</span>
        </div>
      )}
    </div>
  );
};
