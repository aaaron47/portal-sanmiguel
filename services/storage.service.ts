import { AuthSession } from '@/types/auth.types';

const SESSION_KEY = 'sanmi_auth_session';

export const storageService = {
  getSession(): AuthSession | null {
    if (typeof window === 'undefined') return null;
    try {
      const stored = localStorage.getItem(SESSION_KEY);
      if (!stored) return null;
      return JSON.parse(stored) as AuthSession;
    } catch {
      return null;
    }
  },

  setSession(session: AuthSession): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    } catch (e) {
      console.error('Error al guardar sesión en storage:', e);
    }
  },

  clearSession(): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(SESSION_KEY);
    } catch (e) {
      console.error('Error al limpiar sesión de storage:', e);
    }
  },

  getToken(): string | null {
    const session = this.getSession();
    return session?.token || null;
  }
};
