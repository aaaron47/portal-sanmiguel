import React from 'react';
import { FileCheck, Clock, CheckCircle2, AlertTriangle } from 'lucide-react';
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
      <div className="kpi-card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
          <span style={{ fontSize: '0.825rem', color: 'var(--text-muted)', fontWeight: 600 }}>Total Solicitudes</span>
          <FileCheck size={20} color="var(--primary-500)" />
        </div>
        <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)' }}>
          {conConstancia.length}
        </div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
          Constancias formales registradas
        </div>
      </div>

      <div className="kpi-card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
          <span style={{ fontSize: '0.825rem', color: 'var(--text-muted)', fontWeight: 600 }}>Por Evaluar</span>
          <Clock size={20} color="var(--primary-500)" />
        </div>
        <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)' }}>
          {pendientes.length}
        </div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
          Pendientes de dictamen técnico
        </div>
      </div>

      <div className="kpi-card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
          <span style={{ fontSize: '0.825rem', color: 'var(--text-muted)', fontWeight: 600 }}>Aprobadas</span>
          <CheckCircle2 size={20} color="var(--primary-500)" />
        </div>
        <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)' }}>
          {aprobadas.length}
        </div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
          Constancias conformes
        </div>
      </div>

      <div className="kpi-card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
          <span style={{ fontSize: '0.825rem', color: 'var(--text-muted)', fontWeight: 600 }}>Observadas</span>
          <AlertTriangle size={20} color="var(--primary-500)" />
        </div>
        <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)' }}>
          {observadas.length}
        </div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
          Con observaciones notificadas
        </div>
      </div>
    </div>
  );
};
