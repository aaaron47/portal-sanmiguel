'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (t: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

/** Preferencia guardada en localStorage o, si no hay, la del sistema. En el servidor, 'light'. */
function temaInicial(): Theme {
  if (typeof window === 'undefined') return 'light';
  try {
    const savedTheme = localStorage.getItem('portal_theme');
    if (savedTheme === 'light' || savedTheme === 'dark') return savedTheme;
  } catch {
    // Sin acceso a localStorage (p. ej. bloqueado por el navegador): se usa la preferencia del sistema.
  }
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Se lee al crear el estado (sin efecto). El primer render de la app es "Cargando" (AuthContext),
  // que no depende del tema, así que no hay diferencias entre el HTML del servidor y el del navegador.
  const [theme, setThemeState] = useState<Theme>(temaInicial);

  // El efecto solo sincroniza el DOM (atributo del <html>) con el estado.
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const setTheme = (t: Theme) => {
    setThemeState(t);
    try {
      localStorage.setItem('portal_theme', t);
    } catch {
      // Si no se puede guardar, el tema igual cambia en esta sesión.
    }
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme debe ser usado dentro de un ThemeProvider');
  }
  return context;
};
