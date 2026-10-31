import { useState } from 'react';
import { NotifyFn } from '@/types/ui.types';
import { exportarCSV } from '@/utils/csv.utils';

export interface VariablesAcceso {
  sessionTimeoutMinutes: number;
  maxFailedLogins: number;
  minPasswordLength: number;
  require2FAForPrivileged: boolean;
  restrictToMunicipalNetwork: boolean;
  passwordExpirationDays: number;
  allowSimultaneousSessions: boolean;
}

export interface PermisoRol {
  rol: string;
  nombreRol: string;
  alcance: string;
  operacionesPermitidas: string;
  nivelAcceso: 'Total' | 'Operativo' | 'Supervisión' | 'Auditoría' | 'Monitoreo';
}

const DEFAULT_VARIABLES: VariablesAcceso = {
  sessionTimeoutMinutes: 45,
  maxFailedLogins: 5,
  minPasswordLength: 8,
  require2FAForPrivileged: true,
  restrictToMunicipalNetwork: false,
  passwordExpirationDays: 90,
  allowSimultaneousSessions: false,
};

const MATRIZ_PERMISOS: PermisoRol[] = [
  {
    rol: 'ADMIN',
    nombreRol: 'Administrador del Sistema',
    alcance: 'Gobierno de cuentas, seguridad y auditoría institucional',
    operacionesPermitidas: 'Crear, activar, bloquear personal, auditar trazas y configurar acceso',
    nivelAcceso: 'Total',
  },
  {
    rol: 'FUNCIONARIO',
    nombreRol: 'Funcionario de Área',
    alcance: 'Bandeja asignada de su gerencia técnica municipal',
    operacionesPermitidas: 'Responder quejas, derivar casos según Directiva Ágil y dictaminar constancias',
    nivelAcceso: 'Operativo',
  },
  {
    rol: 'SUPERVISOR',
    nombreRol: 'Supervisor General',
    alcance: 'Supervisión transversal de todas las áreas municipales',
    operacionesPermitidas: 'Aprobar resoluciones definitivas y reasignar funcionarios por sobrecarga',
    nivelAcceso: 'Supervisión',
  },
  {
    rol: 'CONTROL_MUNICIPAL',
    nombreRol: 'Control Municipal (OCI)',
    alcance: 'Informes de cumplimiento de plazos y balance de constancias',
    operacionesPermitidas: 'Solo lectura de expedientes, exportación de reportes de efectividad OCI',
    nivelAcceso: 'Auditoría',
  },
  {
    rol: 'CONTROL_TI',
    nombreRol: 'Control TI / Soporte App',
    alcance: 'Telemetría de la aplicación móvil y eventos sin PII',
    operacionesPermitidas: 'Auditar métricas anónimas, dispositivos y cumplimiento de Ley 29733',
    nivelAcceso: 'Monitoreo',
  },
];

export function useControlAcceso(onNotify: NotifyFn) {
  const [variables, setVariables] = useState<VariablesAcceso>(DEFAULT_VARIABLES);
  const [isSaving, setIsSaving] = useState(false);

  const updateVariable = <K extends keyof VariablesAcceso>(key: K, value: VariablesAcceso[K]) => {
    setVariables((prev) => ({ ...prev, [key]: value }));
  };

  const guardarCambios = async () => {
    setIsSaving(true);
    try {
      // Simular persistencia en backend
      await new Promise((resolve) => setTimeout(resolve, 350));
      onNotify('success', 'Variables de control de acceso actualizadas correctamente');
    } catch {
      onNotify('error', 'Error al guardar las variables de acceso');
    } finally {
      setIsSaving(false);
    }
  };

  const restablecerValores = () => {
    setVariables(DEFAULT_VARIABLES);
    onNotify('info', 'Valores de acceso restablecidos por defecto');
  };

  const descargarCSV = () => {
    const cabeceras = ['Rol', 'Nombre del Rol', 'Alcance Municipal', 'Operaciones Permitidas', 'Nivel de Acceso'];
    const filas = MATRIZ_PERMISOS.map((p) => [
      p.rol,
      p.nombreRol,
      p.alcance,
      p.operacionesPermitidas,
      p.nivelAcceso,
    ]);
    exportarCSV('control_acceso', cabeceras, filas);
    onNotify('success', 'Matriz de control de acceso exportada a CSV');
  };

  return {
    variables,
    updateVariable,
    matrizPermisos: MATRIZ_PERMISOS,
    isSaving,
    guardarCambios,
    restablecerValores,
    descargarCSV,
  };
}
