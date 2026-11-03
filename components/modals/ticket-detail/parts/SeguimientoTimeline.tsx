import React from 'react';
import { TicketSeguimiento } from '@/types/ticket.types';

interface SeguimientoTimelineProps {
  seguimientos: TicketSeguimiento[];
}

export const SeguimientoTimeline: React.FC<SeguimientoTimelineProps> = ({ seguimientos }) => (
  <div style={{ marginBottom: '1.5rem' }}>
    <h4 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.75rem', letterSpacing: '0.03em' }}>
      Historial de Seguimiento y Derivaciones
    </h4>
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '0.75rem',
      maxHeight: '200px',
      overflowY: 'auto',
      paddingRight: '0.4rem',
    }}>
      {seguimientos.map((seg) => (
        <div
          key={seg.id}
          style={{
            background: 'var(--bg-card-subtle)',
            border: '1px solid var(--border-color)',
            borderLeft: '4px solid var(--primary-500)',
            padding: '0.75rem 1rem',
            borderRadius: '8px',
            fontSize: '0.85rem',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
            <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>
              {seg.autorNombre} <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>({seg.autorRol})</span>
            </span>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{seg.fecha}</span>
          </div>
          <div style={{ color: 'var(--text-main)', lineHeight: 1.4 }}>
            {seg.comentario}
          </div>
        </div>
      ))}
    </div>
  </div>
);
