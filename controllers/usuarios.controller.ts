import { apiClient, esSinConexion } from '@/services/api-client.service';
import { Usuario } from '@/types/auth.types';
import { USUARIOS_DEMO } from './auth.controller';

const MOCK_USUARIOS: Usuario[] = [
  USUARIOS_DEMO.ADMIN,
  USUARIOS_DEMO.FUNCIONARIO,
  USUARIOS_DEMO.SUPERVISOR,
  USUARIOS_DEMO.CONTROL_MUNICIPAL,
  USUARIOS_DEMO.CONTROL_TI,
  {
    id: 'USR-FUN-09',
    dni: '40891238',
    nombreCompleto: 'Ing. Fernando Rojas',
    email: 'fernando.rojas@sanmiguel.gob.pe',
    rol: 'FUNCIONARIO',
    area: 'Obras Públicas',
    activo: true,
    ultimoAcceso: '2026-10-30 11:15',
    creadoEn: '2025-02-15',
  },
  {
    id: 'USR-FUN-04',
    dni: '44556677',
    nombreCompleto: 'Bach. Laura Paredes',
    email: 'laura.paredes@sanmiguel.gob.pe',
    rol: 'FUNCIONARIO',
    area: 'Parques y Jardines',
    activo: true,
    ultimoAcceso: '2026-10-30 16:45',
    creadoEn: '2025-03-20',
  },
];

export class UsuariosController {
  async getUsuarios(): Promise<Usuario[]> {
    try {
      return await apiClient<Usuario[]>('/usuarios');
    } catch (err) {
      // Datos simulados solo sin conexión; si el backend respondió con error, se avisa a la vista.
      if (!esSinConexion(err)) throw err;
      return [...MOCK_USUARIOS];
    }
  }

  async crearUsuario(data: Omit<Usuario, 'id' | 'creadoEn' | 'activo'>): Promise<Usuario> {
    try {
      return await apiClient<Usuario>('/usuarios', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch (err) {
      // Datos simulados solo sin conexión; si el backend respondió con error, se avisa a la vista.
      if (!esSinConexion(err)) throw err;
      const nuevo: Usuario = {
        ...data,
        id: `USR-${Date.now().toString().slice(-4)}`,
        activo: true,
        creadoEn: new Date().toISOString().substring(0, 10),
      };
      MOCK_USUARIOS.unshift(nuevo);
      return nuevo;
    }
  }

  async cambiarEstadoUsuario(id: string, activo: boolean): Promise<Usuario> {
    try {
      return await apiClient<Usuario>(`/usuarios/${id}/estado`, {
        method: 'PATCH',
        body: JSON.stringify({ activo }),
      });
    } catch (err) {
      // Datos simulados solo sin conexión; si el backend respondió con error, se avisa a la vista.
      if (!esSinConexion(err)) throw err;
      const index = MOCK_USUARIOS.findIndex(u => u.id === id);
      if (index === -1) throw new Error('Usuario no encontrado');
      MOCK_USUARIOS[index] = { ...MOCK_USUARIOS[index], activo };
      return MOCK_USUARIOS[index];
    }
  }
}

export const usuariosController = new UsuariosController();
