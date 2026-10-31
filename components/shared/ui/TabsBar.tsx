import React from 'react';
import type { LucideIcon } from 'lucide-react';

export interface TabItem<T extends string> {
  id: T;
  label: string;
  icon: LucideIcon;
}

interface TabsBarProps<T extends string> {
  tabs: TabItem<T>[];
  active: T;
  onChange: (id: T) => void;
  marginBottom?: string;
}

export function TabsBar<T extends string>({ tabs, active, onChange, marginBottom = '1.5rem' }: TabsBarProps<T>) {
  return (
    <div style={{ display: 'flex', gap: '0.5rem', marginBottom, borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
      {tabs.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          onClick={() => onChange(id)}
          className={`btn ${active === id ? 'btn-primary' : 'btn-secondary'}`}
          style={{ fontSize: '0.85rem' }}
        >
          <Icon size={16} /> {label}
        </button>
      ))}
    </div>
  );
}
