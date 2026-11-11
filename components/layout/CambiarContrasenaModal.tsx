'use client';

import React, { useState } from 'react';
import { KeyRound, X } from 'lucide-react';
import { authController } from '@/controllers/auth.controller';
import { MODO_DEMO, mensajeErrorApi } from '@/services/api-client.service';

interface CambiarContrasenaModalProps {
  onClose: () => void;
  /** Aviso al terminar bien (el modal se cierra solo). */
  onExito: (mensaje: string) => void;
}

const estiloCampo: React.CSSProperties = {
  width: '100%',
  padding: '0.55rem 0.75rem',
  borderRadius: '8px',
  border: '1px solid var(--border-color)',
  background: 'var(--bg-card)',
  color: 'var(--text-main)',
  fontSize: '0.875rem',
};
const estiloEtiqueta: React.CSSProperties = { display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem' };

/**
 * Cambio de contraseña del personal (`POST /auth/cambiar-contrasena`). La longitud mínima la fija el administrador
 * en Control de Acceso: si la nueva es corta, el backend responde con el mínimo en el mensaje y se muestra tal cual.
 */
export const CambiarContrasenaModal: React.FC<CambiarContrasenaModalProps> = ({ onClose, onExito }) => {
  const [actual, setActual] = useState('');
  const [nueva, setNueva] = useState('');
  const [repetida, setRepetida] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const noCoinciden = repetida.length > 0 && nueva !== repetida;
  const igualALaActual = nueva.length > 0 && nueva === actual;
  const puedeEnviar = actual.length > 0 && nueva.length > 0 && nueva === repetida && !igualALaActual && !enviando;

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!puedeEnviar) return;
    setEnviando(true);
    setError(null);
    try {
      await authController.cambiarContrasena(actual, nueva);
      onExito('Tu contraseña se cambió. Se cerraron tus otras sesiones abiertas; esta sigue activa.');
      onClose();
    } catch (err) {
      setError(
        mensajeErrorApi(err, 'No se pudo cambiar la contraseña. Inténtalo de nuevo.', {
          invalid_current_password: 'La contraseña actual no es correcta. Revísala e inténtalo de nuevo.',
          password_reused: 'La nueva contraseña no puede ser una que ya usaste. Elige otra.',
          404: 'El servidor todavía no permite cambiar la contraseña.',
          ...(MODO_DEMO ? { 0: 'En modo demo no se puede cambiar la contraseña: hace falta el servidor.' } : {}),
        })
      );
      setEnviando(false);
    }
  };

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="titulo-cambiar-contrasena">
      <form className="modal-content" style={{ maxWidth: '440px' }} onSubmit={enviar}>
        <div className="modal-header">
          <h3 id="titulo-cambiar-contrasena" style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <KeyRound size={18} /> Cambiar contraseña
          </h3>
          <button type="button" onClick={onClose} disabled={enviando} aria-label="Cerrar" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
          <div>
            <label htmlFor="contrasenaActual" style={estiloEtiqueta}>Contraseña actual</label>
            <input id="contrasenaActual" type="password" autoComplete="current-password" value={actual} onChange={(e) => setActual(e.target.value)} required autoFocus style={estiloCampo} />
          </div>
          <div>
            <label htmlFor="contrasenaNueva" style={estiloEtiqueta}>Nueva contraseña</label>
            <input id="contrasenaNueva" type="password" autoComplete="new-password" value={nueva} onChange={(e) => setNueva(e.target.value)} required aria-describedby="ayudaContrasenaNueva" style={estiloCampo} />
            <p id="ayudaContrasenaNueva" style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0.3rem 0 0' }}>
              {igualALaActual
                ? 'La nueva contraseña debe ser distinta de la actual.'
                : 'Debe tener al menos la longitud que fijó el administrador (8 caracteres o más) y no puede ser una que ya usaste.'}
            </p>
          </div>
          <div>
            <label htmlFor="contrasenaRepetida" style={estiloEtiqueta}>Repite la nueva contraseña</label>
            <input
              id="contrasenaRepetida"
              type="password"
              autoComplete="new-password"
              value={repetida}
              onChange={(e) => setRepetida(e.target.value)}
              required
              aria-invalid={noCoinciden}
              style={{ ...estiloCampo, borderColor: noCoinciden ? 'var(--red-500)' : 'var(--border-color)' }}
            />
            {noCoinciden && <p style={{ fontSize: '0.75rem', color: 'var(--red-600)', margin: '0.3rem 0 0' }}>Las contraseñas no coinciden.</p>}
          </div>
          {error && (
            <p role="alert" style={{ fontSize: '0.8rem', color: 'var(--red-600)', margin: 0 }}>{error}</p>
          )}
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={enviando}>Cancelar</button>
          <button type="submit" className="btn btn-primary" disabled={!puedeEnviar}>
            {enviando ? 'Cambiando...' : 'Cambiar contraseña'}
          </button>
        </div>
      </form>
    </div>
  );
};
