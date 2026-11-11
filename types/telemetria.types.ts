export interface TelemetriaEvento {
  id: string;
  dispositivoAnonimoId: string; // Hash anónimo sin DNI ni nombres por privacidad
  tipoEvento: 'PANTALLA_VISTA' | 'CLICK_BOTON' | 'ERROR_APP' | 'ENVIO_FORMULARIO';
  pantalla: string; // ej. "HomeCiudadano", "NuevoReclamo", "MisReclamos", "AvisoPrivacidad"
  componenteId?: string;
  sistemaOperativo: 'Android' | 'iOS';
  appVersion: string;
  fechaRegistro: string;
  /** Propuesto al backend (Req 3): resultado de la acción. */
  resultado?: 'COMPLETADA' | 'FALLIDA';
  /** Propuesto al backend (Req 3): sesión seudónima a la que pertenece el evento. */
  sesionId?: string;
}

/** Filtros del dashboard de uso (Req 4). Se envían como query de `GET /telemetria/resumen`. */
export interface FiltrosUso {
  /** Fechas en hora de Perú, `YYYY-MM-DD`, ambas incluidas. */
  desde: string;
  hasta: string;
  funcionalidad?: string;
  sistemaOperativo?: 'Android' | 'iOS';
  appVersion?: string;
}

export interface ActividadDia {
  /** `YYYY-MM-DD` en hora de Perú. */
  fecha: string;
  eventos: number;
  sesiones: number;
}

export interface ActividadHora {
  /** 0–23, hora de Perú. */
  hora: number;
  eventos: number;
  sesiones: number;
}

export interface UsoFuncionalidad {
  funcionalidad: string;
  iniciadas: number;
  completadas: number;
  fallidas: number;
}

/**
 * Uso del sistema en el período y filtros pedidos (Req 4). Propuesto al backend: llega en
 * `GET /telemetria/resumen` como `uso`; si no llega, el dashboard avisa que aún no está disponible.
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
  filtrosDisponibles: {
    funcionalidades: string[];
    sistemasOperativos: Array<'Android' | 'iOS'>;
    versiones: string[];
  };
  /** Instante de la última actualización de los datos (ISO 8601, UTC). */
  actualizadoEn: string;
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
  ipAnonimizada: string;
}

export interface OnboardingStats {
  totalUsuariosRegistrados: number;
  onboardingCompletadoCount: number;
  onboardingTasaPorcentaje: number;
  aceptaAnaliticaCount: number;
  aceptaAnaliticaPorcentaje: number;
  rechazaAnaliticaCount: number;
  rechazaAnaliticaPorcentaje: number;
  // Permiso de Notificaciones Push
  notificacionesPermitidasCount: number;
  notificacionesPermitidasPorcentaje: number;
  notificacionesBloqueadasCount: number;
  notificacionesBloqueadasPorcentaje: number;
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
  versionesMasUsadas: Array<{ version: string; porcentaje: number }>;
}

export interface PantallaTrafico {
  pantalla: string;
  vistas: number;
  usuariosUnicos: number;
  tiempoPromedioSegundos: number;
}

export interface TelemetriaResumen {
  onboarding: OnboardingStats;
  dispositivos: DispositivoStats;
  topPantallas: PantallaTrafico[];
  totalEventosUltimas24h: number;
  tasaErroresAppPorcentaje: number;
  /** Uso del sistema con los filtros pedidos (Req 4). Opcional mientras el backend no lo entregue. */
  uso?: UsoSistema;
}
