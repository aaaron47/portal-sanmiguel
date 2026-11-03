import React from 'react';
import { Ticket } from '@/types/ticket.types';

interface ConstanciasKpisProps {
  tickets: Ticket[];
}

export const ConstanciasKpis: React.FC<ConstanciasKpisProps> = ({ tickets }) => {
  const conConstancia = tickets.filter((t) => t.tieneConstancia);
  const pendientes = conConstancia.filter((t) => !t.estadoConstancia || t.estadoConstancia === 'sin_evaluar');
  const aprobadas = conConstancia.filter((t) => t.estadoConstancia === 'aprobada');
  const observadas = conConstancia.filter((t) => t.estadoConstancia === 'observada');

  return (
    <div className="kpi-grid">
      {/* 1. Total Solicitudes */}
      <div className="kpi-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '1rem 1.25rem' }}>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          Total Solicitudes
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div style={{ fontSize: '1.9rem', fontWeight: 800, color: 'var(--text-main)', lineHeight: 1 }}>
            {conConstancia.length}
          </div>
          <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)', lineHeight: 1.35 }}>
            Constancias formales registradas
          </div>
        </div>
      </div>

      {/* 2. Por Evaluar */}
      <div className="kpi-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '1rem 1.25rem' }}>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          Por Evaluar
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div style={{ fontSize: '1.9rem', fontWeight: 800, color: 'var(--amber-600)', lineHeight: 1 }}>
            {pendientes.length}
          </div>
          <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)', lineHeight: 1.35 }}>
            Pendientes de dictamen técnico
          </div>
        </div>
      </div>

      {/* 3. Aprobadas */}
      <div className="kpi-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '1rem 1.25rem' }}>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          Aprobadas
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div style={{ fontSize: '1.9rem', fontWeight: 800, color: 'var(--green-600)', lineHeight: 1 }}>
            {aprobadas.length}
          </div>
          <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)', lineHeight: 1.35 }}>
            Constancias conformes
          </div>
        </div>
      </div>

      {/* 4. Observadas */}
      <div className="kpi-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '1rem 1.25rem' }}>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          Observadas
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div style={{ fontSize: '1.9rem', fontWeight: 800, color: 'var(--red-600)', lineHeight: 1 }}>
            {observadas.length}
          </div>
          <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)', lineHeight: 1.35 }}>
            Con observaciones notificadas
          </div>
        </div>
      </div>
    </div>
  );
};
