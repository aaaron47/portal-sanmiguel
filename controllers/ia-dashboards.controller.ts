import { apiClient, usarDatosDemo } from '@/services/api-client.service';
import {
  ConfiguracionModuloIA,
  ListadoDashboardsResponse,
  ModuloAnalitico,
  ProveedorModeloIA,
  RespuestaChatIA,
  SolicitudChatIA,
  SupersetDashboardInfo,
  SupersetEmbedTokenResponse,
  SupersetMetricItem,
} from '@/types/superset.types';

/**
 * Configuración global para el selector de modelos de IA y embebido de Apache Superset.
 * Pueden sobreescribirse mediante variables de entorno en `.env.local` o `.env.production`.
 */
export const MODELO_IA_LOCAL_NOMBRE =
  process.env.NEXT_PUBLIC_IA_MODEL_LOCAL_NAME || 'San Miguel 1';
export const MODELO_IA_API_NOMBRE =
  process.env.NEXT_PUBLIC_IA_MODEL_API_NAME || 'API';
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
      valor: 'LOCAL',
      etiqueta: cfg.modeloLocalNombre,
      descripcion: cfg.modeloLocalDescripcion,
    },
    {
      valor: 'API',
      etiqueta: cfg.modeloApiNombre,
      descripcion: cfg.modeloApiDescripcion,
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
    modeloApiDescripcion: 'Modelo externo por API configurado en el servidor',
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
    modeloApiDescripcion: 'Modelo externo por API configurado en el servidor',
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
    modeloApiDescripcion: 'Modelo externo por API configurado en el servidor',
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
    embedUuid: 'superset-embed-reportes-tributarios-001',
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
    esEjemplo: true,
  };
}

export class IaDashboardsController {
  /**
   * Obtiene el listado de dashboards creados en Apache Superset y dashboards creados por la IA
   * para el módulo indicado (`CONTROL_MUNICIPAL`, `CONTROL_TI` o `ADMIN`).
   * Endpoint backend: `GET /ia/dashboards?modulo=<MODULO>`
   */
  async getDashboards(modulo: ModuloAnalitico): Promise<ListadoDashboardsResponse> {
    try {
      return await apiClient<ListadoDashboardsResponse>('/ia/dashboards', {
        params: { modulo },
      });
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
   * Obtiene el Key de embebido y la URL para incrustar un dashboard de Apache Superset
   * validando el dominio permitido (Allowed Domains).
   * Flujo de Superset:
   * 1. En Superset se habilita "Embed dashboard", se registra el dominio permitido y se genera un `embedKey` (UUID).
   * 2. Con el `embedKey` y el dominio permitido, se construye la URL embebida (`/superset/embedded/<embedKey>/?standalone=true`).
   * Endpoint backend: `GET /ia/dashboards/:id/embed-token?modulo=<MODULO>&allowedDomain=<ORIGIN>`
   */
  async getSupersetEmbedToken(
    dashboardId: string,
    modulo: ModuloAnalitico = 'CONTROL_MUNICIPAL'
  ): Promise<SupersetEmbedTokenResponse> {
    const originActual =
      SUPERSET_ALLOWED_DOMAIN ||
      (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');

    try {
      const resp = await apiClient<SupersetEmbedTokenResponse>(
        `/ia/dashboards/${encodeURIComponent(dashboardId)}/embed-token`,
        {
          params: {
            modulo,
            allowedDomain: originActual,
          },
        }
      );

      const supersetDomain = (resp.supersetDomain || SUPERSET_BASE_URL).replace(/\/$/, '');
      const embedKey = resp.embedKey || '';
      const embedUrlResuelta =
        resp.embedUrl ||
        (supersetDomain && embedKey
          ? `${supersetDomain}/superset/embedded/${encodeURIComponent(embedKey)}/?standalone=true${
              resp.guestToken ? `&guest_token=${encodeURIComponent(resp.guestToken)}` : ''
            }`
          : '');

      return {
        ...resp,
        embedKey,
        supersetDomain,
        allowedDomain: resp.allowedDomain || originActual,
        embedUrl: embedUrlResuelta,
      };
    } catch (err) {
      if (!usarDatosDemo(err)) throw err;
      const supersetDomain = SUPERSET_BASE_URL.replace(/\/$/, '');
      const demo = DASHBOARDS_POR_MODULO_DEMO[modulo] || DASHBOARDS_POR_MODULO_DEMO.CONTROL_MUNICIPAL;
      const todos = [...demo.superset, ...demo.ia];
      const encontrado = todos.find((d) => d.id === dashboardId);
      const embedKey =
        encontrado?.embedKey || encontrado?.embedUuid || `superset-key-${dashboardId}`;

      const embedUrl = supersetDomain
        ? `${supersetDomain}/superset/embedded/${encodeURIComponent(embedKey)}/?standalone=true`
        : '';

      return {
        dashboardId,
        embedKey,
        supersetDomain,
        allowedDomain: originActual,
        embedUrl,
        guestToken: undefined,
      };
    }
  }

  /**
   * Envía un mensaje al asistente de IA eligiendo entre:
   * - `modo`: `'CONSULTA_DATOS'` (obtener información de los dashboards) o `'GENERAR_DASHBOARD'`
   * - `proveedorModelo`: `'LOCAL'` (modelo local MCP/On-Premise) o `'API'` (modelo en la nube vía backend)
   * Endpoint backend: `POST /ia/chat`
   */
  async enviarConsultaChat(solicitud: SolicitudChatIA): Promise<RespuestaChatIA> {
    try {
      const respuesta = await apiClient<RespuestaChatIA>('/ia/chat', {
        method: 'POST',
        body: JSON.stringify(solicitud),
      });
      return { ...respuesta, esEjemplo: false };
    } catch (err) {
      if (!usarDatosDemo(err)) throw err;
      return construirRespuestaDemoChat(solicitud);
    }
  }

  /**
   * Registra o persiste en el backend un dashboard generado por la IA.
   * Endpoint backend: `POST /ia/dashboards`
   */
  async guardarDashboardIA(
    modulo: ModuloAnalitico,
    dashboard: SupersetDashboardInfo
  ): Promise<SupersetDashboardInfo> {
    try {
      return await apiClient<SupersetDashboardInfo>('/ia/dashboards', {
        method: 'POST',
        body: JSON.stringify({ modulo, dashboard }),
      });
    } catch (err) {
      if (!usarDatosDemo(err)) throw err;
      return dashboard;
    }
  }

  /**
   * Elimina un dashboard generado por la IA.
   * Endpoint backend: `DELETE /ia/dashboards/:id`
   */
  async eliminarDashboardIA(modulo: ModuloAnalitico, dashboardId: string): Promise<void> {
    try {
      await apiClient<void>(`/ia/dashboards/${encodeURIComponent(dashboardId)}`, {
        method: 'DELETE',
        params: { modulo },
      });
    } catch (err) {
      if (!usarDatosDemo(err)) throw err;
    }
  }
}

export const iaDashboardsController = new IaDashboardsController();

