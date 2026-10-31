import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

interface NotificationToastProps {
  type: 'success' | 'error' | 'info';
  message: string;
  onClose: () => void;
  duration?: number;
}

export const NotificationToast: React.FC<NotificationToastProps> = ({
  type,
  message,
  onClose,
  duration = 4000,
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const styles = {
    success: { bg: 'var(--green-50)', border: 'var(--green-300)', text: 'var(--green-700)', icon: CheckCircle2 },
    error: { bg: 'var(--red-50)', border: 'var(--red-300)', text: 'var(--red-700)', icon: AlertCircle },
    info: { bg: 'var(--sky-50)', border: 'var(--sky-300)', text: 'var(--sky-700)', icon: CheckCircle2 },
  }[type];

  const IconComp = styles.icon;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        background: styles.bg,
        border: `1px solid ${styles.border}`,
        color: styles.text,
        padding: '0.875rem 1.25rem',
        borderRadius: '10px',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        zIndex: 9999,
        maxWidth: '420px',
        animation: 'fadeIn 200ms ease-out',
      }}
    >
      <IconComp size={18} />
      <span style={{ fontSize: '0.875rem', fontWeight: 500, flex: 1 }}>{message}</span>
      <button
        onClick={onClose}
        style={{
          background: 'none',
          border: 'none',
          color: styles.text,
          cursor: 'pointer',
          padding: '2px',
          display: 'flex',
        }}
        aria-label="Cerrar notificación"
      >
        <X size={16} />
      </button>
    </div>
  );
};
