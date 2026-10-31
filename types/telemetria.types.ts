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

export interface OnboardingStats {
  totalUsuariosRegistrados: number;
  onboardingCompletadoCount: number;
  onboardingTasaPorcentaje: number;
  aceptaAnaliticaCount: number;
  aceptaAnaliticaPorcentaje: number;
  rechazaAnaliticaCount: number;
  rechazaAnaliticaPorcentaje: number;
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
