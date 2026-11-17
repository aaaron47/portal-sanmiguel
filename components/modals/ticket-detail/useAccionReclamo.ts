import { useState } from 'react';
import { useAreas } from '@/components/shared/hooks/useAreas';
import { mensajeErrorApi } from '@/services/api-client.service';
import { AccionCodigo, AccionTicket, CategoriaReclamo, DatosAccion, OnAccionTicket, Ticket } from '@/types/ticket.types';
import { FuncionarioOpcion, MENSAJES_ERROR_RECLAMO, errorArchivoEvidencia, puede } from '@/utils/ticket.utils';

interface OpcionesAccionReclamo {
  ticket: Ticket;
  initialAction: AccionTicket;
  /** Funcionarios para asignar o reasignar (solo el supervisor). */
  funcionarios: FuncionarioOpcion[];
  onAccion: OnAccionTicket;
}

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

/**
 * Estado de la acción abierta en el expediente: qué acción es, lo escrito en su formulario, si se está
 * guardando y el error del último intento. El formulario y los botones del pie leen de aquí.
 */
export function useAccionReclamo({ ticket, initialAction, funcionarios, onAccion }: OpcionesAccionReclamo) {
  const inicial: AccionTicket = initialAction !== 'ninguna' && puede(ticket, initialAction) ? initialAction : 'ninguna';
  const [accion, setAccion] = useState<AccionTicket>(inicial);
  const [datos, setDatos] = useState<DatosAccion>(() => datosIniciales(inicial, ticket));
  // true cuando la persona ya escribió o eligió algo: antes de descartarlo se le pregunta.
  const [conCambios, setConCambios] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { areas } = useAreas();

  const cambiarVarios = (parcial: Partial<DatosAccion>) => {
    setDatos((d) => ({ ...d, ...parcial }));
    setConCambios(true);
  };
  const cambiar = <K extends keyof DatosAccion>(campo: K, valor: DatosAccion[K]) =>
    cambiarVarios({ [campo]: valor } as Partial<DatosAccion>);

  const abrir = (a: AccionCodigo) => {
    setDatos(datosIniciales(a, ticket));
    setAccion(a);
    setConCambios(false);
    setError(null);
  };
  const cerrar = () => {
    setAccion('ninguna');
    setDatos({});
    setConCambios(false);
    setError(null);
  };

  // Asignar: funcionarios activos del área elegida. Reasignar: del área del reclamo, sin el actual.
  const areaElegida = areas.find((a) => a.id === datos.areaId);
  const funcionariosAsignables = funcionarios.filter((f) => f.activo && areaElegida && f.area === areaElegida.nombre);
  const funcionariosReasignables = funcionarios.filter(
    (f) => f.activo && f.area === ticket.areaAsignada && f.id !== ticket.funcionarioAsignadoId
  );
  const sinFuncionarios =
    (accion === 'ASIGNAR' && Boolean(datos.areaId) && funcionariosAsignables.length === 0) ||
    (accion === 'REASIGNAR' && funcionariosReasignables.length === 0);
  // El archivo elegido se revisa antes de enviarlo (tipo y tamaño); el backend lo vuelve a comprobar.
  const errorArchivo = accion === 'ADJUNTAR_EVIDENCIA' && datos.archivo ? errorArchivoEvidencia(datos.archivo) : null;
  const bloqueado = enviando || sinFuncionarios || Boolean(errorArchivo);

  const enviar = async () => {
    if (accion === 'ninguna' || bloqueado) return;
    const paraEnviar =
      accion === 'REASIGNAR'
        ? { ...datos, funcionarioNombre: funcionarios.find((f) => f.id === datos.funcionarioId)?.nombre }
        : datos;
    setEnviando(true);
    setError(null);
    try {
      await onAccion(ticket, accion, paraEnviar);
      cerrar();
    } catch (err) {
      // El formulario queda abierto con lo escrito, y el motivo queda a la vista junto al botón para reintentar.
      setError(mensajeErrorApi(err, 'No se pudo guardar la acción. Inténtalo de nuevo.', MENSAJES_ERROR_RECLAMO));
    } finally {
      setEnviando(false);
    }
  };

  return {
    accion,
    datos,
    conCambios,
    enviando,
    error,
    areas,
    funcionariosAsignables,
    funcionariosReasignables,
    sinFuncionarios,
    errorArchivo,
    bloqueado,
    cambiar,
    cambiarVarios,
    abrir,
    cerrar,
    enviar,
  };
}

export type AccionReclamo = ReturnType<typeof useAccionReclamo>;
