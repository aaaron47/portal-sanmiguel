import { apiClient, ApiError, usarDatosDemo } from '@/services/api-client.service';
import {
  CATALOGO_REPORTES_OFICIALES,
  ConstanciaItem,
  ConstanciaPdfResponse,
  FiltroConstanciasParams,
  FiltroReporteTributarioParams,
  ListadoConstanciasResponse,
  ReporteTributarioResponse,
} from '@/types/reportes-tributarios.types';

export interface KpisReporte {
  totalReclamosPeriodo: number;
  tiempoPromedioResolucionDias: number;
  tasaResolucionPorcentaje: number;
  totalConstanciasEmitidas: number;
  constanciasAprobadas: number;
  constanciasObservadas: number;
  constanciasPendientes: number;
}

export interface ReportePorArea {
  area: string;
  totalReclamos: number;
  resueltos: number;
  enProceso: number;
  porcentajeCumplimiento: number;
}

const MOCK_KPIS: KpisReporte = {
  totalReclamosPeriodo: 487,
  tiempoPromedioResolucionDias: 2.8,
  tasaResolucionPorcentaje: 91.4,
  totalConstanciasEmitidas: 142,
  constanciasAprobadas: 118,
  constanciasObservadas: 14,
  constanciasPendientes: 10,
};

const MOCK_AREAS: ReportePorArea[] = [
  { area: 'Fiscalización y Control', totalReclamos: 184, resueltos: 168, enProceso: 16, porcentajeCumplimiento: 91.3 },
  { area: 'Obras Públicas', totalReclamos: 112, resueltos: 98, enProceso: 14, porcentajeCumplimiento: 87.5 },
  { area: 'Limpieza Pública', totalReclamos: 96, resueltos: 94, enProceso: 2, porcentajeCumplimiento: 97.9 },
  { area: 'Parques y Jardines', totalReclamos: 58, resueltos: 52, enProceso: 6, porcentajeCumplimiento: 89.6 },
  { area: 'Seguridad Ciudadana', totalReclamos: 37, resueltos: 36, enProceso: 1, porcentajeCumplimiento: 97.2 },
];

export const MOCK_ROWS_BY_REPORT: Record<string, string[][]> = {
  R1: [
    ['C-100234', 'INVERSIONES SAN MIGUEL S.A.C.', 'GENERAL', 'RUC', '20512345678', 'AV. LA MARINA 2100', 'AV. LA MARINA', '2100', '401', '-', 'A', '12', 'SAN MIGUEL', '14500.00', '8200.00', '11600.00', '6560.00', '3200.00', '1800.00', '2880.00', '1620.00', '22660.00', '27700.00', 'HABIDO', 'JURIDICA', 'tributos@sanmiguelsac.pe', '998123456', 'SI'],
    ['C-100455', 'GONZALES PEREZ JUAN CARLOS', 'ORDINARIO', 'DNI', '09876543', 'CALLE LOS PATRIOTAS 340', 'LOS PATRIOTAS', '340', '-', '-', 'B', '04', 'SAN MIGUEL', '4800.00', '3100.00', '3840.00', '2480.00', '1100.00', '850.00', '990.00', '765.00', '8075.00', '9850.00', 'HABIDO', 'NATURAL', 'jgonzales@gmail.com', '987654321', 'NO'],
    ['C-100892', 'CONSTRUCTORA COSTANERA S.R.L.', 'PRICO', 'RUC', '20609876541', 'AV. COSTANERA 1250', 'AV. COSTANERA', '1250', 'OF 12', '-', 'C', '01', 'SAN MIGUEL', '38900.00', '19400.00', '31120.00', '15520.00', '7500.00', '4200.00', '6750.00', '3780.00', '57170.00', '70000.00', 'HABIDO', 'JURIDICA', 'admin@costanerasrl.pe', '945112233', 'SI'],
    ['C-101103', 'MENDOZA RUIZ MARIA ELENA', 'ORDINARIO', 'DNI', '41239876', 'JR. LIBERTAD 512', 'JR. LIBERTAD', '512', '201', '-', 'E', '18', 'SAN MIGUEL', '2100.00', '1400.00', '1680.00', '1120.00', '580.00', '420.00', '522.00', '378.00', '3700.00', '4500.00', 'HABIDO', 'NATURAL', 'maria.mendoza@outlook.com', '971345678', 'SI'],
    ['C-101419', 'CORPORACION GASTRONOMICA DEL PACIFICO', 'PRICO', 'RUC', '20456789123', 'AV. UNIVERSITARIA 1890', 'AV. UNIVERSITARIA', '1890', '-', '-', 'F', '09', 'SAN MIGUEL', '24000.00', '13200.00', '19200.00', '10560.00', '5100.00', '2900.00', '4590.00', '2610.00', '36960.00', '45200.00', 'HABIDO', 'JURIDICA', 'contabilidad@pacificorest.pe', '981223344', 'SI'],
  ],
  R2: [
    ['C-100455', 'GONZALES PEREZ JUAN CARLOS', 'ORDINARIO', 'DNI', '09876543', 'CALLE LOS PATRIOTAS 340', '7900.00'],
    ['C-101902', 'ALVAREZ QUISPE CARMEN ROSA', 'ORDINARIO', 'DNI', '10293847', 'AV. BRIGIDA SILVA 450', '5650.00'],
    ['C-102311', 'DISTRIBUIDORA SAN MIGUEL S.A.C.', 'GENERAL', 'RUC', '20491827364', 'CALLE MANTARO 125', '18400.00'],
    ['C-102874', 'PAREDES SALAZAR ROBERTO', 'ORDINARIO', 'DNI', '08765412', 'PASAJE SAN MARTIN 118', '4120.00'],
  ],
  R3: [
    ['C-100001', 'CONSOLIDADO ANUAL IMPUESTO PREDIAL', 'GENERAL', 'RESUMEN', 'PREDIAL-2026', 'SAN MIGUEL', '18500000.00', '2026', 'IMPUESTO PREDIAL', '78.5%', '82.1%', '21.5%'],
    ['C-100002', 'CONSOLIDADO ANUAL ARBITRIOS LIMPIEZA', 'GENERAL', 'RESUMEN', 'ARB-LIMPIEZA', 'SAN MIGUEL', '12400000.00', '2026', 'LIMPIEZA PUBLICA', '68.2%', '72.4%', '31.8%'],
    ['C-100003', 'CONSOLIDADO ANUAL ARBITRIOS SERENAZGO', 'GENERAL', 'RESUMEN', 'ARB-SERENAZGO', 'SAN MIGUEL', '9800000.00', '2026', 'SEGURIDAD CIUDADANA', '71.0%', '75.2%', '29.0%'],
    ['C-100004', 'CONSOLIDADO ANUAL PARQUES Y JARDINES', 'GENERAL', 'RESUMEN', 'ARB-PARQUES', 'SAN MIGUEL', '6200000.00', '2026', 'PARQUES Y JARDINES', '69.4%', '73.1%', '30.6%'],
  ],
  R4: [
    ['2026', 'OP-2026-00412', 'ORDEN DE PAGO', 'C-100234', '2025', '001', 'LOTE 01', 'INVERSIONES SAN MIGUEL S.A.C.', 'AV. LA MARINA 2100', '20512345678', 'JURIDICA', '22700.00', '5000.00', '17700.00'],
    ['2026', 'RD-2026-00108', 'RESOLUCION DE DETERMINACION', 'C-100892', '2024', '002', 'LOTE 03', 'CONSTRUCTORA COSTANERA S.R.L.', 'AV. COSTANERA 1250', '20609876541', 'JURIDICA', '58300.00', '12000.00', '46300.00'],
    ['2026', 'OP-2026-00891', 'ORDEN DE PAGO', 'C-101419', '2025', '001', 'LOTE 09', 'CORPORACION GASTRONOMICA DEL PACIFICO', 'AV. UNIVERSITARIA 1890', '20456789123', 'JURIDICA', '37200.00', '8000.00', '29200.00'],
  ],
  R5: [
    ['C-100892', 'CONSTRUCTORA COSTANERA S.R.L.', 'PRICO', 'RUC', '20609876541', 'AV. COSTANERA 1250', 'AV. COSTANERA', '1250', 'OF 12', '-', 'C', '01', 'SAN MIGUEL', '142.50', '45000.00', '22000.00', '38900.00', '19400.00', '31120.00', '15520.00', 'HABIDO', 'JURIDICA', 'admin@costanerasrl.pe', '945112233'],
    ['C-101419', 'CORPORACION GASTRONOMICA DEL PACIFICO', 'PRICO', 'RUC', '20456789123', 'AV. UNIVERSITARIA 1890', 'AV. UNIVERSITARIA', '1890', '-', '-', 'F', '09', 'SAN MIGUEL', '88.20', '32000.00', '16500.00', '24000.00', '13200.00', '19200.00', '10560.00', 'HABIDO', 'JURIDICA', 'contabilidad@pacificorest.pe', '981223344'],
    ['C-102041', 'CENTRO COMERCIAL PLAZA SAN MIGUEL S.A.', 'PRICO', 'RUC', '20109988771', 'AV. LA MARINA 2000', 'AV. LA MARINA', '2000', '-', '-', 'M', '01', 'SAN MIGUEL', '410.00', '180000.00', '95000.00', '0.00', '0.00', '0.00', '0.00', 'HABIDO', 'JURIDICA', 'tributario@plazasanmiguel.pe', '999887766'],
  ],
  R6: [
    ['C-102041', 'CENTRO COMERCIAL PLAZA SAN MIGUEL S.A.', 'PRICO', 'RUC', '20109988771', 'AV. LA MARINA 2000', '180000.00', '95000.00', '180000.00', '95000.00'],
    ['C-103112', 'RAMIREZ TORRES GUILLERMO', 'ORDINARIO', 'DNI', '07894561', 'JR. LIBERTAD 820', '3200.00', '2100.00', '3200.00', '2100.00'],
    ['C-103450', 'VEGA SILVA BEATRIZ ELVIRA', 'ORDINARIO', 'DNI', '09456712', 'AV. FEDERICO GALLESE 310', '2800.00', '1950.00', '2800.00', '1950.00'],
    ['C-103890', 'CLINICA SAN MIGUEL S.A.C.', 'PRICO', 'RUC', '20498761234', 'AV. Elmer Faucett 450', '42000.00', '24000.00', '42000.00', '24000.00'],
  ],
  R7: [
    ['IMPUESTO PREDIAL', '2026', 'ANEXO-01', '14200000.00', '11147000.00', '3053000.00', '78.5%'],
    ['IMPUESTO PREDIAL', '2025', 'ANEXO-01', '13800000.00', '12420000.00', '1380000.00', '90.0%'],
    ['ARBITRIOS MUNICIPALES', '2026', 'ANEXO-02', '18900000.00', '13135500.00', '5764500.00', '69.5%'],
    ['ARBITRIOS MUNICIPALES', '2025', 'ANEXO-02', '17500000.00', '14875000.00', '2625000.00', '85.0%'],
  ],
  R8: [
    ['IMPUESTO PREDIAL', '2021', 'ANEXO-01', '840000.00', '5 AÑOS'],
    ['IMPUESTO PREDIAL', '2022', 'ANEXO-01', '980000.00', '4 AÑOS'],
    ['IMPUESTO PREDIAL', '2023', 'ANEXO-01', '1250000.00', '3 AÑOS'],
    ['IMPUESTO PREDIAL', '2024', 'ANEXO-01', '1680000.00', '2 AÑOS'],
    ['IMPUESTO PREDIAL', '2025', 'ANEXO-01', '2100000.00', '1 AÑO'],
  ],
  R9: [
    ['2026-T1', 'IMPUESTO PREDIAL', '28/02/2026', '26/02/2026', '4500000.00', 'OPORTUNO', '8450', '1200', '87.5%'],
    ['2026-T2', 'IMPUESTO PREDIAL', '31/05/2026', '29/05/2026', '4200000.00', 'OPORTUNO', '8100', '1550', '83.9%'],
    ['2026-T3', 'IMPUESTO PREDIAL', '31/08/2026', '30/08/2026', '3950000.00', 'OPORTUNO', '7800', '1850', '80.8%'],
    ['2026-T1', 'ARBITRIOS', '28/02/2026', '15/03/2026', '2800000.00', 'CON ATRASO', '5600', '2900', '65.8%'],
  ],
  R10: [
    ['IMPUESTO PREDIAL', '2026', 'CUOTA 1 (FEBRERO)', '28/02/2026', '4500000.00', '465.00'],
    ['IMPUESTO PREDIAL', '2026', 'CUOTA 2 (MAYO)', '31/05/2026', '4200000.00', '435.00'],
    ['IMPUESTO PREDIAL', '2026', 'CUOTA 3 (AGOSTO)', '31/08/2026', '3950000.00', '410.00'],
    ['ARBITRIOS MUNICIPALES', '2026', 'CUOTAS 1-9 CONSOLIDADAS', '30/09/2026', '14200000.00', '185.00'],
  ],
  R11: [
    ['2026', 'ARBITRIOS', '28/02/2026', '20/04/2026', '51 DIAS', 'INCUMPLIDO REINCIDENTE', '62.0%', '4 CUOTAS', '3 AÑOS CONSECUTIVOS'],
    ['2026', 'IMPUESTO PREDIAL', '31/05/2026', '15/08/2026', '76 DIAS', 'INCUMPLIDO OBSERVADO', '58.5%', '2 CUOTAS', '2 AÑOS CONSECUTIVOS'],
    ['2025', 'ARBITRIOS', '31/08/2025', '30/11/2025', '91 DIAS', 'INCUMPLIDO COACTIVO', '44.0%', '6 CUOTAS', '4 AÑOS CONSECUTIVOS'],
  ],
};

export const MOCK_CONSTANCIAS: ConstanciaItem[] = [
  {
    id: 'c1',
    folio: 'CNA-2026-00382',
    contribuyenteCodigo: 'C-103112',
    contribuyenteNombre: 'RAMIREZ TORRES GUILLERMO',
    documentoTipo: 'DNI',
    documentoNumero: '07894561',
    predioCodigo: 'PRE-019482',
    direccionPredio: 'JR. LIBERTAD 820, DPTO 301, SAN MIGUEL',
    estadoTributario: 'SIN_DEUDA',
    deudaMonto: 0,
    firmadoDigitalmente: true,
    firmanteNombre: 'Abg. Carlos Mendoza Villavicencio',
    firmanteCargo: 'Subgerente de Recaudación y Control Tributario',
    entidadCertificadora: 'RENIEC - Entidad de Certificación del Estado Peruano (EC-EREP)',
    hashCVD: 'c7a9e102-4b89-4a91-99cd-382901aef114',
    fechaEmision: '02/11/2026 10:14:22',
    fechaVencimiento: '02/12/2026',
    qrUrl: 'https://servicios.munisanmiguel.gob.pe/validador?cvd=c7a9e102-4b89-4a91-99cd-382901aef114',
  },
  {
    id: 'c2',
    folio: 'CNA-2026-00383',
    contribuyenteCodigo: 'C-102041',
    contribuyenteNombre: 'CENTRO COMERCIAL PLAZA SAN MIGUEL S.A.',
    documentoTipo: 'RUC',
    documentoNumero: '20109988771',
    predioCodigo: 'PRE-002100',
    direccionPredio: 'AV. LA MARINA 2000, LOTE 01, SAN MIGUEL',
    estadoTributario: 'SIN_DEUDA',
    deudaMonto: 0,
    firmadoDigitalmente: true,
    firmanteNombre: 'Abg. Carlos Mendoza Villavicencio',
    firmanteCargo: 'Subgerente de Recaudación y Control Tributario',
    entidadCertificadora: 'RENIEC - Entidad de Certificación del Estado Peruano (EC-EREP)',
    hashCVD: '8f4b1192-ea31-4101-77cf-554201994b21',
    fechaEmision: '01/11/2026 16:45:00',
    fechaVencimiento: '01/12/2026',
    qrUrl: 'https://servicios.munisanmiguel.gob.pe/validador?cvd=8f4b1192-ea31-4101-77cf-554201994b21',
  },
  {
    id: 'c3',
    folio: 'CNA-2026-00384',
    contribuyenteCodigo: 'C-100455',
    contribuyenteNombre: 'GONZALES PEREZ JUAN CARLOS',
    documentoTipo: 'DNI',
    documentoNumero: '09876543',
    predioCodigo: 'PRE-088192',
    direccionPredio: 'CALLE LOS PATRIOTAS 340, SAN MIGUEL',
    estadoTributario: 'REGISTRA_DEUDA',
    deudaMonto: 7900.00,
    firmadoDigitalmente: false,
    firmanteNombre: 'Subgerencia de Recaudación',
    firmanteCargo: 'Dictamen de Observación Tributaria',
    entidadCertificadora: 'Pendiente de subsanación de pago',
    hashCVD: 'DENEGADO-DEUDA-PENDIENTE',
    fechaEmision: '02/11/2026 11:20:15',
    fechaVencimiento: 'N/A',
    qrUrl: '',
  },
  {
    id: 'c4',
    folio: 'CNA-2026-00385',
    contribuyenteCodigo: 'C-103450',
    contribuyenteNombre: 'VEGA SILVA BEATRIZ ELVIRA',
    documentoTipo: 'DNI',
    documentoNumero: '09456712',
    predioCodigo: 'PRE-044211',
    direccionPredio: 'AV. FEDERICO GALLESE 310, DPTO 402, SAN MIGUEL',
    estadoTributario: 'SIN_DEUDA',
    deudaMonto: 0,
    firmadoDigitalmente: true,
    firmanteNombre: 'Abg. Carlos Mendoza Villavicencio',
    firmanteCargo: 'Subgerente de Recaudación y Control Tributario',
    entidadCertificadora: 'RENIEC - Entidad de Certificación del Estado Peruano (EC-EREP)',
    hashCVD: '33e14a90-8812-4c22-b519-90214811a432',
    fechaEmision: '30/10/2026 09:12:30',
    fechaVencimiento: '30/11/2026',
    qrUrl: 'https://servicios.munisanmiguel.gob.pe/validador?cvd=33e14a90-8812-4c22-b519-90214811a432',
  },
  {
    id: 'c5',
    folio: 'CNA-2026-00386',
    contribuyenteCodigo: 'C-100892',
    contribuyenteNombre: 'CONSTRUCTORA COSTANERA S.R.L.',
    documentoTipo: 'RUC',
    documentoNumero: '20609876541',
    predioCodigo: 'PRE-099230',
    direccionPredio: 'AV. COSTANERA 1250, SAN MIGUEL',
    estadoTributario: 'REGISTRA_DEUDA',
    deudaMonto: 57170.00,
    firmadoDigitalmente: false,
    firmanteNombre: 'Subgerencia de Recaudación',
    firmanteCargo: 'Dictamen de Observación Tributaria',
    entidadCertificadora: 'Pendiente de subsanación de pago',
    hashCVD: 'DENEGADO-DEUDA-PENDIENTE',
    fechaEmision: '29/10/2026 14:05:00',
    fechaVencimiento: 'N/A',
    qrUrl: '',
  },
];

// PDF base64 de demostración para visualización local de constancia firmada
const DEMO_CONSTANCIA_PDF_BASE64 =
  'JVBERi0xLjQKMSAwIG9iaiA8PC9UeXBlIC9DYXRhbG9nIC9QYWdlcyAyIDAgUj4+IGVuZG9iagoyIDAgb2JqIDw8L1R5cGUgL1BhZ2VzIC9LaWRzIFszIDAgUl0gL0NvdW50IDE+PiBlbmRvYmoKMyAwIG9iaiA8PC9UeXBlIC9QYWdlIC9QYXJlbnQgMiAwIFIgL1Jlc291cmNlcyA0IDAgUiAvTWVkaWFCb3ggWzAgMCA1OTUgODQyXSAvQ29udGVudHMgNSAwIFI+PiBlbmRvYmoKNCAwIG9iaiA8PC9Gb250IDw8L0YxIDw8L1R5cGUgL0ZvbnQgL1N1YnR5cGUgL1R5cGUxIC9CYXNlRm9udCAvSGVsdmV0aWNhLUJvbGQ+PiwgL0YyIDw8L1R5cGUgL0ZvbnQgL1N1YnR5cGUgL1R5cGUxIC9CYXNlRm9udCAvSGVsdmV0aWNhPj4+Pj4+IGVuZG9iago1IDAgb2JqIDw8L0xlbmd0aCA2MzM+PiBzdHJlYW0KQlQKL0YxIDE2IFRmCjUwIDc4MCBUZAooTVVOSUNJUEFMSURBRCBESVNUUklUQUwgREUgU0FOIE1JR1VFTCkgVGoKL0YyIDEwIFRmCjAgLTIwIFRkCihHRVJFTkNJQSBERSBBRE1JTklTVFJBQ0lPTiBUUklCVVRBUklBIC0gU1VCR0VSRU5DSUEgREUgUkVDQVVEQUNJT04pIFRqCjAgLTQwIFRkCi9GMSAxNCBUZgooQ09OU1RBTkNJQSBERSBOTyBBREVVRE8gVFJJQlVUQVJJTykgVGoKL0YyIDExIFRmCjAgLTMwIFRkCihQb3IgbWVkaW8gZGVsIHByZXNlbnRlIGRvY3VtZW50bywgbGEgTXVuaWNpcGFsaWRhZCBEaXN0cml0YWwgZGUgU2FuIE1pZ3VlbCkgVGoKMCAtMTggVGQKKENFUlRJRklDQSBxdWUgZWwgY29udHJpYnV5ZW50ZSBOTyBSRUdJU1RSQSBERVVEQSBUUklCVVRBUklBIHBlbmRpZW50ZSkgVGoKMCAtMTggVGQKKGRlIHBhZ28gcG9yIGNvbmNlcHRvIGRlIEltcHVlc3RvIFByZWRpYWwgbmkgQXJiaXRyaW9zIE11bmljaXBhbGVzLikgVGoKMCAtMzUgVGQKKERvY3VtZW50byBvZmljaWFsIGZpcm1hZG8gZGlnaXRhbG1lbnRlIGNvbmZvcm1lIGEgbGEgTGV5IE4gMjcyNjkuKSBUagowIC0yNSBUZAovRjEgMTAgVGYKKEZpcm1hIERpZ2l0YWw6IFBBZEVTIC8gUkVOSUVDIC0gRXN0YWRvIFBlcnVhbm8pIFRqCkVUCmVuZHN0cmVhbQplbmRvYmoKeHJlZgowIDYKMDAwMDAwMDAwMCA2NTUzNSBmIAowMDAwMDAwMDA5IDAwMDAwIG4gCjAwMDAwMDAwNTggMDAwMDAgbiAKMDAwMDAwMDExNSAwMDAwMCBuIAowMDAwMDAwMjE2IDAwMDAwIG4gCjAwMDAwMDAzMzEgMDAwMDAgbiAKdHJhaWxlciA8PC9TaXplIDYgL1Jvb3QgMSAwIFI+PgpzdGFydHhyZWYKMTA2MwolJUVPRg==';

export class ReportesController {
  /** `periodo`: "2026-10" (mes) o "2026-T3" (trimestre). Los datos simulados no cambian por período. */
  async getKpis(periodo: string): Promise<KpisReporte> {
    try {
      return await apiClient<KpisReporte>('/reportes/kpis', { params: { periodo } });
    } catch (err) {
      // Datos simulados solo sin conexión y en modo demo; si no, el error llega a la vista.
      if (!usarDatosDemo(err)) throw err;
      return MOCK_KPIS;
    }
  }

  async getReportesPorArea(periodo: string): Promise<ReportePorArea[]> {
    try {
      return await apiClient<ReportePorArea[]>('/reportes/areas', { params: { periodo } });
    } catch (err) {
      // Datos simulados solo sin conexión y en modo demo; si no, el error llega a la vista.
      if (!usarDatosDemo(err)) throw err;
      return MOCK_AREAS;
    }
  }

  /**
   * Obtiene las filas y metadatos de un Reporte Tributario Oficial (R1 a R11).
   * Endpoint backend: `GET /reportes/tributarios/:codigo`
   */
  async getReporteTributario(
    params: FiltroReporteTributarioParams
  ): Promise<ReporteTributarioResponse> {
    const codigo = params.codigo || 'R1';
    const tributo = params.tributo || 'TODOS';
    const periodo = params.periodo || '2026';
    const busqueda = (params.busqueda || '').trim();
    const pagina = params.pagina && params.pagina > 0 ? params.pagina : 1;
    const tamano = params.tamano && params.tamano > 0 ? params.tamano : 10;

    try {
      return await apiClient<ReporteTributarioResponse>(
        `/reportes/tributarios/${encodeURIComponent(codigo)}`,
        {
          params: {
            tributo,
            periodo,
            busqueda: busqueda || undefined,
            pagina,
            tamano,
            privacidad: params.enmascararPrivacidad,
          },
        }
      );
    } catch (err) {
      const es404 = err instanceof ApiError && err.status === 404;
      if (!usarDatosDemo(err) && !es404) throw err;
      const info =
        CATALOGO_REPORTES_OFICIALES.find((r) => r.codigo === codigo) ||
        CATALOGO_REPORTES_OFICIALES[0];
      const rawRows = MOCK_ROWS_BY_REPORT[info.codigo] || [];
      const query = busqueda.toLowerCase();
      const filtradas = query
        ? rawRows.filter((fila) =>
            fila.some((celda) => celda.toLowerCase().includes(query))
          )
        : rawRows;

      const totalRegistros = filtradas.length;
      const totalPaginas = Math.max(1, Math.ceil(totalRegistros / tamano));
      const paginaAjustada = Math.min(pagina, totalPaginas);
      const inicio = (paginaAjustada - 1) * tamano;
      const filasPaginadas = filtradas.slice(inicio, inicio + tamano);

      return {
        codigo: info.codigo,
        nombre: info.nombre,
        periodo,
        tributo,
        cabeceras: info.cabeceras,
        filas: filasPaginadas,
        totalRegistros,
        paginaActual: paginaAjustada,
        totalPaginas,
      };
    }
  }

  /**
   * Obtiene el listado de Constancias de No Adeudo Tributario.
   * Endpoint backend: `GET /reportes/constancias`
   */
  async getConstancias(
    params: FiltroConstanciasParams = {}
  ): Promise<ListadoConstanciasResponse> {
    const estado = params.estado || 'TODOS';
    const busqueda = (params.busqueda || '').trim();
    const pagina = params.pagina && params.pagina > 0 ? params.pagina : 1;
    const tamano = params.tamano && params.tamano > 0 ? params.tamano : 10;

    try {
      return await apiClient<ListadoConstanciasResponse>('/reportes/constancias', {
        params: {
          estado: estado !== 'TODOS' ? estado : undefined,
          busqueda: busqueda || undefined,
          pagina,
          tamano,
          privacidad: params.enmascararPrivacidad,
        },
      });
    } catch (err) {
      const es404 = err instanceof ApiError && err.status === 404;
      if (!usarDatosDemo(err) && !es404) throw err;
      const q = busqueda.toLowerCase();
      const filtradas = MOCK_CONSTANCIAS.filter((item) => {
        const matchEstado =
          estado === 'TODOS' ||
          (estado === 'FIRMADO' && item.firmadoDigitalmente) ||
          (estado === 'DEUDA' && item.estadoTributario === 'REGISTRA_DEUDA');
        const matchTexto =
          !q ||
          item.folio.toLowerCase().includes(q) ||
          item.contribuyenteNombre.toLowerCase().includes(q) ||
          item.documentoNumero.includes(busqueda) ||
          item.predioCodigo.toLowerCase().includes(q);
        return matchEstado && matchTexto;
      });

      return {
        items: filtradas,
        totalRegistros: filtradas.length,
        paginaActual: 1,
        totalPaginas: Math.max(1, Math.ceil(filtradas.length / tamano)),
      };
    }
  }

  /**
   * Obtiene el documento PDF oficial (URL o Base64 + metadatos de firma PAdES) de una Constancia de No Adeudo.
   * Endpoint backend: `GET /reportes/constancias/:id/pdf`
   */
  async getConstanciaPdf(constanciaId: string): Promise<ConstanciaPdfResponse> {
    try {
      return await apiClient<ConstanciaPdfResponse>(
        `/reportes/constancias/${encodeURIComponent(constanciaId)}/pdf`
      );
    } catch (err) {
      const es404 = err instanceof ApiError && err.status === 404;
      if (!usarDatosDemo(err) && !es404) throw err;
      const detalle =
        MOCK_CONSTANCIAS.find((c) => c.id === constanciaId || c.folio === constanciaId) ||
        MOCK_CONSTANCIAS[0];

      return {
        constanciaId: detalle.id,
        folio: detalle.folio,
        pdfUrl: undefined,
        pdfBase64: detalle.firmadoDigitalmente ? DEMO_CONSTANCIA_PDF_BASE64 : undefined,
        mimeType: 'application/pdf',
        nombreArchivo: `${detalle.folio}.pdf`,
        firmadoDigitalmente: detalle.firmadoDigitalmente,
        hashCVD: detalle.hashCVD,
        fechaGeneracion: detalle.fechaEmision,
        detalle,
      };
    }
  }
}

export const reportesController = new ReportesController();
