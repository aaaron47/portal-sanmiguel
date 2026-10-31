import React, { useState } from 'react';
import { UserRole, ROLE_LABELS } from '@/types/auth.types';
import { FormField, inputStyle } from '@/components/shared/ui/FormField';
import { NuevoUsuario } from '../useUsuarios';

interface CrearUsuarioFormProps {
  onSubmit: (data: NuevoUsuario) => Promise<void>;
  onCancel: () => void;
}

export const CrearUsuarioForm: React.FC<CrearUsuarioFormProps> = ({ onSubmit, onCancel }) => {
  const [dni, setDni] = useState('');
  const [nombreCompleto, setNombreCompleto] = useState('');
  const [email, setEmail] = useState('');
  const [rol, setRol] = useState<UserRole>('FUNCIONARIO');
  const [area, setArea] = useState('Fiscalización y Control');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dni || !nombreCompleto || !email) return;
    onSubmit({ dni, nombreCompleto, email, rol, area });
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{ background: 'var(--bg-card-subtle)', padding: '1.25rem', borderRadius: '10px', marginBottom: '1.5rem', border: '1px solid var(--border-color)' }}
    >
      <h4 style={{ fontSize: '0.9rem', marginBottom: '0.75rem', fontWeight: 700 }}>Registrar Nuevo Personal Municipal</h4>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
        <FormField label="DNI:">
          <input type="text" maxLength={8} required value={dni} onChange={(e) => setDni(e.target.value)} placeholder="Ej. 74589123" style={inputStyle} />
        </FormField>
        <FormField label="Nombres y Apellidos:">
          <input type="text" required value={nombreCompleto} onChange={(e) => setNombreCompleto(e.target.value)} placeholder="Ej. Juan Pérez" style={inputStyle} />
        </FormField>
        <FormField label="Correo Institucional:">
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ejemplo@sanmiguel.gob.pe" style={inputStyle} />
        </FormField>
        <FormField label="Rol Asignado:">
          <select value={rol} onChange={(e) => setRol(e.target.value as UserRole)} style={inputStyle}>
            {(Object.keys(ROLE_LABELS) as UserRole[]).map((r) => (
              <option key={r} value={r}>
                {ROLE_LABELS[r]}
              </option>
            ))}
          </select>
        </FormField>
        <FormField label="Área:">
          <input type="text" value={area} onChange={(e) => setArea(e.target.value)} placeholder="Fiscalización, Obras, etc." style={inputStyle} />
        </FormField>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
        <button type="button" onClick={onCancel} className="btn btn-secondary" style={{ fontSize: '0.8rem' }}>
          Cancelar
        </button>
        <button type="submit" className="btn btn-primary" style={{ fontSize: '0.8rem' }}>
          Guardar Usuario
        </button>
      </div>
    </form>
  );
};
