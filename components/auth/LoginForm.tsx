'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import { UserRole } from '@/types/auth.types';
import { MODO_DEMO } from '@/services/api-client.service';
import {
  Lock,
  User,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  AlertCircle
} from 'lucide-react';

interface LoginFormProps {
  onSuccess?: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onSuccess }) => {
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [emailOrDni, setEmailOrDni] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailOrDni.trim()) {
      setErrorMsg('Ingresa tu DNI o correo institucional.');
      return;
    }
    if (!password) {
      setErrorMsg('Ingresa tu contraseña.');
      return;
    }
    setErrorMsg('');

    setIsLoading(true);
    try {
      await login({ emailOrDni, password });
      onSuccess?.();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'No se pudo iniciar sesión. Inténtalo de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickDemoLogin = async (role: UserRole) => {
    setErrorMsg('');
    setIsLoading(true);
    try {
      await login({ emailOrDni: `demo.${role.toLowerCase()}@sanmiguel.gob.pe`, targetRole: role });
      onSuccess?.();
    } catch {
      setErrorMsg('No se pudo entrar con el perfil de prueba. Inténtalo de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-claro" style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(circle at 50% 20%, var(--sky-100) 0%, var(--slate-50) 70%)',
      padding: '1.5rem',
    }}>
      <div style={{
        background: 'var(--white)',
        borderRadius: '20px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04)',
        border: '1px solid var(--slate-200)',
        width: '100%',
        maxWidth: '480px',
        padding: '2.5rem',
      }}>
        {/* Cabecera del Portal con Logo Institucional */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.25rem' }}>
            <Image
              src="/logo-san-miguel-light.png" // El login siempre es claro: el logo blanco del modo oscuro no se vería
              alt="Municipalidad Distrital de San Miguel"
              width={260}
              height={94}
              priority
              style={{ objectFit: 'contain', width: 'auto', maxHeight: '76px' }}
            />
          </div>
        </div>

        {/* Mensaje de Error (Heurística Nielsen 9) */}
        {errorMsg && (
          <div style={{
            background: 'var(--red-50)',
            border: '1px solid var(--red-300)',
            color: 'var(--red-700)',
            padding: '0.75rem',
            borderRadius: '8px',
            marginBottom: '1.25rem',
            fontSize: '0.825rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}>
            <AlertCircle size={16} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Formulario tradicional de Login */}
        <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.75rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--slate-700)', marginBottom: '0.35rem' }}>
              DNI o Correo Institucional
            </label>
            <div style={{ position: 'relative' }}>
              <User size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--slate-400)' }} />
              <input
                type="text"
                placeholder="45892101 o usuario@sanmiguel.gob.pe"
                value={emailOrDni}
                onChange={(e) => setEmailOrDni(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.625rem 0.75rem 0.625rem 2.25rem',
                  borderRadius: '10px',
                  border: '1px solid var(--slate-300)',
                  fontSize: '0.9rem',
                  outline: 'none',
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--slate-700)', marginBottom: '0.35rem' }}>
              Contraseña
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--slate-400)' }} />
              <input
                type="password"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.625rem 0.75rem 0.625rem 2.25rem',
                  borderRadius: '10px',
                  border: '1px solid var(--slate-300)',
                  fontSize: '0.9rem',
                  outline: 'none',
                }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="btn btn-primary"
            style={{ width: '100%', padding: '0.75rem', marginTop: '0.5rem', fontSize: '0.95rem' }}
          >
            {isLoading ? 'Iniciando sesión...' : 'Ingresar al Portal'}
            <ArrowRight size={18} />
          </button>
        </form>

        {/* Accesos rápidos de prueba: solo en modo demo (nunca en producción con el backend real). */}
        {MODO_DEMO && (
          <>
            {/* Separador */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', margin: '1.25rem 0' }}>
              <div style={{ flex: 1, height: '1px', background: 'var(--slate-200)' }} />
              <span style={{ fontSize: '0.75rem', color: 'var(--slate-400)', fontWeight: 600, textTransform: 'uppercase' }}>
                O probar con los 5 roles
              </span>
              <div style={{ flex: 1, height: '1px', background: 'var(--slate-200)' }} />
            </div>

            {/* Accesos Rápidos por Rol (Heurística Nielsen 7: Flexibilidad y eficiencia) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('ADMIN')}
                style={{
                  padding: '0.5rem 0.75rem',
                  borderRadius: '8px',
                  border: '1px solid var(--violet-200)',
                  background: 'var(--violet-50)',
                  color: 'var(--violet-800)',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <span>1. Rol Administrador (Usuarios y Auditoría)</span>
                <Sparkles size={14} />
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemoLogin('FUNCIONARIO')}
                style={{
                  padding: '0.5rem 0.75rem',
                  borderRadius: '8px',
                  border: '1px solid var(--sky-200)',
                  background: 'var(--sky-50)',
                  color: 'var(--sky-700)',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <span>2. Rol Funcionario (Atención y Constancias)</span>
                <Sparkles size={14} />
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemoLogin('SUPERVISOR')}
                style={{
                  padding: '0.5rem 0.75rem',
                  borderRadius: '8px',
                  border: '1px solid var(--amber-200)',
                  background: 'var(--amber-50)',
                  color: 'var(--amber-800)',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <span>3. Rol Supervisor (Aprobación y Panorama)</span>
                <Sparkles size={14} />
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemoLogin('CONTROL_MUNICIPAL')}
                style={{
                  padding: '0.5rem 0.75rem',
                  borderRadius: '8px',
                  border: '1px solid var(--green-200)',
                  background: 'var(--green-50)',
                  color: 'var(--green-800)',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <span>4. Rol Control Municipal (Reportes OCI)</span>
                <Sparkles size={14} />
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemoLogin('CONTROL_TI')}
                style={{
                  padding: '0.5rem 0.75rem',
                  borderRadius: '8px',
                  border: '1px solid var(--fuchsia-200)',
                  background: 'var(--fuchsia-50)',
                  color: 'var(--fuchsia-800)',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <span>5. Rol Control TI (Telemetría App Móvil)</span>
                <Sparkles size={14} />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
