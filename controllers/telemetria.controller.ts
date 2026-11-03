import { apiClient, usarDatosDemo } from '@/services/api-client.service';
import { TelemetriaResumen, TelemetriaEvento, ConsentimientoAuditoriaLog, OnboardingStats } from '@/types/telemetria.types';

const MOCK_RESUMEN_TELEMETRIA: TelemetriaResumen = {
  onboarding: {
    totalUsuariosRegistrados: 12450,
    onboardingCompletadoCount: 11180,
    onboardingTasaPorcentaje: 89.8,
    aceptaAnaliticaCount: 8832,
    aceptaAnaliticaPorcentaje: 79.0,
    rechazaAnaliticaCount: 2348,
    rechazaAnaliticaPorcentaje: 21.0,
    notificacionesPermitidasCount: 9680,
    notificacionesPermitidasPorcentaje: 77.8,
    notificacionesBloqueadasCount: 2770,
    notificacionesBloqueadasPorcentaje: 22.2,
    versionTerminosVigente: 'v1.3 (2026-10)',
    fechaRevisionTerminos: '2026-10-15',
    diasRetencionLogs: 60,
    telemetriaActiva: true,
    embudoPasos: [
      { paso: 1, nombre: 'Bienvenida e Instalación', descripcion: 'Primer inicio y visualización del splash de bienvenida', usuariosCount: 12450, porcentajeRetencion: 100, porcentajeAbandono: 0 },
      { paso: 2, nombre: 'Términos y Privacidad (Ley 29733)', descripcion: 'Lectura de aviso de protección de datos personales', usuariosCount: 11950, porcentajeRetencion: 96.0, porcentajeAbandono: 4.0 },
      { paso: 3, nombre: 'Permiso de Notificaciones Push', descripcion: 'Consentimiento para avisos de cambio de estado de reclamos', usuariosCount: 11520, porcentajeRetencion: 92.5, porcentajeAbandono: 3.5 },
      { paso: 4, nombre: 'Registro y Verificación Final', descripcion: 'Creación de credenciales vecinales e ingreso al home', usuariosCount: 11180, porcentajeRetencion: 89.8, porcentajeAbandono: 2.7 },
    ],
  },
  dispositivos: {
    androidCount: 9460,
    iosCount: 2990,
    versionesMasUsadas: [
      { version: 'v2.4.1 (Última)', porcentaje: 68 },
      { version: 'v2.3.0', porcentaje: 21 },
      { version: 'v2.1.8 (Deprecada)', porcentaje: 11 },
    ],
  },
  topPantallas: [
    { pantalla: 'HomeCiudadano', vistas: 42300, usuariosUnicos: 9800, tiempoPromedioSegundos: 45 },
    { pantalla: 'NuevoReclamo', vistas: 18450, usuariosUnicos: 5400, tiempoPromedioSegundos: 120 },
    { pantalla: 'AvisoPrivacidadOnboarding', vistas: 12450, usuariosUnicos: 11180, tiempoPromedioSegundos: 30 },
    { pantalla: 'MisReclamosSeguimiento', vistas: 9800, usuariosUnicos: 4120, tiempoPromedioSegundos: 65 },
    { pantalla: 'DetalleConstancia', vistas: 3400, usuariosUnicos: 1980, tiempoPromedioSegundos: 40 },
  ],
  totalEventosUltimas24h: 38490,
  tasaErroresAppPorcentaje: 0.42,
};

const MOCK_EVENTOS_RECIENTES: TelemetriaEvento[] = [
  {
    id: 'EVT-9001',
    dispositivoAnonimoId: 'anon-usr-7f8e1a',
    tipoEvento: 'PANTALLA_VISTA',
    pantalla: 'HomeCiudadano',
    sistemaOperativo: 'Android',
    appVersion: 'v2.4.1',
    fechaRegistro: '2026-10-30 20:14:02',
  },
  {
    id: 'EVT-9002',
    dispositivoAnonimoId: 'anon-usr-4b2c9d',
    tipoEvento: 'CLICK_BOTON',
    pantalla: 'NuevoReclamo',
    componenteId: 'btn_adjuntar_foto',
    sistemaOperativo: 'iOS',
    appVersion: 'v2.4.1',
    fechaRegistro: '2026-10-30 20:13:45',
  },
  {
    id: 'EVT-9003',
    dispositivoAnonimoId: 'anon-usr-1100aa',
    tipoEvento: 'ENVIO_FORMULARIO',
    pantalla: 'AvisoPrivacidadOnboarding',
    componenteId: 'btn_acepta_analitica_true',
    sistemaOperativo: 'Android',
    appVersion: 'v2.4.1',
    fechaRegistro: '2026-10-30 20:12:11',
  },
  {
    id: 'EVT-9004',
    dispositivoAnonimoId: 'anon-usr-33ee7b',
    tipoEvento: 'PANTALLA_VISTA',
    pantalla: 'MisReclamosSeguimiento',
    sistemaOperativo: 'Android',
    appVersion: 'v2.3.0',
    fechaRegistro: '2026-10-30 20:10:50',
  },
  {
    id: 'EVT-9005',
    dispositivoAnonimoId: 'anon-usr-9912fc',
    tipoEvento: 'CLICK_BOTON',
    pantalla: 'DetalleConstancia',
    componenteId: 'btn_descargar_constancia_pdf',
    sistemaOperativo: 'iOS',
    appVersion: 'v2.4.1',
    fechaRegistro: '2026-10-30 20:09:18',
  },
];

const MOCK_CONSENTIMIENTOS_AUDITORIA: ConsentimientoAuditoriaLog[] = [
  {
    id: 'CSN-2026-001',
    dispositivoHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    aceptaAnalitica: true,
    permiteNotificaciones: true,
    versionTerminos: 'v1.3 (2026-10)',
    fechaDecision: '2026-10-30 19:42:15',
    ipAnonimizada: '190.237.xxx.xxx',
  },
  {
    id: 'CSN-2026-002',
    dispositivoHash: '8792039bbf8a486378411d3bfec28a8d05dd3b6630f89fc485c2826cf8d80f08',
    aceptaAnalitica: false,
    permiteNotificaciones: true,
    versionTerminos: 'v1.3 (2026-10)',
    fechaDecision: '2026-10-30 18:30:22',
    ipAnonimizada: '181.176.xxx.xxx',
  },
  {
    id: 'CSN-2026-003',
    dispositivoHash: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
    aceptaAnalitica: true,
    permiteNotificaciones: false,
    versionTerminos: 'v1.3 (2026-10)',
    fechaDecision: '2026-10-30 16:15:08',
    ipAnonimizada: '200.48.xxx.xxx',
  },
  {
    id: 'CSN-2026-004',
    dispositivoHash: '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8',
    aceptaAnalitica: true,
    permiteNotificaciones: true,
    versionTerminos: 'v1.3 (2026-10)',
    fechaDecision: '2026-10-30 14:02:49',
    ipAnonimizada: '190.113.xxx.xxx',
  },
  {
    id: 'CSN-2026-005',
    dispositivoHash: '4b227777d4dd1fc61c6f884f48641d02b4d121d3fd328cb08b5531fcacdabf8a',
    aceptaAnalitica: false,
    permiteNotificaciones: false,
    versionTerminos: 'v1.2 (2026-09)',
    fechaDecision: '2026-10-29 22:11:30',
    ipAnonimizada: '179.6.xxx.xxx',
  },
];

export class TelemetriaController {
  async getResumen(): Promise<TelemetriaResumen> {
    try {
      return await apiClient<TelemetriaResumen>('/telemetria/resumen');
    } catch (err) {
      // Datos simulados solo sin conexión y en modo demo; si no, el error llega a la vista.
      if (!usarDatosDemo(err)) throw err;
      return MOCK_RESUMEN_TELEMETRIA;
    }
  }

  async getEventosRecientes(limite = 10): Promise<TelemetriaEvento[]> {
    try {
      return await apiClient<TelemetriaEvento[]>('/telemetria/eventos', {
        params: { limite },
      });
    } catch (err) {
      // Datos simulados solo sin conexión y en modo demo; si no, el error llega a la vista.
      if (!usarDatosDemo(err)) throw err;
      return MOCK_EVENTOS_RECIENTES.slice(0, limite);
    }
  }

  async getConsentimientosAuditoria(): Promise<ConsentimientoAuditoriaLog[]> {
    try {
      return await apiClient<ConsentimientoAuditoriaLog[]>('/telemetria/consentimientos');
    } catch (err) {
      if (!usarDatosDemo(err)) throw err;
      return MOCK_CONSENTIMIENTOS_AUDITORIA;
    }
  }

  async actualizarConfiguracionPrivacidad(config: {
    versionTerminosVigente?: string;
    diasRetencionLogs?: number;
    telemetriaActiva?: boolean;
  }): Promise<OnboardingStats> {
    try {
      return await apiClient<OnboardingStats>('/telemetria/configuracion', {
        method: 'PUT',
        body: JSON.stringify(config),
      });
    } catch (err) {
      if (!usarDatosDemo(err)) throw err;
      if (config.versionTerminosVigente !== undefined) {
        MOCK_RESUMEN_TELEMETRIA.onboarding.versionTerminosVigente = config.versionTerminosVigente;
        MOCK_RESUMEN_TELEMETRIA.onboarding.fechaRevisionTerminos = new Date().toISOString().split('T')[0];
      }
      if (config.diasRetencionLogs !== undefined) {
        MOCK_RESUMEN_TELEMETRIA.onboarding.diasRetencionLogs = config.diasRetencionLogs;
      }
      if (config.telemetriaActiva !== undefined) {
        MOCK_RESUMEN_TELEMETRIA.onboarding.telemetriaActiva = config.telemetriaActiva;
      }
      return MOCK_RESUMEN_TELEMETRIA.onboarding;
    }
  }
}

export const telemetriaController = new TelemetriaController();
