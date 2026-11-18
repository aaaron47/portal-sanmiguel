'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import {
  Send,
  RotateCcw,
  Sparkles,
  Layers,
  X,
} from 'lucide-react';
import {
  ModoConsultaIA,
  ModuloAnalitico,
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

const SECUENCIA_PUNTOS = ['.', '..', '...', '..', '.', ''] as const;

function limpiarTextoRespuesta(texto: string): string {
  return texto
    .replace(/<think>[\s\S]*?<\/think>/gi, '')
    .replace(/<think>[\s\S]*$/gi, '')
    .replace(/<tool_call>[\s\S]*?<\/tool_call>/gi, '')
    .replace(/^\s*(?:\*\*|__)?Herramientas usadas:(?:\*\*|__)?[^\n]*/gim, '')
    .replace(
      /^\s*(?:\*\*|__)?Elementos creados en Superset:(?:\*\*|__)?[^\n]*(?:\n(?![ \t]*\n)[^\n]+)*/gim,
      ''
    )
    .replace(/\n{3,}/g, '\n\n')
    .trim();
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
  const [pasoPuntos, setPasoPuntos] = useState(0);
  const [proveedorModelo, setProveedorModelo] = useState<ProveedorModeloIA>(modeloInicial);
  const [errorApiTexto, setErrorApiTexto] = useState<string | null>(null);

  useEffect(() => {
    if (!isGenerating) return;
    const id = window.setInterval(() => {
      setPasoPuntos((prev) => (prev + 1) % SECUENCIA_PUNTOS.length);
    }, 350);
    return () => window.clearInterval(id);
  }, [isGenerating]);

  useEffect(() => {
    let cancelado = false;
    iaDashboardsController
      .getEstadoIa()
      .then((estado) => {
        if (cancelado) return;
        if (estado.api === 'NO_CONFIGURADO' && proveedorModelo === 'API' && estado.modelo === 'DISPONIBLE') {
          setProveedorModelo('LOCAL');
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
      setPasoPuntos(0);
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
          dashboardSugeridoId: resp.dashboardSugeridoId,
          dashboardGenerado: resp.dashboardGenerado,
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
    ]
  );

  const reiniciarConversacion = () => {
    setMensajes([]);
    setPrompt('');
    setErrorApiTexto(null);
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
                  <MarkdownRenderer content={limpiarTextoRespuesta(m.texto)} />
                )}

                {m.dashboardGenerado && onVisualizarDashboard && (
                  <button
                    type="button"
                    onClick={() => onVisualizarDashboard(m.dashboardGenerado!.id, m.dashboardGenerado)}
                    className="btn btn-primary"
                    style={{
                      marginTop: '0.55rem',
                      fontSize: '0.73rem',
                      padding: '0.32rem 0.65rem',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                    }}
                  >
                    <Layers size={12} />
                    <span>Ver tablero: {m.dashboardGenerado.titulo}</span>
                  </button>
                )}
              </div>
            </div>
          ))
        )}

        {isGenerating && (
          <div
            style={{
              display: 'flex',
              gap: '0.45rem',
              alignSelf: 'flex-start',
              maxWidth: '94%',
            }}
          >
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

            <div
              style={{
                background: 'var(--bg-card-subtle)',
                color: 'var(--text-muted)',
                borderRadius: '10px',
                padding: '0.55rem 0.8rem',
                fontSize: '0.78rem',
                border: '1px solid var(--border-color)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
              }}
            >
              <Sparkles size={14} className="spin-anim" color="var(--sky-600)" />
              <span>
                Procesando
                <span style={{ display: 'inline-block', width: '1.25em', textAlign: 'left' }}>
                  {SECUENCIA_PUNTOS[pasoPuntos]}
                </span>
              </span>
            </div>
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
            {opcionesModelo.map((opt) => (
              <option key={opt.valor} value={opt.valor}>
                {opt.etiqueta}
              </option>
            ))}
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
