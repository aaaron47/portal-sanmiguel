'use client';

import React, { createContext, useContext, useState, useSyncExternalStore, useTransition } from 'react';
import { AuthSession, LoginCredentials, UserRole, Usuario } from '@/types/auth.types';
import { authController, USUARIOS_DEMO } from '@/controllers/auth.controller';
import { storageService } from '@/services/storage.service';

interface AuthContextType {
  usuario: Usuario | null;
  rol: UserRole | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  switchRoleDemo: (role: UserRole) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Usuario de la sesión guardada, si sigue vigente; si venció, la borra.
 * En el servidor no hay localStorage y devuelve null.
 */
function usuarioDeSesionGuardada(): Usuario | null {
  const session = storageService.getSession();
  if (session?.usuario && (!session.expiraEn || session.expiraEn > Date.now())) {
    return session.usuario;
  }
  if (session) storageService.clearSession();
  return null;
}

const sinSuscripcion = () => () => {};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Se lee al crear el estado (sin efecto). Solo se entra directo si hay una sesión vigente.
  const [usuario, setUsuario] = useState<Usuario | null>(usuarioDeSesionGuardada);
  // false en el servidor y en la hidratación, true después: mientras tanto se muestra "Cargando",
  // así el HTML del servidor (sin sesión) y el primer render del navegador coinciden.
  const hidratado = useSyncExternalStore(sinSuscripcion, () => true, () => false);
  const [cerrandoSesion, setCerrandoSesion] = useState(false);
  const isLoading = !hidratado || cerrandoSesion;
  const [, startTransition] = useTransition();

  // No usa isLoading: el formulario de login muestra su propio "Iniciando sesión..." y,
  // si la página cambiara al indicador de carga, el formulario se desmontaría y perdería el error.
  const login = async (credentials: LoginCredentials) => {
    const session = await authController.login(credentials);
    setUsuario(session.usuario);
  };

  const logout = async () => {
    setCerrandoSesion(true);
    try {
      await authController.logout();
      setUsuario(null);
    } finally {
      setCerrandoSesion(false);
    }
  };

  const switchRoleDemo = (targetRole: UserRole) => {
    startTransition(() => {
      const demoUser = USUARIOS_DEMO[targetRole];
      const newSession: AuthSession = {
        token: `demo-switch-token-${targetRole.toLowerCase()}`,
        usuario: demoUser,
        expiraEn: Date.now() + 86400000,
      };
      storageService.setSession(newSession);
      setUsuario(demoUser);
    });
  };

  return (
    <AuthContext.Provider
      value={{
        usuario,
        rol: usuario?.rol || null,
        isAuthenticated: !!usuario,
        isLoading,
        login,
        logout,
        switchRoleDemo,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser utilizado dentro de un AuthProvider');
  }
  return context;
}
