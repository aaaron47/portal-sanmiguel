import React, { useEffect, useRef, useState } from 'react';
import { Download, Eye, EyeOff, FileImage, FileText, Paperclip } from 'lucide-react';
import { TicketAdjunto } from '@/types/ticket.types';
import { ticketsController } from '@/controllers/tickets.controller';
import { MODO_DEMO, mensajeErrorApi } from '@/services/api-client.service';
import { TIPOS_ADJUNTO_PERMITIDOS, tamanoLegible } from '@/utils/ticket.utils';
import { fechaHoraPeru } from '@/utils/fecha-peru.utils';

interface ExpedienteAdjuntosProps {
  ticketId: string;
}

const ETIQUETA_ORIGEN: Record<string, string> = {
  CIUDADANO: 'Del ciudadano',
  EVALUACION: 'Evidencia de la evaluación',
  RESPUESTA: 'De la respuesta',
};

interface VistaPrevia {
  adjuntoId: string;
  url: string;
  tipoMime: string;
  nombre: string;
}

const estiloBoton: React.CSSProperties = { fontSize: '0.75rem', padding: '0.3rem 0.6rem' };

/**
 * Archivos del reclamo: los que adjuntó el ciudadano en la app y las evidencias que subió el personal.
 * El modal lo monta con una `key` por reclamo y por evidencia nueva: así vuelve a leer la lista sin efectos extra.
 */
export const ExpedienteAdjuntos: React.FC<ExpedienteAdjuntosProps> = ({ ticketId }) => {
  const [adjuntos, setAdjuntos] = useState<TicketAdjunto[] | null>(null);
  const [errorLista, setErrorLista] = useState<string | null>(null);
  const [errorArchivo, setErrorArchivo] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState<string | null>(null);
  const [vista, setVista] = useState<VistaPrevia | null>(null);
  // Los archivos ya pedidos se guardan mientras el expediente está abierto, para no bajarlos dos veces.
  const archivos = useRef(new Map<string, Blob>());
  const urlVista = useRef<string | null>(null);

  useEffect(() => {
    let montado = true;
    ticketsController
      .getAdjuntos(ticketId)
      .then((lista) => {
        if (montado) setAdjuntos(lista);
      })
      .catch((err) => {
        if (!montado) return;
        setAdjuntos([]);
        setErrorLista(
          mensajeErrorApi(err, 'Inténtalo de nuevo más tarde.', {
            404: 'El servidor todavía no ofrece los adjuntos de los reclamos.',
          })
        );
      });
    return () => {
      montado = false;
      if (urlVista.current) URL.revokeObjectURL(urlVista.current);
    };
  }, [ticketId]);

  /** Pide el archivo con la sesión del portal. El tipo se fija al declarado y solo si es PDF, JPG o PNG. */
  const obtenerArchivo = async (adjunto: TicketAdjunto): Promise<Blob> => {
    const guardado = archivos.current.get(adjunto.id);
    if (guardado) return guardado;
    const recibido = await ticketsController.descargarAdjunto(ticketId, adjunto.id);
    const tipo = TIPOS_ADJUNTO_PERMITIDOS.includes(adjunto.tipoMime) ? adjunto.tipoMime : 'application/octet-stream';
    const archivo = new Blob([recibido], { type: tipo });
    archivos.current.set(adjunto.id, archivo);
    return archivo;
  };

  const cerrarVista = () => {
    if (urlVista.current) URL.revokeObjectURL(urlVista.current);
    urlVista.current = null;
    setVista(null);
  };

  const conArchivo = async (adjunto: TicketAdjunto, usar: (archivo: Blob) => void) => {
    setErrorArchivo(null);
    setOcupado(adjunto.id);
    try {
      usar(await obtenerArchivo(adjunto));
    } catch (err) {
      const detalle = mensajeErrorApi(err, 'Inténtalo de nuevo.', {
        404: 'No encontramos este archivo. Cierra el expediente y vuelve a abrirlo.',
        ...(MODO_DEMO ? { 0: 'En modo demo no hay archivos: hace falta el servidor.' } : {}),
      });
      setErrorArchivo(`No se pudo abrir "${adjunto.nombreArchivo}". ${detalle}`);
    } finally {
      setOcupado(null);
    }
  };

  const ver = (adjunto: TicketAdjunto) => {
    if (vista?.adjuntoId === adjunto.id) {
      cerrarVista();
      return;
    }
    void conArchivo(adjunto, (archivo) => {
      cerrarVista();
      const url = URL.createObjectURL(archivo);
      urlVista.current = url;
      setVista({ adjuntoId: adjunto.id, url, tipoMime: archivo.type, nombre: adjunto.nombreArchivo });
    });
  };

  const descargar = (adjunto: TicketAdjunto) =>
    void conArchivo(adjunto, (archivo) => {
      const url = URL.createObjectURL(archivo);
      const enlace = document.createElement('a');
      enlace.href = url;
      enlace.download = adjunto.nombreArchivo;
      document.body.appendChild(enlace);
      enlace.click();
      enlace.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    });

  return (
    <div style={{ marginBottom: '1.5rem' }} data-seccion="adjuntos">
      <h4 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem', letterSpacing: '0.03em', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
        <Paperclip size={14} /> Adjuntos y evidencias{adjuntos && adjuntos.length > 0 ? ` (${adjuntos.length})` : ''}
      </h4>

      {adjuntos === null && <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>Cargando archivos…</p>}

      {errorLista && (
        <p role="alert" style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>
          No se pudieron leer los archivos de este reclamo. {errorLista}
        </p>
      )}

      {adjuntos !== null && !errorLista && adjuntos.length === 0 && (
        <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>Este reclamo no tiene archivos adjuntos.</p>
      )}

      {adjuntos !== null && adjuntos.length > 0 && (
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {adjuntos.map((a) => {
            const disponible = a.disponible !== false;
            const sePuedeVer = disponible && TIPOS_ADJUNTO_PERMITIDOS.includes(a.tipoMime);
            const abierto = vista?.adjuntoId === a.id;
            return (
              <li
                key={a.id}
                style={{ background: 'var(--bg-card-subtle)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.6rem 0.75rem', fontSize: '0.825rem' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0, flex: '1 1 240px' }}>
                    {a.tipoMime.startsWith('image/') ? (
                      <FileImage size={18} color="var(--primary-500)" style={{ flexShrink: 0 }} />
                    ) : (
                      <FileText size={18} color="var(--primary-500)" style={{ flexShrink: 0 }} />
                    )}
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-main)', overflowWrap: 'anywhere' }}>{a.nombreArchivo}</div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                        {ETIQUETA_ORIGEN[a.origen] ?? a.origen} · {tamanoLegible(a.tamanoBytes)}
                        {a.subidoPor ? ` · ${a.subidoPor}` : ''} · {fechaHoraPeru(a.subidoEn)}
                      </div>
                    </div>
                  </div>
                  {disponible ? (
                    <div style={{ display: 'flex', gap: '0.4rem', flexShrink: 0 }}>
                      {sePuedeVer && (
                        <button type="button" className="btn btn-secondary" style={estiloBoton} disabled={ocupado !== null} onClick={() => ver(a)} aria-expanded={abierto}>
                          {abierto ? <EyeOff size={14} /> : <Eye size={14} />} {abierto ? 'Ocultar' : 'Ver'}
                        </button>
                      )}
                      <button type="button" className="btn btn-secondary" style={estiloBoton} disabled={ocupado !== null} onClick={() => descargar(a)}>
                        <Download size={14} /> {ocupado === a.id ? 'Abriendo…' : 'Descargar'}
                      </button>
                    </div>
                  ) : (
                    <span
                      title="El archivo lo guardó el sistema anterior de la app y no está en este servidor."
                      style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontStyle: 'italic', flexShrink: 0 }}
                    >
                      Archivo no disponible
                    </span>
                  )}
                </div>
                {abierto && vista && (
                  <div style={{ marginTop: '0.6rem' }}>
                    {vista.tipoMime.startsWith('image/') ? (
                      // eslint-disable-next-line @next/next/no-img-element -- es un archivo local (blob:), no una imagen del sitio
                      <img src={vista.url} alt={`Adjunto ${vista.nombre}`} style={{ maxWidth: '100%', maxHeight: '420px', borderRadius: '6px', border: '1px solid var(--border-color)' }} />
                    ) : (
                      <iframe src={vista.url} title={`Adjunto ${vista.nombre}`} style={{ width: '100%', height: '420px', border: '1px solid var(--border-color)', borderRadius: '6px', background: 'var(--bg-card)' }} />
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {errorArchivo && (
        <p role="alert" style={{ fontSize: '0.8rem', color: 'var(--red-600)', marginTop: '0.5rem' }}>
          {errorArchivo}
        </p>
      )}
    </div>
  );
};
