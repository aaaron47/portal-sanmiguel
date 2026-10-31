import { apiClient } from '@/services/api-client.service';
import { AuditoriaLog, AuditoriaFiltros } from '@/types/auditoria.types';

const MOCK_LOGS_AUDITORIA: AuditoriaLog[] = [
  {
    id: 'AUD-001',
    adminId: 'USR-ADM-01',
    adminNombre: 'Ing. Carlos Mendoza',
    adminEmail: 'carlos.mendoza@sanmiguel.gob.pe',
    accion: 'LOGIN',
    entidadAfectada: 'Sesión Administrativa',
    ipOrigen: '192.168.10.45',
    userAgent: 'Mozilla/5.0 (X11; Linux x86_64)',
    detalles: 'Inicio de sesión con validación de credenciales y rol ADMIN.',
    fecha: '2026-10-30 19:40:15',
  },
  {
    id: 'AUD-002',
    adminId: 'USR-ADM-01',
    adminNombre: 'Ing. Carlos Mendoza',
    adminEmail: 'carlos.mendoza@sanmiguel.gob.pe',
    accion: 'CREACION_USUARIO',
    entidadAfectada: 'Usuario: USR-FUN-02',
    ipOrigen: '192.168.10.45',
    userAgent: 'Mozilla/5.0 (X11; Linux x86_64)',
    detalles: 'Alta de funcionario en módulo Fiscalización con DNI 71239845.',
    fecha: '2026-10-30 18:25:00',
  },
  {
    id: 'AUD-003',
    adminId: 'USR-ADM-01',
    adminNombre: 'Ing. Carlos Mendoza',
    adminEmail: 'carlos.mendoza@sanmiguel.gob.pe',
    accion: 'CAMBIO_ESTADO_USUARIO',
    entidadAfectada: 'Usuario: USR-FUN-07',
    ipOrigen: '192.168.10.45',
    userAgent: 'Mozilla/5.0 (X11; Linux x86_64)',
    detalles: 'Desactivación temporal por cese laboral del funcionario.',
    fecha: '2026-10-29 14:10:22',
  },
  {
    id: 'AUD-004',
    adminId: 'USR-ADM-01',
    adminNombre: 'Ing. Carlos Mendoza',
    adminEmail: 'carlos.mendoza@sanmiguel.gob.pe',
    accion: 'CONSULTA_AUDITORIA',
    entidadAfectada: 'Módulo Auditoría General',
    ipOrigen: '192.168.10.45',
    userAgent: 'Mozilla/5.0 (X11; Linux x86_64)',
    detalles: 'Exportación de eventos de seguridad para control interno.',
    fecha: '2026-10-29 11:05:40',
  },
];

export class AuditoriaController {
  async getLogs(filtros?: AuditoriaFiltros): Promise<AuditoriaLog[]> {
    try {
      return await apiClient<AuditoriaLog[]>('/auditoria', {
        params: filtros as Record<string, string | number | boolean | undefined>,
      });
    } catch {
      let resultado = [...MOCK_LOGS_AUDITORIA];
      if (filtros?.accion) {
        resultado = resultado.filter(l => l.accion === filtros.accion);
      }
      if (filtros?.busqueda) {
        const query = filtros.busqueda.toLowerCase();
        resultado = resultado.filter(l => 
          l.adminNombre.toLowerCase().includes(query) ||
          l.entidadAfectada.toLowerCase().includes(query) ||
          l.detalles.toLowerCase().includes(query)
        );
      }
      return resultado;
    }
  }
}

export const auditoriaController = new AuditoriaController();
