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
  /** Identificador numérico real en Apache Superset (`id` devuelto por `GET /api/v1/admin/bi/dashboards`) */
  supersetId?: number;
  slug: string;
  titulo: string;
  descripcion: string;
  categoria: 'tributario' | 'cumplimiento' | 'sla' | 'tipologia' | 'telemetria' | 'seguridad';
  urlRelativa: string;
  origen?: OrigenDashboard;
  modulo?: ModuloAnalitico;
  /** true si el dashboard está publicado; false si es un borrador */
  publicado?: boolean;
  /** Key / UUID generado en Apache Superset al activar "Embed dashboard" */
  embedKey?: string;
  embedUuid?: string | null;
  /** Fecha o texto relativo de última actualización devuelto por el backend */
  actualizado?: string;
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

export interface ProgresoChatIA {
  estado: string;
  segundos: number;
  pasos: string[];
  creados?: string[];
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
  pasos?: string[];
  creados?: string[];
  segundos?: number;
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
  onProgreso?: (progreso: ProgresoChatIA) => void;
  signal?: AbortSignal;
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
  pasos?: string[];
  creados?: string[];
  segundos?: number;
  esEjemplo?: boolean;
}

export type AmbitoDashboardBi = 'publicados' | 'borradores';

/** Elemento devuelto por `GET /api/v1/admin/bi/dashboards?ambito=publicados|borradores` */
export interface BiDashboardItemResponse {
  id: number;
  titulo: string;
  publicado: boolean;
  embedUuid: string | null;
  actualizado?: string;
}

/** Respuesta de `GET /api/v1/admin/bi/dashboards/{embedUuid}/guest-token` */
export interface BiGuestTokenResponse {
  token: string;
  supersetUrl: string;
  dashboardId: string;
  expiraEn: number;
}

/** Respuesta de `PUT /api/v1/admin/bi/dashboards/{id}/publicacion` */
export interface BiPublicacionResponse {
  dashboardId: number;
  publicado: boolean;
}

/** Respuesta de `PUT /api/v1/admin/bi/dashboards/{id}/embebido` */
export interface BiEmbebidoResponse {
  dashboardId: number;
  uuid: string;
  dominiosPermitidos: string[];
}

export type EstadoDisponibilidadIa = 'DISPONIBLE' | 'SIN_RESPUESTA' | 'NO_CONFIGURADO';

/** Respuesta de `GET /api/v1/admin/bi/ia/estado` */
export interface EstadoIaBiResponse {
  modelo: EstadoDisponibilidadIa;
  trabajosPendientes: number;
  maxEnCola: number;
  api: 'DISPONIBLE' | 'NO_CONFIGURADO';
  trabajosPendientesApi: number;
}

export type NivelMcp = 'CONSULTA' | 'CONSTRUCCION';

/** Respuesta de `PUT / DELETE /api/v1/admin/bi/personal/{administradorId}/mcp` */
export interface AccesoMcpPersonalResponse {
  administradorId: string;
  supersetUsuario: string;
  nivel: NivelMcp;
  habilitado: boolean;
  rolesSuperset: string[];
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
