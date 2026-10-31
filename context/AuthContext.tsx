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
    const session = storageService.getSession();
    if (session?.usuario) {
      setUsuario(session.usuario);
    } else {
      // Por defecto iniciamos con Funcionario como demostración accesible
      setUsuario(USUARIOS_DEMO.FUNCIONARIO);
      storageService.setSession({
        token: 'initial-demo-token',
        usuario: USUARIOS_DEMO.FUNCIONARIO,
        expiraEn: Date.now() + 86400000,
      });
    }
    setIsLoading(false);
  }, []);

  const login = async (credentials: LoginCredentials) => {
    setIsLoading(true);
    try {
      const session = await authController.login(credentials);
      setUsuario(session.usuario);
    } finally {
      setIsLoading(false);
    }
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
