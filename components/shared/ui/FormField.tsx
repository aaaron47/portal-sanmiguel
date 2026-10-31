import React from 'react';

interface FormFieldProps {
  label: string;
  children: React.ReactNode;
  size?: 'sm' | 'md';
}

/** Etiqueta + control de formulario. */
export const FormField: React.FC<FormFieldProps> = ({ label, children, size = 'sm' }) => (
  <div>
    <label
      style={{
        display: 'block',
        fontSize: size === 'sm' ? '0.75rem' : '0.8rem',
        fontWeight: 600,
        color: size === 'sm' ? 'var(--text-muted)' : 'var(--text-main)',
        marginBottom: '0.25rem',
      }}
    >
      {label}
    </label>
    {children}
  </div>
);

export const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.5rem',
  borderRadius: '6px',
  border: '1px solid var(--border-color)',
  background: 'var(--bg-card)',
  color: 'var(--text-main)',
};
