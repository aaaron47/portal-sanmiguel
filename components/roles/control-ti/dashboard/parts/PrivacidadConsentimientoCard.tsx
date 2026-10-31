import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { OnboardingStats } from '@/types/telemetria.types';
import { CardHeader, CardAside } from '@/components/shared/ui/CardHeader';

export const PrivacidadConsentimientoCard: React.FC<{ stats: OnboardingStats }> = ({ stats }) => (
  <div className="card">
    <CardHeader
      icon={<ShieldCheck size={18} />}
      title="Privacidad y Consentimiento Vecinal"
      aside={<CardAside>Tabla usuarios (3 columnas)</CardAside>}
    />

    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
          <span style={{ color: 'var(--green-600)', fontWeight: 600 }}>Aceptan Analítica (&quot;Sí&quot;)</span>
          <strong>{stats.aceptaAnaliticaCount.toLocaleString()} ({stats.aceptaAnaliticaPorcentaje}%)</strong>
        </div>
        <div style={{ height: '8px', background: 'var(--slate-200)', borderRadius: '4px', overflow: 'hidden' }}>
          <div style={{ width: `${stats.aceptaAnaliticaPorcentaje}%`, height: '100%', background: 'var(--green-600)' }} />
        </div>
      </div>

      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
          <span style={{ color: 'var(--red-600)', fontWeight: 600 }}>Rechazan Analítica (&quot;No&quot;)</span>
          <strong>{stats.rechazaAnaliticaCount.toLocaleString()} ({stats.rechazaAnaliticaPorcentaje}%)</strong>
        </div>
        <div style={{ height: '8px', background: 'var(--slate-200)', borderRadius: '4px', overflow: 'hidden' }}>
          <div style={{ width: `${stats.rechazaAnaliticaPorcentaje}%`, height: '100%', background: 'var(--red-600)' }} />
        </div>
      </div>

      <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)', background: 'var(--bg-card-subtle)', padding: '0.75rem', borderRadius: '6px' }}>
        Total usuarios vecinales registrados: <strong>{stats.totalUsuariosRegistrados.toLocaleString()}</strong>.
        La decisión es capturada en <code>fecha_decision</code> y no se envía telemetría si rechazan.
      </div>
    </div>
  </div>
);
