'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { UserRole, ROLE_LABELS } from '@/types/auth.types';
import { MODO_DEMO } from '@/services/api-client.service';
import {
  Users,
  ShieldAlert,
  Inbox,
  FileCheck,
  CheckCircle2,
  Layers,
  BarChart3,
  Activity,
  Smartphone,
  Eye,
  Sun,
  Moon,
  HelpCircle,
  LogOut,
  ArrowRightLeft,
  ChevronUp,
  KeyRound,
  Sparkles,
  Table
} from 'lucide-react';
import { FaqModal } from '@/components/modals/FaqModal';
import { CambiarContrasenaModal } from './CambiarContrasenaModal';
import { NotifyFn } from '@/types/ui.types';

interface SidebarProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  /** Avisos del portal (p. ej. tras cambiar la contraseña). */
  onNotify?: NotifyFn;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onTabChange, onNotify }) => {
  const { usuario, rol, logout, switchRoleDemo } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isFaqOpen, setIsFaqOpen] = useState(false);
  const [isCambioContrasenaOpen, setIsCambioContrasenaOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  // Cerrar popover de cuenta si se hace clic afuera
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    if (isProfileOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isProfileOpen]);

  // Iniciales del usuario
  const getInitials = (name?: string) => {
    if (!name) return 'US';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return parts[0].substring(0, 2).toUpperCase();
  };

  return (
    <>
      <aside className="app-sidebar">
        {/* Cabecera con Logo Institucional */}
        <div className="sidebar-header">
          <Image
            src={theme === 'dark' ? '/logo-san-miguel-dark.png' : '/logo-san-miguel-light.png'}
            alt="Municipalidad de San Miguel"
            width={288}
            height={104}
            priority
            className="sidebar-logo"
          />
        </div>

        {/* Navegación Adaptativa por Rol */}
        <nav className="sidebar-nav">
          {/* ROL 1: ADMIN */}
          {rol === 'ADMIN' && (
            <>
              <span className="nav-section-title">Administración</span>
              <button
                className={`nav-item ${currentTab === 'admin-usuarios' ? 'active' : ''}`}
                onClick={() => onTabChange('admin-usuarios')}
              >
                <Users size={18} />
                Gestión de Usuarios
              </button>
              <button
                className={`nav-item ${currentTab === 'admin-auditoria' ? 'active' : ''}`}
                onClick={() => onTabChange('admin-auditoria')}
              >
                <ShieldAlert size={18} />
                Auditoría y Seguridad
              </button>
              <button
                className={`nav-item ${currentTab === 'admin-acceso' ? 'active' : ''}`}
                onClick={() => onTabChange('admin-acceso')}
              >
                <KeyRound size={18} />
                Control de Acceso
              </button>
            </>
          )}

          {/* ROL 2: FUNCIONARIO */}
          {rol === 'FUNCIONARIO' && (
            <>
              <span className="nav-section-title">Atención de Quejas</span>
              <button
                className={`nav-item ${currentTab === 'funcionario-bandeja' ? 'active' : ''}`}
                onClick={() => onTabChange('funcionario-bandeja')}
              >
                <Inbox size={18} />
                Bandeja de Reclamos ({usuario?.area || 'Mi Área'})
              </button>
              <button
                className={`nav-item ${currentTab === 'funcionario-constancias' ? 'active' : ''}`}
                onClick={() => onTabChange('funcionario-constancias')}
              >
                <FileCheck size={18} />
                Evaluación de Constancias
              </button>
            </>
          )}

          {/* ROL 3: SUPERVISOR */}
          {rol === 'SUPERVISOR' && (
            <>
              <span className="nav-section-title">Supervisión General</span>
              <button
                className={`nav-item ${currentTab === 'supervisor-panorama' ? 'active' : ''}`}
                onClick={() => onTabChange('supervisor-panorama')}
              >
                <Layers size={18} />
                Panorama Integral
              </button>
              <button
                className={`nav-item ${currentTab === 'supervisor-aprobaciones' ? 'active' : ''}`}
                onClick={() => onTabChange('supervisor-aprobaciones')}
              >
                <CheckCircle2 size={18} />
                Revisión y Aprobación
              </button>
              <button
                className={`nav-item ${currentTab === 'supervisor-reasignaciones' ? 'active' : ''}`}
                onClick={() => onTabChange('supervisor-reasignaciones')}
              >
                <Eye size={18} />
                Reasignación de Casos
              </button>
              <button
                className={`nav-item ${currentTab === 'supervisor-constancias' ? 'active' : ''}`}
                onClick={() => onTabChange('supervisor-constancias')}
              >
                <FileCheck size={18} />
                Constancias de No Adeudo
              </button>
            </>
          )}

          {/* ROL 4: CONTROL MUNICIPAL (LECTURA) */}
          {rol === 'CONTROL_MUNICIPAL' && (
            <>
              <span className="nav-section-title">Control Institucional</span>
              <button
                className={`nav-item ${currentTab === 'control-dashboard' || currentTab === 'control-reportes' ? 'active' : ''}`}
                onClick={() => onTabChange('control-dashboard')}
              >
                <BarChart3 size={18} />
                Dashboard General
              </button>
              <button
                className={`nav-item ${currentTab === 'control-tributarios' ? 'active' : ''}`}
                onClick={() => onTabChange('control-tributarios')}
              >
                <Table size={18} />
                Reportes Tributarios
              </button>
              <button
                className={`nav-item ${currentTab === 'control-ia' || currentTab === 'control-superset' ? 'active' : ''}`}
                onClick={() => onTabChange('control-ia')}
              >
                <Sparkles size={18} />
                Asistente MCP (Consultas IA)
              </button>
              <button
                className={`nav-item ${currentTab === 'control-constancias' ? 'active' : ''}`}
                onClick={() => onTabChange('control-constancias')}
              >
                <FileCheck size={18} />
                Constancias de No Adeudo
              </button>
            </>
          )}

          {/* ROL 5: CONTROL APP / TI (LECTURA) */}
          {rol === 'CONTROL_TI' && (
            <>
              <span className="nav-section-title">Monitoreo y Telemetría</span>
              <button
                className={`nav-item ${currentTab === 'ti-telemetria' ? 'active' : ''}`}
                onClick={() => onTabChange('ti-telemetria')}
              >
                <Activity size={18} />
                Dashboard Telemetría App
              </button>
              <button
                className={`nav-item ${currentTab === 'ti-onboarding' ? 'active' : ''}`}
                onClick={() => onTabChange('ti-onboarding')}
              >
                <Smartphone size={18} />
                Privacidad y Onboarding
              </button>
            </>
          )}
        </nav>

        {/* Parte Inferior del Sidebar al Estilo Gemini */}
        <div className="sidebar-gemini-footer" ref={profileRef}>
          {/* Popover flotante de cuenta cuando se hace clic en el perfil */}
          {isProfileOpen && (
            <div className="gemini-account-popover">
              <div className="popover-user-meta">
                <div className="popover-avatar">
                  {getInitials(usuario?.nombreCompleto)}
                </div>
                <div className="popover-details">
                  <span className="popover-name">{usuario?.nombreCompleto || 'Usuario'}</span>
                  <span className="popover-email">{usuario?.email || 'funcionario@munisanmiguel.gob.pe'}</span>
                  <span className="popover-badge">{rol ? ROLE_LABELS[rol] : 'Funcionario'}</span>
                </div>
              </div>

              {/* Selector de Simulación de Rol: solo en modo demo (en producción permitiría cambiar de rol sin permiso) */}
              {MODO_DEMO && (
                <div className="popover-section">
                  <label className="popover-label">
                    <ArrowRightLeft size={13} /> Simular Rol (Demo):
                  </label>
                  <select
                    value={rol || 'FUNCIONARIO'}
                    onChange={(e) => {
                      switchRoleDemo(e.target.value as UserRole);
                      setIsProfileOpen(false);
                    }}
                    className="popover-select"
                  >
                    <option value="ADMIN">1. Admin (Usuarios / Auditoría)</option>
                    <option value="FUNCIONARIO">2. Funcionario (Atención)</option>
                    <option value="SUPERVISOR">3. Supervisor (Aprobación)</option>
                    <option value="CONTROL_MUNICIPAL">4. Control Municipal (OCI)</option>
                    <option value="CONTROL_TI">5. Control TI (Telemetría)</option>
                  </select>
                </div>
              )}

              <div className="popover-divider" />

              <button
                onClick={() => {
                  setIsProfileOpen(false);
                  setIsCambioContrasenaOpen(true);
                }}
                className="popover-logout-btn popover-action-btn"
              >
                <KeyRound size={15} />
                Cambiar contraseña
              </button>

              <button
                onClick={() => {
                  setIsProfileOpen(false);
                  logout();
                }}
                className="popover-logout-btn"
              >
                <LogOut size={15} />
                Cerrar Sesión
              </button>
            </div>
          )}

          {/* Barra Gemini Inferior */}
          <div className="gemini-footer-row">
            {/* Sección Izquierda: Perfil y Rol */}
            <div
              className="gemini-account-left"
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              title="Ver cuenta y cambiar rol"
            >
              <div className="gemini-avatar">
                {getInitials(usuario?.nombreCompleto)}
              </div>
              <div className="gemini-account-texts">
                <span className="gemini-user-name">
                  {usuario?.nombreCompleto || 'Usuario Municipal'}
                </span>
                <span className="gemini-user-role">
                  {rol ? ROLE_LABELS[rol] : 'Funcionario'}
                </span>
              </div>
              <ChevronUp
                size={14}
                className={`gemini-chevron ${isProfileOpen ? 'open' : ''}`}
              />
            </div>

            {/* Sección Derecha: Acciones Rápidas (Modo Oscuro/Claro y FAQ) */}
            <div className="gemini-account-right">
              {/* Botón de cambiar modo oscuro a claro */}
              <button
                onClick={toggleTheme}
                className="gemini-icon-button"
                title={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
                aria-label="Cambiar modo oscuro a claro"
              >
                {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
              </button>

              {/* Botón de preguntas frecuentes */}
              <button
                onClick={() => setIsFaqOpen(true)}
                className="gemini-icon-button"
                title="Preguntas frecuentes y ayuda"
                aria-label="Preguntas frecuentes"
              >
                <HelpCircle size={17} />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Modal de Preguntas Frecuentes */}
      <FaqModal isOpen={isFaqOpen} onClose={() => setIsFaqOpen(false)} />
      {isCambioContrasenaOpen && (
        <CambiarContrasenaModal
          onClose={() => setIsCambioContrasenaOpen(false)}
          onExito={(mensaje) => onNotify?.('success', mensaje)}
        />
      )}
    </>
  );
};
