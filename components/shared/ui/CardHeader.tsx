import React from 'react';

interface CardHeaderProps {
  icon: React.ReactNode;
  title: React.ReactNode;
  aside?: React.ReactNode;
}

export const CardHeader: React.FC<CardHeaderProps> = ({ icon, title, aside }) => (
  <div className="card-header">
    <h3 className="card-title">
      {icon} {title}
    </h3>
    {aside}
  </div>
);

/** Texto secundario alineado a la derecha del encabezado de una tarjeta. */
export const CardAside: React.FC<{ children: React.ReactNode; color?: string; bold?: boolean }> = ({
  children,
  color = 'var(--slate-500)',
  bold,
}) => (
  <span style={{ fontSize: '0.8rem', color, fontWeight: bold ? 600 : undefined }}>{children}</span>
);
