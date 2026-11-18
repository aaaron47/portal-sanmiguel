import React from 'react';
import { AccionCodigo, CategoriaReclamo, ResultadoReclamo, Ticket, TicketPrioridad } from '@/types/ticket.types';
import { ETIQUETAS_CATEGORIA, ETIQUETAS_RESULTADO } from '@/utils/ticket.utils';
import { ACCIONES } from '../acciones.config';
import { AccionReclamo } from '../useAccionReclamo';

interface AccionesFormProps {
  /** El botón de confirmar está en el pie del expediente y se une a este formulario por su id. */
  id: string;
  accion: AccionCodigo;
  ticket: Ticket;
  estado: AccionReclamo;
}

const CATEGORIAS = Object.keys(ETIQUETAS_CATEGORIA) as CategoriaReclamo[];
const RESULTADOS = Object.keys(ETIQUETAS_RESULTADO) as ResultadoReclamo[];
const PRIORIDADES: TicketPrioridad[] = ['BAJA', 'MEDIA', 'ALTA'];

/** Campo con etiqueta asociada (el id enlaza la etiqueta y la ayuda para lectores de pantalla). */
const Campo: React.FC<{ id: string; etiqueta: string; ayuda?: string; children: React.ReactNode }> = ({
  id,
  etiqueta,
  ayuda,
  children,
}) => (
  <div className="expediente-campo">
    <label htmlFor={id}>{etiqueta}</label>
    {children}
    {ayuda && <p id={`${id}-ayuda`} className="expediente-ayuda">{ayuda}</p>}
  </div>
);

interface AreaTextoProps {
  id: string;
  etiqueta: string;
  ayuda?: string;
  valor?: string;
  onChange: (valor: string) => void;
  filas?: number;
  obligatorio?: boolean;
  minimo?: number;
  maximo: number;
}

/** Texto largo con contador: avisa cuánto falta para el mínimo antes de enviar y cuánto queda del máximo. */
const AreaTexto: React.FC<AreaTextoProps> = ({ id, etiqueta, ayuda, valor = '', onChange, filas = 3, obligatorio, minimo, maximo }) => {
  const faltan = minimo && valor.length > 0 && valor.length < minimo ? minimo - valor.length : 0;
  return (
    <div className="expediente-campo">
      <label htmlFor={id}>{etiqueta}</label>
      <textarea
        id={id}
        rows={filas}
        value={valor}
        onChange={(e) => onChange(e.target.value)}
        required={obligatorio}
        minLength={minimo}
        maxLength={maximo}
        aria-describedby={`${id}-ayuda`}
      />
      <div id={`${id}-ayuda`} className="expediente-ayuda expediente-ayuda-fila">
        <span>{faltan ? `Faltan ${faltan} caracteres (mínimo ${minimo}).` : ayuda}</span>
        <span aria-label={`${valor.length} de ${maximo} caracteres`}>
          {valor.length}/{maximo}
        </span>
      </div>
    </div>
  );
};

/**
 * Formulario de la acción abierta. Solo tiene los campos: el estado vive en `useAccionReclamo` y los botones
 * de cancelar y confirmar están en el pie del expediente, siempre a la vista.
 */
export const AccionesForm: React.FC<AccionesFormProps> = ({ id, accion, ticket, estado }) => {
  const { datos, cambiar, cambiarVarios, areas, funcionariosAsignables, funcionariosReasignables, sinFuncionarios, errorArchivo } = estado;
  const def = ACCIONES[accion];
  const Icono = def.icon;
  const respuestaEnRevision = ticket.respuestas?.find((r) => r.estado === 'EN_REVISION');
  const ultimaObservada = ticket.respuestas?.[0]?.estado === 'OBSERVADA' ? ticket.respuestas[0] : undefined;
  const revisaRespuesta = accion === 'APROBAR_RESPUESTA' || accion === 'OBSERVAR_RESPUESTA';

  return (
    <form
      id={id}
      className="expediente-form"
      aria-labelledby={`${id}-titulo`}
      onSubmit={(e) => {
        e.preventDefault();
        void estado.enviar();
      }}
    >
      <h3 id={`${id}-titulo`} className="expediente-form-titulo">
        <Icono size={17} aria-hidden="true" /> {def.titulo}
      </h3>

      {/* Mientras se guarda, los campos quedan bloqueados: lo escrito no cambia a mitad del envío. */}
      <fieldset disabled={estado.enviando}>
        {accion === 'VALIDAR' && (
          <Campo id="categoria" etiqueta="Categoría del reclamo" ayuda={ticket.estado === 'registrado' ? 'El reclamo se marcará como recibido y validado.' : undefined}>
            <select id="categoria" value={datos.categoria ?? ''} onChange={(e) => cambiar('categoria', e.target.value as CategoriaReclamo)} required>
              <option value="" disabled>Elige la categoría</option>
              {CATEGORIAS.map((c) => <option key={c} value={c}>{ETIQUETAS_CATEGORIA[c]}</option>)}
            </select>
          </Campo>
        )}

        {accion === 'OBSERVAR' && (
          <>
            <AreaTexto id="observacion" etiqueta="¿Qué debe completar el ciudadano?" ayuda="Escríbelo tal como lo leerá el ciudadano." valor={datos.observacion} onChange={(v) => cambiar('observacion', v)} obligatorio minimo={3} maximo={1000} />
            <Campo id="plazoDias" etiqueta="Plazo para responder (días)" ayuda="Entre 1 y 30 días.">
              <input id="plazoDias" type="number" min={1} max={30} value={datos.plazoDias ?? 5} onChange={(e) => cambiar('plazoDias', Number(e.target.value))} required aria-describedby="plazoDias-ayuda" style={{ maxWidth: '120px' }} />
            </Campo>
          </>
        )}

        {accion === 'ASIGNAR' && (
          <>
            <Campo id="areaAsignar" etiqueta="Área responsable">
              <select id="areaAsignar" value={datos.areaId ?? ''} onChange={(e) => cambiarVarios({ areaId: e.target.value, funcionarioId: '' })} required>
                <option value="" disabled>Elige el área</option>
                {areas.map((a) => <option key={a.id} value={a.id}>{a.nombre}</option>)}
              </select>
            </Campo>
            <Campo id="funcionarioAsignar" etiqueta="Funcionario">
              {sinFuncionarios ? (
                <p className="expediente-ayuda" role="status">No hay funcionarios activos en esta área. Elige otra área.</p>
              ) : (
                <select id="funcionarioAsignar" value={datos.funcionarioId ?? ''} onChange={(e) => cambiar('funcionarioId', e.target.value)} required disabled={!datos.areaId}>
                  <option value="" disabled>{datos.areaId ? 'Elige un funcionario' : 'Primero elige el área'}</option>
                  {funcionariosAsignables.map((f) => <option key={f.id} value={f.id}>{f.nombre}</option>)}
                </select>
              )}
            </Campo>
            <Campo id="prioridadAsignar" etiqueta="Prioridad" ayuda="Con prioridad ALTA la respuesta necesitará tu aprobación.">
              <select id="prioridadAsignar" value={datos.prioridad ?? ''} onChange={(e) => cambiar('prioridad', e.target.value as TicketPrioridad)} aria-describedby="prioridadAsignar-ayuda">
                {PRIORIDADES.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </Campo>
            <AreaTexto id="motivoAsignar" etiqueta="Indicaciones para el funcionario (opcional)" valor={datos.motivo} onChange={(v) => cambiar('motivo', v)} filas={2} maximo={500} />
          </>
        )}

        {accion === 'REASIGNAR' && (
          <>
            <Campo id="funcionarioReasignar" etiqueta={`Nuevo funcionario de ${ticket.areaAsignada || 'el área'}`} ayuda={ticket.funcionarioAsignadoNombre ? `Asignado ahora: ${ticket.funcionarioAsignadoNombre}` : undefined}>
              {sinFuncionarios ? (
                <p className="expediente-ayuda" role="status">No hay otros funcionarios activos en esta área. Para cambiar de área, el funcionario puede devolverlo para reasignar.</p>
              ) : (
                <select id="funcionarioReasignar" value={datos.funcionarioId ?? ''} onChange={(e) => cambiar('funcionarioId', e.target.value)} required>
                  <option value="" disabled>Elige un funcionario</option>
                  {funcionariosReasignables.map((f) => <option key={f.id} value={f.id}>{f.nombre}</option>)}
                </select>
              )}
            </Campo>
            <AreaTexto id="motivoReasignar" etiqueta="Motivo de la reasignación" valor={datos.motivo} onChange={(v) => cambiar('motivo', v)} filas={2} obligatorio minimo={3} maximo={400} />
          </>
        )}

        {accion === 'EVALUAR' && (
          <>
            <AreaTexto id="antecedentes" etiqueta="Antecedentes revisados" valor={datos.antecedentes} onChange={(v) => cambiar('antecedentes', v)} obligatorio minimo={3} maximo={4000} />
            <AreaTexto id="hallazgos" etiqueta="Hallazgos" valor={datos.hallazgos} onChange={(v) => cambiar('hallazgos', v)} obligatorio minimo={3} maximo={4000} />
            <AreaTexto id="conclusion" etiqueta="Conclusión (opcional)" valor={datos.conclusion} onChange={(v) => cambiar('conclusion', v)} filas={2} maximo={2000} />
          </>
        )}

        {accion === 'ADJUNTAR_EVIDENCIA' && (
          <Campo id="archivoEvidencia" etiqueta="Archivo" ayuda="PDF, JPG o PNG de hasta 10 MB. Un archivo por vez. Conviene registrar primero la evaluación.">
            <input
              id="archivoEvidencia"
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
              onChange={(e) => cambiar('archivo', e.target.files?.[0])}
              required
              aria-invalid={Boolean(errorArchivo)}
              aria-describedby={errorArchivo ? 'archivoEvidenciaError' : 'archivoEvidencia-ayuda'}
            />
            {errorArchivo && (
              <p id="archivoEvidenciaError" role="alert" className="expediente-ayuda expediente-error">
                {errorArchivo}
              </p>
            )}
          </Campo>
        )}

        {accion === 'ELABORAR_RESPUESTA' && (
          <>
            {ultimaObservada?.comentarioRevision && (
              <div className="expediente-aviso" role="note">
                <strong>Observación de {ultimaObservada.revisadoPor || 'el supervisor'}:</strong> {ultimaObservada.comentarioRevision}
              </div>
            )}
            <Campo id="resultado" etiqueta="Resultado">
              <select id="resultado" value={datos.resultado ?? ''} onChange={(e) => cambiar('resultado', e.target.value as ResultadoReclamo)} required>
                <option value="" disabled>Elige el resultado</option>
                {RESULTADOS.map((r) => <option key={r} value={r}>{ETIQUETAS_RESULTADO[r]}</option>)}
              </select>
            </Campo>
            <AreaTexto id="respuesta" etiqueta="Respuesta para el ciudadano" ayuda="Es el texto que recibirá el ciudadano." valor={datos.respuesta} onChange={(v) => cambiar('respuesta', v)} filas={4} obligatorio minimo={10} maximo={4000} />
            <AreaTexto id="fundamentos" etiqueta="Fundamentos" ayuda="En qué se basa la respuesta." valor={datos.fundamentos} onChange={(v) => cambiar('fundamentos', v)} obligatorio minimo={10} maximo={4000} />
            <AreaTexto id="accionesCorrectivas" etiqueta="Acciones correctivas (opcional)" valor={datos.accionesCorrectivas} onChange={(v) => cambiar('accionesCorrectivas', v)} filas={2} maximo={4000} />
          </>
        )}

        {revisaRespuesta && respuestaEnRevision && (
          <div className="expediente-cita">
            <p className="expediente-cita-pie">Respuesta elaborada por {respuestaEnRevision.elaboradoPor}</p>
            <p><strong>Resultado:</strong> {ETIQUETAS_RESULTADO[respuestaEnRevision.resultado] ?? respuestaEnRevision.resultado}</p>
            <p><strong>Respuesta:</strong> {respuestaEnRevision.respuesta}</p>
            <p><strong>Fundamentos:</strong> {respuestaEnRevision.fundamentos}</p>
            {respuestaEnRevision.accionesCorrectivas && <p><strong>Acciones correctivas:</strong> {respuestaEnRevision.accionesCorrectivas}</p>}
          </div>
        )}
        {revisaRespuesta && !ticket.respuestas && (
          <p className="expediente-ayuda" role="status">Cargando la respuesta por aprobar…</p>
        )}

        {accion === 'OBSERVAR_RESPUESTA' && (
          <AreaTexto id="comentarioRevision" etiqueta="Qué debe corregir el funcionario" valor={datos.comentario} onChange={(v) => cambiar('comentario', v)} obligatorio minimo={3} maximo={1000} />
        )}

        {(accion === 'DEVOLVER_PARA_REASIGNAR' || accion === 'DECLARAR_IMPROCEDENTE') && (
          <AreaTexto
            id="motivo"
            etiqueta={accion === 'DECLARAR_IMPROCEDENTE' ? 'Motivo de la improcedencia' : '¿Por qué no corresponde a esta área o funcionario?'}
            ayuda={accion === 'DECLARAR_IMPROCEDENTE' ? 'Escríbelo tal como lo leerá el ciudadano.' : undefined}
            valor={datos.motivo}
            onChange={(v) => cambiar('motivo', v)}
            obligatorio
            minimo={3}
            maximo={4000}
          />
        )}

        {(accion === 'RECIBIR' || accion === 'VALIDAR' || accion === 'APROBAR_RESPUESTA' || accion === 'NOTA') && (
          <AreaTexto
            id="comentario"
            etiqueta={accion === 'NOTA' ? 'Nota (solo la ve el personal)' : 'Comentario (opcional)'}
            valor={datos.comentario}
            onChange={(v) => cambiar('comentario', v)}
            filas={2}
            obligatorio={accion === 'NOTA'}
            minimo={accion === 'NOTA' ? 3 : undefined}
            maximo={2000}
          />
        )}
      </fieldset>
    </form>
  );
};
