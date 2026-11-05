export interface TelemetriaEvento {
  id: string;
  dispositivoAnonimoId: string; // Hash anónimo sin DNI ni nombres por privacidad
  tipoEvento: 'PANTALLA_VISTA' | 'CLICK_BOTON' | 'ERROR_APP' | 'ENVIO_FORMULARIO';
  pantalla: string; // ej. "HomeCiudadano", "NuevoReclamo", "MisReclamos", "AvisoPrivacidad"
  componenteId?: string;
  sistemaOperativo: 'Android' | 'iOS';
  appVersion: string;
  fechaRegistro: string;
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
}
