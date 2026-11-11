import { useState, useEffect, useMemo } from 'react';
import { NotifyFn } from '@/types/ui.types';
import { exportarCSV } from '@/utils/csv.utils';
import { mensajeErrorApi } from '@/services/api-client.service';
import { telemetriaController } from '@/controllers/telemetria.controller';
import { seguridadController } from '@/controllers/seguridad.controller';
import { CambiosPoliticas, DocumentoVersion } from '@/types/seguridad.types';

export interface VariablesAcceso {
  // 1. Políticas de acceso del personal (PUT /seguridad/politicas-acceso)
  sessionTimeoutMinutes: number;
  maxFailedLogins: number;
  lockoutMinutes: number;
  minPasswordLength: number;
  // 2. Telemetría de la app (PUT /telemetria/configuracion)
  telemetriaActiva: boolean;
  /** Solo informativo: el backend purga cada día lo que supera este plazo (RETENCION_USO_MESES). */
  mesesRetencionUso: number;
  // 3. Versión activa del aviso de analítica (PUT /documentos-versiones/{id}/activar)
  versionAvisoId: string;
}

/** Cada sección se lee y se guarda con su propio endpoint. */
type Seccion = 'politicas' | 'telemetria' | 'documentos';

const SECCION: Record<keyof VariablesAcceso, Seccion> = {
  sessionTimeoutMinutes: 'politicas',
  maxFailedLogins: 'politicas',
  lockoutMinutes: 'politicas',
  minPasswordLength: 'politicas',
  telemetriaActiva: 'telemetria',
  mesesRetencionUso: 'telemetria',
  versionAvisoId: 'documentos',
};

const CAMPOS_POLITICAS = ['sessionTimeoutMinutes', 'maxFailedLogins', 'lockoutMinutes', 'minPasswordLength'] as const;

const NOMBRE_SECCION: Record<Seccion, string> = {
  politicas: 'las políticas de acceso',
  telemetria: 'la configuración de telemetría',
  documentos: 'las versiones del aviso de analítica',
};

export interface PermisoRol {
  rol: string;
  nombreRol: string;
  alcance: string;
  operacionesPermitidas: string;
  nivelAcceso: 'Total' | 'Operativo' | 'Supervisión' | 'Auditoría' | 'Monitoreo';
}

/** Valores recomendados (botón "Valores recomendados"). Mientras no se lea el servidor, solo se muestran atenuados. */
const DEFAULT_VARIABLES: VariablesAcceso = {
  sessionTimeoutMinutes: 30,
  maxFailedLogins: 5,
  lockoutMinutes: 15,
  minPasswordLength: 8,
  telemetriaActiva: true,
  mesesRetencionUso: 12,
  versionAvisoId: '',
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

/** "a", "a ni b", "a, b ni c". */
const unirNi = (partes: string[]) =>
  partes.length <= 1 ? partes.join('') : `${partes.slice(0, -1).join(', ')} ni ${partes[partes.length - 1]}`;

export function useControlAcceso(onNotify: NotifyFn) {
  const [variablesGuardadas, setVariablesGuardadas] = useState<VariablesAcceso>(DEFAULT_VARIABLES);
  const [variables, setVariables] = useState<VariablesAcceso>(DEFAULT_VARIABLES);
  const [isSaving, setIsSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [textoConfirmacion, setTextoConfirmacion] = useState('');
  // Mientras se lee la configuración del servidor no se puede guardar.
  const [cargandoConfig, setCargandoConfig] = useState(true);
  // Si no se pudo leer algo del servidor, se explica aquí. Solo se cambia lo que sí se leyó:
  // en lo demás, los valores en pantalla serían los recomendados, no los guardados.
  const [errorCarga, setErrorCarga] = useState<string | null>(null);
  const [leido, setLeido] = useState<Record<Seccion, boolean>>({ politicas: false, telemetria: false, documentos: false });
  const [versionPoliticas, setVersionPoliticas] = useState<number | undefined>(undefined);
  const [ultimaModificacion, setUltimaModificacion] = useState<{ fecha?: string; por?: string } | null>(null);
  const [versionesAviso, setVersionesAviso] = useState<DocumentoVersion[]>([]);
  /** Versión que informa `/telemetria/resumen` (por si no se pudieron leer las versiones). */
  const [versionAvisoVigente, setVersionAvisoVigente] = useState<string>('');

  // Leer la configuración guardada al abrir la pestaña
  useEffect(() => {
    let montado = true;
    Promise.allSettled([
      seguridadController.getPoliticas(),
      telemetriaController.getResumen(),
      seguridadController.getDocumentosVersiones('AVISO_ANALITICA'),
    ]).then(([resPoliticas, resTelemetria, resDocumentos]) => {
      if (!montado) return;
      const config: VariablesAcceso = { ...DEFAULT_VARIABLES };
      const faltan: string[] = [];
      let primerError: unknown;
      const fallo = (seccion: Seccion, razon: unknown) => {
        faltan.push(NOMBRE_SECCION[seccion]);
        primerError ??= razon;
      };

      if (resPoliticas.status === 'fulfilled') {
        const p = resPoliticas.value;
        CAMPOS_POLITICAS.forEach((k) => (config[k] = p[k]));
        setVersionPoliticas(p.version);
        setUltimaModificacion({ fecha: p.actualizadoEn, por: p.actualizadoPor });
      } else fallo('politicas', resPoliticas.reason);

      if (resTelemetria.status === 'fulfilled') {
        config.telemetriaActiva = resTelemetria.value.onboarding.telemetriaActiva;
        config.mesesRetencionUso = resTelemetria.value.onboarding.mesesRetencionUso;
        setVersionAvisoVigente(resTelemetria.value.onboarding.versionTerminosVigente);
      } else fallo('telemetria', resTelemetria.reason);

      if (resDocumentos.status === 'fulfilled') {
        setVersionesAviso(resDocumentos.value);
        config.versionAvisoId = resDocumentos.value.find((d) => d.activo)?.id ?? '';
      } else fallo('documentos', resDocumentos.reason);

      setVariablesGuardadas(config);
      setVariables(config);
      setLeido({
        politicas: resPoliticas.status === 'fulfilled',
        telemetria: resTelemetria.status === 'fulfilled',
        documentos: resDocumentos.status === 'fulfilled',
      });
      if (faltan.length > 0) {
        const detalle = mensajeErrorApi(primerError, 'Inténtalo de nuevo más tarde.', {
          404: 'El servidor todavía no ofrece esta configuración.',
        });
        setErrorCarga(
          `No se pudo leer del servidor ${unirNi(faltan)}. ${detalle} En esa parte ves valores de referencia, ` +
            'no los guardados, y no se puede cambiar hasta que el servidor responda.' +
            (faltan.length < 3 ? ' Lo demás sí se puede guardar.' : '')
        );
      }
      setCargandoConfig(false);
    });

    return () => {
      montado = false;
    };
  }, []);

  const updateVariable = <K extends keyof VariablesAcceso>(key: K, value: VariablesAcceso[K]) => {
    // No se cambia una sección que no se pudo leer del servidor.
    if (cargandoConfig || !leido[SECCION[key]]) return;
    setVariables((prev) => ({ ...prev, [key]: value }));
  };

  const cambioEn = (seccion: Seccion) =>
    (Object.keys(SECCION) as (keyof VariablesAcceso)[]).some(
      (k) => SECCION[k] === seccion && variables[k] !== variablesGuardadas[k]
    );
  const cambioPoliticas = cambioEn('politicas');
  const cambioTelemetria = cambioEn('telemetria');
  const cambioDocumentos = cambioEn('documentos');
  const hayCambios = cambioPoliticas || cambioTelemetria || cambioDocumentos;

  const textoVersion = (id: string) => versionesAviso.find((d) => d.id === id)?.version ?? (versionAvisoVigente || '—');

  // Lista de cambios para el modal de confirmación
  const resumenCambios = useMemo(() => {
    const lista: string[] = [];
    const v = variables;
    const g = variablesGuardadas;
    if (v.sessionTimeoutMinutes !== g.sessionTimeoutMinutes) {
      lista.push(`Cierre de sesión por inactividad: ${g.sessionTimeoutMinutes} min ➔ ${v.sessionTimeoutMinutes} min`);
    }
    if (v.maxFailedLogins !== g.maxFailedLogins) {
      lista.push(`Intentos fallidos antes del bloqueo: ${g.maxFailedLogins} ➔ ${v.maxFailedLogins}`);
    }
    if (v.lockoutMinutes !== g.lockoutMinutes) {
      lista.push(`Duración del bloqueo: ${g.lockoutMinutes} min ➔ ${v.lockoutMinutes} min`);
    }
    if (v.minPasswordLength !== g.minPasswordLength) {
      lista.push(`Longitud mínima de contraseña: ${g.minPasswordLength} ➔ ${v.minPasswordLength} caracteres`);
    }
    if (v.telemetriaActiva !== g.telemetriaActiva) {
      lista.push(`Telemetría de la app: ${g.telemetriaActiva ? 'ACTIVA' : 'EN PAUSA'} ➔ ${v.telemetriaActiva ? 'ACTIVA' : 'EN PAUSA'}`);
    }
    if (v.versionAvisoId !== g.versionAvisoId) {
      const antes = versionesAviso.find((d) => d.id === g.versionAvisoId)?.version ?? '—';
      const despues = versionesAviso.find((d) => d.id === v.versionAvisoId)?.version ?? '—';
      lista.push(`Versión activa del aviso de analítica: ${antes} ➔ ${despues} (los ciudadanos deberán aceptarla de nuevo)`);
    }
    return lista;
  }, [variables, variablesGuardadas, versionesAviso]);

  const puedeGuardar = !cargandoConfig && (leido.politicas || leido.telemetria || leido.documentos);

  const solicitarGuardar = () => {
    if (!hayCambios || !puedeGuardar) return;
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

    // Cada sección se guarda con su endpoint, y solo si cambió. El backend registra la auditoría de cada una.
    const pasos: { seccion: Seccion; guardar: () => Promise<Partial<VariablesAcceso>> }[] = [];
    if (cambioPoliticas) {
      pasos.push({
        seccion: 'politicas',
        guardar: async () => {
          const cambios: CambiosPoliticas = {};
          CAMPOS_POLITICAS.forEach((k) => {
            if (variables[k] !== variablesGuardadas[k]) cambios[k] = variables[k];
          });
          const p = await seguridadController.guardarPoliticas(cambios, versionPoliticas);
          setVersionPoliticas(p.version);
          setUltimaModificacion({ fecha: p.actualizadoEn, por: p.actualizadoPor });
          // Lo que quedó guardado es lo que devuelve el servidor.
          return Object.fromEntries(CAMPOS_POLITICAS.map((k) => [k, p[k] ?? variables[k]]));
        },
      });
    }
    if (cambioTelemetria) {
      pasos.push({
        seccion: 'telemetria',
        guardar: async () => {
          const o = await telemetriaController.actualizarConfiguracionPrivacidad({ telemetriaActiva: variables.telemetriaActiva });
          return { telemetriaActiva: o.telemetriaActiva ?? variables.telemetriaActiva };
        },
      });
    }
    if (cambioDocumentos) {
      pasos.push({
        seccion: 'documentos',
        guardar: async () => {
          const activada = await seguridadController.activarDocumentoVersion(variables.versionAvisoId);
          setVersionesAviso((prev) => prev.map((d) => ({ ...d, activo: d.id === variables.versionAvisoId })));
          setVersionAvisoVigente(activada.version ?? textoVersion(variables.versionAvisoId));
          return { versionAvisoId: variables.versionAvisoId };
        },
      });
    }

    const guardadas: Seccion[] = [];
    let acumulado: Partial<VariablesAcceso> = {};
    for (const paso of pasos) {
      try {
        acumulado = { ...acumulado, ...(await paso.guardar()) };
        guardadas.push(paso.seccion);
      } catch (err) {
        const detalle = mensajeErrorApi(err, 'Inténtalo de nuevo.', {
          409: 'Otro administrador cambió esta configuración mientras la editabas. Recarga la página para ver los valores actuales.',
          // 501 (`not_implemented`) solo lo responde la activación de una versión del aviso.
          not_implemented: 'El servidor todavía no puede cambiar la versión activa: falta un permiso en la base de datos.',
          501: 'El servidor todavía no puede cambiar la versión activa: falta un permiso en la base de datos.',
        });
        // Lo que ya se guardó queda como guardado; el modal sigue abierto solo con lo que falta.
        if (guardadas.length > 0) {
          setVariablesGuardadas((prev) => ({ ...prev, ...acumulado }));
          setVariables((prev) => ({ ...prev, ...acumulado }));
          onNotify('error', `Se guardó ${unirY(guardadas.map((s) => NOMBRE_SECCION[s]))}, pero no ${NOMBRE_SECCION[paso.seccion]}. ${detalle}`);
        } else {
          onNotify('error', `No se pudo guardar ${NOMBRE_SECCION[paso.seccion]}. ${detalle}`);
        }
        setIsSaving(false);
        return;
      }
    }

    const final = { ...variables, ...acumulado };
    setVariablesGuardadas(final);
    setVariables(final);
    setIsModalOpen(false);
    setTextoConfirmacion('');
    setIsSaving(false);
    onNotify('success', 'Los cambios se guardaron y el servidor los registró en auditoría.');
  };

  const descartarCambios = () => {
    setVariables(variablesGuardadas);
    onNotify('info', 'Cambios en borrador descartados.');
  };

  const restablecerValores = () => {
    // Solo las políticas y el interruptor, y solo si se pudieron leer. La versión del aviso no se toca.
    setVariables((prev) => ({
      ...prev,
      ...(leido.politicas ? Object.fromEntries(CAMPOS_POLITICAS.map((k) => [k, DEFAULT_VARIABLES[k]])) : {}),
      ...(leido.telemetria ? { telemetriaActiva: DEFAULT_VARIABLES.telemetriaActiva } : {}),
    }));
    onNotify('info', 'Valores recomendados cargados en borrador. Presiona "Guardar Configuración" para aplicarlos.');
  };

  const descargarCSV = () => {
    const cabeceras = ['Rol', 'Nombre del Rol', 'Alcance Municipal', 'Operaciones Permitidas', 'Nivel de Acceso'];
    const filas = MATRIZ_PERMISOS.map((p) => [p.rol, p.nombreRol, p.alcance, p.operacionesPermitidas, p.nivelAcceso]);
    exportarCSV('control_acceso', cabeceras, filas);
    onNotify('success', 'Matriz de control de acceso exportada a CSV');
  };

  return {
    variables,
    variablesGuardadas,
    updateVariable,
    hayCambios,
    puedeGuardar,
    cargandoConfig,
    errorCarga,
    leido,
    ultimaModificacion,
    versionesAviso,
    versionAvisoVigente,
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

/** "a", "a y b", "a, b y c". */
const unirY = (partes: string[]) =>
  partes.length <= 1 ? partes.join('') : `${partes.slice(0, -1).join(', ')} y ${partes[partes.length - 1]}`;
