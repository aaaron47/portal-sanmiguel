export type UserRole = 
  | 'ADMIN'
  | 'FUNCIONARIO'
  | 'SUPERVISOR'
  | 'CONTROL_MUNICIPAL'
  | 'CONTROL_TI';

export const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: 'Administrador',
  FUNCIONARIO: 'Funcionario',
  SUPERVISOR: 'Supervisor',
  CONTROL_MUNICIPAL: 'Control Municipal',
  CONTROL_TI: 'Control TI',
};

export interface Usuario {
  id: string;
  dni: string;
  nombreCompleto: string;
  email: string;
  rol: UserRole;
  area?: string; // Por ejemplo: 'Fiscalización', 'Mesa de Partes', 'Obras Públicas', 'TI'
  activo: boolean;
  ultimoAcceso?: string;
  creadoEn: string;
}

export interface LoginCredentials {
  emailOrDni: string;
  password?: string;
  targetRole?: UserRole; // Soporte para selector rápido
}

export interface AuthSession {
  token: string;
  refreshToken?: string;
  usuario: Usuario;
  expiraEn: number;
}
