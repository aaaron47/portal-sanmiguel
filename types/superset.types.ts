export type ModuloAnalitico = 'CONTROL_MUNICIPAL' | 'CONTROL_TI' | 'ADMIN';

export type OrigenDashboard = 'SUPERSET' | 'IA';

export type ProveedorModeloIA = 'LOCAL' | 'API';

export type ModoConsultaIA = 'CONSULTA_DATOS' | 'GENERAR_DASHBOARD';

export interface SupersetMetricItem {
  label: string;
  valor: string | number;
  cambio?: string;
  positivo?: boolean;
}

export interface SupersetDashboardWidget {
  id: string;
  titulo: string;
  tipo: 'kpi_comparativo' | 'barras_progreso' | 'resumen_segmentos';
  subtitulo?: string;
  items: {
    etiqueta: string;
    valor: string;
    porcentaje?: number;
    detalle?: string;
    tono?: 'positivo' | 'negativo' | 'alerta' | 'neutro';
  }[];
  notaPie?: string;
}

export interface SupersetDashboardInfo {
  id: string;
  slug: string;
  titulo: string;
  descripcion: string;
  categoria: 'tributario' | 'cumplimiento' | 'sla' | 'tipologia' | 'telemetria' | 'seguridad';
  urlRelativa: string;
  origen?: OrigenDashboard;
  modulo?: ModuloAnalitico;
  /** Key / UUID generado en Apache Superset al activar "Embed dashboard" */
  embedKey?: string;
  embedUuid?: string;
  /** Dominio permitido configurado en Apache Superset (Allowed Domains) */
  allowedDomain?: string;
  creadoEn?: string;
  autor?: string;
  modeloUsado?: ProveedorModeloIA;
  nombreModeloDetalle?: string;
  promptOrigen?: string;
  fuentesDatos?: string[];
  metricasResumen?: SupersetMetricItem[];
  widgets?: SupersetDashboardWidget[];
  sqlBase?: string;
}

export interface SupersetChatMessage {
  id: string;
  rol: 'user' | 'assistant';
  texto: string;
  fecha: string;
  modo?: ModoConsultaIA;
  proveedorModelo?: ProveedorModeloIA;
  nombreModelo?: string;
  fuentesConsultadas?: string[];
  dashboardSugeridoId?: string;
  dashboardGenerado?: SupersetDashboardInfo;
  graficoTitulo?: string;
  metricas?: SupersetMetricItem[];
  sqlGenerado?: string;
  estado?: 'pensando' | 'completado' | 'error';
  /** true si el asistente no respondió y se muestra un ejemplo con datos ficticios (se avisa en pantalla). */
  esEjemplo?: boolean;
}

/** Contrato de envío al backend para el chat de IA (consulta sobre dashboards o generación de dashboard). */
export interface SolicitudChatIA {
  modulo: ModuloAnalitico;
  modo: ModoConsultaIA;
  proveedorModelo: ProveedorModeloIA;
  mensaje: string;
  dashboardContextoActivoId?: string;
  dashboardContextoIds?: string[];
  historial?: Array<{
    rol: 'user' | 'assistant';
    texto: string;
  }>;
}

/** Contrato de respuesta del backend para el chat de IA. */
export interface RespuestaChatIA {
  texto: string;
  modo: ModoConsultaIA;
  proveedorModelo: ProveedorModeloIA;
  nombreModelo?: string;
  fuentesConsultadas?: string[];
  dashboardSugeridoId?: string;
  graficoTitulo?: string;
  sqlGenerado?: string;
  metricas?: SupersetMetricItem[];
  dashboardGenerado?: SupersetDashboardInfo;
  esEjemplo?: boolean;
}

/** Respuesta del endpoint GET /ia/dashboards?modulo=... */
export interface ListadoDashboardsResponse {
  modulo: ModuloAnalitico;
  dashboardsSuperset: SupersetDashboardInfo[];
  dashboardsIA: SupersetDashboardInfo[];
}

/**
 * Respuesta del endpoint GET /ia/dashboards/:id/embed-token para embeber Apache Superset
 * mediante el Key generado en Superset y el dominio permitido (Allowed Domains).
 */
export interface SupersetEmbedTokenResponse {
  dashboardId: string;
  /** Key / UUID de embebido generado en Apache Superset */
  embedKey: string;
  /** Dominio base de la instancia de Apache Superset (ej. https://superset.munisanmiguel.gob.pe) */
  supersetDomain?: string;
  /** Dominio del frontend autorizado en Superset (Allowed Domains) */
  allowedDomain: string;
  /** URL final lista para incrustar en el iframe (ej. https://superset.../superset/embedded/<embedKey>/?standalone=true) */
  embedUrl: string;
  /** Guest token opcional si Superset requiere autenticación adicional por sesión */
  guestToken?: string;
  expiraEn?: string;
}

/** Configuración modular por rol para reutilizar el módulo en Control Municipal, Control-TI y Admin. */
export interface ConfiguracionModuloIA {
  modulo: ModuloAnalitico;
  tituloPantalla: string;
  subtituloPantalla: string;
  contextoBackend: string;
  etiquetaFuentes: string;
  modeloLocalNombre: string;
  modeloLocalDescripcion: string;
  modeloApiNombre: string;
  modeloApiDescripcion: string;
  sugerenciasConsulta: string[];
  sugerenciasGeneracion: string[];
}
