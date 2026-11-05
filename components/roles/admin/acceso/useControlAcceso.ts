import { useState, useEffect, useMemo } from 'react';
import { NotifyFn } from '@/types/ui.types';
import { exportarCSV } from '@/utils/csv.utils';
import { apiClient, usarDatosDemo } from '@/services/api-client.service';
import { telemetriaController } from '@/controllers/telemetria.controller';
import { auditoriaController } from '@/controllers/auditoria.controller';

export interface VariablesAcceso {
  // 1. Políticas de Sesión y Autenticación
  sessionTimeoutMinutes: number;
  maxFailedLogins: number;
  minPasswordLength: number;
  require2FAForPrivileged: boolean;
  restrictToMunicipalNetwork: boolean;
  passwordExpirationDays: number;
  allowSimultaneousSessions: boolean;
  // 2. Gobernanza de Datos y Telemetría Móvil (Ley N° 29733)
  telemetriaActiva: boolean;
  /** Solo informativo: la purga mensual de la BD conserva 12 meses (RETENCION_USO_MESES). */
  mesesRetencionUso: number;
  versionTerminosVigente: string;
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
  telemetriaActiva: true,
  mesesRetencionUso: 12,
  versionTerminosVigente: 'v1.3 (2026-10)',
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
  const [variablesGuardadas, setVariablesGuardadas] = useState<VariablesAcceso>(DEFAULT_VARIABLES);
  const [variables, setVariables] = useState<VariablesAcceso>(DEFAULT_VARIABLES);
  const [isSaving, setIsSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [textoConfirmacion, setTextoConfirmacion] = useState('');

  // Sincronizar con el backend al montar el componente
  useEffect(() => {
    let montado = true;
    telemetriaController
      .getResumen()
      .then((resumen) => {
        if (!montado) return;
        const configInicial: VariablesAcceso = {
          ...DEFAULT_VARIABLES,
          telemetriaActiva: resumen.onboarding.telemetriaActiva,
          mesesRetencionUso: resumen.onboarding.mesesRetencionUso,
          versionTerminosVigente: resumen.onboarding.versionTerminosVigente,
        };
        setVariablesGuardadas(configInicial);
        setVariables(configInicial);
      })
      .catch(() => {
        // En caso de fallo de red, se mantienen los valores por defecto seguros
      });

    return () => {
      montado = false;
    };
  }, []);

  const updateVariable = <K extends keyof VariablesAcceso>(key: K, value: VariablesAcceso[K]) => {
    setVariables((prev) => ({ ...prev, [key]: value }));
  };

  // Comparar si existen cambios con respecto a lo guardado
  const hayCambios = useMemo(() => {
    return (Object.keys(variablesGuardadas) as (keyof VariablesAcceso)[]).some(
      (k) => variables[k] !== variablesGuardadas[k]
    );
  }, [variables, variablesGuardadas]);

  // Lista detallada de cambios detectados para el modal y la auditoría
  const resumenCambios = useMemo(() => {
    const lista: string[] = [];
    if (variables.sessionTimeoutMinutes !== variablesGuardadas.sessionTimeoutMinutes) {
      lista.push(`Tiempo de Inactividad: ${variablesGuardadas.sessionTimeoutMinutes}m ➔ ${variables.sessionTimeoutMinutes}m`);
    }
    if (variables.passwordExpirationDays !== variablesGuardadas.passwordExpirationDays) {
      lista.push(`Renovación de Contraseña: ${variablesGuardadas.passwordExpirationDays}d ➔ ${variables.passwordExpirationDays}d`);
    }
    if (variables.maxFailedLogins !== variablesGuardadas.maxFailedLogins) {
      lista.push(`Intentos fallidos antes de bloqueo: ${variablesGuardadas.maxFailedLogins} ➔ ${variables.maxFailedLogins}`);
    }
    if (variables.minPasswordLength !== variablesGuardadas.minPasswordLength) {
      lista.push(`Longitud mínima de contraseña: ${variablesGuardadas.minPasswordLength} ➔ ${variables.minPasswordLength} caracteres`);
    }
    if (variables.telemetriaActiva !== variablesGuardadas.telemetriaActiva) {
      lista.push(`Telemetría Móvil: ${variablesGuardadas.telemetriaActiva ? 'ACTIVA' : 'EN PAUSA'} ➔ ${variables.telemetriaActiva ? 'REANUDADA (ACTIVA)' : 'PAUSADA (KILL-SWITCH ACTIVADO)'}`);
    }
    if (variables.versionTerminosVigente !== variablesGuardadas.versionTerminosVigente) {
      lista.push(`Versión Términos App: ${variablesGuardadas.versionTerminosVigente} ➔ ${variables.versionTerminosVigente} (Re-aceptación ciudadana obligatoria)`);
    }
    return lista;
  }, [variables, variablesGuardadas]);

  const solicitarGuardar = () => {
    if (!hayCambios) return;
    setTextoConfirmacion('');
    setIsModalOpen(true);
  };

  const cancelarGuardar = () => {
    setIsModalOpen(false);
    setTextoConfirmacion('');
  };

  const confirmarYGuardar = async () => {
    if (textoConfirmacion.trim().toLowerCase() !== 'realizar cambios' || isSaving) return;

    setIsSaving(true);
    try {
      // 1. Guardar cambios de telemetría/gobernanza en Spring Boot
      await telemetriaController.actualizarConfiguracionPrivacidad({
        telemetriaActiva: variables.telemetriaActiva,
        versionTerminosVigente: variables.versionTerminosVigente,
      });

      // 2. Guardar políticas de acceso en Spring Boot
      try {
        await apiClient('/seguridad/politicas-acceso', {
          method: 'PUT',
          body: JSON.stringify(variables),
        });
      } catch (err) {
        if (!usarDatosDemo(err)) throw err;
      }

      // 3. Registrar formalmente en auditoría
      await auditoriaController.registrarLog({
        accion: 'ACTUALIZACION_POLITICA',
        entidadAfectada: 'Políticas de Seguridad y Acceso',
        detalles: `Configuración actualizada por Administrador. Modificaciones aplicadas: ${resumenCambios.join(' | ')}.`,
      });

      setVariablesGuardadas({ ...variables });
      setIsModalOpen(false);
      setTextoConfirmacion('');
      onNotify('success', 'Todas las políticas de acceso y gobernanza fueron actualizadas con éxito y registradas en auditoría.');
    } catch {
      onNotify('error', 'Error al guardar las políticas en el servidor. Intente nuevamente.');
    } finally {
      setIsSaving(false);
    }
  };

  const descartarCambios = () => {
    setVariables(variablesGuardadas);
    onNotify('info', 'Cambios en borrador descartados.');
  };

  const restablecerValores = () => {
    setVariables(DEFAULT_VARIABLES);
    onNotify('info', 'Valores de acceso reestablecidos por defecto (en borrador). Presione "Guardar Configuración" para aplicarlos.');
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
    variablesGuardadas,
    updateVariable,
    hayCambios,
    resumenCambios,
    isModalOpen,
    textoConfirmacion,
    setTextoConfirmacion,
    solicitarGuardar,
    cancelarGuardar,
    confirmarYGuardar,
    descartarCambios,
    matrizPermisos: MATRIZ_PERMISOS,
    isSaving,
    restablecerValores,
    descargarCSV,
  };
}
