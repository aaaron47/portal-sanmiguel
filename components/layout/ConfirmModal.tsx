import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'primary' | 'success';
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'primary',
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  const btnClass = {
    danger: 'btn-danger',
    primary: 'btn-primary',
    success: 'btn-success',
  }[variant];

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '480px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertTriangle size={20} color={variant === 'danger' ? 'var(--red-600)' : 'var(--sky-600)'} />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>{title}</h3>
          </div>
          <button
            onClick={onCancel}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--slate-500)' }}
            aria-label="Cerrar modal"
          >
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          <p style={{ color: 'var(--slate-600)', fontSize: '0.9rem', lineHeight: '1.5' }}>
            {message}
          </p>
        </div>

        <div className="modal-footer">
          <button onClick={onCancel} className="btn btn-secondary">
            {cancelText}
          </button>
          <button onClick={onConfirm} className={`btn ${btnClass}`}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
