import React from 'react';
import { Search } from 'lucide-react';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  maxWidth?: string;
}

export const SearchInput: React.FC<SearchInputProps> = ({ value, onChange, placeholder, maxWidth }) => (
  <div style={{ position: 'relative', flex: 1, minWidth: '240px', maxWidth }}>
    <Search size={16} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-muted)' }} />
    <input
      type="text"
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        width: '100%',
        padding: '0.5rem 0.5rem 0.5rem 2.2rem',
        borderRadius: '8px',
        border: '1px solid var(--border-color)',
        background: 'var(--bg-card)',
        color: 'var(--text-main)',
      }}
    />
  </div>
);
