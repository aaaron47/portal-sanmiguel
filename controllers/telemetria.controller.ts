import { apiClient } from '@/services/api-client.service';
import { TelemetriaResumen, TelemetriaEvento } from '@/types/telemetria.types';

const MOCK_RESUMEN_TELEMETRIA: TelemetriaResumen = {
  onboarding: {
    totalUsuariosRegistrados: 12450,
    onboardingCompletadoCount: 11180,
    onboardingTasaPorcentaje: 89.8,
    aceptaAnaliticaCount: 8832,
    aceptaAnaliticaPorcentaje: 79.0,
    rechazaAnaliticaCount: 2348,
    rechazaAnaliticaPorcentaje: 21.0,
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

export class TelemetriaController {
  async getResumen(): Promise<TelemetriaResumen> {
    try {
      return await apiClient<TelemetriaResumen>('/telemetria/resumen');
    } catch {
      return MOCK_RESUMEN_TELEMETRIA;
    }
  }

  async getEventosRecientes(limite = 10): Promise<TelemetriaEvento[]> {
    try {
      return await apiClient<TelemetriaEvento[]>('/telemetria/eventos', {
        params: { limite },
      });
    } catch {
      return MOCK_EVENTOS_RECIENTES.slice(0, limite);
    }
  }
}

export const telemetriaController = new TelemetriaController();
