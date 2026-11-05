'use client';

import React, { useState } from 'react';
import { KeyRound, Copy, Check } from 'lucide-react';
import { CredencialNueva } from '../useUsuarios';

interface ContrasenaTemporalAvisoProps {
  credencial: CredencialNueva;
  onCerrar: () => void;
}

/**
 * Muestra una sola vez la contraseña temporal de una cuenta nueva. El backend no la vuelve a entregar (en la BD
 * queda solo su hash), así que el Admin debe copiarla y entregarla a la persona por un medio seguro.
 */
export const ContrasenaTemporalAviso: React.FC<ContrasenaTemporalAvisoProps> = ({ credencial, onCerrar }) => {
  const [copiado, setCopiado] = useState(false);

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(credencial.contrasenaTemporal);
      setCopiado(true);
    } catch {
      // Sin permiso de portapapeles: la contraseña sigue visible para copiarla a mano.
      setCopiado(false);
    }
  };

  return (
    <div
      role="alert"
      style={{
        background: 'var(--bg-card-subtle)',
        border: '1.5px solid var(--amber-500)',
        borderRadius: '10px',
        padding: '1rem 1.25rem',
        marginBottom: '1.5rem',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
        <KeyRound size={18} color="var(--amber-700)" />
        <strong style={{ fontSize: '0.9rem', color: 'var(--text-main)' }}>
          Contraseña temporal de {credencial.nombreCompleto}
        </strong>
      </div>
      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0 0 0.75rem' }}>
        Entrégala a la persona por un medio seguro. <strong>No se volverá a mostrar.</strong> Entra con su DNI como
        usuario.
      </p>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          Usuario: <strong style={{ color: 'var(--text-main)' }}>{credencial.usuario}</strong>
        </span>
        <code
          style={{
            fontSize: '0.95rem',
            padding: '0.3rem 0.6rem',
            borderRadius: '6px',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            color: 'var(--text-main)',
            userSelect: 'all',
          }}
        >
          {credencial.contrasenaTemporal}
        </code>
        <button type="button" onClick={copiar} className="btn btn-secondary" style={{ fontSize: '0.75rem' }}>
          {copiado ? <Check size={14} /> : <Copy size={14} />} {copiado ? 'Copiada' : 'Copiar'}
        </button>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button type="button" onClick={onCerrar} className="btn btn-primary" style={{ fontSize: '0.8rem' }}>
          Ya la entregué, cerrar
        </button>
      </div>
    </div>
  );
};
