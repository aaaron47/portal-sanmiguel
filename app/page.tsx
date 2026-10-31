'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Sidebar } from '@/components/layout/Sidebar';
import { LoginForm } from '@/components/auth/LoginForm';
import { AdminView } from '@/components/roles/admin/AdminView';
import { FuncionarioView } from '@/components/roles/funcionario/FuncionarioView';
import { SupervisorView } from '@/components/roles/supervisor/SupervisorView';
import { ControlMunicipalView } from '@/components/roles/control-municipal/ControlMunicipalView';
import { ControlTiView } from '@/components/roles/control-ti/ControlTiView';
import { NotificationToast } from '@/components/layout/NotificationToast';

export default function HomePage() {
  const { isAuthenticated, rol, isLoading } = useAuth();
  const [currentTab, setCurrentTab] = useState<string>('inicio');
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  // Al cambiar de rol, ajustamos automáticamente el tab inicial por defecto
  useEffect(() => {
    if (rol === 'ADMIN') {
      setCurrentTab('admin-usuarios');
    } else if (rol === 'FUNCIONARIO') {
      setCurrentTab('funcionario-bandeja');
    } else if (rol === 'SUPERVISOR') {
      setCurrentTab('supervisor-panorama');
    } else if (rol === 'CONTROL_MUNICIPAL') {
      setCurrentTab('control-reportes');
    } else if (rol === 'CONTROL_TI') {
      setCurrentTab('ti-telemetria');
    }
  }, [rol]);

  const showNotification = (type: 'success' | 'error' | 'info', message: string) => {
    setNotification({ type, message });
  };

  if (isLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--slate-50)',
        fontFamily: 'var(--font-main)',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid var(--slate-200)',
            borderTopColor: 'var(--sky-600)',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem',
          }} />
          <p style={{ color: 'var(--slate-500)', fontSize: '0.9rem' }}>Cargando portal municipal...</p>
        </div>
      </div>
    );
  }

  // Heurística de Nielsen 6: Si no está autenticado, muestra el Login
  if (!isAuthenticated) {
    return <LoginForm onSuccess={() => showNotification('success', 'Sesión iniciada correctamente')} />;
  }

  return (
    <div className="app-layout">
      {/* Navegación lateral adaptativa por Rol */}
      <Sidebar currentTab={currentTab} onTabChange={setCurrentTab} />

      {/* Área Principal de Contenido */}
      <div className="main-content">
        <main className="content-body">
          {/* ROL 1: ADMIN */}
          {rol === 'ADMIN' && (
            <AdminView
              initialTab={currentTab}
              onNotify={showNotification}
            />
          )}

          {/* ROL 2: FUNCIONARIO */}
          {rol === 'FUNCIONARIO' && (
            <FuncionarioView
              initialTab={currentTab}
              onNotify={showNotification}
            />
          )}

          {/* ROL 3: SUPERVISOR */}
          {rol === 'SUPERVISOR' && (
            <SupervisorView
              initialTab={currentTab}
              onNotify={showNotification}
            />
          )}

          {/* ROL 4: CONTROL MUNICIPAL */}
          {rol === 'CONTROL_MUNICIPAL' && (
            <ControlMunicipalView
              initialTab={currentTab}
              onNotify={showNotification}
            />
          )}

          {/* ROL 5: CONTROL APP / TI */}
          {rol === 'CONTROL_TI' && (
            <ControlTiView
              initialTab={currentTab}
              onNotify={showNotification}
            />
          )}
        </main>
      </div>

      {/* Feedback flotante (Heurística de Nielsen 1: Visibilidad del estado del sistema) */}
      {notification && (
        <NotificationToast
          type={notification.type}
          message={notification.message}
          onClose={() => setNotification(null)}
        />
      )}
    </div>
  );
}
