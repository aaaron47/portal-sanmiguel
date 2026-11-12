export interface ReporteItemInfo {
  codigo: string;
  nombre: string;
  categoria: 'deuda' | 'buenos_pagadores' | 'recaudacion' | 'comportamiento';
  descripcion: string;
  cabeceras: string[];
}

/** Parámetros de consulta para `GET /reportes/tributarios/:codigo` */
export interface FiltroReporteTributarioParams {
  codigo: string;
  tributo?: string;
  periodo?: string;
  busqueda?: string;
  pagina?: number;
  tamano?: number;
  enmascararPrivacidad?: boolean;
}

/** Respuesta del endpoint `GET /reportes/tributarios/:codigo` */
export interface ReporteTributarioResponse {
  codigo: string;
  nombre: string;
  periodo: string;
  tributo: string;
  cabeceras: string[];
  filas: string[][];
  totalRegistros: number;
  paginaActual: number;
  totalPaginas: number;
}

export type FormatoDescargaTablaBi = 'csv' | 'xlsx';

/** Tabla certificada en Apache Superset (`GET /api/v1/admin/bi/tablas`) */
export interface TablaCertificadaBi {
  id: number;
  nombre: string;
  descripcion: string;
  certificadoPor: string;
}

/** Contenido y metadatos de una tabla descargada desde `GET /api/v1/admin/bi/tablas/{datasetId}/descarga` */
export interface ResultadoDescargaTablaBi {
  datasetId: number;
  nombreArchivo: string;
  tablaIncompleta: boolean;
  tablaFilas: number;
  cabeceras: string[];
  filas: string[][];
}

export type EstadoTrabajoDescargaTodas = 'EN_COLA' | 'EJECUTANDO' | 'COMPLETADO' | 'ERROR';

/** Estado del trabajo asíncrono de descarga masiva ZIP (`POST / GET /api/v1/admin/bi/tablas/descarga-todas`) */
export interface TrabajoDescargaTodasBi {
  id: string;
  estado: EstadoTrabajoDescargaTodas;
  total: number;
  hechas: number;
  avisos: string[];
  error: string | null;
  nombreArchivo: string | null;
}

/** Expediente de Constancia de No Adeudo Tributario */
export interface ConstanciaItem {
  id: string;
  folio: string;
  contribuyenteCodigo: string;
  contribuyenteNombre: string;
  documentoTipo: 'DNI' | 'RUC';
  documentoNumero: string;
  predioCodigo: string;
  direccionPredio: string;
  estadoTributario: 'SIN_DEUDA' | 'REGISTRA_DEUDA';
  deudaMonto: number;
  firmadoDigitalmente: boolean;
  firmanteNombre: string;
  firmanteCargo: string;
  entidadCertificadora: string;
  hashCVD: string;
  fechaEmision: string;
  fechaVencimiento: string;
  qrUrl: string;
}

/** Parámetros de consulta para `GET /reportes/constancias` */
export interface FiltroConstanciasParams {
  estado?: string;
  busqueda?: string;
  pagina?: number;
  tamano?: number;
  enmascararPrivacidad?: boolean;
}

/** Respuesta del endpoint `GET /reportes/constancias` */
export interface ListadoConstanciasResponse {
  items: ConstanciaItem[];
  totalRegistros: number;
  paginaActual: number;
  totalPaginas: number;
}

/** Respuesta del endpoint `GET /reportes/constancias/:id/pdf` para visualizar/descargar lo que devuelve el PDF */
export interface ConstanciaPdfResponse {
  constanciaId: string;
  folio: string;
  /** URL firmada o endpoint directo del PDF devuelto por el backend */
  pdfUrl?: string;
  /** Contenido del PDF en Base64 (opcional si el backend devuelve bytes codificados en JSON) */
  pdfBase64?: string;
  mimeType: 'application/pdf';
  nombreArchivo: string;
  firmadoDigitalmente: boolean;
  hashCVD: string;
  fechaGeneracion: string;
  detalle: ConstanciaItem;
}

export const CATALOGO_REPORTES_OFICIALES: ReporteItemInfo[] = [
  {
    codigo: 'R1',
    nombre: 'Reporte de Morosos',
    categoria: 'deuda',
    descripcion: 'Identificación completa del contribuyente, domicilio y deudas con/sin beneficio (1900-2025 y 2026) en Predial y Arbitrios.',
    cabeceras: [
      'CODIGO CONTRIBUYENTE',
      'RAZON SOCIAL DE CONTRIBUYENTE',
      'REGIMEN',
      'DOCUMENTO TIPO',
      'DOCUMENTO NUMERO',
      'DOMICILIO FISCAL',
      'VIA',
      'N°',
      'DPTO',
      'INTERIOR',
      'MZ',
      'LOTE',
      'DISTRITO',
      'DEUDA SIN BENEFICIO (1900-2025) PREDIAL',
      'DEUDA SIN BENEFICIO (1900-2025) ARBITRIOS',
      'DEUDA CON BENEFICIO (1900-2025) PREDIAL',
      'DEUDA CON BENEFICIO (1900-2025) ARBITRIOS',
      'DEUDA SIN BENEFICIO (2026) PREDIAL',
      'DEUDA SIN BENEFICIO (2026) ARBITRIOS',
      'DEUDA CON BENEFICIO (2026) PREDIAL',
      'DEUDA CON BENEFICIO (2026) ARBITRIOS',
      'TOTAL CON BENEFICIO',
      'TOTAL SIN BENEFICIO',
      'CONDICION',
      'TIPO PERSONA',
      'EMAIL',
      'TELEFONOS',
      'PAGOS EN LINEA USUARIO',
    ],
  },
  {
    codigo: 'R2',
    nombre: 'Contribuyentes sin pagos (2022-2025)',
    categoria: 'deuda',
    descripcion: 'Contribuyentes que registran cero pagos en el cuatrienio 2022 a 2025.',
    cabeceras: [
      'CODIGO CONTRIBUYENTE',
      'RAZON SOCIAL DE CONTRIBUYENTE',
      'REGIMEN',
      'DOCUMENTO TIPO',
      'DNI / RUC',
      'DOMICILIO FISCAL',
      'DEUDA AÑO 2022-2025',
    ],
  },
  {
    codigo: 'R3',
    nombre: '% de Recaudación y Efectividad',
    categoria: 'recaudacion',
    descripcion: 'Ratios porcentuales de recaudación, morosidad y efectividad de cobranza por concepto y año.',
    cabeceras: [
      'CODIGO CONTRIBUYENTE',
      'RAZON SOCIAL DE CONTRIBUYENTE',
      'REGIMEN',
      'DOCUMENTO TIPO',
      'DNI / RUC',
      'DOMICILIO FISCAL',
      'EMISION',
      'AÑO',
      'CONCEPTO',
      '% RECAUDACION',
      '% EFECTIVIDAD',
      '% MOROSIDAD',
    ],
  },
  {
    codigo: 'R4',
    nombre: 'Emisión de Valores Tributarios',
    categoria: 'recaudacion',
    descripcion: 'Seguimiento a títulos ejecutivos (Órdenes de Pago, Resoluciones de Determinación) y montos pendientes.',
    cabeceras: [
      'AÑO VALOR',
      'Nº VALOR',
      'TIPO VALOR',
      'CODIGO',
      'AÑO DEUDA',
      'CORRELATIVO',
      'LOTE',
      'CONTRIBUYENTE',
      'DOMICILIO FISCAL',
      'DNI',
      'TIPO PERSONA',
      'DEUDA_TOTAL',
      'MONTO PAGADO',
      'MONTO PENDIENTE',
    ],
  },
  {
    codigo: 'R5',
    nombre: 'Principales Contribuyentes (PRICOS)',
    categoria: 'deuda',
    descripcion: 'Contribuyentes con base imponible de Impuesto Predial mayor o igual a 10 UIT.',
    cabeceras: [
      'CODIGO CONTRIBUYENTE',
      'RAZON SOCIAL DE CONTRIBUYENTE',
      'REGIMEN',
      'DOCUMENTO TIPO',
      'DNI / RUC',
      'DOMICILIO FISCAL',
      'VIA',
      'N°',
      'DPTO',
      'INTERIOR',
      'MZ',
      'LOTE',
      'DISTRITO',
      'BASE IMPONIBLE (UIT)',
      'EMISIÓN PREDIAL',
      'EMISIÓN ARBITRIOS',
      'DEUDA AÑOS ANTERIORES PREDIAL',
      'DEUDA AÑOS ANTERIORES ARBITRIOS',
      'DEUDA 2026 CON DSCTO PREDIAL',
      'DEUDA 2026 CON DSCTO ARBITRIOS',
      'CONDICION',
      'TIPO PERSONA',
      'EMAIL',
      'TELEFONOS',
    ],
  },
  {
    codigo: 'R6',
    nombre: 'Buenos Pagadores (Puntuales)',
    categoria: 'buenos_pagadores',
    descripcion: 'Contribuyentes puntuales: comparación de montos emitidos vs cancelados en Predial y Arbitrios.',
    cabeceras: [
      'CODIGO CONTRIBUYENTE',
      'RAZON SOCIAL DE CONTRIBUYENTE',
      'REGIMEN',
      'DOCUMENTO TIPO',
      'DNI / RUC',
      'DOMICILIO FISCAL',
      'MONTO EMITIDO PREDIAL',
      'MONTO EMITIDO ARBITRIOS',
      'MONTO PAGADO PREDIAL',
      'MONTO PAGADO ARBITRIOS',
    ],
  },
  {
    codigo: 'R7',
    nombre: 'Nivel Histórico de Cumplimiento',
    categoria: 'comportamiento',
    descripcion: 'Evolución del porcentaje de cumplimiento anual por predio (anexo): cancelado vs saldo pendiente.',
    cabeceras: [
      'CONCEPTO',
      'AÑO',
      'ANEXO',
      'MONTO EMITIDO',
      'MONTO CANCELADO',
      'SALDO PENDIENTE',
      '% CUMPLIMIENTO',
    ],
  },
  {
    codigo: 'R8',
    nombre: 'Antigüedad de la Deuda',
    categoria: 'comportamiento',
    descripcion: 'Estratos de antigüedad de la deuda tributaria y años transcurridos desde el origen.',
    cabeceras: [
      'CONCEPTO',
      'AÑO',
      'ANEXO',
      'DEUDA',
      'AÑOS DE ANTIGÜEDAD',
    ],
  },
  {
    codigo: 'R9',
    nombre: 'Comportamiento de Pago',
    categoria: 'comportamiento',
    descripcion: 'Evaluación de puntualidad: pagos oportunos vs pagos con atraso por periodo y fecha de vencimiento.',
    cabeceras: [
      'PERIODO',
      'TRIBUTO',
      'FECHA DE VENCIMIENTO',
      'FECHA DE PAGO',
      'MONTO PAGADO',
      'ESTADO DE CUMPLIMIENTO',
      'PAGOS OPORTUNOS',
      'PAGOS CON ATRASO',
      '% CUMPLIMIENTO',
    ],
  },
  {
    codigo: 'R10',
    nombre: 'Monto Promedio Recaudado',
    categoria: 'comportamiento',
    descripcion: 'Cálculo de montos totales recaudados y promedio por cuota mensual.',
    cabeceras: [
      'CONCEPTO',
      'AÑO DE PAGO',
      'CUOTAS',
      'FECHA DE PAGO',
      'MONTO RECAUDADO',
      'MONTO PROMEDIO',
    ],
  },
  {
    codigo: 'R11',
    nombre: 'Reincidencia en Incumplimiento',
    categoria: 'comportamiento',
    descripcion: 'Registro de días de atraso, historial de cuotas impagas y conteo de reincidencias.',
    cabeceras: [
      'PERIODO',
      'TRIBUTO',
      'FECHA DE VENCIMIENTO',
      'FECHA DE PAGO',
      'DIAS DE ATRASO',
      'ESTADO DE CUMPLIMIENTO',
      '% CUMPLIMIENTO',
      'INCUMPLIMIENTOS',
      'REINCIDENCIAS',
    ],
  },
];
