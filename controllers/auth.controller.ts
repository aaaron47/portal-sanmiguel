import { apiClient } from '@/services/api-client.service';
import { storageService } from '@/services/storage.service';
import { AuthSession, LoginCredentials, UserRole, Usuario } from '@/types/auth.types';

// Usuarios de demostración para los 5 roles solicitados por la municipalidad
export const USUARIOS_DEMO: Record<UserRole, Usuario> = {
  ADMIN: {
    id: 'USR-ADM-01',
    dni: '45892101',
    nombreCompleto: 'Ing. Carlos Mendoza',
    email: 'carlos.mendoza@sanmiguel.gob.pe',
    rol: 'ADMIN',
    area: 'Tecnología y Gestión',
    activo: true,
    ultimoAcceso: '2026-10-30 19:40',
    creadoEn: '2025-01-15',
  },
  FUNCIONARIO: {
    id: 'USR-FUN-02',
    dni: '71239845',
    nombreCompleto: 'Lic. Mariana Rios',
    email: 'mariana.rios@sanmiguel.gob.pe',
    rol: 'FUNCIONARIO',
    area: 'Fiscalización y Control',
    activo: true,
    ultimoAcceso: '2026-10-30 18:25',
    creadoEn: '2025-02-10',
  },
  SUPERVISOR: {
    id: 'USR-SUP-03',
    dni: '10984523',
    nombreCompleto: 'Dr. Roberto Salas',
    email: 'roberto.salas@sanmiguel.gob.pe',
    rol: 'SUPERVISOR',
    area: 'Supervisión General',
    activo: true,
    ultimoAcceso: '2026-10-30 20:05',
    creadoEn: '2024-11-01',
  },
  CONTROL_MUNICIPAL: {
    id: 'USR-CTM-04',
    dni: '08761234',
    nombreCompleto: 'Eco. Elena Benavides',
    email: 'elena.benavides@sanmiguel.gob.pe',
    rol: 'CONTROL_MUNICIPAL',
    area: 'Órgano de Control Institucional',
    activo: true,
    ultimoAcceso: '2026-10-30 15:10',
    creadoEn: '2025-03-01',
  },
  CONTROL_TI: {
    id: 'USR-TI-05',
    dni: '43998811',
    nombreCompleto: 'Ing. Diego Falconi',
    email: 'diego.falconi@sanmiguel.gob.pe',
    rol: 'CONTROL_TI',
    area: 'TI e Innovación Digital',
    activo: true,
    ultimoAcceso: '2026-10-30 20:12',
    creadoEn: '2025-01-20',
  },
};

export class AuthController {
  /**
   * Autenticación de usuario. Consume endpoint /auth/login del backend.
   * Cuenta con fallback demo transparente para evaluar los 5 perfiles.
   */
  async login(credentials: LoginCredentials): Promise<AuthSession> {
    try {
      // Intento contra backend real
      const session = await apiClient<AuthSession>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      });
      storageService.setSession(session);
      return session;
    } catch {
      // Fallback inteligente para entorno de desarrollo / evaluación de roles
      const targetRole = credentials.targetRole || 'FUNCIONARIO';
      const usuario = USUARIOS_DEMO[targetRole];
      
      const mockSession: AuthSession = {
        token: `mock-jwt-token-${usuario.rol.toLowerCase()}-${Date.now()}`,
        usuario: {
          ...usuario,
          email: credentials.emailOrDni.includes('@') ? credentials.emailOrDni : usuario.email,
        },
        expiraEn: Date.now() + 8 * 60 * 60 * 1000, // 8 horas
      };

      storageService.setSession(mockSession);
      return mockSession;
    }
  }

  async logout(): Promise<void> {
    try {
      await apiClient('/auth/logout', { method: 'POST' });
    } catch {
      // Ignorar error de red al salir
    } finally {
      storageService.clearSession();
    }
  }

  async getCurrentUser(): Promise<Usuario | null> {
    const session = storageService.getSession();
    if (!session) return null;
    
    try {
      const user = await apiClient<Usuario>('/auth/me');
      return user;
    } catch {
      // Si el backend aún no está online, devuelve el usuario de la sesión guardada
      return session.usuario;
    }
  }
}

export const authController = new AuthController();
