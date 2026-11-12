'use client';

import React from 'react';
import {
  Database,
  Sparkles,
  Eye,
  MessageSquare,
  Cpu,
  Cloud,
  Calendar,
  Trash2,
  Layers,
} from 'lucide-react';
import { SupersetDashboardInfo } from '@/types/superset.types';

interface DashboardListCardProps {
  dashboard: SupersetDashboardInfo;
  seleccionado: boolean;
  onVisualizar: (dashboard: SupersetDashboardInfo) => void;
  onConsultarConIA: (dashboard: SupersetDashboardInfo) => void;
  onEliminar?: (dashboardId: string) => void;
}

export const DashboardListCard: React.FC<DashboardListCardProps> = ({
  dashboard,
  seleccionado,
  onVisualizar,
  onConsultarConIA,
  onEliminar,
}) => {
  const esIA = dashboard.origen === 'IA';

  return (
    <div
      className="card"
      style={{
        padding: '1.25rem',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        gap: '1rem',
        border: seleccionado ? '2px solid var(--sky-600)' : '1px solid var(--border-color)',
        background: 'var(--bg-card)',
      }}
    >
      <div>
        {/* Cabecera: Badge de Origen + Modelo + Fecha */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '0.5rem',
            flexWrap: 'wrap',
            marginBottom: '0.65rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
            <span
              className={esIA ? 'badge badge-success' : 'badge badge-primary'}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.7rem', fontWeight: 700 }}
            >
              {esIA ? <Sparkles size={12} /> : <Database size={12} />}
              {esIA ? 'Creado por IA' : 'Apache Superset'}
            </span>

            {esIA && dashboard.modeloUsado && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  padding: '0.18rem 0.5rem',
                  borderRadius: '999px',
                  background: 'var(--bg-card-subtle)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-main)',
                }}
              >
                {dashboard.modeloUsado === 'LOCAL' ? <Cpu size={11} /> : <Cloud size={11} />}
                {dashboard.nombreModeloDetalle || (dashboard.modeloUsado === 'LOCAL' ? 'San Miguel 1' : 'Claude Opus')}
              </span>
            )}
          </div>

          {dashboard.creadoEn && (
            <span
              style={{
                fontSize: '0.7rem',
                color: 'var(--text-muted)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem',
              }}
            >
              <Calendar size={11} />
              {dashboard.creadoEn}
            </span>
          )}
        </div>

        {/* Título y Descripción */}
        <h4 style={{ fontSize: '1rem', fontWeight: 800, margin: '0 0 0.35rem', color: 'var(--text-main)' }}>
          {dashboard.titulo}
        </h4>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0 0 0.75rem', lineHeight: 1.45 }}>
          {dashboard.descripcion}
        </p>

        {/* Prompt original si fue creado por IA */}
        {esIA && dashboard.promptOrigen && (
          <div
            style={{
              background: 'var(--bg-card-subtle)',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              padding: '0.5rem 0.65rem',
              fontSize: '0.75rem',
              color: 'var(--text-muted)',
              marginBottom: '0.75rem',
            }}
          >
            <strong style={{ color: 'var(--text-main)' }}>Prompt IA:</strong> &ldquo;{dashboard.promptOrigen}&rdquo;
          </div>
        )}

        {/* Fuentes de datos vinculadas */}
        {dashboard.fuentesDatos && dashboard.fuentesDatos.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
            <Layers size={12} color="var(--sky-600)" />
            {dashboard.fuentesDatos.map((fuente, idx) => (
              <span
                key={idx}
                style={{
                  fontSize: '0.68rem',
                  fontWeight: 600,
                  padding: '0.15rem 0.45rem',
                  borderRadius: '6px',
                  background: 'var(--bg-card-subtle)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-muted)',
                }}
              >
                {fuente}
              </span>
            ))}
          </div>
        )}

        {/* Resumen rápido de KPIs del dashboard */}
        {dashboard.metricasResumen && dashboard.metricasResumen.length > 0 && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(115px, 1fr))',
              gap: '0.5rem',
            }}
          >
            {dashboard.metricasResumen.slice(0, 3).map((m, idx) => (
              <div
                key={idx}
                style={{
                  background: 'var(--bg-card-subtle)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  padding: '0.45rem 0.6rem',
                }}
              >
                <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'block' }}>{m.label}</span>
                <strong
                  style={{
                    fontSize: '0.88rem',
                    color: m.positivo === false ? 'var(--amber-700)' : 'var(--sky-700)',
                  }}
                >
                  {m.valor}
                </strong>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pie de acciones */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.5rem',
          paddingTop: '0.75rem',
          borderTop: '1px solid var(--border-color)',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', gap: '0.5rem', flex: 1, flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => onVisualizar(dashboard)}
            className={seleccionado ? 'btn btn-primary' : 'btn btn-secondary'}
            style={{ fontSize: '0.78rem', padding: '0.4rem 0.75rem', flex: 1 }}
          >
            <Eye size={14} />
            {seleccionado ? 'Viendo en pantalla' : 'Ver dashboard'}
          </button>

          <button
            type="button"
            onClick={() => onConsultarConIA(dashboard)}
            className="btn btn-secondary"
            style={{ fontSize: '0.78rem', padding: '0.4rem 0.75rem', flex: 1 }}
            title="Abrir chat de IA para consultar datos de este dashboard"
          >
            <MessageSquare size={14} />
            Consultar con IA
          </button>
        </div>

        {esIA && onEliminar && (
          <button
            type="button"
            onClick={() => onEliminar(dashboard.id)}
            className="btn btn-secondary"
            style={{ padding: '0.4rem 0.55rem', color: 'var(--red-600)' }}
            title="Eliminar dashboard generado por IA"
            aria-label={`Eliminar ${dashboard.titulo}`}
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>
    </div>
  );
};
