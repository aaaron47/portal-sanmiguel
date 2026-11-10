'use client';

import React, { useState, useCallback } from 'react';
import {
  Send,
  Bot,
  User,
  RotateCcw,
  Sparkles,
  Layers,
  X,
  CheckCircle2,
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
  iaDashboardsController,
  obtenerOpcionesSelectorModelo,
} from '@/controllers/ia-dashboards.controller';
import { mensajeErrorApi } from '@/services/api-client.service';

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
  modeloInicial = 'LOCAL',
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
          fuentesConsultadas: resp.fuentesConsultadas,
          dashboardSugeridoId: resp.dashboardSugeridoId,
          dashboardGenerado: resp.dashboardGenerado,
          graficoTitulo: resp.graficoTitulo,
          metricas: resp.metricas,
        };

        setMensajes((prev) => [...prev, respuestaBot]);
      } catch (err) {
        setErrorApiTexto(
          mensajeErrorApi(err, 'No se pudo procesar la consulta en el asistente de IA. Inténtalo de nuevo.')
        );
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
          <Sparkles size={16} color="var(--sky-600)" />
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
              gap: '0.5rem',
            }}
          >
            <Bot size={28} style={{ opacity: 0.35 }} />
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
                    background: 'var(--sky-100)',
                    color: 'var(--sky-700)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Bot size={13} />
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
                <div>{m.texto}</div>

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
                      Agregado a Generados por IA
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--sky-600)', fontSize: '0.76rem' }}>
            <Sparkles size={13} className="spin-anim" />
            <span>Analizando...</span>
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
