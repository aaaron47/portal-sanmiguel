'use client';

import React, { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { SupersetEmbedViewer } from './SupersetEmbedViewer';
import { SupersetChatAssistant } from './SupersetChatAssistant';

export const SupersetReportesView: React.FC = () => {
  const [dashboardId, setDashboardId] = useState('D1');

  return (
    <div>
      {/* Banner Explicativo de Integración MCP + Apache Superset */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(2, 132, 199, 0.08), rgba(109, 40, 217, 0.08))',
        border: '1px solid var(--sky-200)',
        borderRadius: '12px',
        padding: '1rem 1.25rem',
        marginBottom: '1.25rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '0.75rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ padding: '0.5rem', borderRadius: '10px', background: 'var(--sky-600)', color: 'white' }}>
            <Sparkles size={20} />
          </div>
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
              Reportería Inteligente con MCP & Apache Superset
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0.2rem 0 0' }}>
              Genera dashboards analíticos y reportes en lenguaje natural usando MCP o navega los paneles embebidos en vivo.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <span className="badge badge-primary">Superset Embedded API</span>
          <span className="badge badge-success">Conector MCP Activo</span>
        </div>
      </div>

      {/* Grid Principal: Chat Asistente a la izquierda y Visor Embebido a la derecha */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
        gap: '1.25rem',
        alignItems: 'start',
      }}>
        {/* Panel Izquierdo: Chat Asistente con MCP */}
        <div style={{ minWidth: '320px' }}>
          <SupersetChatAssistant onVisualizarDashboard={(id) => setDashboardId(id)} />
        </div>

        {/* Panel Derecho: Visor Embebido de Superset */}
        <div style={{ minWidth: '360px' }}>
          <SupersetEmbedViewer
            dashboardSeleccionadoId={dashboardId}
            onCambiarDashboard={(id) => setDashboardId(id)}
          />
        </div>
      </div>
    </div>
  );
};
