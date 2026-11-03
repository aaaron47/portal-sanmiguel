import { apiClient, usarDatosDemo } from '@/services/api-client.service';
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
    fecha: '2026-11-02 08:30:15',
  },
  {
    id: 'AUD-002',
    adminId: 'USR-ADM-01',
    adminNombre: 'Ing. Carlos Mendoza',
    adminEmail: 'carlos.mendoza@sanmiguel.gob.pe',
    accion: 'CONSULTA_GOBERNANZA',
    entidadAfectada: 'Módulo Control de Acceso',
    ipOrigen: '192.168.10.45',
    userAgent: 'Mozilla/5.0 (X11; Linux x86_64)',
    detalles: 'Verificación de estado de políticas Ley N° 29733 y telemetría móvil.',
    fecha: '2026-11-02 09:12:40',
  },
  {
    id: 'AUD-003',
    adminId: 'USR-ADM-01',
    adminNombre: 'Ing. Carlos Mendoza',
    adminEmail: 'carlos.mendoza@sanmiguel.gob.pe',
    accion: 'CREACION_USUARIO',
    entidadAfectada: 'Usuario: USR-FUN-09',
    ipOrigen: '192.168.10.45',
    userAgent: 'Mozilla/5.0 (X11; Linux x86_64)',
    detalles: 'Alta de nuevo funcionario en módulo Fiscalización con DNI 71239845.',
    fecha: '2026-11-01 16:45:00',
  },
  {
    id: 'AUD-004',
    adminId: 'USR-ADM-02',
    adminNombre: 'Lic. Sofía Alarcón',
    adminEmail: 'sofia.alarcon@sanmiguel.gob.pe',
    accion: 'ASIGNACION_ROL',
    entidadAfectada: 'Usuario: USR-FUN-04',
    ipOrigen: '192.168.10.88',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    detalles: 'Actualización de permisos a Supervisor General de Reclamos.',
    fecha: '2026-11-01 14:20:10',
  },
  {
    id: 'AUD-005',
    adminId: 'USR-ADM-01',
    adminNombre: 'Ing. Carlos Mendoza',
    adminEmail: 'carlos.mendoza@sanmiguel.gob.pe',
    accion: 'EXPORTACION_REPORTE',
    entidadAfectada: 'Auditoría Legal Ley N° 29733',
    ipOrigen: '192.168.10.45',
    userAgent: 'Mozilla/5.0 (X11; Linux x86_64)',
    detalles: 'Descarga de informe de consentimientos ciudadanos para OCI.',
    fecha: '2026-11-01 11:05:30',
  },
  {
    id: 'AUD-006',
    adminId: 'USR-ADM-02',
    adminNombre: 'Lic. Sofía Alarcón',
    adminEmail: 'sofia.alarcon@sanmiguel.gob.pe',
    accion: 'CAMBIO_ESTADO_USUARIO',
    entidadAfectada: 'Usuario: USR-FUN-07',
    ipOrigen: '192.168.10.88',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    detalles: 'Desactivación temporal por cese laboral del funcionario.',
    fecha: '2026-10-31 17:15:22',
  },
  {
    id: 'AUD-007',
    adminId: 'USR-ADM-01',
    adminNombre: 'Ing. Carlos Mendoza',
    adminEmail: 'carlos.mendoza@sanmiguel.gob.pe',
    accion: 'ACTUALIZACION_POLITICA',
    entidadAfectada: 'Gobernanza de Retención',
    ipOrigen: '192.168.10.45',
    userAgent: 'Mozilla/5.0 (X11; Linux x86_64)',
    detalles: 'Confirmación de política de retención legal a 60 días en base de datos.',
    fecha: '2026-10-31 10:40:18',
  },
  {
    id: 'AUD-008',
    adminId: 'USR-ADM-01',
    adminNombre: 'Ing. Carlos Mendoza',
    adminEmail: 'carlos.mendoza@sanmiguel.gob.pe',
    accion: 'LOGIN',
    entidadAfectada: 'Sesión Administrativa',
    ipOrigen: '192.168.10.45',
    userAgent: 'Mozilla/5.0 (X11; Linux x86_64)',
    detalles: 'Inicio de sesión seguro mediante protocolo 2FA.',
    fecha: '2026-10-30 08:00:12',
  },
  {
    id: 'AUD-009',
    adminId: 'USR-ADM-02',
    adminNombre: 'Lic. Sofía Alarcón',
    adminEmail: 'sofia.alarcon@sanmiguel.gob.pe',
    accion: 'REASIGNACION_MASIVA',
    entidadAfectada: 'Expedientes Fiscalización',
    ipOrigen: '192.168.10.88',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    detalles: 'Rebalanceo de 14 tickets acumulados por alta demanda en Av. Costanera.',
    fecha: '2026-10-29 18:30:00',
  },
  {
    id: 'AUD-010',
    adminId: 'USR-ADM-01',
    adminNombre: 'Ing. Carlos Mendoza',
    adminEmail: 'carlos.mendoza@sanmiguel.gob.pe',
    accion: 'APROBACION_RESOLUCION',
    entidadAfectada: 'Expediente REC-2026-00412',
    ipOrigen: '192.168.10.45',
    userAgent: 'Mozilla/5.0 (X11; Linux x86_64)',
    detalles: 'Visto bueno a resolución de subsanación de ruidos molestos.',
    fecha: '2026-10-29 15:10:45',
  },
  {
    id: 'AUD-011',
    adminId: 'USR-ADM-01',
    adminNombre: 'Ing. Carlos Mendoza',
    adminEmail: 'carlos.mendoza@sanmiguel.gob.pe',
    accion: 'DEPURACION_PROGRAMADA',
    entidadAfectada: 'Logs Antiguos Telemetría',
    ipOrigen: '192.168.10.45',
    userAgent: 'CRON_JOB_SISTEMA',
    detalles: 'Ejecución automática de purga de eventos anónimos de más de 60 días.',
    fecha: '2026-10-29 03:00:01',
  },
  {
    id: 'AUD-012',
    adminId: 'USR-ADM-02',
    adminNombre: 'Lic. Sofía Alarcón',
    adminEmail: 'sofia.alarcon@sanmiguel.gob.pe',
    accion: 'CONSULTA_AUDITORIA',
    entidadAfectada: 'Módulo Auditoría General',
    ipOrigen: '192.168.10.88',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    detalles: 'Revisión periódica de accesos y trazabilidad administrativa.',
    fecha: '2026-10-28 11:20:19',
  },
];

export class AuditoriaController {
  async getLogs(filtros?: AuditoriaFiltros): Promise<AuditoriaLog[]> {
    try {
      return await apiClient<AuditoriaLog[]>('/auditoria', {
        params: filtros as Record<string, string | number | boolean | undefined>,
      });
    } catch (err) {
      // Datos simulados solo sin conexión y en modo demo; si no, el error llega a la vista.
      if (!usarDatosDemo(err)) throw err;
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

  async registrarLog(nuevoLog: {
    adminNombre?: string;
    adminEmail?: string;
    accion: string;
    entidadAfectada: string;
    detalles: string;
    ipOrigen?: string;
  }): Promise<AuditoriaLog> {
    try {
      return await apiClient<AuditoriaLog>('/auditoria', {
        method: 'POST',
        body: JSON.stringify(nuevoLog),
      });
    } catch (err) {
      if (!usarDatosDemo(err)) throw err;
      const logCreado: AuditoriaLog = {
        id: `AUD-${String(MOCK_LOGS_AUDITORIA.length + 1).padStart(3, '0')}`,
        adminId: 'USR-ADM-01',
        adminNombre: nuevoLog.adminNombre || 'Ing. Carlos Mendoza',
        adminEmail: nuevoLog.adminEmail || 'carlos.mendoza@sanmiguel.gob.pe',
        accion: nuevoLog.accion,
        entidadAfectada: nuevoLog.entidadAfectada,
        ipOrigen: nuevoLog.ipOrigen || '192.168.10.45',
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Mozilla/5.0 (Admin Console)',
        detalles: nuevoLog.detalles,
        fecha: new Date().toISOString().replace('T', ' ').substring(0, 19),
      };
      MOCK_LOGS_AUDITORIA.unshift(logCreado);
      return logCreado;
    }
  }
}

export const auditoriaController = new AuditoriaController();
