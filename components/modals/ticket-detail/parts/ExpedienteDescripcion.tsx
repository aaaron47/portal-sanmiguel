import React from 'react';

interface ExpedienteDescripcionProps {
  descripcion: string;
}

export const ExpedienteDescripcion: React.FC<ExpedienteDescripcionProps> = ({ descripcion }) => (
  <div style={{ marginBottom: '1.5rem' }}>
    <h4 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem', letterSpacing: '0.03em' }}>
      Descripción del Vecino
    </h4>
    <div style={{ background: 'var(--bg-card-subtle)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.875rem', fontSize: '0.9rem', color: 'var(--text-main)', lineHeight: 1.5 }}>
      {descripcion}
    </div>
  </div>
);
