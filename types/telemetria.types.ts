/** Canal desde el que se registró el uso: la app móvil del ciudadano o este portal web. */
export type CanalUso = 'MOVIL' | 'WEB';

/**
 * Evento de uso (Req 3). El backend guarda identificadores seudónimos: nunca nombre, correo ni DNI.
 * Los códigos (`tipoEvento`, `funcionalidad`...) se muestran con las etiquetas de `utils/telemetria.utils.ts`.
 */
export interface TelemetriaEvento {
  id: string;
  dispositivoAnonimoId: string;
  /** Vistos en el backend: `PANTALLA`, `CONSULTA`, `INICIO_SESION`, `CIERRE_SESION`. */
  tipoEvento: string;
  pantalla?: string | null;
  componenteId?: string | null;
  /** "Android", "iOS", "Windows", "Linux"... */
  sistemaOperativo: string;
  appVersion: string;
  /** `AAAA-MM-DD HH:mm:ss`, hora de Perú. */
  fechaRegistro: string;
  /** Resultado de la acción; `NO_APLICA` en eventos que no son una operación (ver una pantalla). */
  resultado?: 'INICIADA' | 'COMPLETADA' | 'FALLIDA' | 'NO_APLICA' | null;
  /** Sesión seudónima a la que pertenece el evento. */
  sesionId?: string | null;
  /** Código de funcionalidad (`DEUDAS`, `RECLAMOS`...). */
  funcionalidad?: string | null;
  codigoError?: string | null;
  duracionMs?: number | null;
  canal?: CanalUso | null;
  tipoActor?: 'CIUDADANO' | 'PERSONAL' | null;
}

/** Filtros del dashboard de uso (Req 4). Se envían como query de `GET /telemetria/resumen`. */
export interface FiltrosUso {
  /** Fechas en hora de Perú, `AAAA-MM-DD`, ambas incluidas. El backend acepta hasta 366 días. */
  fechaDesde: string;
  fechaHasta: string;
  /** Código de `opcionesFiltro.funcionalidades`. */
  funcionalidad?: string;
  /** Código de `opcionesFiltro.sistemasOperativos` (`ANDROID`, `IOS`...). */
  sistemaOperativo?: string;
  appVersion?: string;
  canal?: CanalUso;
}

export interface ActividadDia {
  /** `AAAA-MM-DD` en hora de Perú. */
  fecha: string;
  eventos: number;
  sesiones: number;
  usuariosUnicos?: number;
}

export interface ActividadHora {
  /** 0–23, hora de Perú. */
  hora: number;
  eventos: number;
  sesiones: number;
}

export interface UsoFuncionalidad {
  /** Código de funcionalidad. */
  funcionalidad: string;
  eventos?: number;
  sesiones?: number;
  usuariosUnicos?: number;
  iniciadas: number;
  completadas: number;
  fallidas: number;
  porcentajeCompletadas?: number;
}

/** Valores que el backend ofrece para cada filtro. */
export interface OpcionesFiltroUso {
  funcionalidades: string[];
  sistemasOperativos: string[];
  versiones: string[];
  canales?: CanalUso[];
}

/**
 * Uso del sistema en el período y filtros pedidos (Req 4), tal como lo usa el dashboard.
 * Se arma con `usoDelResumen` a partir de la respuesta de `GET /telemetria/resumen`.
 */
export interface UsoSistema {
  usuariosUnicos: number;
  sesiones: number;
  consultasIniciadas: number;
  consultasCompletadas: number;
  consultasFallidas: number;
  porcentajeCompletadas: number;
  actividadPorDia: ActividadDia[];
  actividadPorHora: ActividadHora[];
  funcionalidades: UsoFuncionalidad[];
  filtrosDisponibles: OpcionesFiltroUso;
  /** Último dato registrado (`AAAA-MM-DD HH:mm:ss`, hora de Perú). */
  actualizadoEn?: string;
}

export interface OnboardingFunnelStep {
  paso: number;
  nombre: string;
  descripcion: string;
  usuariosCount: number;
  porcentajeRetencion: number;
  porcentajeAbandono: number;
}

export interface ConsentimientoAuditoriaLog {
  id: string;
  dispositivoHash: string;
  aceptaAnalitica: boolean;
  permiteNotificaciones: boolean;
  versionTerminos: string;
  fechaDecision: string;
  /** El backend puede no guardarla (llega `null`). */
  ipAnonimizada?: string | null;
  /** Dónde se tomó la decisión (`ONBOARDING`, configuración de privacidad...). */
  origen?: string | null;
  canal?: CanalUso | null;
}

export interface OnboardingStats {
  totalUsuariosRegistrados: number;
  onboardingCompletadoCount: number;
  onboardingTasaPorcentaje: number;
  /** Usuarios que omitieron la introducción (Req 5). */
  onboardingOmitidoCount?: number;
  aceptaAnaliticaCount: number;
  aceptaAnaliticaPorcentaje: number;
  rechazaAnaliticaCount: number;
  rechazaAnaliticaPorcentaje: number;
  /** Usuarios que todavía no aceptaron ni rechazaron la analítica opcional. */
  sinDecisionAnaliticaCount?: number;
  // Permiso de Notificaciones Push
  notificacionesPermitidasCount: number;
  notificacionesPermitidasPorcentaje: number;
  notificacionesBloqueadasCount: number;
  notificacionesBloqueadasPorcentaje: number;
  /** `false` cuando el backend no tiene el dato de notificaciones: los cuatro campos de arriba llegan en 0. */
  notificacionesDisponibles?: boolean;
  // Gobernanza y Controles de Privacidad
  versionTerminosVigente: string;
  fechaRevisionTerminos: string;
  /** Meses que se conservan los registros de uso (configuracion_sistema.RETENCION_USO_MESES). Solo lectura. */
  mesesRetencionUso: number;
  telemetriaActiva: boolean;
  embudoPasos: OnboardingFunnelStep[];
}

export interface DispositivoStats {
  androidCount: number;
  iosCount: number;
  /** Otros sistemas (Windows, macOS, Linux): uso desde el portal web. */
  otrosCount?: number;
  versionesMasUsadas: Array<{ version: string; porcentaje: number }>;
}

export interface PantallaTrafico {
  pantalla: string;
  vistas: number;
  usuariosUnicos: number;
  tiempoPromedioSegundos: number;
}

/**
 * Respuesta de `GET /telemetria/resumen`. `onboarding` y los totales de 24 h son el estado general;
 * lo demás (desde `filtros`) es el uso del sistema con los filtros de la query (Req 4).
 */
export interface TelemetriaResumen {
  onboarding: OnboardingStats;
  dispositivos: DispositivoStats;
  topPantallas: PantallaTrafico[];
  totalEventosUltimas24h: number;
  tasaErroresAppPorcentaje: number;
  /** Filtros que aplicó el backend (sin fechas en la query usa los últimos 30 días). */
  filtros?: { [K in keyof FiltrosUso]?: FiltrosUso[K] | null };
  opcionesFiltro?: OpcionesFiltroUso;
  sesiones?: { total: number; usuariosUnicos: number; instalacionesUnicas?: number; duracionPromedioSegundos?: number };
  consultas?: { iniciadas: number; completadas: number; fallidas: number; porcentajeCompletadas: number };
  funcionalidades?: UsoFuncionalidad[];
  actividadPorDia?: ActividadDia[];
  actividadPorHora?: ActividadHora[];
  /** Último evento registrado (`AAAA-MM-DD HH:mm:ss`, hora de Perú). */
  ultimaActualizacion?: string | null;
}
