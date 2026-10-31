import React from 'react';
import { Smartphone } from 'lucide-react';
import { DispositivoStats } from '@/types/telemetria.types';
import { CardHeader } from '@/components/shared/ui/CardHeader';

export const DispositivosCard: React.FC<{ stats: DispositivoStats }> = ({ stats }) => {
  const total = stats.androidCount + stats.iosCount;
  const androidPct = total > 0 ? Math.round((stats.androidCount / total) * 100) : 0;
  const iosPct = total > 0 ? Math.round((stats.iosCount / total) * 100) : 0;

  return (
    <div className="card">
      <CardHeader
        icon={<Smartphone size={18} />}
        title="Distribución de Dispositivos y App"
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', padding: '0.5rem 0' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--green-600)' }}>
              {androidPct}%
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)' }}>
              Android ({stats.androidCount.toLocaleString()})
            </div>
          </div>
          <div style={{ width: '1px', height: '35px', background: 'var(--slate-200)' }} />
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--sky-600)' }}>
              {iosPct}%
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)' }}>
              iOS ({stats.iosCount.toLocaleString()})
            </div>
          </div>
        </div>

        <div>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--slate-600)', textTransform: 'uppercase' }}>
            Versiones Instaladas:
          </span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.35rem' }}>
            {stats.versionesMasUsadas.map((ver, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                <span>{ver.version}</span>
                <strong>{ver.porcentaje}%</strong>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
