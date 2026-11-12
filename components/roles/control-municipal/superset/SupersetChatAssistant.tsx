'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import {
  Send,
  User,
  RotateCcw,
  Sparkles,
  Layers,
  X,
  CheckCircle2,
  AlertTriangle,
  Clock,
} from 'lucide-react';
import {
  EstadoIaBiResponse,
  ModoConsultaIA,
  ModuloAnalitico,
  ProgresoChatIA,
  ProveedorModeloIA,
  SupersetChatMessage,
  SupersetDashboardInfo,
} from '@/types/superset.types';
import {
  CONFIG_MODULOS_IA,
  DASHBOARDS_SUPERSET_CONTROL_MUNICIPAL,
  ErrorTrabajoIa,
  formatearErrorIaBackend,
  iaDashboardsController,
  obtenerOpcionesSelectorModelo,
} from '@/controllers/ia-dashboards.controller';
import { MarkdownRenderer } from '@/components/shared/ui/MarkdownRenderer';

interface SupersetChatAssistantProps {
  modulo?: ModuloAnalitico;
  dashboardsDisponibles?: SupersetDashboardInfo[];
  modoInicial?: ModoConsultaIA;
  modeloInicial?: ProveedorModeloIA;
  dashboardContextoInicialId?: string;
  isFullscreen?: boolean;
  onVisualizarDashboard?: (dashboardId: string, dashboardObj?: SupersetDashboardInfo) => void;
  onDashboardGenerado?: (nuevoDashboard: SupersetDashboardInfo) => void;
  onCerrar?: () => void;
}

let contadorMensajes = 100;
function generarIdMensaje(prefijo: string): string {
  contadorMensajes += 1;
  return `${prefijo}-${contadorMensajes}`;
}

export const SupersetChatAssistant: React.FC<SupersetChatAssistantProps> = ({
  modulo = 'CONTROL_MUNICIPAL',
  dashboardsDisponibles = DASHBOARDS_SUPERSET_CONTROL_MUNICIPAL,
  modoInicial = 'CONSULTA_DATOS',
  modeloInicial = 'API',
  dashboardContextoInicialId,
  isFullscreen = false,
  onVisualizarDashboard,
  onDashboardGenerado,
  onCerrar,
}) => {
  const [mensajes, setMensajes] = useState<SupersetChatMessage[]>([]);
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [proveedorModelo, setProveedorModelo] = useState<ProveedorModeloIA>(modeloInicial);
  const [errorApiTexto, setErrorApiTexto] = useState<string | null>(null);
  const [progresoLive, setProgresoLive] = useState<ProgresoChatIA | null>(null);
  const [estadoIa, setEstadoIa] = useState<EstadoIaBiResponse | null>(null);
  const [avisoCola, setAvisoCola] = useState<string | null>(null);

  const consultarEstadoIa = useCallback(async () => {
    try {
      const estado = await iaDashboardsController.getEstadoIa();
      setEstadoIa(estado);
      const enCola =
        proveedorModelo === 'LOCAL' ? estado.trabajosPendientes : estado.trabajosPendientesApi;
      if (enCola > 0) {
        setAvisoCola(`Hay ${enCola} pregunta${enCola > 1 ? 's' : ''} por delante en la cola.`);
      } else {
        setAvisoCola(null);
      }
    } catch {
      // Si el endpoint de estado no responde (modo demo o sin backend)
    }
  }, [proveedorModelo]);

  useEffect(() => {
    let cancelado = false;
    iaDashboardsController
      .getEstadoIa()
      .then((estado) => {
        if (cancelado) return;
        setEstadoIa(estado);
        if (estado.api === 'NO_CONFIGURADO' && proveedorModelo === 'API' && estado.modelo === 'DISPONIBLE') {
          setProveedorModelo('LOCAL');
        }
        const enCola =
          proveedorModelo === 'LOCAL' ? estado.trabajosPendientes : estado.trabajosPendientesApi;
        if (enCola > 0) {
          setAvisoCola(`Hay ${enCola} pregunta${enCola > 1 ? 's' : ''} por delante en la cola.`);
        } else {
          setAvisoCola(null);
        }
      })
      .catch(() => {
        // Ignorar si endpoint de estado no está disponible
      });

    return () => {
      cancelado = true;
    };
  }, [proveedorModelo]);

  const configModulo = CONFIG_MODULOS_IA[modulo] || CONFIG_MODULOS_IA.CONTROL_MUNICIPAL;
  const opcionesModelo = obtenerOpcionesSelectorModelo(modulo);
  const nombreModeloActivo =
    proveedorModelo === 'LOCAL' ? configModulo.modeloLocalNombre : configModulo.modeloApiNombre;
  const tieneTexto = prompt.trim().length > 0;

  const enviarConsulta = useCallback(
    async (textoConsulta: string, modoForzado?: ModoConsultaIA) => {
      if (!textoConsulta.trim() || isGenerating) return;

      const modoInferido: ModoConsultaIA =
        modoForzado ||
        (modoInicial === 'GENERAR_DASHBOARD' && mensajes.length === 0
          ? 'GENERAR_DASHBOARD'
          : 'CONSULTA_DATOS');

      setErrorApiTexto(null);
      setProgresoLive(null);

      const userMsg: SupersetChatMessage = {
        id: generarIdMensaje('usr'),
        rol: 'user',
        texto: textoConsulta,
        fecha: 'Ahora',
        modo: modoInferido,
        proveedorModelo,
        nombreModelo: nombreModeloActivo,
      };

      const historialActual = mensajes.map((m) => ({
        rol: m.rol,
        texto: m.texto,
      }));

      setMensajes((prev) => [...prev, userMsg]);
      setPrompt('');
      setIsGenerating(true);

      try {
        const resp = await iaDashboardsController.enviarConsultaChat({
          modulo,
          modo: modoInferido,
          proveedorModelo,
          mensaje: textoConsulta,
          dashboardContextoActivoId: dashboardContextoInicialId,
          dashboardContextoIds: dashboardsDisponibles.map((d) => d.id),
          historial: historialActual,
          onProgreso: (p) => setProgresoLive(p),
        });

        if (resp.dashboardGenerado && onDashboardGenerado) {
          onDashboardGenerado(resp.dashboardGenerado);
        }

        const respuestaBot: SupersetChatMessage = {
          id: generarIdMensaje('bot'),
          rol: 'assistant',
          texto: resp.texto,
          fecha: 'Ahora',
          modo: resp.modo,
          proveedorModelo: resp.proveedorModelo,
          nombreModelo: resp.nombreModelo,
          fuentesConsultadas: resp.fuentesConsultadas,
          dashboardSugeridoId: resp.dashboardSugeridoId,
          dashboardGenerado: resp.dashboardGenerado,
          graficoTitulo: resp.graficoTitulo,
          metricas: resp.metricas,
          pasos: resp.pasos,
          creados: resp.creados,
          segundos: resp.segundos,
        };

        setMensajes((prev) => [...prev, respuestaBot]);
      } catch (err) {
        if (err instanceof ErrorTrabajoIa) {
          const respuestaError: SupersetChatMessage = {
            id: generarIdMensaje('bot-err'),
            rol: 'assistant',
            texto: `El asistente no pudo completar todo el proceso: ${err.message}`,
            fecha: 'Ahora',
            estado: 'error',
            creados: err.creados,
            pasos: err.pasos,
            proveedorModelo,
            nombreModelo: nombreModeloActivo,
          };
          setMensajes((prev) => [...prev, respuestaError]);
        } else {
          setErrorApiTexto(
            formatearErrorIaBackend(err, 'No se pudo procesar la consulta en el asistente de IA. Inténtalo de nuevo.')
          );
        }
      } finally {
        setIsGenerating(false);
        setProgresoLive(null);
        consultarEstadoIa();
      }
    },
    [
      isGenerating,
      modoInicial,
      mensajes,
      proveedorModelo,
      nombreModeloActivo,
      dashboardContextoInicialId,
      dashboardsDisponibles,
      modulo,
      onDashboardGenerado,
      consultarEstadoIa,
    ]
  );

  const reiniciarConversacion = () => {
    setMensajes([]);
    setPrompt('');
    setErrorApiTexto(null);
    setProgresoLive(null);
  };

  return (
    <aside
      className="card"
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: isFullscreen ? 'calc(100vh - 2rem)' : '100%',
        minHeight: '540px',
        maxHeight: isFullscreen ? 'calc(100vh - 2rem)' : '80vh',
        padding: '0.9rem 1rem',
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
      }}
    >
      {/* 1. Cabecera limpia: solo título y botón de cerrar (sin etiquetas ni switches de modelo) */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.5rem',
          paddingBottom: '0.7rem',
          marginBottom: '0.7rem',
          borderBottom: '1px solid var(--border-color)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
          <strong style={{ fontSize: '0.9rem', color: 'var(--text-main)' }}>Asistente San Miguel</strong>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          {mensajes.length > 0 && (
            <button
              type="button"
              onClick={reiniciarConversacion}
              className="btn btn-secondary"
              style={{ fontSize: '0.7rem', padding: '0.28rem 0.45rem' }}
              title="Limpiar conversación"
            >
              <RotateCcw size={12} />
            </button>
          )}

          {onCerrar && (
            <button
              type="button"
              onClick={onCerrar}
              className="btn btn-secondary"
              style={{ fontSize: '0.7rem', padding: '0.28rem 0.45rem' }}
              aria-label="Cerrar panel de IA"
              title="Cerrar panel de IA"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {errorApiTexto && (
        <div className="alert-warning-box" style={{ marginBottom: '0.6rem', padding: '0.5rem 0.75rem', fontSize: '0.75rem' }}>
          <span>{errorApiTexto}</span>
        </div>
      )}

      {avisoCola && (
        <div
          style={{
            marginBottom: '0.5rem',
            padding: '0.4rem 0.65rem',
            fontSize: '0.72rem',
            borderRadius: '6px',
            background: 'var(--amber-50)',
            color: 'var(--amber-800)',
            border: '1px solid var(--amber-200)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
          }}
        >
          <Clock size={13} />
          <span>{avisoCola}</span>
        </div>
      )}

      {proveedorModelo === 'LOCAL' && estadoIa?.modelo && estadoIa.modelo !== 'DISPONIBLE' && (
        <div
          style={{
            marginBottom: '0.5rem',
            padding: '0.4rem 0.65rem',
            fontSize: '0.72rem',
            borderRadius: '6px',
            background: 'var(--amber-50)',
            color: 'var(--amber-800)',
            border: '1px solid var(--amber-200)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
          }}
        >
          <AlertTriangle size={13} />
          <span>
            {estadoIa.modelo === 'SIN_RESPUESTA'
              ? 'El modelo local no responde actualmente. Puedes alternar al modelo API.'
              : 'El modelo local no está configurado.'}
          </span>
        </div>
      )}

      {proveedorModelo === 'API' && estadoIa?.api === 'NO_CONFIGURADO' && (
        <div
          style={{
            marginBottom: '0.5rem',
            padding: '0.4rem 0.65rem',
            fontSize: '0.72rem',
            borderRadius: '6px',
            background: 'var(--amber-50)',
            color: 'var(--amber-800)',
            border: '1px solid var(--amber-200)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
          }}
        >
          <AlertTriangle size={13} />
          <span>La API de Claude no está configurada en el servidor. Puedes alternar al modelo local.</span>
        </div>
      )}

      {/* 2. Área de Mensajes y Zero State limpio (sin tarjetas grandes ni bloques verdes) */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.7rem',
          paddingRight: '0.2rem',
        }}
      >
        {mensajes.length === 0 ? (
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              padding: '1.5rem 1rem',
              color: 'var(--text-muted)',
              gap: '0.65rem',
            }}
          >
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '6px',
                boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
                overflow: 'hidden',
              }}
            >
              <Image
                src="/icon.png"
                alt="Municipalidad de San Miguel"
                width={34}
                height={34}
                style={{ objectFit: 'contain' }}
              />
            </div>
            <p style={{ fontSize: '0.8rem', margin: 0, maxWidth: '240px', lineHeight: 1.45 }}>
              Realiza consultas cruzadas sobre los dashboards o solicita generar un nuevo tablero.
            </p>
          </div>
        ) : (
          mensajes.map((m) => (
            <div
              key={m.id}
              style={{
                display: 'flex',
                gap: '0.45rem',
                alignSelf: m.rol === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '94%',
              }}
            >
              {m.rol === 'assistant' && (
                <div
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    overflow: 'hidden',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                  }}
                >
                  <Image
                    src="/icon.png"
                    alt="San Miguel"
                    width={18}
                    height={18}
                    style={{ objectFit: 'contain' }}
                  />
                </div>
              )}

              <div
                style={{
                  background: m.rol === 'user' ? 'var(--sky-600)' : 'var(--bg-card-subtle)',
                  color: m.rol === 'user' ? 'white' : 'var(--text-main)',
                  borderRadius: '10px',
                  padding: '0.6rem 0.8rem',
                  fontSize: '0.79rem',
                  border: m.rol === 'user' ? 'none' : '1px solid var(--border-color)',
                }}
              >
                {m.rol === 'user' ? (
                  <div>{m.texto}</div>
                ) : (
                  <MarkdownRenderer content={m.texto} />
                )}

                {/* Fuentes cruzadas */}
                {m.fuentesConsultadas && m.fuentesConsultadas.length > 0 && (
                  <div style={{ marginTop: '0.4rem', display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                    {m.fuentesConsultadas.map((f, idx) => (
                      <span
                        key={idx}
                        style={{
                          fontSize: '0.64rem',
                          padding: '0.1rem 0.38rem',
                          borderRadius: '4px',
                          background: 'var(--bg-card)',
                          border: '1px solid var(--border-color)',
                          color: 'var(--sky-700)',
                          fontWeight: 600,
                        }}
                      >
                        {f}
                      </span>
                    ))}
                  </div>
                )}

                {/* Métricas inline */}
                {m.metricas && m.metricas.length > 0 && (
                  <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                    {m.metricas.map((item, i) => (
                      <div
                        key={i}
                        style={{
                          background: 'var(--bg-card)',
                          padding: '0.3rem 0.5rem',
                          borderRadius: '6px',
                          border: '1px solid var(--border-color)',
                        }}
                      >
                        <span style={{ fontSize: '0.64rem', color: 'var(--text-muted)', display: 'block' }}>
                          {item.label}
                        </span>
                        <strong
                          style={{
                            fontSize: '0.78rem',
                            color: item.positivo === false ? 'var(--red-600)' : 'var(--green-600)',
                          }}
                        >
                          {item.valor}
                        </strong>
                      </div>
                    ))}
                  </div>
                )}

                {/* Si se creó un nuevo dashboard */}
                {m.dashboardGenerado && (
                  <div
                    style={{
                      marginTop: '0.55rem',
                      padding: '0.55rem',
                      borderRadius: '8px',
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-color)',
                      color: 'var(--text-main)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700, fontSize: '0.73rem', marginBottom: '0.35rem' }}>
                      <CheckCircle2 size={13} color="var(--green-600)" />
                      Agregado a Borradores
                    </div>
                    {onVisualizarDashboard && (
                      <button
                        type="button"
                        onClick={() => onVisualizarDashboard(m.dashboardGenerado!.id, m.dashboardGenerado)}
                        className="btn btn-primary"
                        style={{ fontSize: '0.72rem', padding: '0.28rem 0.6rem', width: '100%' }}
                      >
                        <Layers size={12} />
                        Ver en el panel central
                      </button>
                    )}
                  </div>
                )}

                {/* Si se alcanzaron a crear elementos en Superset (incluso ante error) */}
                {m.creados && m.creados.length > 0 && (
                  <div
                    style={{
                      marginTop: '0.45rem',
                      padding: '0.45rem 0.6rem',
                      borderRadius: '8px',
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-color)',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        color: 'var(--text-main)',
                        marginBottom: '0.25rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                      }}
                    >
                      <Layers size={12} color="var(--sky-600)" />
                      <span>Elementos creados en Superset:</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                      {m.creados.map((item, idx) => (
                        <div
                          key={idx}
                          style={{
                            fontSize: '0.7rem',
                            padding: '0.2rem 0.4rem',
                            borderRadius: '4px',
                            background: 'var(--bg-card-subtle)',
                            border: '1px solid var(--border-color)',
                            color: 'var(--text-main)',
                            fontFamily: 'var(--font-mono)',
                          }}
                        >
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Herramientas MCP y tiempo de respuesta del asistente */}
                {((m.pasos && m.pasos.length > 0) || m.segundos !== undefined) && (
                  <div
                    style={{
                      marginTop: '0.45rem',
                      paddingTop: '0.35rem',
                      borderTop: '1px solid var(--border-color)',
                      fontSize: '0.67rem',
                      color: 'var(--text-muted)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.2rem',
                    }}
                  >
                    {m.pasos && m.pasos.length > 0 && (
                      <div>
                        <span style={{ fontWeight: 600 }}>Herramientas usadas: </span>
                        <span>{m.pasos.join(', ')}</span>
                      </div>
                    )}
                    {m.segundos !== undefined && (
                      <div style={{ fontStyle: 'italic', fontSize: '0.63rem' }}>
                        Listo en {m.segundos}s · {m.nombreModelo || (m.proveedorModelo === 'API' ? 'Claude Opus' : 'San Miguel 1')}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {m.rol === 'user' && (
                <div
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: 'var(--slate-200)',
                    color: 'var(--slate-700)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <User size={13} />
                </div>
              )}
            </div>
          ))
        )}

        {isGenerating && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.35rem',
              padding: '0.65rem 0.8rem',
              background: 'var(--bg-card-subtle)',
              border: '1px solid var(--border-color)',
              borderRadius: '10px',
              maxWidth: '94%',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: 'var(--sky-700)', fontWeight: 600, fontSize: '0.78rem' }}>
                <Sparkles size={14} className="spin-anim" />
                <span>
                  {progresoLive?.estado
                    ? `${progresoLive.estado}…`
                    : `Procesando en ${nombreModeloActivo}…`}
                </span>
              </div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700 }}>
                {progresoLive?.segundos !== undefined ? `${progresoLive.segundos}s` : 'Iniciando…'}
              </span>
            </div>

            {proveedorModelo === 'LOCAL' && (
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', lineHeight: 1.35 }}>
                Inferencia privada en CPU (San Miguel 1): una respuesta suele tardar de decenas de segundos a minutos.
              </div>
            )}

            {proveedorModelo === 'API' && (
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', lineHeight: 1.35 }}>
                Inferencia vía API ({nombreModeloActivo}): respuesta rápida con herramientas MCP de Superset (~15–20s).
              </div>
            )}

            {progresoLive?.pasos && progresoLive.pasos.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', flexWrap: 'wrap', marginTop: '0.2rem' }}>
                <span style={{ fontSize: '0.66rem', fontWeight: 600, color: 'var(--text-main)' }}>Herramientas:</span>
                {progresoLive.pasos.map((p, idx) => (
                  <span
                    key={idx}
                    style={{
                      fontSize: '0.64rem',
                      padding: '0.1rem 0.35rem',
                      borderRadius: '4px',
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-color)',
                      color: 'var(--sky-700)',
                      fontFamily: 'monospace',
                    }}
                  >
                    {p}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 3. Barra de Input con selector de modelo integrado a la izquierda y botón de envío reactivo */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          enviarConsulta(prompt);
        }}
        style={{
          marginTop: '0.6rem',
          paddingTop: '0.55rem',
          borderTop: '1px solid var(--border-color)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
            background: 'var(--bg-app)',
            borderRadius: '12px',
            border: '1px solid var(--border-color)',
            padding: '0.3rem 0.4rem 0.3rem 0.55rem',
          }}
        >
          {/* Selector minimalista de modelo integrado a la izquierda del input */}
          <select
            aria-label="Modelo de IA"
            value={proveedorModelo}
            onChange={(e) => setProveedorModelo(e.target.value as ProveedorModeloIA)}
            disabled={isGenerating}
            title={
              opcionesModelo.find((o) => o.valor === proveedorModelo)?.descripcion ||
              'Seleccionar modelo de IA'
            }
            style={{
              border: 'none',
              borderRight: '1px solid var(--border-color)',
              background: 'transparent',
              color: 'var(--text-muted)',
              fontSize: '0.72rem',
              fontWeight: 700,
              padding: '0.2rem 0.4rem 0.2rem 0',
              marginRight: '0.15rem',
              outline: 'none',
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            {opcionesModelo.map((opt) => {
              let sufijo = '';
              if (opt.valor === 'LOCAL' && estadoIa?.modelo && estadoIa.modelo !== 'DISPONIBLE') {
                sufijo = estadoIa.modelo === 'SIN_RESPUESTA' ? ' (Sin respuesta)' : ' (No config.)';
              } else if (opt.valor === 'API' && estadoIa?.api === 'NO_CONFIGURADO') {
                sufijo = ' (No config.)';
              }
              return (
                <option key={opt.valor} value={opt.valor}>
                  {opt.etiqueta}
                  {sufijo}
                </option>
              );
            })}
          </select>

          <input
            type="text"
            placeholder="Escribe una consulta..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            disabled={isGenerating}
            style={{
              flex: 1,
              minWidth: 0,
              border: 'none',
              background: 'transparent',
              outline: 'none',
              fontSize: '0.8rem',
              color: 'var(--text-main)',
              padding: '0.2rem 0.25rem',
            }}
          />

          <button
            type="submit"
            disabled={!tieneTexto || isGenerating}
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '8px',
              background: tieneTexto ? 'var(--sky-600)' : 'var(--slate-200)',
              border: 'none',
              color: tieneTexto ? '#ffffff' : 'var(--slate-400)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: tieneTexto && !isGenerating ? 'pointer' : 'not-allowed',
              transition: 'background-color 0.15s ease, color 0.15s ease',
              flexShrink: 0,
            }}
            title="Enviar mensaje"
          >
            <Send size={13} />
          </button>
        </div>
      </form>
    </aside>
  );
};
