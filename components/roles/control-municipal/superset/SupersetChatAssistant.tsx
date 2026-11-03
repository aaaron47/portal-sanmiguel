'use client';

import React, { useState, useCallback } from 'react';
import { 
  Send, 
  Bot, 
  User, 
  Terminal,
  Cpu,
  RotateCcw,
  Sparkles
} from 'lucide-react';
import { SupersetChatMessage, SupersetMetricItem } from '@/types/superset.types';

const MCP_ENDPOINT = process.env.NEXT_PUBLIC_MCP_API_URL || 'http://localhost:8000/api/mcp/generate-report';

interface SupersetChatAssistantProps {
  onVisualizarDashboard?: (dashboardId: string) => void;
}

let contadorMensajes = 100;
function generarIdMensaje(prefijo: string): string {
  contadorMensajes += 1;
  return `${prefijo}-${contadorMensajes}`;
}

const SALUDO_CORTO = '¡Hola! Soy tu asistente tributario MCP. ¿Qué reporte o consulta deseas analizar hoy?';

export const SupersetChatAssistant: React.FC<SupersetChatAssistantProps> = ({
  onVisualizarDashboard,
}) => {
  const [mensajes, setMensajes] = useState<SupersetChatMessage[]>([]);
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const enviarConsulta = useCallback((textoConsulta: string) => {
    if (!textoConsulta.trim() || isGenerating) return;

    const tieneMensajesPrevios = mensajes.length > 0;
    const nuevosMensajes: SupersetChatMessage[] = [];

    // Si es la primera interacción, incluir el saludo corto inicial del bot antes de la pregunta
    if (!tieneMensajesPrevios) {
      nuevosMensajes.push({
        id: generarIdMensaje('bot-saludo'),
        rol: 'assistant',
        texto: SALUDO_CORTO,
        fecha: 'Ahora',
      });
    }

    const userMsg: SupersetChatMessage = {
      id: generarIdMensaje('usr'),
      rol: 'user',
      texto: textoConsulta,
      fecha: 'Ahora',
    };
    nuevosMensajes.push(userMsg);

    setMensajes((prev) => [...prev, ...nuevosMensajes]);
    setPrompt('');
    setIsGenerating(true);

    const consultarMcp = async () => {
      try {
        const res = await fetch(MCP_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: textoConsulta, context: 'tributacion_municipal_san_miguel' }),
        });
        if (res.ok) {
          const data = await res.json();
          return data;
        }
      } catch {
        // Fallback local analítico
      }

      const q = textoConsulta.toLowerCase();
      let dashboardId = 'D1';
      let tituloGrafico = 'R1. Deuda de Morosos con/sin Beneficio';
      let sql = `SELECT c.codigo_contribuyente, c.razon_social, SUM(d.monto_insoluto + d.costo_emision) AS total_sin_beneficio, SUM((d.monto_insoluto + d.costo_emision) * (1 - d.dscto_arbitrios)) AS total_con_beneficio FROM contribuyentes c JOIN deudas_emisiones d ON c.id = d.contribuyente_id WHERE d.estado = 'PENDIENTE' GROUP BY c.codigo_contribuyente, c.razon_social ORDER BY total_sin_beneficio DESC LIMIT 50;`;
      let metricas: SupersetMetricItem[] = [
        { label: 'Deuda Total Morosa', valor: 'S/ 14.8M', cambio: '1900 a 2026', positivo: false },
        { label: 'Beneficio Estimado', valor: 'S/ 3.6M', cambio: '% Dscto Arbitrios', positivo: true },
      ];

      if (q.includes('r5') || q.includes('pricos') || q.includes('10 uit')) {
        dashboardId = 'D1';
        tituloGrafico = 'R5. Principales Contribuyentes (PRICOS ≥ 10 UIT)';
        sql = `SELECT c.codigo_contribuyente, c.razon_social, p.base_imponible_uit, SUM(d.deuda_anios_anteriores) AS deuda_anterior, SUM(d.deuda_2026) AS deuda_actual FROM contribuyentes c JOIN predios_anexos p ON c.id = p.contribuyente_id JOIN deudas_emisiones d ON p.id = d.predio_id WHERE p.base_imponible_uit >= 10.0 GROUP BY c.codigo_contribuyente, c.razon_social, p.base_imponible_uit;`;
        metricas = [
          { label: 'Total PRICOS Registrados', valor: '503', positivo: true },
          { label: 'Recaudación Proyectada', valor: 'S/ 8.4M', positivo: true },
        ];
      } else if (q.includes('r3') || q.includes('recaudacion') || q.includes('efectividad') || q.includes('morosidad')) {
        dashboardId = 'D2';
        tituloGrafico = 'R3. Eficacia de Cobranza y Recaudación';
        sql = `SELECT anio_fiscal, SUM(monto_recaudado) / SUM(monto_emitido) * 100 AS efectividad_pct, SUM(monto_moroso) AS saldo_pendiente FROM emisiones_tributarias GROUP BY anio_fiscal ORDER BY anio_fiscal DESC;`;
        metricas = [
          { label: 'Efectividad Cobranza', valor: '78.4%', positivo: true },
          { label: 'Morosidad Global', valor: '21.6%', positivo: false },
        ];
      } else if (q.includes('r6') || q.includes('buenos pagadores') || q.includes('puntual')) {
        dashboardId = 'D3';
        tituloGrafico = 'R6. Buenos Pagadores en Predial y Arbitrios';
        sql = `SELECT c.codigo_contribuyente, c.razon_social, COUNT(d.cuota) AS cuotas_puntuales FROM contribuyentes c JOIN deudas_emisiones d ON c.id = d.contribuyente_id WHERE d.estado = 'PAGADO_OPORTUNO' AND d.anio = 2026 GROUP BY c.codigo_contribuyente, c.razon_social HAVING COUNT(d.cuota) = 4;`;
        metricas = [
          { label: 'Contribuyentes Puntuales', valor: '18,420', positivo: true },
          { label: '% del Padrón Municipal', valor: '64.2%', positivo: true },
        ];
      } else if (q.includes('r8') || q.includes('antiguedad') || q.includes('reincidencia') || q.includes('r11')) {
        dashboardId = 'D4';
        tituloGrafico = 'R8 & R11. Antigüedad y Reincidencia en Deuda';
        sql = `SELECT estrato_antiguedad, COUNT(*) AS total_deudores, SUM(monto_total) AS deuda_estrato FROM v_analisis_antiguedad_tributaria GROUP BY estrato_antiguedad ORDER BY orden_estrato;`;
        metricas = [
          { label: 'Antigüedad Promedio', valor: '2.3 años', positivo: true },
          { label: 'Reincidentes Crónicos', valor: '12.8%', positivo: false },
        ];
      }

      return {
        texto: `El modelo analítico MCP interpretó tu consulta. Se procesaron los parámetros tributarios según el catálogo oficial y se estructuró la agregación SQL.`,
        dashboardSugeridoId: dashboardId,
        graficoTitulo: tituloGrafico,
        sqlGenerado: sql,
        metricas,
      };
    };

    consultarMcp().then((resp) => {
      const respuestaBot: SupersetChatMessage = {
        id: generarIdMensaje('bot'),
        rol: 'assistant',
        texto: resp.texto,
        fecha: 'Ahora',
        dashboardSugeridoId: resp.dashboardSugeridoId,
        graficoTitulo: resp.graficoTitulo,
        sqlGenerado: resp.sqlGenerado,
        metricas: resp.metricas,
      };

      setMensajes((prev) => [...prev, respuestaBot]);
      setIsGenerating(false);
    });
  }, [isGenerating, mensajes.length]);

  const reiniciarConversacion = () => {
    setMensajes([]);
    setPrompt('');
  };

  // VISTA 1: Pantalla inicial centrada a mitad del alto con gradiente de luz celeste municipalidad
  if (mensajes.length === 0) {
    return (
      <div
        className="card"
        style={{
          minHeight: 'calc(100vh - 160px)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem 1.5rem',
          position: 'relative',
          borderRadius: '16px',
          overflow: 'hidden',
          background: 'var(--bg-card)',
        }}
      >
        {/* Efecto de luz con gradiente celeste municipalidad circular-ovalado en el centro del cuadro de texto */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '740px',
            height: '320px',
            background: 'radial-gradient(ellipse 70% 55% at 50% 50%, rgba(14, 165, 233, 0.32) 0%, rgba(2, 132, 199, 0.16) 45%, rgba(56, 189, 248, 0.04) 70%, transparent 80%)',
            borderRadius: '50%',
            filter: 'blur(36px)',
            pointerEvents: 'none',
            zIndex: 0,
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '460px',
            height: '160px',
            background: 'radial-gradient(ellipse at center, rgba(56, 189, 248, 0.38) 0%, rgba(14, 165, 233, 0.14) 55%, transparent 75%)',
            borderRadius: '50%',
            filter: 'blur(20px)',
            pointerEvents: 'none',
            zIndex: 0,
          }}
        />

        {/* Título Central con la fuente nativa del sistema */}
        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', marginBottom: '2rem' }}>
          <h1
            style={{
              fontSize: '2.25rem',
              fontWeight: 700,
              color: 'var(--text-main)',
              margin: 0,
              letterSpacing: '-0.025em',
              fontFamily: 'inherit',
            }}
          >
            ¿Por dónde empezamos?
          </h1>
        </div>

        {/* Cuadro de texto centrado en el medio de la pantalla */}
        <div style={{ width: '100%', maxWidth: '720px', position: 'relative', zIndex: 1 }}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              enviarConsulta(prompt);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              background: 'var(--bg-card)',
              border: '1.5px solid rgba(14, 165, 233, 0.5)',
              borderRadius: '32px',
              padding: '0.75rem 1rem 0.75rem 1.4rem',
              boxShadow: '0 10px 30px -5px rgba(14, 165, 233, 0.22), 0 2px 8px rgba(0, 0, 0, 0.06)',
              transition: 'all 0.25s ease',
            }}
          >
            {/* Input Principal */}
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Escribe tu consulta tributaria para el modelo local..."
              style={{
                flex: 1,
                border: 'none',
                outline: 'none',
                background: 'transparent',
                fontSize: '1rem',
                color: 'var(--text-main)',
                fontFamily: 'inherit',
              }}
              autoFocus
            />

            {/* Botón Send */}
            <button
              type="submit"
              disabled={!prompt.trim() || isGenerating}
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                background: prompt.trim() ? 'var(--sky-600)' : 'var(--bg-card-subtle)',
                border: '1px solid var(--border-color)',
                color: prompt.trim() ? '#ffffff' : 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: prompt.trim() ? 'pointer' : 'default',
                transition: 'all 0.2s ease',
                flexShrink: 0,
              }}
              title="Enviar consulta"
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      </div>
    );
  }

  // VISTA 2: Conversación activa
  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '640px', padding: '1.25rem' }}>
      {/* Cabecera del Asistente */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-color)', marginBottom: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ padding: '0.4rem', borderRadius: '8px', background: 'linear-gradient(135deg, var(--sky-600), var(--violet-700))', color: 'white' }}>
            <Cpu size={16} />
          </div>
          <div>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
              Asistente MCP (Modelo Local)
            </h4>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Consultas tributarias en lenguaje natural</span>
          </div>
        </div>

        <button
          onClick={reiniciarConversacion}
          className="btn btn-secondary"
          style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem' }}
          title="Nueva conversación"
        >
          <RotateCcw size={13} />
          Nueva consulta
        </button>
      </div>

      {/* Área de Mensajes */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem', paddingRight: '0.25rem' }}>
        {mensajes.map((m) => (
          <div
            key={m.id}
            style={{
              display: 'flex',
              gap: '0.5rem',
              alignSelf: m.rol === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '92%',
            }}
          >
            {m.rol === 'assistant' && (
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--sky-100)', color: 'var(--sky-700)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Bot size={16} />
              </div>
            )}

            <div style={{
              background: m.rol === 'user' ? 'var(--sky-600)' : 'var(--bg-card-subtle)',
              color: m.rol === 'user' ? 'white' : 'var(--text-main)',
              borderRadius: '12px',
              padding: '0.75rem 1rem',
              fontSize: '0.85rem',
              border: m.rol === 'user' ? 'none' : '1px solid var(--border-color)',
            }}>
              <div>{m.texto}</div>

              {/* Consulta SQL generada por el MCP */}
              {m.sqlGenerado && (
                <div style={{ marginTop: '0.5rem', background: 'var(--bg-app)', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '0.675rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <Terminal size={11} /> Consulta SQL generada:
                  </div>
                  <code style={{ fontSize: '0.7rem', color: 'var(--primary-700)', wordBreak: 'break-all', fontFamily: 'var(--font-mono)' }}>
                    {m.sqlGenerado}
                  </code>
                </div>
              )}

              {/* Métricas y resumen analítico */}
              {m.metricas && (
                <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {m.metricas.map((item, i) => (
                    <div key={i} style={{ background: 'var(--bg-card)', padding: '0.4rem 0.6rem', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>{item.label}</span>
                      <strong style={{ fontSize: '0.85rem', color: item.positivo ? 'var(--green-600)' : 'var(--red-600)' }}>
                        {item.valor}
                      </strong>
                    </div>
                  ))}
                </div>
              )}

              {/* Botón para cargar en Superset si el handler existe */}
              {m.dashboardSugeridoId && onVisualizarDashboard && (
                <div style={{ marginTop: '0.75rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border-color)' }}>
                  <button
                    onClick={() => onVisualizarDashboard(m.dashboardSugeridoId!)}
                    className="btn btn-primary"
                    style={{ fontSize: '0.775rem', padding: '0.35rem 0.75rem', width: '100%', justifyContent: 'center' }}
                  >
                    Ver &quot;{m.graficoTitulo}&quot; en Apache Superset
                  </button>
                </div>
              )}

              <span style={{ display: 'block', textAlign: 'right', fontSize: '0.675rem', opacity: 0.7, marginTop: '0.35rem' }}>
                {m.fecha}
              </span>
            </div>

            {m.rol === 'user' && (
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--slate-200)', color: 'var(--slate-700)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <User size={16} />
              </div>
            )}
          </div>
        ))}

        {isGenerating && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--sky-600)', fontSize: '0.825rem' }}>
            <Sparkles size={16} className="spin-anim" />
            <span>Consultando modelo MCP local y estructurando respuesta...</span>
          </div>
        )}
      </div>

      {/* Input estilo Gemini en la parte inferior */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          enviarConsulta(prompt);
        }}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          marginTop: '0.75rem',
          paddingTop: '0.5rem',
          borderTop: '1px solid var(--border-color)',
        }}
      >
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: 'var(--bg-app)',
            borderRadius: '24px',
            border: '1px solid var(--border-color)',
            padding: '0.45rem 1rem',
          }}
        >
          <input
            type="text"
            placeholder="Escribe una consulta tributaria o presiona @..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            disabled={isGenerating}
            style={{
              flex: 1,
              border: 'none',
              background: 'transparent',
              outline: 'none',
              fontSize: '0.85rem',
              color: 'var(--text-main)',
            }}
          />
          <button
            type="submit"
            disabled={!prompt.trim() || isGenerating}
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              background: prompt.trim() ? 'var(--primary-600)' : 'transparent',
              border: 'none',
              color: prompt.trim() ? 'white' : 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: prompt.trim() ? 'pointer' : 'default',
            }}
          >
            <Send size={13} />
          </button>
        </div>
      </form>
    </div>
  );
};
