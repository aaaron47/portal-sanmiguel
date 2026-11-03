import { apiClient, usarDatosDemo } from '@/services/api-client.service';
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
  {
    id: 'USR-FUN-12',
    dni: '42119988',
    nombreCompleto: 'Ing. Roberto Castro',
    email: 'roberto.castro@sanmiguel.gob.pe',
    rol: 'FUNCIONARIO',
    area: 'Gestión Ambiental',
    activo: true,
    ultimoAcceso: '2026-10-31 09:30',
    creadoEn: '2025-04-10',
  },
  {
    id: 'USR-FUN-15',
    dni: '43990011',
    nombreCompleto: 'Dra. Patricia Valdivia',
    email: 'patricia.valdivia@sanmiguel.gob.pe',
    rol: 'FUNCIONARIO',
    area: 'Fiscalización y Control',
    activo: true,
    ultimoAcceso: '2026-11-01 15:20',
    creadoEn: '2025-05-18',
  },
  {
    id: 'USR-FUN-18',
    dni: '46771122',
    nombreCompleto: 'Lic. Miguel Ángel Benites',
    email: 'miguel.benites@sanmiguel.gob.pe',
    rol: 'FUNCIONARIO',
    area: 'Seguridad Ciudadana',
    activo: true,
    ultimoAcceso: '2026-11-02 08:45',
    creadoEn: '2025-06-22',
  },
  {
    id: 'USR-FUN-21',
    dni: '45882233',
    nombreCompleto: 'Abg. Carmen Del Solar',
    email: 'carmen.delsolar@sanmiguel.gob.pe',
    rol: 'FUNCIONARIO',
    area: 'Servicios a la Ciudad',
    activo: false,
    ultimoAcceso: '2026-09-15 12:00',
    creadoEn: '2025-07-05',
  },
  {
    id: 'USR-FUN-24',
    dni: '47113344',
    nombreCompleto: 'CPC. Daniel Ramos',
    email: 'daniel.ramos@sanmiguel.gob.pe',
    rol: 'CONTROL_MUNICIPAL',
    area: 'Control Institucional (OCI)',
    activo: true,
    ultimoAcceso: '2026-11-02 10:10',
    creadoEn: '2025-08-14',
  },
  {
    id: 'USR-FUN-27',
    dni: '48224455',
    nombreCompleto: 'Lic. Gabriela Mendoza',
    email: 'gabriela.mendoza@sanmiguel.gob.pe',
    rol: 'SUPERVISOR',
    area: 'Participación Vecinal',
    activo: true,
    ultimoAcceso: '2026-11-02 11:30',
    creadoEn: '2025-09-01',
  },
];

export class UsuariosController {
  async getUsuarios(): Promise<Usuario[]> {
    try {
      return await apiClient<Usuario[]>('/usuarios');
    } catch (err) {
      // Datos simulados solo sin conexión y en modo demo; si no, el error llega a la vista.
      if (!usarDatosDemo(err)) throw err;
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
      // Datos simulados solo sin conexión y en modo demo; si no, el error llega a la vista.
      if (!usarDatosDemo(err)) throw err;
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
      // Datos simulados solo sin conexión y en modo demo; si no, el error llega a la vista.
      if (!usarDatosDemo(err)) throw err;
      const index = MOCK_USUARIOS.findIndex(u => u.id === id);
      if (index === -1) throw new Error('Usuario no encontrado');
      MOCK_USUARIOS[index] = { ...MOCK_USUARIOS[index], activo };
      return MOCK_USUARIOS[index];
    }
  }
}

export const usuariosController = new UsuariosController();
