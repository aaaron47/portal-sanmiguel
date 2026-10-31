'use client';

import React, { createContext, useContext, useEffect, useState, useTransition } from 'react';
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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [, startTransition] = useTransition();

  useEffect(() => {
    // Solo se entra directo si hay una sesión guardada y vigente; si no, se muestra el login.
    const session = storageService.getSession();
    if (session?.usuario && (!session.expiraEn || session.expiraEn > Date.now())) {
      setUsuario(session.usuario);
    } else if (session) {
      storageService.clearSession();
    }
    setIsLoading(false);
  }, []);

  // No usa isLoading: el formulario de login muestra su propio "Iniciando sesión..." y,
  // si la página cambiara al indicador de carga, el formulario se desmontaría y perdería el error.
  const login = async (credentials: LoginCredentials) => {
    const session = await authController.login(credentials);
    setUsuario(session.usuario);
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await authController.logout();
      setUsuario(null);
    } finally {
      setIsLoading(false);
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
