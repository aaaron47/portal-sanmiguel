import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface KpiCardProps {
  icon: LucideIcon;
  label: string;
  value: React.ReactNode;
  bg: string;
  color: string;
}

export const KpiCard: React.FC<KpiCardProps> = ({ icon: Icon, label, value, bg, color }) => (
  <div className="kpi-card">
    <div className="kpi-icon-wrap" style={{ background: bg, color }}>
      <Icon size={24} />
    </div>
    <div className="kpi-meta">
      <span className="kpi-label">{label}</span>
      <span className="kpi-value">{value}</span>
    </div>
  </div>
);
