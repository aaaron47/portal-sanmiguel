import React from 'react';
import { KpisReporte } from '@/controllers/reportes.controller';

export const ConstanciasBalanceCards: React.FC<{ kpis: KpisReporte }> = ({ kpis }) => (
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
    <div style={{ background: 'var(--green-50)', border: '1px solid var(--green-200)', padding: '1rem', borderRadius: '10px' }}>
      <div style={{ fontSize: '0.8rem', color: 'var(--green-800)', fontWeight: 600 }}>Aprobadas y Emitidas</div>
      <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--green-900)', marginTop: '0.25rem' }}>
        {kpis.constanciasAprobadas}
      </div>
      <div style={{ fontSize: '0.75rem', color: 'var(--green-700)', marginTop: '0.25rem' }}>Con firma y código QR digital</div>
    </div>

    <div style={{ background: 'var(--amber-50)', border: '1px solid var(--amber-200)', padding: '1rem', borderRadius: '10px' }}>
      <div style={{ fontSize: '0.8rem', color: 'var(--amber-800)', fontWeight: 600 }}>Observadas para Subsanación</div>
      <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--amber-900)', marginTop: '0.25rem' }}>
        {kpis.constanciasObservadas}
      </div>
      <div style={{ fontSize: '0.75rem', color: 'var(--amber-700)', marginTop: '0.25rem' }}>Documentación incompleta</div>
    </div>

    <div style={{ background: 'var(--bg-card-subtle)', border: '1px solid var(--border-color)', padding: '1rem', borderRadius: '10px' }}>
      <div style={{ fontSize: '0.8rem', color: 'var(--slate-600)', fontWeight: 600 }}>En Proceso de Dictamen</div>
      <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--slate-800)', marginTop: '0.25rem' }}>
        {kpis.constanciasPendientes}
      </div>
      <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)', marginTop: '0.25rem' }}>Dentro del plazo legal</div>
    </div>
  </div>
);
