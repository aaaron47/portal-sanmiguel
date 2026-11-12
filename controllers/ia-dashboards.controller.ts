import {
  apiClient,
  apiClientArchivo,
  apiClientArchivoConMeta,
  ApiError,
  codigoErrorApi,
  mensajeErrorApi,
  usarDatosDemo,
} from '@/services/api-client.service';
import {
  AccesoMcpPersonalResponse,
  AmbitoDashboardBi,
  BiDashboardItemResponse,
  BiEmbebidoResponse,
  BiGuestTokenResponse,
  BiPublicacionResponse,
  ConfiguracionModuloIA,
  EstadoIaBiResponse,
  ListadoDashboardsResponse,
  ModuloAnalitico,
  NivelMcp,
  ProveedorModeloIA,
  RespuestaChatIA,
  SolicitudChatIA,
  SupersetDashboardInfo,
  SupersetEmbedTokenResponse,
  SupersetMetricItem,
} from '@/types/superset.types';
import {
  CATALOGO_REPORTES_OFICIALES,
  FormatoDescargaTablaBi,
  ResultadoDescargaTablaBi,
  TablaCertificadaBi,
  TrabajoDescargaTodasBi,
} from '@/types/reportes-tributarios.types';
import { MOCK_ROWS_BY_REPORT } from '@/controllers/reportes.controller';
import { descargarBlobArchivo, exportarCSV, parsearCSV } from '@/utils/csv.utils';

/**
 * Configuración global para el selector de modelos de IA y embebido de Apache Superset.
 * Pueden sobreescribirse mediante variables de entorno en `.env.local` o `.env.production`.
 */
export const MODELO_IA_LOCAL_NOMBRE =
  process.env.NEXT_PUBLIC_IA_MODEL_LOCAL_NAME || 'San Miguel 1';
export const MODELO_IA_API_NOMBRE =
  process.env.NEXT_PUBLIC_IA_MODEL_API_NAME || 'Claude Opus';
export const SUPERSET_BASE_URL =
  process.env.NEXT_PUBLIC_SUPERSET_URL || '';
export const SUPERSET_ALLOWED_DOMAIN =
  process.env.NEXT_PUBLIC_SUPERSET_ALLOWED_DOMAIN || '';

export interface OpcionSelectorModeloIA {
  valor: ProveedorModeloIA;
  etiqueta: string;
  descripcion: string;
}

export function obtenerOpcionesSelectorModelo(
  modulo: ModuloAnalitico = 'CONTROL_MUNICIPAL'
): OpcionSelectorModeloIA[] {
  const cfg = CONFIG_MODULOS_IA[modulo] || CONFIG_MODULOS_IA.CONTROL_MUNICIPAL;
  return [
    {
      valor: 'API',
      etiqueta: `${cfg.modeloApiNombre} (API)`,
      descripcion: cfg.modeloApiDescripcion,
    },
    {
      valor: 'LOCAL',
      etiqueta: `${cfg.modeloLocalNombre} (Local)`,
      descripcion: cfg.modeloLocalDescripcion,
    },
  ];
}

/**
 * Configuraciones modulares por tipo de usuario/rol.
 * Permite trasladar la pantalla de Dashboards + Asistente IA a Control-TI y Admin
 * cambiando únicamente la prop `modulo`.
 */
export const CONFIG_MODULOS_IA: Record<ModuloAnalitico, ConfiguracionModuloIA> = {
  CONTROL_MUNICIPAL: {
    modulo: 'CONTROL_MUNICIPAL',
    tituloPantalla: 'Apache Superset y Consultas IA',
    subtituloPantalla:
      'Explora los dashboards embebidos de Apache Superset (oficiales y generados por IA) y realiza consultas cruzadas entre tableros.',
    contextoBackend: 'tributacion_y_control_municipal_san_miguel',
    etiquetaFuentes: 'Dashboards de Superset (R1–R11) y Control OCI',
    modeloLocalNombre: MODELO_IA_LOCAL_NOMBRE,
    modeloLocalDescripcion: `Modelo local municipal (${MODELO_IA_LOCAL_NOMBRE} · Inferencia privada sin salida a internet)`,
    modeloApiNombre: MODELO_IA_API_NOMBRE,
    modeloApiDescripcion: `Modelo ${MODELO_IA_API_NOMBRE} por API externa (rápido, ~15s, con herramientas MCP para Superset)`,
    sugerenciasConsulta: [
      'Cruzar deuda con beneficio (R1) frente a PRICOS con deuda pendiente (R5)',
      'Comparar % de recaudación efectiva (R3) con reincidencia en mora (R11)',
      '¿Cuántos contribuyentes PRICOS (≥10 UIT) tienen valores coactivos en R4?',
      'Compara los buenos pagadores (R6) frente a la antigüedad de deuda (R8)',
    ],
    sugerenciasGeneracion: [
      'Genera un dashboard cruzando morosidad con/sin beneficio (R1) y cartera PRICOS (R5)',
      'Crea un dashboard cruzado de recaudación 2026 (R3) y cobranza coactiva de valores (R4)',
      'Genera un tablero cruzando buenos pagadores (R6), antigüedad (R8) y reincidencia (R11)',
    ],
  },
  CONTROL_TI: {
    modulo: 'CONTROL_TI',
    tituloPantalla: 'Dashboards de Telemetría y Consultas IA',
    subtituloPantalla:
      'Monitorea tableros de rendimiento en Apache Superset y realiza consultas cruzadas sobre métricas de la app móvil.',
    contextoBackend: 'telemetria_app_y_onboarding_ti',
    etiquetaFuentes: 'Telemetría App Móvil, Sesiones y Consentimiento LPDP',
    modeloLocalNombre: MODELO_IA_LOCAL_NOMBRE,
    modeloLocalDescripcion: `Modelo local municipal (${MODELO_IA_LOCAL_NOMBRE} · Procesamiento privado de telemetría)`,
    modeloApiNombre: MODELO_IA_API_NOMBRE,
    modeloApiDescripcion: `Modelo ${MODELO_IA_API_NOMBRE} por API externa (rápido, ~15s, con herramientas MCP para Superset)`,
    sugerenciasConsulta: [
      '¿Cuál es la tasa de conversión del onboarding ciudadano y aceptación de privacidad?',
      '¿Qué pantallas concentran mayor tiempo de carga o errores en Android vs iOS?',
    ],
    sugerenciasGeneracion: [
      'Genera un dashboard de embudo de onboarding y consentimiento Ley 29733',
      'Crea un dashboard comparativo de estabilidad de versiones móviles y latencia API',
    ],
  },
  ADMIN: {
    modulo: 'ADMIN',
    tituloPantalla: 'Dashboards de Auditoría y Consultas IA',
    subtituloPantalla:
      'Supervisa tableros de control de acceso y auditoría en Superset y realiza consultas cruzadas de seguridad.',
    contextoBackend: 'auditoria_seguridad_y_usuarios_admin',
    etiquetaFuentes: 'Registros de Auditoría, Control de Acceso RBAC y Sesiones',
    modeloLocalNombre: MODELO_IA_LOCAL_NOMBRE,
    modeloLocalDescripcion: `Modelo local municipal (${MODELO_IA_LOCAL_NOMBRE} · Auditoría privada en infraestructura local)`,
    modeloApiNombre: MODELO_IA_API_NOMBRE,
    modeloApiDescripcion: `Modelo ${MODELO_IA_API_NOMBRE} por API externa (rápido, ~15s, con herramientas MCP para Superset)`,
    sugerenciasConsulta: [
      '¿Cuántos intentos fallidos de inicio de sesión y bloqueos se registraron esta semana?',
      '¿Qué roles y áreas tienen mayor actividad de modificación de expedientes?',
    ],
    sugerenciasGeneracion: [
      'Genera un dashboard de auditoría de accesos, bloqueos de cuentas y actividad por rol',
      'Crea un dashboard de cumplimiento de gobernanza de datos y rotación de credenciales',
    ],
  },
};

/**
 * Dashboards Oficiales de Apache Superset para Control Municipal.
 * El primero ('reportes-tributarios') es el dashboard principal "Reportes Tributarios"
 * que se muestra en la sección de Superset del Dashboard General.
 */
export const DASHBOARDS_SUPERSET_CONTROL_MUNICIPAL: SupersetDashboardInfo[] = [
  {
    id: 'reportes-tributarios',
    slug: 'reportes-tributarios',
    titulo: 'Reportes Tributarios',
    descripcion:
      'Dashboard consolidado de Apache Superset con los indicadores oficiales de Impuesto Predial, Arbitrios, PRICOS, Recaudación, Valores y Cumplimiento (R1 a R11).',
    categoria: 'tributario',
    origen: 'SUPERSET',
    modulo: 'CONTROL_MUNICIPAL',
    urlRelativa: '/superset/dashboard/reportes-tributarios/?standalone=true',
    embedUuid: '29e399ef-75cd-4927-893f-9713435c9766',
    creadoEn: '01/11/2026',
    autor: 'Gerencia de Administración Tributaria · Superset',
    fuentesDatos: ['R1 Morosos', 'R2 Sin Pagos', 'R3 Recaudación', 'R4 Valores', 'R5 PRICOS', 'R6–R11 Cumplimiento'],
    metricasResumen: [
      { label: 'Deuda Sin Beneficio', valor: 'S/ 14.8M', cambio: 'R1 Consolidado', positivo: false },
      { label: 'Deuda Con Beneficio', valor: 'S/ 11.2M', cambio: 'Dscto. Arbitrios', positivo: true },
      { label: 'Efectividad Cobranza', valor: '78.4%', cambio: 'Meta anual 80%', positivo: true },
      { label: 'PRICOS al Día', valor: '68.0%', cambio: '342 de 503', positivo: true },
    ],
    widgets: [
      {
        id: 'w-rt-1',
        titulo: 'R1. Morosidad: Deuda Sin Beneficio vs Con Beneficio (S/.)',
        subtitulo: 'Consolidado 1900–2026 en Impuesto Predial y Arbitrios Municipales',
        tipo: 'kpi_comparativo',
        items: [
          { etiqueta: 'Deuda Sin Beneficio', valor: 'S/ 14.8M', detalle: 'Predial + Arbitrios', tono: 'alerta' },
          { etiqueta: 'Deuda Con Beneficio', valor: 'S/ 11.2M', detalle: 'Ahorro S/ 3.6M en Arbitrios', tono: 'positivo' },
        ],
        notaPie: 'Descuento en Arbitrios Municipales aplicado a 8,420 predios fiscales.',
      },
      {
        id: 'w-rt-2',
        titulo: 'R3 & R4. Eficacia de Recaudación y Emisión de Valores 2026',
        subtitulo: 'Ejecución presupuestal de cobranza ordinaria y coactiva',
        tipo: 'barras_progreso',
        items: [
          { etiqueta: '% Recaudación Efectiva (R3)', valor: '78.4%', porcentaje: 78.4, tono: 'positivo' },
          { etiqueta: '% Cumplimiento Buenos Pagadores (R6)', valor: '64.2%', porcentaje: 64.2, tono: 'positivo' },
          { etiqueta: '% Morosidad Pendiente (R3)', valor: '21.6%', porcentaje: 21.6, tono: 'negativo' },
        ],
        notaPie: '4,820 valores emitidos (OP y RD) con S/ 3.4M recaudados en vía coactiva.',
      },
      {
        id: 'w-rt-3',
        titulo: 'R2, R5, R8 & R11. Segmentación de Cartera y Antigüedad',
        subtitulo: 'Principales Contribuyentes (≥ 10 UIT) y comportamiento histórico',
        tipo: 'resumen_segmentos',
        items: [
          { etiqueta: 'R5. PRICOS al Día (2026)', valor: '342 contribuyentes (68%)', tono: 'positivo' },
          { etiqueta: 'R5. PRICOS con Deuda Anterior', valor: '161 contribuyentes (32%)', tono: 'negativo' },
          { etiqueta: 'R2. Cero Pagos (2022–2025)', valor: '89 contribuyentes', tono: 'alerta' },
          { etiqueta: 'R8 & R11. Antigüedad Promedio / Reincidencia', valor: '2.3 años · 12.8% reincidentes', tono: 'neutro' },
        ],
      },
    ],
  },
  {
    id: 'D1',
    slug: 'deuda-morosidad-pricos',
    titulo: 'Deuda, Morosidad y PRICOS (R1, R2, R5)',
    descripcion:
      'Reporte detallado de morosos con/sin beneficio, contribuyentes sin pagos 2022-2025 y Principales Contribuyentes (≥10 UIT).',
    categoria: 'cumplimiento',
    origen: 'SUPERSET',
    modulo: 'CONTROL_MUNICIPAL',
    urlRelativa: '/superset/dashboard/deuda-morosidad-pricos/?standalone=true',
    embedUuid: 'superset-embed-d1',
    creadoEn: '28/10/2026',
    autor: 'Subgerencia de Recaudación · Superset',
    fuentesDatos: ['R1 Morosos', 'R2 Sin Pagos 2022-2025', 'R5 PRICOS ≥10 UIT'],
    metricasResumen: [
      { label: 'Deuda Sin Beneficio', valor: 'S/ 14.8M', positivo: false },
      { label: 'Deuda Con Beneficio', valor: 'S/ 11.2M', positivo: true },
      { label: 'Total PRICOS', valor: '503', positivo: true },
    ],
  },
  {
    id: 'D2',
    slug: 'recaudacion-valores',
    titulo: 'Eficacia de Recaudación y Valores (R3, R4)',
    descripcion:
      '% de recaudación, morosidad, efectividad y estado de cobranza de Órdenes de Pago y Resoluciones de Determinación.',
    categoria: 'sla',
    origen: 'SUPERSET',
    modulo: 'CONTROL_MUNICIPAL',
    urlRelativa: '/superset/dashboard/recaudacion-valores/?standalone=true',
    embedUuid: 'superset-embed-d2',
    creadoEn: '29/10/2026',
    autor: 'Ejecutoría Coactiva · Superset',
    fuentesDatos: ['R3 % Recaudación y Efectividad', 'R4 Emisión de Valores'],
    metricasResumen: [
      { label: 'Recaudación Efectiva', valor: '78.4%', positivo: true },
      { label: 'Valores Emitidos', valor: '4,820', positivo: true },
      { label: 'Cobranza Coactiva', valor: 'S/ 3.4M', positivo: true },
    ],
  },
  {
    id: 'D3',
    slug: 'buenos-pagadores-cumplimiento',
    titulo: 'Buenos Pagadores y Cumplimiento (R6, R7, R10)',
    descripcion:
      'Contribuyentes puntuales en Predial/Arbitrios, evolución anual de cumplimiento por anexo y montos promedio recaudados.',
    categoria: 'cumplimiento',
    origen: 'SUPERSET',
    modulo: 'CONTROL_MUNICIPAL',
    urlRelativa: '/superset/dashboard/buenos-pagadores-cumplimiento/?standalone=true',
    embedUuid: 'superset-embed-d3',
    creadoEn: '30/10/2026',
    autor: 'Gerencia de Administración Tributaria · Superset',
    fuentesDatos: ['R6 Buenos Pagadores', 'R7 Nivel Histórico', 'R10 Monto Promedio'],
    metricasResumen: [
      { label: 'Buenos Pagadores', valor: '18,420 (64.2%)', positivo: true },
      { label: 'Promedio Cuota Predial', valor: 'S/ 436.60', positivo: true },
    ],
    widgets: [
      {
        id: 'w-d3-1',
        titulo: 'R6 & R7. Evolución de Cumplimiento por Tributo',
        subtitulo: 'Porcentaje de pago oportuno en Impuesto Predial y Arbitrios',
        tipo: 'barras_progreso',
        items: [
          { etiqueta: 'Impuesto Predial 2026 (Anexo 01)', valor: '78.5%', porcentaje: 78.5, tono: 'positivo' },
          { etiqueta: 'Arbitrios Municipales 2026 (Anexo 02)', valor: '69.5%', porcentaje: 69.5, tono: 'positivo' },
          { etiqueta: 'Padrón de Buenos Pagadores (R6)', valor: '64.2%', porcentaje: 64.2, tono: 'positivo' },
        ],
      },
      {
        id: 'w-d3-2',
        titulo: 'R10. Monto Promedio Recaudado por Cuota Trimestral',
        subtitulo: 'Recaudación efectiva y ticket promedio en el ejercicio 2026',
        tipo: 'resumen_segmentos',
        items: [
          { etiqueta: 'Cuota 1 (Febrero) — S/ 4.50M', valor: 'Promedio: S/ 465.00', tono: 'positivo' },
          { etiqueta: 'Cuota 2 (Mayo) — S/ 4.20M', valor: 'Promedio: S/ 435.00', tono: 'positivo' },
          { etiqueta: 'Cuota 3 (Agosto) — S/ 3.95M', valor: 'Promedio: S/ 410.00', tono: 'neutro' },
        ],
      },
    ],
  },
  {
    id: 'D4',
    slug: 'antiguedad-reincidencia',
    titulo: 'Antigüedad y Comportamiento de Pago (R8, R9, R11)',
    descripcion:
      'Estratos de antigüedad de deuda, pagos oportunos vs atrasados y análisis de reincidencia en mora.',
    categoria: 'tipologia',
    origen: 'SUPERSET',
    modulo: 'CONTROL_MUNICIPAL',
    urlRelativa: '/superset/dashboard/antiguedad-reincidencia/?standalone=true',
    embedUuid: 'superset-embed-d4',
    creadoEn: '31/10/2026',
    autor: 'Fiscalización Tributaria · Superset',
    fuentesDatos: ['R8 Antigüedad de Deuda', 'R9 Comportamiento de Pago', 'R11 Reincidencia'],
    metricasResumen: [
      { label: 'Antigüedad Promedio', valor: '2.3 años', positivo: true },
      { label: 'Reincidentes Crónicos', valor: '12.8%', positivo: false },
    ],
    widgets: [
      {
        id: 'w-d4-1',
        titulo: 'R8. Saldos por Estrato de Antigüedad (2021–2025)',
        subtitulo: 'Deuda acumulada según años de antigüedad fiscal',
        tipo: 'resumen_segmentos',
        items: [
          { etiqueta: '2025 (1 año de antigüedad)', valor: 'S/ 2,100,000.00', tono: 'neutro' },
          { etiqueta: '2023–2024 (2 a 3 años)', valor: 'S/ 2,930,000.00', tono: 'alerta' },
          { etiqueta: '2021–2022 (4 a 5 años)', valor: 'S/ 1,820,000.00', tono: 'negativo' },
        ],
      },
      {
        id: 'w-d4-2',
        titulo: 'R9 & R11. Puntualidad vs Reincidencia en Mora',
        subtitulo: 'Comportamiento de pago al vencimiento trimestral',
        tipo: 'barras_progreso',
        items: [
          { etiqueta: 'Pagos Oportunos al Vencimiento (R9)', valor: '83.9%', porcentaje: 83.9, tono: 'positivo' },
          { etiqueta: 'Pagos con Atraso Menor a 60 Días', valor: '16.1%', porcentaje: 16.1, tono: 'alerta' },
          { etiqueta: 'Incumplimiento Reincidente ≥ 2 Años (R11)', valor: '12.8%', porcentaje: 12.8, tono: 'negativo' },
        ],
      },
    ],
  },
];

/**
 * Dashboards ya creados por la IA para Control Municipal (datos semilla en modo demo).
 */
const DASHBOARDS_IA_CONTROL_MUNICIPAL: SupersetDashboardInfo[] = [
  {
    id: 'IA-101',
    slug: 'ia-recuperacion-pricos-beneficios',
    titulo: 'Priorización de Recuperación de Cartera PRICOS y Beneficios 2026',
    descripcion:
      'Tablero generado por IA cruzando el padrón de Principales Contribuyentes (R5) con el descuento de arbitrios (R1) para identificar cuentas de rápida recuperación.',
    categoria: 'tributario',
    origen: 'IA',
    modulo: 'CONTROL_MUNICIPAL',
    urlRelativa: '/superset/dashboard/ia-recuperacion-pricos-beneficios/?standalone=true',
    creadoEn: '05/11/2026 16:40',
    autor: 'Asistente IA Municipal',
    modeloUsado: 'LOCAL',
    nombreModeloDetalle: 'San Miguel 1',
    promptOrigen:
      'Genera un dashboard cruzando los PRICOS con deuda de años anteriores (R5) y el potencial de ahorro con beneficio tributario (R1).',
    fuentesDatos: ['Reportes Tributarios', 'R1 Morosos', 'R5 PRICOS'],
    sqlBase:
      'SELECT c.codigo_contribuyente, c.razon_social, p.base_imponible_uit, SUM(d.deuda_anios_anteriores) AS deuda_antigua, SUM(d.total_con_beneficio) AS monto_recuperable FROM contribuyentes c JOIN predios_anexos p ON c.id = p.contribuyente_id JOIN deudas_emisiones d ON p.id = d.predio_id WHERE p.base_imponible_uit >= 10 GROUP BY c.codigo_contribuyente, c.razon_social, p.base_imponible_uit ORDER BY deuda_antigua DESC;',
    metricasResumen: [
      { label: 'PRICOS con Deuda Recuperable', valor: '161', cambio: '≥ 10 UIT', positivo: false },
      { label: 'Monto Objetivo con Beneficio', valor: 'S/ 4.9M', cambio: 'Recuperación estimada', positivo: true },
      { label: 'Ahorro Promedio Arbitrios', valor: '24.3%', cambio: 'Incentivo vigente', positivo: true },
    ],
    widgets: [
      {
        id: 'w-ia-101-1',
        titulo: 'Potencial de Recuperación en Cartera PRICOS (S/.)',
        subtitulo: 'Comparativa de deuda exigible vs liquidación con beneficio de pronto pago',
        tipo: 'kpi_comparativo',
        items: [
          { etiqueta: 'Deuda Exigible Sin Beneficio', valor: 'S/ 6.4M', detalle: '161 contribuyentes PRICOS', tono: 'alerta' },
          { etiqueta: 'Liquidación Con Beneficio', valor: 'S/ 4.9M', detalle: 'Cierre proyectado Q4 2026', tono: 'positivo' },
        ],
        notaPie: 'Generado automáticamente a partir de las vistas R1 y R5.',
      },
      {
        id: 'w-ia-101-2',
        titulo: 'Distribución por Tramo de Base Imponible (UIT)',
        subtitulo: 'Concentración de deuda en Principales Contribuyentes',
        tipo: 'barras_progreso',
        items: [
          { etiqueta: 'Tramo > 50 UIT (Gran Comercio / Centros Comerciales)', valor: '54.0%', porcentaje: 54, tono: 'positivo' },
          { etiqueta: 'Tramo 20 a 50 UIT (Inmobiliarias y Servicios)', valor: '31.5%', porcentaje: 31.5, tono: 'alerta' },
          { etiqueta: 'Tramo 10 a 20 UIT (Personas Naturales / PYMES)', valor: '14.5%', porcentaje: 14.5, tono: 'neutro' },
        ],
      },
    ],
  },
  {
    id: 'IA-102',
    slug: 'ia-alerta-reincidencia-coactiva',
    titulo: 'Mapa de Riesgo por Antigüedad y Reincidencia Tributaria (R4, R8, R11)',
    descripcion:
      'Análisis generado por IA que vincula los estratos de antigüedad mayor a 3 años (R8) con reincidencias consecutivas (R11) y órdenes de pago emitidas (R4).',
    categoria: 'sla',
    origen: 'IA',
    modulo: 'CONTROL_MUNICIPAL',
    urlRelativa: '/superset/dashboard/ia-alerta-reincidencia-coactiva/?standalone=true',
    creadoEn: '06/11/2026 11:15',
    autor: 'Asistente IA Municipal',
    modeloUsado: 'API',
    nombreModeloDetalle: 'Modelo API',
    promptOrigen:
      'Crea un dashboard de riesgo que relacione la antigüedad de deuda (R8), la reincidencia en incumplimiento (R11) y las órdenes de pago pendientes (R4).',
    fuentesDatos: ['Reportes Tributarios', 'R4 Valores Tributarios', 'R8 Antigüedad', 'R11 Reincidencia'],
    sqlBase:
      'SELECT r.anio_deuda, r.reincidencias, COUNT(v.nro_valor) AS valores_pendientes, SUM(v.monto_pendiente) AS saldo_coactivo FROM v_reincidencia_tributaria r JOIN valores_emitidos v ON r.codigo_contribuyente = v.codigo WHERE v.monto_pendiente > 0 GROUP BY r.anio_deuda, r.reincidencias;',
    metricasResumen: [
      { label: 'Deuda > 3 Años en Riesgo', valor: 'S/ 3.07M', cambio: 'Estratos 2021–2023', positivo: false },
      { label: 'Tasa de Reincidencia Crítica', valor: '12.8%', cambio: '≥ 3 años consecutivos', positivo: false },
      { label: 'Efectividad Notificación OP', valor: '81.5%', cambio: '+4.2% vs mes anterior', positivo: true },
    ],
    widgets: [
      {
        id: 'w-ia-102-1',
        titulo: 'Saldo Pendiente por Estrato de Antigüedad (R8)',
        subtitulo: 'Priorización para prescripción cero y cobranza coactiva',
        tipo: 'resumen_segmentos',
        items: [
          { etiqueta: 'Deuda 2021–2022 (4 a 5 años)', valor: 'S/ 1,820,000.00 · Prioridad Alta', tono: 'negativo' },
          { etiqueta: 'Deuda 2023–2024 (2 a 3 años)', valor: 'S/ 2,930,000.00 · En Cobranza OP', tono: 'alerta' },
          { etiqueta: 'Deuda 2025 (1 año)', valor: 'S/ 2,100,000.00 · Gestión Preventiva', tono: 'positivo' },
        ],
      },
      {
        id: 'w-ia-102-2',
        titulo: 'Conversión de Valores Tributarios Emitidos (R4)',
        subtitulo: 'Órdenes de Pago (OP) y Resoluciones de Determinación (RD)',
        tipo: 'barras_progreso',
        items: [
          { etiqueta: 'Órdenes de Pago Canceladas en Plazo', valor: '68.4%', porcentaje: 68.4, tono: 'positivo' },
          { etiqueta: 'Resoluciones de Determinación en Fraccionamiento', valor: '19.2%', porcentaje: 19.2, tono: 'alerta' },
          { etiqueta: 'Valores Derivados a Embargo / Coactiva', valor: '12.4%', porcentaje: 12.4, tono: 'negativo' },
        ],
      },
    ],
  },
];

/**
 * Datos semilla preparados para cuando se habilite en Control-TI y Admin.
 */
const DASHBOARDS_POR_MODULO_DEMO: Record<
  ModuloAnalitico,
  { superset: SupersetDashboardInfo[]; ia: SupersetDashboardInfo[] }
> = {
  CONTROL_MUNICIPAL: {
    superset: DASHBOARDS_SUPERSET_CONTROL_MUNICIPAL,
    ia: DASHBOARDS_IA_CONTROL_MUNICIPAL,
  },
  CONTROL_TI: {
    superset: [
      {
        id: 'ti-superset-telemetria',
        slug: 'telemetria-app-movil',
        titulo: 'Telemetría y Rendimiento App Ciudadana',
        descripcion: 'Sesiones activas, tiempos de respuesta de endpoints y estabilidad por versión Android/iOS.',
        categoria: 'telemetria',
        origen: 'SUPERSET',
        modulo: 'CONTROL_TI',
        urlRelativa: '/superset/dashboard/telemetria-app-movil/?standalone=true',
        creadoEn: '01/11/2026',
        autor: 'Control TI · Superset',
        fuentesDatos: ['Eventos App Móvil', 'Métricas API Gateway'],
        metricasResumen: [
          { label: 'Sesiones sin Fallos', valor: '99.4%', positivo: true },
          { label: 'Adopción Onboarding', valor: '86.2%', positivo: true },
        ],
      },
    ],
    ia: [],
  },
  ADMIN: {
    superset: [
      {
        id: 'admin-superset-auditoria',
        slug: 'auditoria-accesos-rbac',
        titulo: 'Auditoría de Seguridad y Control de Acceso',
        descripcion: 'Monitoreo de sesiones, cambios de rol, bloqueos de cuenta y trazabilidad de acciones.',
        categoria: 'seguridad',
        origen: 'SUPERSET',
        modulo: 'ADMIN',
        urlRelativa: '/superset/dashboard/auditoria-accesos-rbac/?standalone=true',
        creadoEn: '01/11/2026',
        autor: 'Seguridad de la Información · Superset',
        fuentesDatos: ['Logs de Auditoría', 'Usuarios y Roles RBAC'],
        metricasResumen: [
          { label: 'Cuentas Activas', valor: '48', positivo: true },
          { label: 'Alertas de Bloqueo', valor: '2', positivo: false },
        ],
      },
    ],
    ia: [],
  },
};

let contadorDashboardsIA = 200;

function construirRespuestaDemoChat(solicitud: SolicitudChatIA): RespuestaChatIA {
  const config = CONFIG_MODULOS_IA[solicitud.modulo];
  const etiquetaModelo =
    solicitud.proveedorModelo === 'LOCAL'
      ? config.modeloLocalNombre
      : config.modeloApiNombre;
  const q = solicitud.mensaje.toLowerCase();

  // MODO 2: Generar un nuevo dashboard con IA
  if (
    solicitud.modo === 'GENERAR_DASHBOARD' ||
    q.includes('genera un dashboard') ||
    q.includes('generar dashboard') ||
    q.includes('crea un dashboard') ||
    q.includes('crear dashboard') ||
    q.includes('nuevo tablero') ||
    q.includes('genera un tablero')
  ) {
    contadorDashboardsIA += 1;
    const nuevoId = `IA-${contadorDashboardsIA}`;
    const ahora = new Date();
    const fechaFormateada = `${ahora.toLocaleDateString('es-PE')} ${ahora.toLocaleTimeString('es-PE', {
      hour: '2-digit',
      minute: '2-digit',
    })}`;

    let titulo = 'Dashboard Analítico Personalizado de Fiscalización Tributaria';
    let descripcion = `Tablero generado por IA (${etiquetaModelo}) a partir de los datos disponibles en Reportes Tributarios.`;
    let fuentes = ['Reportes Tributarios', 'R1 Morosos', 'R3 Recaudación', 'R5 PRICOS'];
    let sql = `SELECT c.regimen, COUNT(DISTINCT c.codigo_contribuyente) AS total_contribuyentes, SUM(d.total_sin_beneficio) AS deuda_bruta, SUM(d.total_con_beneficio) AS deuda_con_descuento FROM contribuyentes c JOIN deudas_emisiones d ON c.id = d.contribuyente_id GROUP BY c.regimen ORDER BY deuda_bruta DESC;`;
    let metricas: SupersetMetricItem[] = [
      { label: 'Deuda Analizada', valor: 'S/ 14.8M', cambio: 'Padrón 2026', positivo: false },
      { label: 'Recuperación con Beneficio', valor: 'S/ 11.2M', cambio: '+75.6% liquidez', positivo: true },
      { label: 'Contribuyentes Impactados', valor: '8,420', cambio: 'Predial y Arbitrios', positivo: true },
    ];

    if (q.includes('recaudacion') || q.includes('valores') || q.includes('coactiva') || q.includes('r3') || q.includes('r4')) {
      titulo = 'Dashboard IA: Eficiencia de Recaudación y Cobranza de Valores (R3, R4)';
      descripcion =
        'Monitoreo cruzado de efectividad de recaudación por tributo y estado de cobranza de Órdenes de Pago y Resoluciones.';
      fuentes = ['Reportes Tributarios', 'R3 % Recaudación', 'R4 Emisión de Valores'];
      sql = `SELECT v.tipo_valor, COUNT(v.nro_valor) AS emitidos, SUM(v.monto_pagado) AS recaudado, SUM(v.monto_pendiente) AS pendiente FROM valores_tributarios v WHERE v.anio_valor = 2026 GROUP BY v.tipo_valor;`;
      metricas = [
        { label: 'Efectividad Global', valor: '78.4%', cambio: 'Ejercicio 2026', positivo: true },
        { label: 'Valores Emitidos', valor: '4,820', cambio: 'OP y RD', positivo: true },
        { label: 'Recaudación Coactiva', valor: 'S/ 3.4M', cambio: 'Cobranza activa', positivo: true },
      ];
    } else if (q.includes('puntual') || q.includes('buenos pagadores') || q.includes('antiguedad') || q.includes('r6') || q.includes('r8')) {
      titulo = 'Dashboard IA: Puntualidad Tributaria vs Antigüedad de Cartera (R6, R8, R11)';
      descripcion =
        'Segmentación del comportamiento de pago oportuno frente a saldos históricos y contribuyentes reincidentes.';
      fuentes = ['Reportes Tributarios', 'R6 Buenos Pagadores', 'R8 Antigüedad', 'R11 Reincidencia'];
      sql = `SELECT a.anios_antiguedad, SUM(a.deuda) AS saldo_estrato, COUNT(b.codigo_contribuyente) AS puntuales_comparados FROM v_antiguedad_deuda a LEFT JOIN v_buenos_pagadores b ON a.anexo = b.anexo GROUP BY a.anios_antiguedad;`;
      metricas = [
        { label: 'Buenos Pagadores', valor: '64.2%', cambio: '18,420 vecinos', positivo: true },
        { label: 'Antigüedad Media', valor: '2.3 años', cambio: 'R8 Histórico', positivo: true },
        { label: 'Reincidencia Crónica', valor: '12.8%', cambio: 'R11 Control', positivo: false },
      ];
    }

    const nuevoDashboard: SupersetDashboardInfo = {
      id: nuevoId,
      slug: `ia-custom-${contadorDashboardsIA}`,
      titulo,
      descripcion,
      categoria: 'tributario',
      origen: 'IA',
      modulo: solicitud.modulo,
      urlRelativa: `/superset/dashboard/ia-custom-${contadorDashboardsIA}/?standalone=true`,
      creadoEn: fechaFormateada,
      autor: 'Usuario en Sesión · Asistente IA',
      modeloUsado: solicitud.proveedorModelo,
      nombreModeloDetalle: etiquetaModelo,
      promptOrigen: solicitud.mensaje,
      fuentesDatos: fuentes,
      sqlBase: sql,
      metricasResumen: metricas,
      widgets: [
        {
          id: `${nuevoId}-w1`,
          titulo: 'Indicadores Principales del Tablero Generado',
          subtitulo: `Síntesis calculada por ${etiquetaModelo}`,
          tipo: 'kpi_comparativo',
          items: metricas.slice(0, 2).map((m) => ({
            etiqueta: m.label,
            valor: String(m.valor),
            detalle: m.cambio || 'Consolidado Municipal',
            tono: m.positivo ? 'positivo' : 'alerta',
          })),
          notaPie: `Prompt utilizado: "${solicitud.mensaje}"`,
        },
        {
          id: `${nuevoId}-w2`,
          titulo: 'Desglose Analítico por Fuentes de Datos',
          subtitulo: `Fuentes vinculadas: ${fuentes.join(', ')}`,
          tipo: 'barras_progreso',
          items: [
            { etiqueta: 'Cobertura de Registros Validados en Superset', valor: '94.2%', porcentaje: 94.2, tono: 'positivo' },
            { etiqueta: 'Participación de Impuesto Predial', valor: '58.6%', porcentaje: 58.6, tono: 'positivo' },
            { etiqueta: 'Participación de Arbitrios Municipales', valor: '41.4%', porcentaje: 41.4, tono: 'alerta' },
          ],
        },
      ],
    };

    return {
      texto: `He generado el nuevo dashboard "${nuevoDashboard.titulo}" utilizando ${etiquetaModelo} a partir de los datos disponibles en ${fuentes.join(', ')}. Ya se encuentra disponible en la sección "Dashboards creados por la IA".`,
      modo: 'GENERAR_DASHBOARD',
      proveedorModelo: solicitud.proveedorModelo,
      nombreModelo: etiquetaModelo,
      fuentesConsultadas: fuentes,
      dashboardSugeridoId: nuevoDashboard.id,
      graficoTitulo: nuevoDashboard.titulo,
      sqlGenerado: sql,
      metricas,
      dashboardGenerado: nuevoDashboard,
      pasos: ['superset_mcp.analizar_esquema', 'superset_mcp.generar_vista_dashboard'],
      segundos: 4,
      esEjemplo: true,
    };
  }

  // MODO 1: Consultar información a partir de los datos disponibles en los dashboards
  let dashboardId = 'reportes-tributarios';
  let tituloGrafico = 'Reportes Tributarios — R1. Deuda de Morosos con/sin Beneficio';
  let fuentesConsultadas = ['Dashboard: Reportes Tributarios', 'R1. Reporte de Morosos'];
  let sql = `SELECT c.codigo_contribuyente, c.razon_social, SUM(d.monto_insoluto + d.costo_emision) AS total_sin_beneficio, SUM((d.monto_insoluto + d.costo_emision) * (1 - d.dscto_arbitrios)) AS total_con_beneficio FROM contribuyentes c JOIN deudas_emisiones d ON c.id = d.contribuyente_id WHERE d.estado = 'PENDIENTE' GROUP BY c.codigo_contribuyente, c.razon_social ORDER BY total_sin_beneficio DESC LIMIT 50;`;
  let metricas: SupersetMetricItem[] = [
    { label: 'Deuda Total Sin Beneficio', valor: 'S/ 14.8M', cambio: '1900 a 2026', positivo: false },
    { label: 'Deuda Con Beneficio', valor: 'S/ 11.2M', cambio: 'Ahorro S/ 3.6M', positivo: true },
  ];
  let resumenTexto =
    'A partir de los datos disponibles en el dashboard "Reportes Tributarios" (R1), la deuda morosa total sin beneficio asciende a S/ 14.8M, reduciéndose a S/ 11.2M al aplicar los descuentos vigentes en arbitrios municipales.';

  if (q.includes('r5') || q.includes('pricos') || q.includes('10 uit')) {
    dashboardId = 'reportes-tributarios';
    tituloGrafico = 'Reportes Tributarios — R5. Principales Contribuyentes (PRICOS ≥ 10 UIT)';
    fuentesConsultadas = ['Dashboard: Reportes Tributarios', 'D1. Deuda, Morosidad y PRICOS', 'R5. PRICOS'];
    sql = `SELECT c.codigo_contribuyente, c.razon_social, p.base_imponible_uit, SUM(d.deuda_anios_anteriores) AS deuda_anterior, SUM(d.deuda_2026) AS deuda_actual FROM contribuyentes c JOIN predios_anexos p ON c.id = p.contribuyente_id JOIN deudas_emisiones d ON p.id = d.predio_id WHERE p.base_imponible_uit >= 10.0 GROUP BY c.codigo_contribuyente, c.razon_social, p.base_imponible_uit;`;
    metricas = [
      { label: 'Total PRICOS Registrados', valor: '503', positivo: true },
      { label: 'PRICOS al Día (2026)', valor: '342 (68%)', positivo: true },
      { label: 'PRICOS con Deuda Anterior', valor: '161 (32%)', positivo: false },
    ];
    resumenTexto =
      'Según los datos del dashboard "Reportes Tributarios" (sección R5 - PRICOS), existen 503 contribuyentes con base imponible ≥ 10 UIT: 342 (68%) se encuentran al día en 2026 y 161 (32%) registran saldos de ejercicios anteriores.';
  } else if (q.includes('r3') || q.includes('recaudacion') || q.includes('efectividad') || q.includes('morosidad')) {
    dashboardId = 'D2';
    tituloGrafico = 'D2. Eficacia de Cobranza y Recaudación (R3, R4)';
    fuentesConsultadas = ['Dashboard: Reportes Tributarios', 'D2. Eficacia de Recaudación y Valores', 'R3 & R4'];
    sql = `SELECT anio_fiscal, SUM(monto_recaudado) / SUM(monto_emitido) * 100 AS efectividad_pct, SUM(monto_moroso) AS saldo_pendiente FROM emisiones_tributarias GROUP BY anio_fiscal ORDER BY anio_fiscal DESC;`;
    metricas = [
      { label: 'Efectividad Cobranza', valor: '78.4%', positivo: true },
      { label: 'Morosidad Global', valor: '21.6%', positivo: false },
      { label: 'Recaudado por Coactiva', valor: 'S/ 3.4M', positivo: true },
    ];
    resumenTexto =
      'Consultando los dashboards "Reportes Tributarios" y "D2. Eficacia de Recaudación y Valores", la efectividad de cobranza del ejercicio 2026 alcanza el 78.4%, con una morosidad pendiente de 21.6% y S/ 3.4M recuperados mediante valores tributarios (R4).';
  } else if (q.includes('r6') || q.includes('buenos pagadores') || q.includes('puntual')) {
    dashboardId = 'D3';
    tituloGrafico = 'D3. Buenos Pagadores en Predial y Arbitrios (R6)';
    fuentesConsultadas = ['Dashboard: Reportes Tributarios', 'D3. Buenos Pagadores y Cumplimiento', 'R6 & R10'];
    sql = `SELECT c.codigo_contribuyente, c.razon_social, COUNT(d.cuota) AS cuotas_puntuales FROM contribuyentes c JOIN deudas_emisiones d ON c.id = d.contribuyente_id WHERE d.estado = 'PAGADO_OPORTUNO' AND d.anio = 2026 GROUP BY c.codigo_contribuyente, c.razon_social HAVING COUNT(d.cuota) = 4;`;
    metricas = [
      { label: 'Contribuyentes Puntuales', valor: '18,420', positivo: true },
      { label: '% del Padrón Municipal', valor: '64.2%', positivo: true },
    ];
    resumenTexto =
      'De acuerdo con el dashboard "D3. Buenos Pagadores y Cumplimiento", 18,420 contribuyentes (64.2% del padrón activo) mantienen sus pagos de Impuesto Predial y Arbitrios al día.';
  } else if (q.includes('r8') || q.includes('antiguedad') || q.includes('reincidencia') || q.includes('r11')) {
    dashboardId = 'D4';
    tituloGrafico = 'D4. Antigüedad y Reincidencia en Deuda (R8, R11)';
    fuentesConsultadas = ['Dashboard: Reportes Tributarios', 'D4. Antigüedad y Comportamiento de Pago', 'R8 & R11'];
    sql = `SELECT estrato_antiguedad, COUNT(*) AS total_deudores, SUM(monto_total) AS deuda_estrato FROM v_analisis_antiguedad_tributaria GROUP BY estrato_antiguedad ORDER BY orden_estrato;`;
    metricas = [
      { label: 'Antigüedad Promedio', valor: '2.3 años', positivo: true },
      { label: 'Reincidentes Crónicos', valor: '12.8%', positivo: false },
    ];
    resumenTexto =
      'Según los datos del dashboard "D4. Antigüedad y Comportamiento de Pago", la antigüedad promedio de la cartera morosa es de 2.3 años y el 12.8% presenta reincidencia en 3 o más periodos consecutivos.';
  }

  return {
    texto: `${resumenTexto} (Procesado con ${etiquetaModelo}).`,
    modo: 'CONSULTA_DATOS',
    proveedorModelo: solicitud.proveedorModelo,
    nombreModelo: etiquetaModelo,
    fuentesConsultadas,
    dashboardSugeridoId: dashboardId,
    graficoTitulo: tituloGrafico,
    sqlGenerado: sql,
    metricas,
    pasos: ['superset_mcp.obtener_tablas', 'superset_mcp.ejecutar_consulta_sql'],
    segundos: 3,
    esEjemplo: true,
  };
}

/**
 * Diccionario de códigos de error devueltos por el asistente de IA y el módulo BI (Superset / MCP) en el backend.
 */
export const ERRORES_IA_SANMI: Record<string, string> = {
  bi_no_configurado: 'Esta función de Business Intelligence aún no está configurada en el servidor.',
  bi_area_sin_rol_datos: 'El área de tu cuenta no tiene un grupo de datos asignado. Avisa a un administrador.',
  bi_rol_datos_invalido: 'El grupo de datos asignado a tu área no es válido. Avisa a un administrador.',
  bi_superset_no_disponible: 'Apache Superset está caído o tarda en responder. Inténtalo de nuevo.',
  bi_no_es_dueno: 'No eres dueño de ese dashboard en Apache Superset.',
  bi_sin_cuenta_superset: 'Tu cuenta no tiene usuario en Superset. Un administrador debe habilitar tu acceso MCP primero.',
  bi_graficos_sin_query_context:
    'Los gráficos recién creados se están preparando en Superset. Reintenta en unos segundos.',
  bi_dominios_no_configurados:
    'Falta configurar los dominios permitidos de embebido en el servidor. Avisa al administrador del sistema.',
  bi_ambito_invalido: 'El ámbito de dashboards solicitado no es válido.',
  bi_formato_invalido: 'El formato de descarga solicitado no es válido (usa CSV o XLSX).',
  bi_descarga_no_lista: 'El archivo ZIP aún no termina de generarse.',
  bi_tabla_sin_columnas: 'La tabla seleccionada no tiene columnas disponibles.',
  bi_rol_superset_no_existe: 'Falta un rol requerido en Apache Superset. Avisa al administrador del sistema.',
  bi_usuario_superset_ajeno:
    'El nombre de usuario ya existe en Superset como cuenta humana independiente y no se puede modificar.',
  bi_usuario_superset_en_uso: 'Ese usuario de Superset ya está asignado a otra persona.',
  bi_cuenta_inactiva: 'La cuenta del personal está inactiva.',
  bi_lector_rechazado: 'Superset no aceptó la cuenta de servicio del grupo. Avisa al administrador.',
  bi_descarga_rechazada: 'Superset no aceptó la cuenta de servicio para descargar la tabla. Avisa al administrador.',
  bi_descarga_muy_grande: 'El archivo ZIP superó los 150 MB. Descarga las tablas una por una.',
  bi_descarga_error: 'Ocurrió un error al generar el archivo ZIP de las tablas.',
  ia_ocupada: 'La cola del modelo local está llena en este momento. Reintenta en unos minutos o cambia al modelo API.',
  ia_no_configurada: 'El modelo local de IA no está disponible o no está configurado en el servidor.',
  ia_api_no_configurada: 'El modelo por API (Claude) no está configurado en el servidor.',
  llm_no_disponible: 'El modelo de IA no respondió (¿VM del modelo apagada o túnel Tailscale sin conexión?). Prueba cambiar entre modelo Local y API.',
  llm_respuesta_invalida: 'El modelo devolvió una respuesta inválida o incompleta. Intenta de nuevo.',
  llm_limite: 'La API de Claude alcanzó su límite de uso. Reintenta más tarde o usa el modelo local.',
  llm_credencial_invalida: 'La clave de la API de Claude falló. Avisa al administrador del sistema.',
  llm_rechazo: 'Claude declinó responder esa consulta por sus filtros de seguridad. Reformula la pregunta.',
  mcp_no_disponible: 'No se pudo conectar con el servidor MCP de Superset.',
  mcp_no_autorizado: 'Superset rechazó la autorización del conector MCP.',
  mcp_error: 'El conector MCP devolvió un error al ejecutar la operación.',
  ia_limite_iteraciones: 'El asistente dio demasiadas vueltas sin concluir. Reformula la pregunta de forma más concreta.',
  ia_error_interno: 'Error interno del asistente de IA.',
  not_found: 'No existe este recurso o no pertenece al grupo de datos de tu área.',
};

export interface EnviarTrabajoChatResponse {
  id?: string;
  estado?: string;
  texto?: string;
  respuesta?: string | null;
  error?: string | null;
  pasos?: string[];
  creados?: string[];
  proveedor?: ProveedorModeloIA;
}

export interface ConsultarTrabajoChatResponse {
  id?: string;
  estado: 'EN_COLA' | 'EJECUTANDO' | 'PENDIENTE' | 'EN_PROCESO' | 'COMPLETADO' | 'ERROR';
  pasos?: string[];
  creados?: string[];
  respuesta?: string | null;
  error?: string | null;
  proveedor?: ProveedorModeloIA;
}

/**
 * Error enriquecido cuando un trabajo del asistente termina en estado `ERROR` pero ya había creado
 * recursos en Superset (`creados` no vacío, sección 5.2 de la guía).
 */
export class ErrorTrabajoIa extends Error {
  codigo: string;
  creados: string[];
  pasos: string[];

  constructor(message: string, codigo: string, creados: string[] = [], pasos: string[] = []) {
    super(message);
    this.name = 'ErrorTrabajoIa';
    this.codigo = codigo;
    this.creados = creados;
    this.pasos = pasos;
  }
}

/**
 * Convierte un item devuelto por `GET /api/v1/admin/bi/dashboards?ambito=...`
 * al modelo `SupersetDashboardInfo` usado por el visor del portal.
 */
function mapearBiDashboardItem(
  item: BiDashboardItemResponse,
  modulo: ModuloAnalitico,
  origenPorDefecto: 'SUPERSET' | 'IA'
): SupersetDashboardInfo {
  return {
    id: String(item.id),
    supersetId: item.id,
    slug: `superset-${item.id}`,
    titulo: item.titulo || `Dashboard #${item.id}`,
    descripcion: item.actualizado
      ? `Actualizado ${item.actualizado}`
      : item.publicado
      ? 'Dashboard publicado en Apache Superset'
      : 'Borrador en Apache Superset',
    categoria:
      modulo === 'CONTROL_TI' ? 'telemetria' : modulo === 'ADMIN' ? 'seguridad' : 'tributario',
    urlRelativa: `/superset/dashboard/${item.id}/?standalone=true`,
    origen: item.publicado ? 'SUPERSET' : origenPorDefecto,
    modulo,
    publicado: item.publicado,
    embedUuid: item.embedUuid,
    embedKey: item.embedUuid || undefined,
    actualizado: item.actualizado,
    creadoEn: item.actualizado,
  };
}

/**
 * Extrae metadatos de un dashboard si el arreglo `creados` de `/ia/chat/{id}` incluye
 * p. ej. `"Dashboard creado: «Reclamos por mes» (id 18) - https://bi.../superset/dashboard/18/"`.
 */
export function extraerDashboardDeCreados(
  creados: string[] | undefined,
  modulo: ModuloAnalitico,
  proveedor: ProveedorModeloIA,
  promptOrigen: string
): SupersetDashboardInfo | undefined {
  if (!creados || creados.length === 0) return undefined;
  for (const linea of creados) {
    const matchId = /\(id\s+(\d+)\)/i.exec(linea) || /\/dashboard\/(\d+)/i.exec(linea);
    if (matchId) {
      const numId = Number(matchId[1]);
      const matchTitulo = /[«"“]([^»"”]+)[»"”]/.exec(linea);
      const titulo = matchTitulo?.[1]?.trim() || `Dashboard #${numId}`;
      return {
        id: String(numId),
        supersetId: numId,
        slug: `superset-${numId}`,
        titulo,
        descripcion: 'Borrador recién creado por el asistente en Apache Superset',
        categoria:
          modulo === 'CONTROL_TI' ? 'telemetria' : modulo === 'ADMIN' ? 'seguridad' : 'tributario',
        urlRelativa: `/superset/dashboard/${numId}/?standalone=true`,
        origen: 'IA',
        modulo,
        publicado: false,
        embedUuid: null,
        actualizado: 'Recién creado',
        creadoEn: 'Recién creado',
        modeloUsado: proveedor,
        promptOrigen,
      };
    }
  }
  return undefined;
}

/**
 * Extrae y formatea el mensaje de error real del backend (FastAPI, Spring Boot o REST estándar),
 * evitando mostrar textos genéricos sin detalle como "Error HTTP 422: ".
 */
export function formatearErrorIaBackend(
  err: unknown,
  fallback = 'No se pudo completar la consulta con el asistente de IA.'
): string {
  if (!(err instanceof ApiError)) {
    return err instanceof Error ? err.message : fallback;
  }

  // 1. Si el backend devolvió un objeto de error (JSON)
  if (err.data && typeof err.data === 'object') {
    const data = err.data as Record<string, unknown>;

    // Caso FastAPI / Pydantic: { detail: [...] } o { detail: string }
    if (data.detail !== undefined) {
      if (typeof data.detail === 'string' && data.detail.trim()) {
        return data.detail;
      }
      if (Array.isArray(data.detail)) {
        const detalles = (data.detail as Array<{ loc?: unknown[]; msg?: string; type?: string }>).map((d) => {
          const campo = Array.isArray(d.loc)
            ? d.loc.filter((x) => x !== 'body').map(String).join('.')
            : '';
          return campo ? `${campo}: ${d.msg || d.type || 'error'}` : (d.msg || JSON.stringify(d));
        });
        return `Error en los datos de la consulta (422): ${detalles.join('; ')}`;
      }
    }

    // Caso Spring Boot con DTO de error: { error: { code, message } }
    if (data.error && typeof data.error === 'object') {
      const errObj = data.error as { code?: string; message?: string };
      if (errObj.code && ERRORES_IA_SANMI[errObj.code]) {
        return ERRORES_IA_SANMI[errObj.code];
      }
      if (errObj.message) return errObj.message;
      if (errObj.code) return `Error: ${errObj.code}`;
    }

    // Caso { message: "..." }
    if (typeof data.message === 'string' && data.message.trim()) {
      return data.message;
    }

    // Caso { error: "codigo_o_mensaje" }
    if (typeof data.error === 'string' && data.error.trim()) {
      if (ERRORES_IA_SANMI[data.error]) return ERRORES_IA_SANMI[data.error];
      return data.error;
    }

    // Caso errores de validación en lista: { errors: [...] }
    if (Array.isArray(data.errors)) {
      const detalles = (data.errors as Array<{ defaultMessage?: string; message?: string }>).map(
        (e) => e.defaultMessage || e.message || JSON.stringify(e)
      );
      return `Error de validación (422): ${detalles.join('; ')}`;
    }
  }

  // 2. Si err.data es texto plano
  if (typeof err.data === 'string' && err.data.trim()) {
    return err.data;
  }

  // 3. Fallback con traductor estándar o por estado HTTP
  if (err.status === 422) {
    return 'El backend no pudo procesar los datos de la consulta (422 Unprocessable Entity).';
  }
  if (err.status === 403) {
    return 'El backend rechazó el acceso (403 Prohibido). La ruta del asistente de IA requiere que el rol Control Municipal esté autorizado en el servidor.';
  }

  return mensajeErrorApi(err, fallback);
}

export const RUTA_BI = '/api/v1/admin/bi';

export const MOCK_TABLAS_CERTIFICADAS: TablaCertificadaBi[] = [
  { id: 1, nombre: 'V_REP_R01_MOROSOS', descripcion: 'Reporte de Morosos con Beneficio vs sin Beneficio', certificadoPor: 'Control Municipal' },
  { id: 2, nombre: 'V_REP_R02_SIN_PAGO', descripcion: 'Contribuyentes sin Registros de Pago (2022-2025)', certificadoPor: 'Control Municipal' },
  { id: 3, nombre: 'V_REP_R03_RECAUDACION', descripcion: '% de Recaudación vs Morosidad y Efectividad de Cobranza', certificadoPor: 'Control Municipal' },
  { id: 4, nombre: 'V_REP_R04_VALORES', descripcion: 'Estado de Cobranza de Valores Emitidos', certificadoPor: 'Control Municipal' },
  { id: 5, nombre: 'V_REP_R05_PRICOS', descripcion: 'Principales Contribuyentes (PRICOS) con Deuda Tributaria', certificadoPor: 'Control Municipal' },
  { id: 6, nombre: 'V_REP_R06_BUEN_PAGADOR', descripcion: 'Contribuyentes con Pagos Oportunos en Impuesto Predial y Arbitrios', certificadoPor: 'Control Municipal' },
  { id: 7, nombre: 'V_REP_R07_EFECTIVIDAD_ANUAL', descripcion: 'Efectividad de Cobranza por Año Tributario', certificadoPor: 'Control Municipal' },
  { id: 8, nombre: 'V_REP_R08_ESTRATIFICACION', descripcion: 'Estratificación de Deuda por Antigüedad', certificadoPor: 'Control Municipal' },
  { id: 9, nombre: 'V_REP_R09_CUMPLIMIENTO', descripcion: 'Historial de Cumplimiento (Pagos a Tiempo vs Fuera de Plazo)', certificadoPor: 'Control Municipal' },
  { id: 10, nombre: 'V_REP_R10_PROMEDIO_PUNTUAL', descripcion: 'Monto Promedio Recaudado por Contribuyente Puntual', certificadoPor: 'Control Municipal' },
  { id: 11, nombre: 'V_REP_R11_REINCIDENCIA', descripcion: 'Reincidencia en la Mora Tributaria', certificadoPor: 'Control Municipal' },
];

export class IaDashboardsController {
  /**
   * Lista los dashboards de un ámbito del módulo BI (sección 3.1 de la guía).
   * El backend deduce el grupo de datos del área de la persona: no se envía `modulo`.
   * Endpoint backend: `GET /api/v1/admin/bi/dashboards?ambito=publicados|borradores`
   */
  async getDashboardsBi(
    ambito: AmbitoDashboardBi,
    modulo: ModuloAnalitico = 'CONTROL_MUNICIPAL'
  ): Promise<SupersetDashboardInfo[]> {
    const items = await apiClient<BiDashboardItemResponse[]>(`${RUTA_BI}/dashboards`, {
      params: { ambito },
    });
    return (Array.isArray(items) ? items : []).map((item) =>
      mapearBiDashboardItem(item, modulo, ambito === 'borradores' ? 'IA' : 'SUPERSET')
    );
  }

  /**
   * Publicados (los que ve el grupo de datos) y borradores (los que posee la persona).
   * `dashboardsSuperset` = publicados y `dashboardsIA` = borradores, para reutilizar la vista existente.
   */
  async getDashboards(modulo: ModuloAnalitico): Promise<ListadoDashboardsResponse> {
    try {
      const [publicados, borradores] = await Promise.allSettled([
        this.getDashboardsBi('publicados', modulo),
        this.getDashboardsBi('borradores', modulo),
      ]);
      // Si los publicados fallan, el error llega a la vista; los borradores son complementarios.
      if (publicados.status === 'rejected') throw publicados.reason;
      return {
        modulo,
        dashboardsSuperset: publicados.value,
        dashboardsIA: borradores.status === 'fulfilled' ? borradores.value : [],
      };
    } catch (err) {
      if (!usarDatosDemo(err)) throw err;
      const demo = DASHBOARDS_POR_MODULO_DEMO[modulo] || DASHBOARDS_POR_MODULO_DEMO.CONTROL_MUNICIPAL;
      return {
        modulo,
        dashboardsSuperset: [...demo.superset],
        dashboardsIA: [...demo.ia],
      };
    }
  }

  /**
   * Pide al backend el token temporal (5 min) para mostrar un dashboard embebido (sección 3.1).
   * Endpoint backend: `GET /api/v1/admin/bi/dashboards/{embedUuid}/guest-token`
   */
  async getGuestToken(embedUuid: string): Promise<BiGuestTokenResponse> {
    return apiClient<BiGuestTokenResponse>(
      `${RUTA_BI}/dashboards/${encodeURIComponent(embedUuid)}/guest-token`
    );
  }

  /**
   * Compatibilidad con el visor: devuelve la URL de Superset y el UUID de embebido a partir del guest token.
   * Ya no existe `/ia/dashboards/:id/embed-token`: el SDK usa `getGuestToken`.
   */
  async getSupersetEmbedToken(
    dashboardId: string,
    modulo: ModuloAnalitico = 'CONTROL_MUNICIPAL',
    theme: 'light' | 'dark' = 'light'
  ): Promise<SupersetEmbedTokenResponse> {
    const originActual =
      SUPERSET_ALLOWED_DOMAIN ||
      (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');
    const modoTema = theme === 'dark' ? 'dark' : 'default';

    try {
      const resp = await this.getGuestToken(dashboardId);
      const supersetDomain = (resp.supersetUrl || SUPERSET_BASE_URL).replace(/\/$/, '');
      return {
        dashboardId: resp.dashboardId || dashboardId,
        embedKey: resp.dashboardId || dashboardId,
        supersetDomain,
        allowedDomain: originActual,
        embedUrl: supersetDomain
          ? `${supersetDomain}/superset/embedded/${encodeURIComponent(dashboardId)}/?standalone=true&themeMode=${modoTema}&theme=${theme}`
          : '',
        guestToken: resp.token,
        expiraEn: String(resp.expiraEn),
      };
    } catch (err) {
      if (!usarDatosDemo(err)) throw err;
      const supersetDomain = SUPERSET_BASE_URL.replace(/\/$/, '');
      const demo = DASHBOARDS_POR_MODULO_DEMO[modulo] || DASHBOARDS_POR_MODULO_DEMO.CONTROL_MUNICIPAL;
      const todos = [...demo.superset, ...demo.ia];
      const encontrado = todos.find((d) => d.id === dashboardId);
      const embedKey =
        encontrado?.embedKey || encontrado?.embedUuid || `superset-key-${dashboardId}`;
      return {
        dashboardId,
        embedKey,
        supersetDomain,
        allowedDomain: originActual,
        embedUrl: supersetDomain
          ? `${supersetDomain}/superset/embedded/${encodeURIComponent(embedKey)}/?standalone=true&themeMode=${modoTema}&theme=${theme}`
          : '',
        guestToken: undefined,
      };
    }
  }

  /**
   * Publica un dashboard o lo devuelve a borrador. Solo ADMIN y dueño del dashboard (sección 3.2).
   * Endpoint backend: `PUT /api/v1/admin/bi/dashboards/{id}/publicacion`
   */
  async publicarDashboard(id: number, publicado: boolean): Promise<BiPublicacionResponse> {
    return apiClient<BiPublicacionResponse>(`${RUTA_BI}/dashboards/${id}/publicacion`, {
      method: 'PUT',
      body: JSON.stringify({ publicado }),
    });
  }

  /**
   * Habilita el embebido de un dashboard y devuelve su UUID (sección 3.3).
   * Endpoint backend: `PUT /api/v1/admin/bi/dashboards/{id}/embebido`
   */
  async habilitarEmbebido(id: number): Promise<BiEmbebidoResponse> {
    return apiClient<BiEmbebidoResponse>(`${RUTA_BI}/dashboards/${id}/embebido`, {
      method: 'PUT',
    });
  }

  /**
   * Habilita el embebido reintentando mientras el backend responde 409 `bi_graficos_sin_query_context`
   * (los gráficos recién creados por el asistente tardan unos segundos en quedar listos).
   * Reintenta cada 4 s hasta unos 60 s; `onEspera` permite mostrar "Preparando…".
   */
  async habilitarEmbebidoConReintentos(
    id: number,
    onEspera?: (intento: number) => void,
    signal?: AbortSignal
  ): Promise<BiEmbebidoResponse> {
    const INTERVALO_MS = 4000;
    const MAX_INTENTOS = 15;
    for (let intento = 1; ; intento++) {
      try {
        return await this.habilitarEmbebido(id);
      } catch (err) {
        const reintentable =
          codigoErrorApi(err) === 'bi_graficos_sin_query_context' && intento < MAX_INTENTOS;
        if (!reintentable) throw err;
        onEspera?.(intento);
        await new Promise((resolve) => setTimeout(resolve, INTERVALO_MS));
        if (signal?.aborted) throw new Error('Operación cancelada.');
      }
    }
  }

  /**
   * Retira el embebido de un dashboard (sección 3.3).
   * Endpoint backend: `DELETE /api/v1/admin/bi/dashboards/{id}/embebido`
   */
  async retirarEmbebido(id: number): Promise<void> {
    await apiClient<void>(`${RUTA_BI}/dashboards/${id}/embebido`, { method: 'DELETE' });
  }

  /**
   * Estado del modelo local y de la API de Claude, y preguntas en cola (sección 5.1).
   * Endpoint backend: `GET /api/v1/admin/bi/ia/estado`
   */
  async getEstadoIa(): Promise<EstadoIaBiResponse> {
    return apiClient<EstadoIaBiResponse>(`${RUTA_BI}/ia/estado`);
  }

  /**
   * Envía una pregunta al asistente de IA (modelo local o API de Claude) y espera su respuesta.
   *
   * Flujo con el backend real (sección 5.2 de la guía):
   * 1. `POST /api/v1/admin/bi/ia/chat` con `{ mensaje, historial, proveedor }` → 202 con `{ id }`.
   * 2. Consulta periódica a `GET /api/v1/admin/bi/ia/chat/{id}` cada 3 s hasta `COMPLETADO` o `ERROR`.
   *    No hay tiempo límite corto: el modelo local puede tardar varios minutos.
   * 3. `creados` (lo que el asistente ya creó en Superset) se devuelve siempre, también cuando el estado es `ERROR`.
   * 4. Si no hay conexión y estamos en modo demo, se utiliza `construirRespuestaDemoChat`.
   */
  async enviarConsultaChat(solicitud: SolicitudChatIA): Promise<RespuestaChatIA> {
    const historialFormateado = (solicitud.historial || [])
      .slice(-10)
      .map((t) => ({
        rol: t.rol === 'user' ? ('usuario' as const) : ('asistente' as const),
        contenido: t.texto.slice(0, 4000),
      }));

    const cuerpo = {
      mensaje: solicitud.mensaje.trim().slice(0, 2000),
      historial: historialFormateado,
      proveedor: solicitud.proveedorModelo,
    };

    const cfg = CONFIG_MODULOS_IA[solicitud.modulo] || CONFIG_MODULOS_IA.CONTROL_MUNICIPAL;
    const nombreModelo =
      solicitud.proveedorModelo === 'LOCAL' ? cfg.modeloLocalNombre : cfg.modeloApiNombre;

    try {
      const envio = await apiClient<EnviarTrabajoChatResponse>(`${RUTA_BI}/ia/chat`, {
        method: 'POST',
        body: JSON.stringify(cuerpo),
        signal: solicitud.signal,
      });

      const trabajoId = envio?.id;
      if (!trabajoId) {
        throw new Error('El backend no devolvió un identificador de tarea para la consulta.');
      }

      const INTERVALO_MS = 3000;
      const ESPERA_MAX_MS = 25 * 60 * 1000; // El trabajo se conserva 30 min en el servidor
      const inicio = Date.now();

      while (true) {
        if (solicitud.signal?.aborted) throw new Error('Consulta cancelada.');
        if (Date.now() - inicio > ESPERA_MAX_MS) {
          throw new Error('Se agotó la espera máxima (25 min). El modelo puede estar saturado.');
        }

        await new Promise((resolve) => setTimeout(resolve, INTERVALO_MS));
        if (solicitud.signal?.aborted) throw new Error('Consulta cancelada.');

        const poll = await apiClient<ConsultarTrabajoChatResponse>(
          `${RUTA_BI}/ia/chat/${encodeURIComponent(trabajoId)}`,
          { method: 'GET', signal: solicitud.signal }
        );

        const seg = Math.round((Date.now() - inicio) / 1000);
        const pasos = poll.pasos || [];
        const creados = poll.creados || [];

        solicitud.onProgreso?.({
          estado: poll.estado === 'EN_COLA' ? 'En cola' : 'Procesando',
          segundos: seg,
          pasos,
          creados,
        });

        if (poll.estado === 'COMPLETADO') {
          return {
            texto: poll.respuesta || '(Respuesta vacía del asistente)',
            modo: solicitud.modo,
            proveedorModelo: poll.proveedor || solicitud.proveedorModelo,
            nombreModelo,
            pasos,
            creados,
            segundos: seg,
            dashboardGenerado: extraerDashboardDeCreados(
              creados,
              solicitud.modulo,
              solicitud.proveedorModelo,
              solicitud.mensaje
            ),
            esEjemplo: false,
          };
        }

        if (poll.estado === 'ERROR') {
          const cod = poll.error || 'ia_error_interno';
          const msg = ERRORES_IA_SANMI[cod] || `El asistente terminó con error: ${cod}`;
          throw new ErrorTrabajoIa(msg, cod, creados, pasos);
        }
      }
    } catch (err) {
      if (usarDatosDemo(err)) return construirRespuestaDemoChat(solicitud);
      if (err instanceof ErrorTrabajoIa) throw err;
      if (err instanceof ApiError) throw new Error(formatearErrorIaBackend(err));
      if (err instanceof Error) throw err;
      throw new Error(formatearErrorIaBackend(err));
    }
  }

  /**
   * Registra o persiste en memoria/servidor un dashboard generado por la IA.
   * Flujo de la guía: el asistente crea un borrador; si tiene supersetId, se intenta habilitar el embebido.
   */
  async guardarDashboardIA(
    _modulo: ModuloAnalitico,
    dashboard: SupersetDashboardInfo
  ): Promise<SupersetDashboardInfo> {
    if (dashboard.supersetId && !dashboard.embedUuid) {
      try {
        const resp = await this.habilitarEmbebidoConReintentos(dashboard.supersetId);
        return {
          ...dashboard,
          embedUuid: resp.uuid,
          embedKey: resp.uuid,
        };
      } catch {
        return dashboard;
      }
    }
    return dashboard;
  }

  /**
   * Retira el embebido de un dashboard generado por la IA.
   */
  async eliminarDashboardIA(_modulo: ModuloAnalitico, dashboardId: string): Promise<void> {
    const numId = Number(dashboardId);
    if (!Number.isNaN(numId)) {
      try {
        await this.retirarEmbebido(numId);
      } catch (err) {
        if (!usarDatosDemo(err)) throw err;
      }
    }
  }

  /**
   * Tablas certificadas que puede descargar el grupo de datos del área (sección 4 de la guía).
   * Endpoint backend: `GET /api/v1/admin/bi/tablas`
   */
  async getTablas(): Promise<TablaCertificadaBi[]> {
    try {
      const items = await apiClient<TablaCertificadaBi[]>(`${RUTA_BI}/tablas`);
      return Array.isArray(items) ? items : [];
    } catch (err) {
      if (!usarDatosDemo(err)) throw err;
      return [...MOCK_TABLAS_CERTIFICADAS];
    }
  }

  /**
   * Descarga una tabla certificada en CSV o XLSX (sección 4.1 de la guía).
   * Lee cabeceras `X-Tabla-Incompleta` y `X-Tabla-Filas` devueltas por el servidor.
   * Endpoint backend: `GET /api/v1/admin/bi/tablas/{datasetId}/descarga?formato=csv|xlsx`
   */
  async descargarTabla(
    datasetId: number,
    formato: FormatoDescargaTablaBi = 'csv'
  ): Promise<ResultadoDescargaTablaBi> {
    try {
      const archivo = await apiClientArchivoConMeta(
        `${RUTA_BI}/tablas/${encodeURIComponent(datasetId)}/descarga`,
        { params: { formato } }
      );
      const nombreArchivo =
        archivo.nombreArchivo || `tabla_${datasetId}.${formato}`;

      let cabeceras: string[] = [];
      let filas: string[][] = [];

      if (formato === 'csv') {
        const texto = await archivo.blob.text();
        const parseado = parsearCSV(texto);
        cabeceras = parseado.cabeceras;
        filas = parseado.filas;
      }

      return {
        datasetId,
        nombreArchivo,
        tablaIncompleta: archivo.tablaIncompleta,
        tablaFilas: archivo.tablaFilas >= 0 ? archivo.tablaFilas : filas.length,
        cabeceras,
        filas,
      };
    } catch (err) {
      if (!usarDatosDemo(err)) throw err;
      const codigoReporte = `R${datasetId}`;
      const info =
        CATALOGO_REPORTES_OFICIALES.find((r) => r.codigo === codigoReporte) ||
        CATALOGO_REPORTES_OFICIALES[0];
      const filas = MOCK_ROWS_BY_REPORT[info.codigo] || [];
      return {
        datasetId,
        nombreArchivo: `${info.codigo}_${info.nombre.replace(/\s+/g, '_')}.${formato}`,
        tablaIncompleta: false,
        tablaFilas: filas.length,
        cabeceras: info.cabeceras,
        filas,
      };
    }
  }

  /**
   * Descarga directamente en el navegador el archivo CSV o XLSX de una tabla certificada (sección 4.1).
   */
  async descargarTablaArchivo(
    datasetId: number,
    formato: FormatoDescargaTablaBi = 'csv'
  ): Promise<{ nombreArchivo: string; tablaIncompleta: boolean; tablaFilas: number }> {
    try {
      const archivo = await apiClientArchivoConMeta(
        `${RUTA_BI}/tablas/${encodeURIComponent(datasetId)}/descarga`,
        { params: { formato } }
      );
      const nombre = archivo.nombreArchivo || `V_REP_${datasetId}.${formato}`;
      descargarBlobArchivo(archivo.blob, nombre);
      return {
        nombreArchivo: nombre,
        tablaIncompleta: archivo.tablaIncompleta,
        tablaFilas: archivo.tablaFilas,
      };
    } catch (err) {
      if (!usarDatosDemo(err)) throw err;
      const codigoReporte = `R${datasetId}`;
      const info =
        CATALOGO_REPORTES_OFICIALES.find((r) => r.codigo === codigoReporte) ||
        CATALOGO_REPORTES_OFICIALES[0];
      const filas = MOCK_ROWS_BY_REPORT[info.codigo] || [];
      const nombre = `Reporte_${info.codigo}_${info.nombre.replace(/\s+/g, '_')}`;
      if (formato === 'csv') {
        exportarCSV(nombre, info.cabeceras, filas);
      } else {
        const contenido = [info.cabeceras.join('\t'), ...filas.map((f) => f.join('\t'))].join('\n');
        const blob = new Blob([contenido], { type: 'application/vnd.ms-excel' });
        descargarBlobArchivo(blob, `${nombre}.xls`);
      }
      return {
        nombreArchivo: `${nombre}.${formato}`,
        tablaIncompleta: false,
        tablaFilas: filas.length,
      };
    }
  }

  /**
   * Inicia el trabajo asíncrono para bajar todas las tablas en un archivo ZIP (sección 4.2).
   * Endpoint backend: `POST /api/v1/admin/bi/tablas/descarga-todas?formato=csv|xlsx`
   */
  async iniciarDescargaTodas(
    formato: FormatoDescargaTablaBi = 'csv'
  ): Promise<TrabajoDescargaTodasBi> {
    return apiClient<TrabajoDescargaTodasBi>(`${RUTA_BI}/tablas/descarga-todas`, {
      method: 'POST',
      params: { formato },
    });
  }

  /**
   * Consulta el estado de un trabajo de descarga de todas las tablas (sección 4.2).
   * Endpoint backend: `GET /api/v1/admin/bi/tablas/descarga-todas/{id}`
   */
  async consultarDescargaTodas(id: string): Promise<TrabajoDescargaTodasBi> {
    return apiClient<TrabajoDescargaTodasBi>(
      `${RUTA_BI}/tablas/descarga-todas/${encodeURIComponent(id)}`
    );
  }

  /**
   * Obtiene el archivo ZIP generado cuando el estado es COMPLETADO (sección 4.2).
   * Endpoint backend: `GET /api/v1/admin/bi/tablas/descarga-todas/{id}/archivo`
   */
  async obtenerArchivoDescargaTodas(id: string): Promise<Blob> {
    return apiClientArchivo(
      `${RUTA_BI}/tablas/descarga-todas/${encodeURIComponent(id)}/archivo`
    );
  }

  /**
   * Habilita el acceso MCP en Superset a un personal (ADMIN, sección 6 de la guía).
   * Endpoint backend: `PUT /api/v1/admin/bi/personal/{administradorId}/mcp`
   */
  async habilitarMcpPersonal(
    administradorId: string,
    nivel: NivelMcp
  ): Promise<AccesoMcpPersonalResponse> {
    return apiClient<AccesoMcpPersonalResponse>(
      `${RUTA_BI}/personal/${encodeURIComponent(administradorId)}/mcp`,
      {
        method: 'PUT',
        body: JSON.stringify({ nivel }),
      }
    );
  }

  /**
   * Retira el acceso MCP a un personal (ADMIN, sección 6 de la guía).
   * Endpoint backend: `DELETE /api/v1/admin/bi/personal/{administradorId}/mcp`
   */
  async retirarMcpPersonal(administradorId: string): Promise<AccesoMcpPersonalResponse> {
    return apiClient<AccesoMcpPersonalResponse>(
      `${RUTA_BI}/personal/${encodeURIComponent(administradorId)}/mcp`,
      {
        method: 'DELETE',
      }
    );
  }
}

export const iaDashboardsController = new IaDashboardsController();
