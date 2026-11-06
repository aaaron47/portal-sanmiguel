import React, { useState } from 'react';
import {
  Inbox,
  CheckCircle,
  MessageSquareWarning,
  UserPlus,
  RotateCcw,
  Undo2,
  ClipboardList,
  Send,
  ThumbsUp,
  PenLine,
  Lock,
  Ban,
  StickyNote,
} from 'lucide-react';
import { UserRole } from '@/types/auth.types';
import { useAreas } from '@/components/shared/hooks/useAreas';
import {
  AccionCodigo,
  AccionTicket,
  CategoriaReclamo,
  DatosAccion,
  OnAccionTicket,
  ResultadoReclamo,
  Ticket,
  TicketPrioridad,
} from '@/types/ticket.types';
import { ETIQUETAS_CATEGORIA, ETIQUETAS_RESULTADO, FuncionarioOpcion, esActivo, puede } from '@/utils/ticket.utils';

interface AccionesFormProps {
  ticket: Ticket;
  rolUsuario: UserRole;
  initialAction?: AccionTicket;
  /** Funcionarios para asignar o reasignar (solo el supervisor). */
  funcionarios?: FuncionarioOpcion[];
  onAccion: OnAccionTicket;
}

interface DefAccion {
  label: string;
  titulo: string;
  confirmar: string;
  icon: React.ReactNode;
  className: string;
}

/** Botones en el orden del flujo. Solo se muestran los que vienen en `accionesPermitidas`. */
const ACCIONES: Record<AccionCodigo, DefAccion> = {
  RECIBIR: { label: 'Recibir', titulo: 'Recibir el reclamo', confirmar: 'Marcar como recibido', icon: <Inbox size={15} />, className: 'btn btn-secondary' },
  VALIDAR: { label: 'Validar', titulo: 'Validar y clasificar', confirmar: 'Validar reclamo', icon: <CheckCircle size={15} />, className: 'btn btn-primary' },
  OBSERVAR: { label: 'Pedir información', titulo: 'Pedir información al ciudadano', confirmar: 'Enviar al ciudadano', icon: <MessageSquareWarning size={15} />, className: 'btn btn-secondary' },
  ASIGNAR: { label: 'Asignar', titulo: 'Asignar área y funcionario', confirmar: 'Asignar', icon: <UserPlus size={15} />, className: 'btn btn-primary' },
  EVALUAR: { label: 'Registrar evaluación', titulo: 'Registrar la evaluación del área', confirmar: 'Guardar evaluación', icon: <ClipboardList size={15} />, className: 'btn btn-secondary' },
  ELABORAR_RESPUESTA: { label: 'Elaborar respuesta', titulo: 'Elaborar la respuesta al ciudadano', confirmar: 'Guardar respuesta', icon: <Send size={15} />, className: 'btn btn-primary' },
  APROBAR_RESPUESTA: { label: 'Aprobar respuesta', titulo: 'Aprobar y enviar la respuesta', confirmar: 'Aprobar y enviar', icon: <ThumbsUp size={15} />, className: 'btn btn-success' },
  OBSERVAR_RESPUESTA: { label: 'Observar respuesta', titulo: 'Devolver la respuesta al funcionario', confirmar: 'Devolver con observaciones', icon: <PenLine size={15} />, className: 'btn btn-secondary' },
  REASIGNAR: { label: 'Reasignar funcionario', titulo: 'Reasignar a otro funcionario del área', confirmar: 'Reasignar', icon: <RotateCcw size={15} />, className: 'btn btn-secondary' },
  DEVOLVER_PARA_REASIGNAR: { label: 'Devolver para reasignar', titulo: 'Devolver al supervisor para reasignar', confirmar: 'Devolver', icon: <Undo2 size={15} />, className: 'btn btn-secondary' },
  CERRAR: { label: 'Cerrar caso', titulo: 'Cerrar el caso', confirmar: 'Cerrar caso', icon: <Lock size={15} />, className: 'btn btn-primary' },
  DECLARAR_IMPROCEDENTE: { label: 'Declarar improcedente', titulo: 'Declarar improcedente', confirmar: 'Declarar improcedente', icon: <Ban size={15} />, className: 'btn btn-danger' },
  NOTA: { label: 'Nota interna', titulo: 'Agregar una nota interna', confirmar: 'Guardar nota', icon: <StickyNote size={15} />, className: 'btn btn-secondary' },
};

const ORDEN = Object.keys(ACCIONES) as AccionCodigo[];
const CATEGORIAS = Object.keys(ETIQUETAS_CATEGORIA) as CategoriaReclamo[];
const RESULTADOS = Object.keys(ETIQUETAS_RESULTADO) as ResultadoReclamo[];
const PRIORIDADES: TicketPrioridad[] = ['BAJA', 'MEDIA', 'ALTA'];

const estiloCampo: React.CSSProperties = {
  width: '100%',
  padding: '0.5rem',
  borderRadius: '6px',
  border: '1px solid var(--border-color)',
  background: 'var(--bg-card)',
  color: 'var(--text-main)',
};

const estiloTexto: React.CSSProperties = { ...estiloCampo, resize: 'vertical', minHeight: '70px', maxHeight: '180px' };

const estiloEtiqueta: React.CSSProperties = {
  display: 'block',
  fontSize: '0.8rem',
  fontWeight: 600,
  color: 'var(--text-main)',
  marginBottom: '0.25rem',
};

const estiloAyuda: React.CSSProperties = { fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' };

/** Campo con etiqueta asociada (el id enlaza la etiqueta para lectores de pantalla). */
const Campo: React.FC<{ id: string; etiqueta: string; ayuda?: string; children: React.ReactNode }> = ({
  id,
  etiqueta,
  ayuda,
  children,
}) => (
  <div style={{ marginBottom: '0.75rem' }}>
    <label htmlFor={id} style={estiloEtiqueta}>{etiqueta}</label>
    {children}
    {ayuda && <p style={estiloAyuda}>{ayuda}</p>}
  </div>
);

/** Datos con los que arranca el formulario de cada acción (parte del reclamo tal como está ahora). */
function datosIniciales(accion: AccionTicket, ticket: Ticket): DatosAccion {
  if (accion === 'ASIGNAR') return { areaId: ticket.areaId ?? '', prioridad: ticket.prioridad };
  if (accion === 'OBSERVAR') return { plazoDias: 5 };
  if (accion === 'VALIDAR') return { categoria: (ticket.categoria as CategoriaReclamo) || undefined };
  if (accion === 'ELABORAR_RESPUESTA') {
    // Si el supervisor observó la versión anterior, se parte de ella para corregirla.
    const anterior = ticket.respuestas?.[0];
    if (anterior?.estado === 'OBSERVADA') {
      return {
        respuesta: anterior.respuesta,
        fundamentos: anterior.fundamentos,
        accionesCorrectivas: anterior.accionesCorrectivas,
        resultado: anterior.resultado,
      };
    }
  }
  return {};
}

export const AccionesForm: React.FC<AccionesFormProps> = ({
  ticket,
  rolUsuario,
  initialAction = 'ninguna',
  funcionarios = [],
  onAccion,
}) => {
  // El modal monta este formulario con una `key` por reclamo, versión y acción inicial: basta con inicializar.
  const inicial: AccionTicket = initialAction !== 'ninguna' && puede(ticket, initialAction) ? initialAction : 'ninguna';
  const [accion, setAccion] = useState<AccionTicket>(inicial);
  const [datos, setDatos] = useState<DatosAccion>(() => datosIniciales(inicial, ticket));
  const [enviando, setEnviando] = useState(false);
  const { areas } = useAreas();

  const cambiar = <K extends keyof DatosAccion>(campo: K, valor: DatosAccion[K]) =>
    setDatos((d) => ({ ...d, [campo]: valor }));

  const abrir = (a: AccionCodigo) => {
    setDatos(datosIniciales(a, ticket));
    setAccion(a);
  };
  const cerrar = () => {
    setAccion('ninguna');
    setDatos({});
  };

  // Asignar: funcionarios activos del área elegida. Reasignar: del área del reclamo, sin el actual.
  const areaElegida = areas.find((a) => a.id === datos.areaId);
  const funcionariosAsignables = funcionarios.filter((f) => f.activo && areaElegida && f.area === areaElegida.nombre);
  const funcionariosReasignables = funcionarios.filter(
    (f) => f.activo && f.area === ticket.areaAsignada && f.id !== ticket.funcionarioAsignadoId
  );
  const respuestaEnRevision = ticket.respuestas?.find((r) => r.estado === 'EN_REVISION');
  const ultimaObservada = ticket.respuestas?.[0]?.estado === 'OBSERVADA' ? ticket.respuestas[0] : undefined;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (accion === 'ninguna') return;
    const enviar =
      accion === 'REASIGNAR'
        ? { ...datos, funcionarioNombre: funcionarios.find((f) => f.id === datos.funcionarioId)?.nombre }
        : datos;
    setEnviando(true);
    try {
      await onAccion(ticket, accion, enviar);
      cerrar();
    } catch {
      // La vista ya mostró el aviso; el formulario queda abierto con lo escrito para reintentar.
    } finally {
      setEnviando(false);
    }
  };

  if (accion !== 'ninguna') {
    const def = ACCIONES[accion];
    const sinFuncionarios =
      (accion === 'ASIGNAR' && Boolean(datos.areaId) && funcionariosAsignables.length === 0) ||
      (accion === 'REASIGNAR' && funcionariosReasignables.length === 0);

    return (
      <form onSubmit={handleSubmit} style={{ background: 'var(--bg-card-subtle)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '1.25rem', marginTop: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)' }}>{def.titulo}</h4>
          <button type="button" onClick={cerrar} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
            Cancelar acción
          </button>
        </div>

        {accion === 'VALIDAR' && (
          <Campo id="categoria" etiqueta="Categoría del reclamo" ayuda={ticket.estado === 'registrado' ? 'El reclamo se marcará como recibido y validado.' : undefined}>
            <select id="categoria" value={datos.categoria ?? ''} onChange={(e) => cambiar('categoria', e.target.value as CategoriaReclamo)} required style={estiloCampo}>
              <option value="" disabled>Elige la categoría</option>
              {CATEGORIAS.map((c) => <option key={c} value={c}>{ETIQUETAS_CATEGORIA[c]}</option>)}
            </select>
          </Campo>
        )}

        {accion === 'OBSERVAR' && (
          <>
            <Campo id="observacion" etiqueta="¿Qué debe completar el ciudadano?" ayuda="El ciudadano lo verá en la app con el plazo para responder.">
              <textarea id="observacion" rows={3} value={datos.observacion ?? ''} onChange={(e) => cambiar('observacion', e.target.value)} required minLength={3} maxLength={1000} style={estiloTexto} />
            </Campo>
            <Campo id="plazoDias" etiqueta="Plazo (días)">
              <input id="plazoDias" type="number" min={1} max={30} value={datos.plazoDias ?? 5} onChange={(e) => cambiar('plazoDias', Number(e.target.value))} required style={{ ...estiloCampo, maxWidth: '120px' }} />
            </Campo>
          </>
        )}

        {accion === 'ASIGNAR' && (
          <>
            <Campo id="areaAsignar" etiqueta="Área responsable">
              <select id="areaAsignar" value={datos.areaId ?? ''} onChange={(e) => setDatos((d) => ({ ...d, areaId: e.target.value, funcionarioId: '' }))} required style={estiloCampo}>
                <option value="" disabled>Elige el área</option>
                {areas.map((a) => <option key={a.id} value={a.id}>{a.nombre}</option>)}
              </select>
            </Campo>
            <Campo id="funcionarioAsignar" etiqueta="Funcionario">
              {sinFuncionarios ? (
                <p style={estiloAyuda}>No hay funcionarios activos en esta área.</p>
              ) : (
                <select id="funcionarioAsignar" value={datos.funcionarioId ?? ''} onChange={(e) => cambiar('funcionarioId', e.target.value)} required disabled={!datos.areaId} style={estiloCampo}>
                  <option value="" disabled>{datos.areaId ? 'Elige un funcionario' : 'Primero elige el área'}</option>
                  {funcionariosAsignables.map((f) => <option key={f.id} value={f.id}>{f.nombre}</option>)}
                </select>
              )}
            </Campo>
            <Campo id="prioridadAsignar" etiqueta="Prioridad" ayuda="Con prioridad ALTA la respuesta necesitará tu aprobación.">
              <select id="prioridadAsignar" value={datos.prioridad ?? ''} onChange={(e) => cambiar('prioridad', e.target.value as TicketPrioridad)} style={estiloCampo}>
                {PRIORIDADES.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </Campo>
            <Campo id="motivoAsignar" etiqueta="Indicaciones para el funcionario (opcional)">
              <textarea id="motivoAsignar" rows={2} value={datos.motivo ?? ''} onChange={(e) => cambiar('motivo', e.target.value)} maxLength={500} style={estiloTexto} />
            </Campo>
          </>
        )}

        {accion === 'REASIGNAR' && (
          <>
            <Campo id="funcionarioReasignar" etiqueta={`Nuevo funcionario de ${ticket.areaAsignada || 'el área'}`} ayuda={ticket.funcionarioAsignadoNombre ? `Asignado ahora: ${ticket.funcionarioAsignadoNombre}` : undefined}>
              {sinFuncionarios ? (
                <p style={estiloAyuda}>No hay otros funcionarios activos en esta área. Para cambiar de área, el funcionario puede devolverlo para reasignar.</p>
              ) : (
                <select id="funcionarioReasignar" value={datos.funcionarioId ?? ''} onChange={(e) => cambiar('funcionarioId', e.target.value)} required style={estiloCampo}>
                  <option value="" disabled>Elige un funcionario</option>
                  {funcionariosReasignables.map((f) => <option key={f.id} value={f.id}>{f.nombre}</option>)}
                </select>
              )}
            </Campo>
            <Campo id="motivoReasignar" etiqueta="Motivo de la reasignación">
              <textarea id="motivoReasignar" rows={2} value={datos.motivo ?? ''} onChange={(e) => cambiar('motivo', e.target.value)} required minLength={3} maxLength={400} style={estiloTexto} />
            </Campo>
          </>
        )}

        {accion === 'EVALUAR' && (
          <>
            <Campo id="antecedentes" etiqueta="Antecedentes revisados">
              <textarea id="antecedentes" rows={3} value={datos.antecedentes ?? ''} onChange={(e) => cambiar('antecedentes', e.target.value)} required minLength={3} maxLength={4000} style={estiloTexto} />
            </Campo>
            <Campo id="hallazgos" etiqueta="Hallazgos">
              <textarea id="hallazgos" rows={3} value={datos.hallazgos ?? ''} onChange={(e) => cambiar('hallazgos', e.target.value)} required minLength={3} maxLength={4000} style={estiloTexto} />
            </Campo>
            <Campo id="conclusion" etiqueta="Conclusión (opcional)">
              <textarea id="conclusion" rows={2} value={datos.conclusion ?? ''} onChange={(e) => cambiar('conclusion', e.target.value)} maxLength={2000} style={estiloTexto} />
            </Campo>
          </>
        )}

        {accion === 'ELABORAR_RESPUESTA' && (
          <>
            {ultimaObservada?.comentarioRevision && (
              <p style={{ ...estiloAyuda, fontSize: '0.825rem', marginBottom: '0.75rem', color: 'var(--text-main)' }}>
                <strong>Observación del supervisor:</strong> {ultimaObservada.comentarioRevision}
              </p>
            )}
            <Campo id="resultado" etiqueta="Resultado">
              <select id="resultado" value={datos.resultado ?? ''} onChange={(e) => cambiar('resultado', e.target.value as ResultadoReclamo)} required style={estiloCampo}>
                <option value="" disabled>Elige el resultado</option>
                {RESULTADOS.map((r) => <option key={r} value={r}>{ETIQUETAS_RESULTADO[r]}</option>)}
              </select>
            </Campo>
            <Campo id="respuesta" etiqueta="Respuesta para el ciudadano" ayuda="Mínimo 10 caracteres. Es el texto que recibirá el ciudadano.">
              <textarea id="respuesta" rows={4} value={datos.respuesta ?? ''} onChange={(e) => cambiar('respuesta', e.target.value)} required minLength={10} maxLength={4000} style={estiloTexto} />
            </Campo>
            <Campo id="fundamentos" etiqueta="Fundamentos" ayuda="Mínimo 10 caracteres.">
              <textarea id="fundamentos" rows={3} value={datos.fundamentos ?? ''} onChange={(e) => cambiar('fundamentos', e.target.value)} required minLength={10} maxLength={4000} style={estiloTexto} />
            </Campo>
            <Campo id="accionesCorrectivas" etiqueta="Acciones correctivas (opcional)">
              <textarea id="accionesCorrectivas" rows={2} value={datos.accionesCorrectivas ?? ''} onChange={(e) => cambiar('accionesCorrectivas', e.target.value)} maxLength={4000} style={estiloTexto} />
            </Campo>
            <p style={estiloAyuda}>
              {ticket.prioridad === 'ALTA'
                ? 'Prioridad alta: la respuesta irá al supervisor para su aprobación antes de enviarse.'
                : 'Si el tipo de reclamo lo exige, irá al supervisor; si no, se enviará al ciudadano al guardar.'}
            </p>
          </>
        )}

        {(accion === 'APROBAR_RESPUESTA' || accion === 'OBSERVAR_RESPUESTA') && respuestaEnRevision && (
          <div style={{ fontSize: '0.825rem', color: 'var(--text-main)', marginBottom: '0.75rem', lineHeight: 1.45 }}>
            <p><strong>Resultado:</strong> {ETIQUETAS_RESULTADO[respuestaEnRevision.resultado] ?? respuestaEnRevision.resultado}</p>
            <p><strong>Respuesta:</strong> {respuestaEnRevision.respuesta}</p>
            <p><strong>Fundamentos:</strong> {respuestaEnRevision.fundamentos}</p>
            {respuestaEnRevision.accionesCorrectivas && <p><strong>Acciones correctivas:</strong> {respuestaEnRevision.accionesCorrectivas}</p>}
            <p style={estiloAyuda}>Elaborada por {respuestaEnRevision.elaboradoPor}</p>
          </div>
        )}

        {accion === 'OBSERVAR_RESPUESTA' && (
          <Campo id="comentarioRevision" etiqueta="Qué debe corregir el funcionario">
            <textarea id="comentarioRevision" rows={3} value={datos.comentario ?? ''} onChange={(e) => cambiar('comentario', e.target.value)} required minLength={3} maxLength={1000} style={estiloTexto} />
          </Campo>
        )}

        {(accion === 'DEVOLVER_PARA_REASIGNAR' || accion === 'DECLARAR_IMPROCEDENTE') && (
          <Campo
            id="motivo"
            etiqueta={accion === 'DECLARAR_IMPROCEDENTE' ? 'Motivo de la improcedencia' : '¿Por qué no corresponde a esta área o funcionario?'}
            ayuda={accion === 'DECLARAR_IMPROCEDENTE' ? 'El ciudadano recibirá este motivo. El reclamo queda concluido.' : undefined}
          >
            <textarea id="motivo" rows={3} value={datos.motivo ?? ''} onChange={(e) => cambiar('motivo', e.target.value)} required minLength={3} maxLength={4000} style={estiloTexto} />
          </Campo>
        )}

        {(accion === 'RECIBIR' || accion === 'VALIDAR' || accion === 'APROBAR_RESPUESTA' || accion === 'CERRAR' || accion === 'NOTA') && (
          <Campo
            id="comentario"
            etiqueta={accion === 'NOTA' ? 'Nota (solo la ve el personal)' : 'Comentario (opcional)'}
            ayuda={accion === 'CERRAR' ? 'El caso quedará concluido y sin acciones.' : undefined}
          >
            <textarea id="comentario" rows={2} value={datos.comentario ?? ''} onChange={(e) => cambiar('comentario', e.target.value)} required={accion === 'NOTA'} minLength={accion === 'NOTA' ? 3 : undefined} maxLength={2000} style={estiloTexto} />
          </Campo>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
          <button type="button" onClick={cerrar} className="btn btn-secondary" style={{ fontSize: '0.8rem' }}>
            Cancelar
          </button>
          <button
            type="submit"
            disabled={enviando || sinFuncionarios}
            className={def.className === 'btn btn-secondary' ? 'btn btn-primary' : def.className}
            style={{ fontSize: '0.8rem' }}
          >
            {enviando ? 'Guardando...' : def.confirmar}
          </button>
        </div>
      </form>
    );
  }

  const esRolAtencion = rolUsuario === 'FUNCIONARIO' || rolUsuario === 'SUPERVISOR';
  const disponibles = ORDEN.filter((a) => puede(ticket, a));
  const soloNota = !disponibles.some((a) => a !== 'NOTA');

  let mensaje: string | null = null;
  if (!esRolAtencion) {
    mensaje = `Modo solo lectura para el perfil ${rolUsuario}.`;
  } else if (!esActivo(ticket) && disponibles.length === 0) {
    mensaje = 'Este reclamo ya está concluido; no tiene acciones pendientes.';
  } else if (ticket.respuestaPorAprobar && !puede(ticket, 'APROBAR_RESPUESTA')) {
    mensaje = 'La respuesta está esperando la aprobación del supervisor.';
  } else if (ticket.observacion) {
    mensaje = 'Esperando que el ciudadano complete la información pedida.';
  } else if (soloNota) {
    mensaje = ticket.estado === 'pendiente de asignación'
      ? 'Esperando que el supervisor asigne el área y el funcionario.'
      : 'No tienes acciones sobre este reclamo.';
  }

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
      {disponibles.map((a) => (
        <button key={a} onClick={() => abrir(a)} className={ACCIONES[a].className} style={{ fontSize: '0.825rem' }}>
          {ACCIONES[a].icon} {ACCIONES[a].label}
        </button>
      ))}
      {mensaje && <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>{mensaje}</span>}
    </div>
  );
};
