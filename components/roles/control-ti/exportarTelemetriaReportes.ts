import {
  ConsentimientoAuditoriaLog,
  OnboardingStats,
  TelemetriaEvento,
  TelemetriaResumen,
  UsoSistema,
} from '@/types/telemetria.types';
import { descargarBlobArchivo } from '@/utils/csv.utils';
import { diaCorto, fechaHoraPeru } from '@/utils/fecha-peru.utils';
import {
  etiquetaCanal,
  etiquetaFuncionalidad,
  etiquetaResultado,
  etiquetaSistema,
  etiquetaTipoEvento,
} from '@/utils/telemetria.utils';

interface LogoCargado {
  dataUrl: string;
  aspectRatio: number;
}

const formato = (n: number) => n.toLocaleString('es-PE');
const compacto = (n: number) => (n >= 10000 ? `${Math.round(n / 1000)} mil` : formato(n));

function topeEje(max: number): number {
  if (max <= 0) return 1;
  const p = Math.pow(10, Math.floor(Math.log10(max)));
  for (const m of [1, 2, 2.5, 5, 10]) if (m * p >= max) return m * p;
  return 10 * p;
}

function porcentajeCompletadas(f: UsoSistema['funcionalidades'][number]): string {
  if (f.iniciadas + f.completadas + f.fallidas === 0) return '—';
  if (f.porcentajeCompletadas !== undefined) return `${f.porcentajeCompletadas.toFixed(1)}%`;
  return f.iniciadas ? `${(Math.round((f.completadas / f.iniciadas) * 1000) / 10).toFixed(1)}%` : '—';
}

async function cargarLogoSanMiguel(): Promise<LogoCargado | null> {
  if (typeof window === 'undefined') return null;

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || 738;
        canvas.height = img.naturalHeight || 267;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(null);
          return;
        }
        ctx.drawImage(img, 0, 0);
        const aspectRatio =
          img.naturalWidth > 0 && img.naturalHeight > 0
            ? img.naturalWidth / img.naturalHeight
            : 738 / 267;
        resolve({ dataUrl: canvas.toDataURL('image/png'), aspectRatio });
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = '/logo-san-miguel-light.png';
  });
}

function escaparCeldaCsv(celda: string | number): string {
  const s = String(celda ?? '');
  return `"${s.replace(/"/g, '""')}"`;
}

function descargarSeccionesCsv(nombreBase: string, filas: Array<Array<string | number>>): void {
  const contenido = filas.map((f) => f.map(escaparCeldaCsv).join(',')).join('\n');
  const blob = new Blob(['\ufeff' + contenido], { type: 'text/csv;charset=utf-8;' });
  const fecha = new Date().toISOString().split('T')[0];
  descargarBlobArchivo(blob, `${nombreBase}_${fecha}.csv`);
}

function descargarSeccionesExcel(nombreBase: string, filas: Array<Array<string | number>>): void {
  const contenido = filas
    .map((f) => f.map((c) => String(c ?? '').replace(/[\t\r\n]+/g, ' ')).join('\t'))
    .join('\n');
  const blob = new Blob(['\ufeff' + contenido], { type: 'application/vnd.ms-excel;charset=utf-8;' });
  const fecha = new Date().toISOString().split('T')[0];
  descargarBlobArchivo(blob, `${nombreBase}_${fecha}.xls`);
}

// ============================================================================
// 1. DASHBOARD DE TELEMETRÍA APP (CSV, EXCEL, PDF CON GRÁFICOS)
// ============================================================================

export interface DatosReporteTelemetria {
  resumen: TelemetriaResumen;
  uso?: UsoSistema;
  eventos: TelemetriaEvento[];
  descripcionFiltros: string;
  periodoCodigo: string;
}

function construirFilasSeccionesTelemetria({
  resumen,
  uso,
  eventos,
  descripcionFiltros,
}: DatosReporteTelemetria): Array<Array<string | number>> {
  const filas: Array<Array<string | number>> = [];
  const fechaGeneracion = new Intl.DateTimeFormat('es-PE', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date());

  filas.push(['MUNICIPALIDAD DISTRITAL DE SAN MIGUEL']);
  filas.push(['REPORTE DE TELEMETRÍA Y USO DEL SISTEMA - CONTROL TI']);
  filas.push(['Filtros aplicados', descripcionFiltros || 'Sin filtros adicionales']);
  filas.push(['Último registro', uso?.actualizadoEn ? `${fechaHoraPeru(uso.actualizadoEn)} (hora de Perú)` : '—']);
  filas.push(['Fecha de generación', fechaGeneracion]);
  filas.push([]);

  // Sección 1: KPIs de Uso del Sistema y Estado General
  filas.push(['1. INDICADORES CLAVE (KPIs)']);
  filas.push(['Indicador', 'Valor', 'Detalle']);
  if (uso) {
    filas.push(['Usuarios únicos (período filtrado)', uso.usuariosUnicos, 'Identificadores seudónimos distintos']);
    filas.push(['Sesiones (período filtrado)', uso.sesiones, 'Uso continuo hasta cierre o 30 min de inactividad']);
    filas.push([
      'Consultas completadas (%)',
      `${uso.porcentajeCompletadas.toFixed(1)}%`,
      `${uso.consultasCompletadas} completadas de ${uso.consultasIniciadas} iniciadas`,
    ]);
    filas.push(['Consultas fallidas', uso.consultasFallidas, 'Operaciones que terminaron con error']);
  }
  filas.push([
    'Onboarding completado (estado general)',
    `${resumen.onboarding.onboardingTasaPorcentaje}%`,
    `${resumen.onboarding.onboardingCompletadoCount} de ${resumen.onboarding.totalUsuariosRegistrados} usuarios registrados`,
  ]);
  filas.push([
    'Aceptación de analítica Ley 29733 (estado general)',
    `${resumen.onboarding.aceptaAnaliticaPorcentaje}%`,
    `${resumen.onboarding.aceptaAnaliticaCount} aceptan / ${resumen.onboarding.rechazaAnaliticaCount} rechazan`,
  ]);
  filas.push(['Eventos últimas 24 horas', resumen.totalEventosUltimas24h, 'Total general en las últimas 24h']);
  filas.push(['Tasa de errores de la app', `${resumen.tasaErroresAppPorcentaje}%`, 'En el período filtrado']);
  filas.push([]);

  // Sección 2: Funcionalidades más usadas
  if (uso) {
    const usoDe = (f: UsoSistema['funcionalidades'][number]) => f.eventos ?? f.iniciadas;
    const funcionalidades = [...uso.funcionalidades].sort((a, b) => usoDe(b) - usoDe(a) || b.iniciadas - a.iniciadas);
    filas.push(['2. FUNCIONALIDADES MÁS USADAS']);
    filas.push(['Funcionalidad', 'Código', 'Eventos', 'Iniciadas', 'Completadas', 'Fallidas', '% Completadas']);
    if (funcionalidades.length === 0) {
      filas.push(['Sin actividad con los filtros seleccionados', '', 0, 0, 0, 0, '—']);
    } else {
      funcionalidades.forEach((f) => {
        filas.push([
          etiquetaFuncionalidad(f.funcionalidad),
          f.funcionalidad,
          f.eventos ?? '—',
          f.iniciadas,
          f.completadas,
          f.fallidas,
          porcentajeCompletadas(f),
        ]);
      });
    }
    filas.push([]);

    // Sección 3: Actividad por día
    filas.push(['3. ACTIVIDAD POR DÍA (HORA DE PERÚ)']);
    filas.push(['Fecha', 'Día', 'Eventos', 'Sesiones', 'Usuarios Únicos']);
    uso.actividadPorDia.forEach((d) => {
      filas.push([d.fecha, diaCorto(d.fecha), d.eventos, d.sesiones, d.usuariosUnicos ?? '—']);
    });
    filas.push([]);

    // Sección 4: Actividad por hora
    filas.push(['4. ACTIVIDAD POR HORA DEL DÍA (HORA DE PERÚ)']);
    filas.push(['Hora', 'Franja Horaria', 'Eventos', 'Sesiones']);
    uso.actividadPorHora.forEach((h) => {
      const hh = String(h.hora).padStart(2, '0');
      filas.push([`${h.hora}h`, `${hh}:00 – ${hh}:59`, h.eventos, h.sesiones]);
    });
    filas.push([]);
  }

  // Sección 5: Distribución de Dispositivos y Versiones
  const disp = resumen.dispositivos;
  const otros = disp.otrosCount ?? 0;
  const totalDisp = disp.androidCount + disp.iosCount + otros;
  const pct = (n: number) => (totalDisp > 0 ? `${Math.round((n / totalDisp) * 100)}%` : '0%');
  filas.push(['5. DISTRIBUCIÓN DE DISPOSITIVOS Y VERSIONES INSTALADAS']);
  filas.push(['Plataforma / Sistema Operativo', 'Dispositivos', 'Porcentaje']);
  filas.push(['Android', disp.androidCount, pct(disp.androidCount)]);
  filas.push(['iOS', disp.iosCount, pct(disp.iosCount)]);
  if (otros > 0) {
    filas.push(['Otros (Web / Desktop)', otros, pct(otros)]);
  }
  filas.push([]);
  filas.push(['Versión de la App', 'Participación (%)']);
  disp.versionesMasUsadas.forEach((v) => {
    filas.push([v.version, `${v.porcentaje}%`]);
  });
  filas.push([]);

  // Sección 6: Pantallas más visitadas
  filas.push(['6. PANTALLAS MÁS VISITADAS DE LA APP VECINAL']);
  filas.push(['Pantalla Móvil', 'Vistas Totales', 'Usuarios Únicos', 'Permanencia Media (seg)']);
  resumen.topPantallas.forEach((p) => {
    filas.push([p.pantalla, p.vistas, p.usuariosUnicos, p.tiempoPromedioSegundos]);
  });
  filas.push([]);

  // Sección 7: Eventos de uso recientes (anónimos)
  filas.push(['7. EVENTOS DE USO RECIENTES (ANÓNIMOS)']);
  filas.push([
    'ID Evento',
    'Fecha / Hora',
    'ID Seudónimo',
    'Sesión ID',
    'Tipo de Evento',
    'Funcionalidad',
    'Pantalla',
    'Componente',
    'Resultado',
    'Código Error',
    'Sistema Operativo',
    'Canal',
    'Versión App',
  ]);
  eventos.forEach((evt) => {
    filas.push([
      evt.id,
      evt.fechaRegistro,
      evt.dispositivoAnonimoId,
      evt.sesionId ?? '—',
      etiquetaTipoEvento(evt.tipoEvento),
      evt.funcionalidad ? etiquetaFuncionalidad(evt.funcionalidad) : '—',
      evt.pantalla ?? '—',
      evt.componenteId ?? '—',
      etiquetaResultado(evt.resultado) || '—',
      evt.codigoError ?? '—',
      etiquetaSistema(evt.sistemaOperativo),
      evt.canal ? etiquetaCanal(evt.canal) : '—',
      evt.appVersion,
    ]);
  });

  return filas;
}

export function exportarTelemetriaCsv(datos: DatosReporteTelemetria): void {
  const filas = construirFilasSeccionesTelemetria(datos);
  descargarSeccionesCsv(`Reporte_Telemetria_App_${datos.periodoCodigo}`, filas);
}

export function exportarTelemetriaExcel(datos: DatosReporteTelemetria): void {
  const filas = construirFilasSeccionesTelemetria(datos);
  descargarSeccionesExcel(`Reporte_Telemetria_App_${datos.periodoCodigo}`, filas);
}

export async function exportarTelemetriaPdf(datos: DatosReporteTelemetria): Promise<void> {
  const [{ jsPDF }, { default: autoTable }, logo] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable'),
    cargarLogoSanMiguel(),
  ]);

  const { resumen, uso, eventos, descripcionFiltros, periodoCodigo } = datos;
  const tituloCompleto = 'Reporte de Telemetría y Uso del Sistema';

  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  doc.setProperties({
    title: tituloCompleto,
    subject: 'Métricas de uso, gráficos de actividad, dispositivos y eventos anónimos',
    creator: 'Portal Municipal de San Miguel',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margenX = 12;
  const anchoUtil = pageWidth - margenX * 2;
  let cursorY = 10;

  const asegurarEspacio = (altoNecesario: number) => {
    if (cursorY + altoNecesario > pageHeight - 15) {
      doc.addPage();
      cursorY = 14;
    }
  };

  // 1. Cabecera institucional con logo
  let textoX = margenX;
  const logoAlto = 11.5;
  if (logo) {
    const logoAncho = logoAlto * logo.aspectRatio;
    doc.addImage(logo.dataUrl, 'PNG', margenX, cursorY, logoAncho, logoAlto);
    textoX = margenX + logoAncho + 5;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(3, 105, 161);
  doc.text('MUNICIPALIDAD DISTRITAL DE SAN MIGUEL · SUBGERENCIA DE TI', textoX, cursorY + 3.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(15, 23, 42);
  doc.text(tituloCompleto, textoX, cursorY + 9);

  const fechaGeneracion = new Intl.DateTimeFormat('es-PE', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date());

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  const metaDerecha = [
    uso?.actualizadoEn ? `Último registro: ${fechaHoraPeru(uso.actualizadoEn)} (Perú)` : null,
    `Generado: ${fechaGeneracion}`,
  ]
    .filter(Boolean)
    .join('   •   ');
  doc.text(metaDerecha, pageWidth - margenX, cursorY + 4, { align: 'right' });
  doc.text(`Filtros: ${descripcionFiltros}`, pageWidth - margenX, cursorY + 9, { align: 'right' });

  cursorY += 14.5;
  doc.setDrawColor(2, 132, 199);
  doc.setLineWidth(0.5);
  doc.line(margenX, cursorY, pageWidth - margenX, cursorY);
  cursorY += 4.5;

  // 2. Tarjetas visuales de KPIs (Uso del sistema)
  const dibujarTarjetasKpi = (
    tarjetas: Array<{
      label: string;
      valor: string;
      sub?: string;
      colorBorde: [number, number, number];
      colorTexto: [number, number, number];
      colorFondo: [number, number, number];
    }>
  ) => {
    const gap = 3.5;
    const cardW = (anchoUtil - gap * (tarjetas.length - 1)) / tarjetas.length;
    const cardH = 18;
    asegurarEspacio(cardH + 4);

    tarjetas.forEach((k, idx) => {
      const x = margenX + idx * (cardW + gap);
      doc.setFillColor(...k.colorFondo);
      doc.setDrawColor(...k.colorBorde);
      doc.setLineWidth(0.25);
      doc.roundedRect(x, cursorY, cardW, cardH, 2, 2, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.2);
      doc.setTextColor(100, 116, 139);
      doc.text(k.label.toUpperCase(), x + 3.5, cursorY + 5);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12.5);
      doc.setTextColor(...k.colorTexto);
      doc.text(k.valor, x + 3.5, cursorY + 11.8);

      if (k.sub) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6.8);
        doc.setTextColor(100, 116, 139);
        doc.text(k.sub, x + 3.5, cursorY + 15.8);
      }
    });

    cursorY += cardH + 5;
  };

  if (uso) {
    dibujarTarjetasKpi([
      {
        label: 'Usuarios únicos',
        valor: formato(uso.usuariosUnicos),
        sub: 'IDs seudónimos en el período',
        colorBorde: [186, 230, 253],
        colorTexto: [2, 132, 199],
        colorFondo: [240, 249, 255],
      },
      {
        label: 'Sesiones',
        valor: formato(uso.sesiones),
        sub: 'Uso continuo del sistema',
        colorBorde: [186, 230, 253],
        colorTexto: [2, 132, 199],
        colorFondo: [240, 249, 255],
      },
      {
        label: 'Consultas completadas',
        valor: `${uso.porcentajeCompletadas.toFixed(1)}%`,
        sub: `${formato(uso.consultasCompletadas)} de ${formato(uso.consultasIniciadas)} iniciadas`,
        colorBorde: [187, 247, 208],
        colorTexto: [22, 163, 74],
        colorFondo: [240, 253, 244],
      },
      {
        label: 'Consultas fallidas',
        valor: formato(uso.consultasFallidas),
        sub: 'Operaciones con error',
        colorBorde: [254, 202, 202],
        colorTexto: [220, 38, 38],
        colorFondo: [254, 242, 242],
      },
    ]);
  }

  // 3. Gráficos visuales de columnas (Actividad por día y Actividad por hora) tal como se ven en la página
  if (uso) {
    const chartBoxH = 54;
    const gap = 4;
    const chartBoxW = (anchoUtil - gap) / 2;
    asegurarEspacio(chartBoxH + 6);

    const dibujarGraficoColumnasPdf = (
      boxX: number,
      boxY: number,
      boxW: number,
      boxH: number,
      titulo: string,
      subtitulo: string,
      datos: Array<{ etiquetaEje: string; valor: number }>
    ) => {
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.25);
      doc.roundedRect(boxX, boxY, boxW, boxH, 2.2, 2.2, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.8);
      doc.setTextColor(15, 23, 42);
      doc.text(titulo, boxX + 4, boxY + 5.8);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);
      doc.text(subtitulo, boxX + boxW - 4, boxY + 5.8, { align: 'right' });

      const plotLeft = boxX + 14;
      const plotRight = boxX + boxW - 4;
      const plotTop = boxY + 11.5;
      const plotBottom = boxY + boxH - 8;
      const plotW = plotRight - plotLeft;
      const plotH = plotBottom - plotTop;

      const max = Math.max(0, ...datos.map((d) => d.valor));
      const tope = topeEje(max);
      const idxMax = datos.findIndex((d) => d.valor === max && max > 0);
      const ticks = [tope, tope / 2, 0];

      // Líneas de grilla y etiquetas del eje Y
      ticks.forEach((t) => {
        const y = plotTop + (1 - t / tope) * plotH;
        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.18);
        doc.line(plotLeft, y, plotRight, y);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6.3);
        doc.setTextColor(100, 116, 139);
        doc.text(compacto(t), plotLeft - 1.5, y + 1, { align: 'right' });
      });

      if (datos.length === 0) return;

      const slotW = plotW / datos.length;
      const barW = Math.min(6.5, Math.max(1.4, slotW * 0.68));

      datos.forEach((d, i) => {
        const cx = plotLeft + (i + 0.5) * slotW;
        const barH = d.valor > 0 ? Math.max(0.6, (d.valor / tope) * plotH) : 0;
        const barX = cx - barW / 2;
        const barY = plotBottom - barH;

        if (barH > 0) {
          doc.setFillColor(2, 132, 199);
          doc.rect(barX, barY, barW, barH, 'F');
        }

        if (i === idxMax && d.valor > 0) {
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(6.2);
          doc.setTextColor(15, 23, 42);
          doc.text(compacto(d.valor), cx, Math.max(plotTop - 0.5, barY - 1), { align: 'center' });
        }

        if (d.etiquetaEje) {
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(6);
          doc.setTextColor(100, 116, 139);
          doc.text(d.etiquetaEje, cx, plotBottom + 4.2, { align: 'center' });
        }
      });
    };

    const dias = uso.actividadPorDia;
    const cadaDia = dias.length <= 10 ? 1 : Math.ceil(dias.length / 8);
    const datosDia = dias.map((d, i) => ({
      etiquetaEje: i % cadaDia === 0 ? diaCorto(d.fecha) : '',
      valor: d.eventos,
    }));

    const datosHora = uso.actividadPorHora.map((h) => ({
      etiquetaEje: h.hora % 3 === 0 ? `${h.hora}h` : '',
      valor: h.eventos,
    }));

    dibujarGraficoColumnasPdf(
      margenX,
      cursorY,
      chartBoxW,
      chartBoxH,
      'Actividad por día',
      'Eventos por día, hora de Perú',
      datosDia
    );

    dibujarGraficoColumnasPdf(
      margenX + chartBoxW + gap,
      cursorY,
      chartBoxW,
      chartBoxH,
      'Actividad por hora',
      'Eventos por hora del día, hora de Perú',
      datosHora
    );

    cursorY += chartBoxH + 5;
  }

  // 4. Tabla de Funcionalidades Más Usadas
  if (uso) {
    asegurarEspacio(25);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(15, 23, 42);
    doc.text('Funcionalidades más usadas (Operaciones iniciadas, completadas y fallidas)', margenX, cursorY);
    cursorY += 2.2;

    const usoDe = (f: UsoSistema['funcionalidades'][number]) => f.eventos ?? f.iniciadas;
    const funcionalidades = [...uso.funcionalidades].sort((a, b) => usoDe(b) - usoDe(a) || b.iniciadas - a.iniciadas);
    const conEventos = funcionalidades.some((f) => f.eventos !== undefined);

    const headFunc = [
      'Funcionalidad',
      ...(conEventos ? ['Eventos'] : []),
      'Iniciadas',
      'Completadas',
      'Fallidas',
      '% Completadas',
    ];
    const bodyFunc =
      funcionalidades.length === 0
        ? [['No hay actividad con estos filtros.', ...(conEventos ? ['—'] : []), '0', '0', '0', '—']]
        : funcionalidades.map((f) => [
            etiquetaFuncionalidad(f.funcionalidad),
            ...(conEventos ? [formato(f.eventos ?? 0)] : []),
            formato(f.iniciadas),
            formato(f.completadas),
            formato(f.fallidas),
            porcentajeCompletadas(f),
          ]);

    autoTable(doc, {
      startY: cursorY,
      margin: { left: margenX, right: margenX, top: 14, bottom: 14 },
      head: [headFunc],
      body: bodyFunc,
      theme: 'grid',
      styles: {
        font: 'helvetica',
        fontSize: 7.8,
        cellPadding: 2,
        textColor: [15, 23, 42],
        lineColor: [203, 213, 225],
        lineWidth: 0.18,
      },
      headStyles: {
        fillColor: [2, 132, 199],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8,
      },
      alternateRowStyles: { fillColor: [248, 250, 252] },
    });

    cursorY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 6;
  }

  // 5. Tarjeta visual de Dispositivos y Versiones + Tabla de Pantallas Más Visitadas
  asegurarEspacio(45);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text('Distribución de Dispositivos, Versiones y Pantallas Más Visitadas', margenX, cursorY);
  cursorY += 2.2;

  const disp = resumen.dispositivos;
  const otros = disp.otrosCount ?? 0;
  const totalDisp = disp.androidCount + disp.iosCount + otros;
  const pctNum = (n: number) => (totalDisp > 0 ? Math.round((n / totalDisp) * 100) : 0);

  const filasDispositivosVersiones: string[][] = [
    ['Sistema Operativo: Android', `${formato(disp.androidCount)} disp.`, `${pctNum(disp.androidCount)}%`],
    ['Sistema Operativo: iOS', `${formato(disp.iosCount)} disp.`, `${pctNum(disp.iosCount)}%`],
    ...(otros > 0 ? [['Sistema Operativo: Otros (Web)', `${formato(otros)} disp.`, `${pctNum(otros)}%`]] : []),
    ...disp.versionesMasUsadas.map((v) => [`Versión App: ${v.version}`, 'Instalada', `${v.porcentaje}%`]),
  ];

  autoTable(doc, {
    startY: cursorY,
    margin: { left: margenX, right: margenX, top: 14, bottom: 14 },
    head: [['Segmento / Versión de App', 'Detalle / Conteo', 'Participación (%)']],
    body: filasDispositivosVersiones,
    theme: 'grid',
    styles: {
      font: 'helvetica',
      fontSize: 7.8,
      cellPadding: 1.9,
      textColor: [15, 23, 42],
      lineColor: [203, 213, 225],
      lineWidth: 0.18,
    },
    headStyles: {
      fillColor: [3, 105, 161],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
    },
    alternateRowStyles: { fillColor: [248, 250, 252] },
  });

  cursorY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 5;

  asegurarEspacio(28);
  autoTable(doc, {
    startY: cursorY,
    margin: { left: margenX, right: margenX, top: 14, bottom: 14 },
    head: [['Pantalla Móvil (Top Tráfico)', 'Vistas Totales', 'Usuarios Únicos', 'Permanencia Media']],
    body: resumen.topPantallas.map((p) => [
      p.pantalla,
      formato(p.vistas),
      formato(p.usuariosUnicos),
      `${p.tiempoPromedioSegundos} seg`,
    ]),
    theme: 'grid',
    styles: {
      font: 'helvetica',
      fontSize: 7.8,
      cellPadding: 1.9,
      textColor: [15, 23, 42],
      lineColor: [203, 213, 225],
      lineWidth: 0.18,
    },
    headStyles: {
      fillColor: [2, 132, 199],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
    },
    alternateRowStyles: { fillColor: [248, 250, 252] },
  });

  cursorY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 6;

  // 6. Estado general de la app (4 tarjetas KPI visuales) + Eventos de uso recientes (anónimos)
  asegurarEspacio(28);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text('Estado general de la app y eventos de uso recientes (anónimos)', margenX, cursorY);
  cursorY += 3;

  dibujarTarjetasKpi([
    {
      label: 'Onboarding Completado',
      valor: `${resumen.onboarding.onboardingTasaPorcentaje}%`,
      sub: `${formato(resumen.onboarding.onboardingCompletadoCount)} completados`,
      colorBorde: [186, 230, 253],
      colorTexto: [2, 132, 199],
      colorFondo: [240, 249, 255],
    },
    {
      label: 'Aceptación de Analítica',
      valor: `${resumen.onboarding.aceptaAnaliticaPorcentaje}%`,
      sub: `${formato(resumen.onboarding.aceptaAnaliticaCount)} aceptan (Ley 29733)`,
      colorBorde: [187, 247, 208],
      colorTexto: [22, 163, 74],
      colorFondo: [240, 253, 244],
    },
    {
      label: 'Eventos en 24h',
      valor: formato(resumen.totalEventosUltimas24h),
      sub: 'Últimas 24 horas',
      colorBorde: [253, 230, 138],
      colorTexto: [180, 83, 9],
      colorFondo: [255, 251, 235],
    },
    {
      label: 'Tasa de Errores App',
      valor: `${resumen.tasaErroresAppPorcentaje}%`,
      sub: 'En el período filtrado',
      colorBorde: [245, 208, 254],
      colorTexto: [134, 25, 143],
      colorFondo: [253, 244, 255],
    },
  ]);

  if (eventos.length > 0) {
    asegurarEspacio(25);
    autoTable(doc, {
      startY: cursorY,
      margin: { left: margenX, right: margenX, top: 14, bottom: 14 },
      head: [
        [
          'Fecha / Hora',
          'ID Seudónimo',
          'Tipo de Evento',
          'Funcionalidad / Pantalla',
          'Resultado',
          'Plataforma / Canal',
          'Versión',
        ],
      ],
      body: eventos.map((evt) => {
        const funcPantalla = [
          evt.funcionalidad ? etiquetaFuncionalidad(evt.funcionalidad) : null,
          evt.pantalla,
          evt.componenteId ? `[${evt.componenteId}]` : null,
        ]
          .filter(Boolean)
          .join(' · ');
        const resultado = [etiquetaResultado(evt.resultado) || '—', evt.codigoError ? `(${evt.codigoError})` : null]
          .filter(Boolean)
          .join(' ');
        const plataforma = [etiquetaSistema(evt.sistemaOperativo), evt.canal ? etiquetaCanal(evt.canal) : null]
          .filter(Boolean)
          .join(' · ');
        return [
          evt.fechaRegistro,
          evt.dispositivoAnonimoId,
          etiquetaTipoEvento(evt.tipoEvento),
          funcPantalla || '—',
          resultado,
          plataforma,
          evt.appVersion,
        ];
      }),
      theme: 'grid',
      styles: {
        font: 'helvetica',
        fontSize: 7.4,
        cellPadding: 1.8,
        textColor: [15, 23, 42],
        lineColor: [203, 213, 225],
        lineWidth: 0.18,
      },
      headStyles: {
        fillColor: [2, 132, 199],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 7.8,
      },
      alternateRowStyles: { fillColor: [248, 250, 252] },
    });
  }

  // Pie de página con numeración en todas las páginas
  const totalPaginas = doc.getNumberOfPages();
  for (let i = 1; i <= totalPaginas; i++) {
    doc.setPage(i);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.2);
    doc.line(margenX, pageHeight - 10, pageWidth - margenX, pageHeight - 10);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(
      `Municipalidad Distrital de San Miguel · ${tituloCompleto}`,
      margenX,
      pageHeight - 5.8
    );
    doc.text(`Página ${i} de ${totalPaginas}`, pageWidth - margenX, pageHeight - 5.8, {
      align: 'right',
    });
  }

  const pdfBlob = doc.output('blob');
  descargarBlobArchivo(pdfBlob, `Reporte_Telemetria_App_${periodoCodigo}.pdf`);
}

// ============================================================================
// 2. PRIVACIDAD Y ONBOARDING (CSV, EXCEL, PDF CON EMBUDO VISUAL Y GOBERNANZA)
// ============================================================================

export interface DatosReportePrivacidad {
  stats: OnboardingStats;
  logsFiltrados: ConsentimientoAuditoriaLog[];
  totalLogs: number;
  descripcionFiltros: string;
}

function construirFilasSeccionesPrivacidad({
  stats,
  logsFiltrados,
  totalLogs,
  descripcionFiltros,
}: DatosReportePrivacidad): Array<Array<string | number>> {
  const filas: Array<Array<string | number>> = [];
  const fechaGeneracion = new Intl.DateTimeFormat('es-PE', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date());

  filas.push(['MUNICIPALIDAD DISTRITAL DE SAN MIGUEL']);
  filas.push(['INFORME DE PRIVACIDAD, ONBOARDING Y AUDITORÍA LEGAL (LEY N° 29733)']);
  filas.push(['Filtros aplicados', descripcionFiltros || 'Todos los registros']);
  filas.push(['Registros exportados', `${logsFiltrados.length} de ${totalLogs}`]);
  filas.push(['Fecha de generación', fechaGeneracion]);
  filas.push([]);

  // Sección 1: KPIs y Gobernanza
  filas.push(['1. INDICADORES DE PRIVACIDAD, ONBOARDING Y GOBERNANZA']);
  filas.push(['Indicador / Parámetro', 'Valor', 'Detalle']);
  filas.push(['Total Usuarios Registrados', stats.totalUsuariosRegistrados, 'Ciudadanos registrados en la App']);
  filas.push([
    'Onboarding Completado',
    `${stats.onboardingTasaPorcentaje}%`,
    `${stats.onboardingCompletadoCount} ciudadanos completaron el onboarding`,
  ]);
  filas.push([
    'Consentimiento Analítica (Ley N° 29733)',
    `${stats.aceptaAnaliticaPorcentaje}%`,
    `${stats.aceptaAnaliticaCount} aceptan / ${stats.rechazaAnaliticaCount} rechazan`,
  ]);
  filas.push([
    'Estado de Telemetría en Vivo (Kill-Switch)',
    stats.telemetriaActiva ? 'ACTIVA' : 'EN PAUSA',
    stats.telemetriaActiva ? 'Recolección activa en producción' : 'Recolección en pausa de emergencia',
  ]);
  filas.push(['Versión de Términos y Privacidad Vigente', stats.versionTerminosVigente, `Última revisión: ${stats.fechaRevisionTerminos}`]);
  filas.push(['Periodo de Retención de Logs', `${stats.mesesRetencionUso} meses`, 'Depuración automática diaria']);
  filas.push([]);

  // Sección 2: Embudo de Conversión del Onboarding
  filas.push(['2. EMBUDO DE CONVERSIÓN DEL ONBOARDING (APP MÓVIL)']);
  filas.push(['Paso', 'Nombre del Paso', 'Descripción', 'Usuarios', 'Retención (%)', 'Abandono (%)']);
  stats.embudoPasos.forEach((step) => {
    filas.push([
      step.paso,
      step.nombre,
      step.descripcion,
      step.usuariosCount,
      `${step.porcentajeRetencion}%`,
      `${step.porcentajeAbandono}%`,
    ]);
  });
  filas.push([]);

  // Sección 3: Trazabilidad de Consentimientos y Auditoría Legal
  filas.push(['3. TRAZABILIDAD DE CONSENTIMIENTOS Y AUDITORÍA LEGAL (LEY N° 29733)']);
  filas.push([
    'ID Registro',
    'Dispositivo Hash (SHA-256)',
    'Acepta Analítica (Ley 29733)',
    'Versión Términos',
    'Fecha y Hora Decisión',
    'Origen',
    'Canal',
  ]);
  logsFiltrados.forEach((log) => {
    filas.push([
      log.id,
      log.dispositivoHash,
      log.aceptaAnalitica ? 'ACEPTADO (SÍ)' : 'RECHAZADO (NO)',
      log.versionTerminos,
      log.fechaDecision,
      log.origen ?? 'ONBOARDING',
      log.canal ? etiquetaCanal(log.canal) : 'App móvil',
    ]);
  });

  return filas;
}

export function exportarPrivacidadCsv(datos: DatosReportePrivacidad): void {
  const filas = construirFilasSeccionesPrivacidad(datos);
  descargarSeccionesCsv('Auditoria_Privacidad_Ley29733', filas);
}

export function exportarPrivacidadExcel(datos: DatosReportePrivacidad): void {
  const filas = construirFilasSeccionesPrivacidad(datos);
  descargarSeccionesExcel('Auditoria_Privacidad_Ley29733', filas);
}

export async function exportarPrivacidadPdf(datos: DatosReportePrivacidad): Promise<void> {
  const [{ jsPDF }, { default: autoTable }, logo] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable'),
    cargarLogoSanMiguel(),
  ]);

  const { stats, logsFiltrados, totalLogs, descripcionFiltros } = datos;
  const tituloCompleto = 'Informe de Privacidad, Onboarding y Auditoría Legal (Ley N° 29733)';

  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  doc.setProperties({
    title: tituloCompleto,
    subject: 'Embudo de conversión de onboarding, gobernanza y trazabilidad de consentimientos',
    creator: 'Portal Municipal de San Miguel',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margenX = 12;
  const anchoUtil = pageWidth - margenX * 2;
  let cursorY = 10;

  const asegurarEspacio = (altoNecesario: number) => {
    if (cursorY + altoNecesario > pageHeight - 15) {
      doc.addPage();
      cursorY = 14;
    }
  };

  // 1. Cabecera institucional con logo
  let textoX = margenX;
  const logoAlto = 11.5;
  if (logo) {
    const logoAncho = logoAlto * logo.aspectRatio;
    doc.addImage(logo.dataUrl, 'PNG', margenX, cursorY, logoAncho, logoAlto);
    textoX = margenX + logoAncho + 5;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(3, 105, 161);
  doc.text('MUNICIPALIDAD DISTRITAL DE SAN MIGUEL · SUBGERENCIA DE TI', textoX, cursorY + 3.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12.5);
  doc.setTextColor(15, 23, 42);
  doc.text(tituloCompleto, textoX, cursorY + 9);

  const fechaGeneracion = new Intl.DateTimeFormat('es-PE', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date());

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(
    `Registros: ${logsFiltrados.length} de ${totalLogs}   •   Generado: ${fechaGeneracion}`,
    pageWidth - margenX,
    cursorY + 4,
    { align: 'right' }
  );
  doc.text(
    `Filtros: ${descripcionFiltros || 'Todos los registros'}`,
    pageWidth - margenX,
    cursorY + 9,
    { align: 'right' }
  );

  cursorY += 14.5;
  doc.setDrawColor(2, 132, 199);
  doc.setLineWidth(0.5);
  doc.line(margenX, cursorY, pageWidth - margenX, cursorY);
  cursorY += 4.5;

  // 2. Tres tarjetas KPI superiores + Tres tarjetas de Gobernanza en una fila de 3 + 3
  const gap = 3.5;
  const cardW = (anchoUtil - gap * 2) / 3;
  const cardH = 18;
  const kpisTop: Array<{
    label: string;
    valor: string;
    sub: string;
    borde: [number, number, number];
    texto: [number, number, number];
    fondo: [number, number, number];
  }> = [
    {
      label: 'Total Registros',
      valor: formato(stats.totalUsuariosRegistrados),
      sub: `Completaron el onboarding: ${stats.onboardingTasaPorcentaje}% (${formato(stats.onboardingCompletadoCount)})`,
      borde: [186, 230, 253],
      texto: [15, 23, 42],
      fondo: [240, 249, 255],
    },
    {
      label: 'Consentimiento Ley 29733',
      valor: `${stats.aceptaAnaliticaPorcentaje}%`,
      sub: `${formato(stats.aceptaAnaliticaCount)} aceptan analítica anónima (${formato(stats.rechazaAnaliticaCount)} rechazan)`,
      borde: [187, 247, 208],
      texto: [22, 163, 74],
      fondo: [240, 253, 244],
    },
    {
      label: 'Telemetría en Vivo (Kill-Switch)',
      valor: stats.telemetriaActiva ? 'ACTIVA' : 'EN PAUSA',
      sub: `Retención: ${stats.mesesRetencionUso} meses · Términos vigentes: ${stats.versionTerminosVigente} (${stats.fechaRevisionTerminos})`,
      borde: stats.telemetriaActiva ? [187, 247, 208] : [253, 230, 138],
      texto: stats.telemetriaActiva ? [22, 163, 74] : [180, 83, 9],
      fondo: stats.telemetriaActiva ? [240, 253, 244] : [255, 251, 235],
    },
  ];

  kpisTop.forEach((k, idx) => {
    const x = margenX + idx * (cardW + gap);
    doc.setFillColor(...k.fondo);
    doc.setDrawColor(...k.borde);
    doc.setLineWidth(0.25);
    doc.roundedRect(x, cursorY, cardW, cardH, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.2);
    doc.setTextColor(100, 116, 139);
    doc.text(k.label.toUpperCase(), x + 3.5, cursorY + 5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(...k.texto);
    doc.text(k.valor, x + 3.5, cursorY + 11.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.7);
    doc.setTextColor(71, 85, 105);
    doc.text(k.sub, x + 3.5, cursorY + 15.8);
  });

  cursorY += cardH + 5;

  // 3. Gráfico visual: Embudo de Conversión del Onboarding (App Móvil) con barras de progreso como en la página
  const pasos = stats.embudoPasos;
  if (pasos.length > 0) {
    const stepRowH = 12.5;
    const funnelBoxH = 11 + pasos.length * stepRowH;
    asegurarEspacio(funnelBoxH + 4);

    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.25);
    doc.roundedRect(margenX, cursorY, anchoUtil, funnelBoxH, 2.2, 2.2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.2);
    doc.setTextColor(15, 23, 42);
    doc.text('Embudo de Conversión del Onboarding (App Móvil)', margenX + 4, cursorY + 6);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.2);
    doc.setTextColor(100, 116, 139);
    doc.text('Paso a paso de adopción ciudadana', pageWidth - margenX - 4, cursorY + 6, { align: 'right' });

    let stepY = cursorY + 9.5;
    pasos.forEach((step) => {
      // Círculo con el número de paso
      doc.setFillColor(2, 132, 199);
      doc.circle(margenX + 6.5, stepY + 3.2, 2.4, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(255, 255, 255);
      doc.text(String(step.paso), margenX + 6.5, stepY + 4.1, { align: 'center' });

      // Nombre y descripción del paso
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(15, 23, 42);
      doc.text(step.nombre, margenX + 11, stepY + 3.2);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.8);
      doc.setTextColor(100, 116, 139);
      doc.text(` · ${step.descripcion}`, margenX + 11 + doc.getTextWidth(step.nombre) + 1, stepY + 3.2);

      // Métricas a la derecha
      const metricasTexto = `${formato(step.usuariosCount)} usuarios (${step.porcentajeRetencion}%)${
        step.porcentajeAbandono > 0 ? `   •   Abandono: ${step.porcentajeAbandono}%` : ''
      }`;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.4);
      doc.setTextColor(3, 105, 161);
      doc.text(metricasTexto, pageWidth - margenX - 4, stepY + 3.2, { align: 'right' });

      // Barra de progreso de fondo y relleno
      const barX = margenX + 11;
      const barY = stepY + 5.5;
      const barW = anchoUtil - 15;
      const barH = 3.2;

      doc.setFillColor(226, 232, 240);
      doc.roundedRect(barX, barY, barW, barH, 1.2, 1.2, 'F');

      const fillW = Math.max(2, (Math.min(100, Math.max(0, step.porcentajeRetencion)) / 100) * barW);
      if (step.porcentajeRetencion > 90) {
        doc.setFillColor(2, 132, 199);
      } else {
        doc.setFillColor(245, 158, 11);
      }
      doc.roundedRect(barX, barY, fillW, barH, 1.2, 1.2, 'F');

      stepY += stepRowH;
    });

    cursorY += funnelBoxH + 5;
  }

  // 4. Tabla de Trazabilidad de Consentimientos y Auditoría Legal (Ley N° 29733)
  asegurarEspacio(25);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text('Trazabilidad de Consentimientos y Auditoría Legal (Ley N° 29733)', margenX, cursorY);
  cursorY += 2.2;

  autoTable(doc, {
    startY: cursorY,
    margin: { left: margenX, right: margenX, top: 14, bottom: 14 },
    head: [
      [
        '#',
        'ID Registro',
        'Hash Dispositivo (SHA-256 Anonimizado)',
        'Analítica Ley 29733',
        'Versión Términos',
        'Fecha y Hora de Decisión',
      ],
    ],
    body: logsFiltrados.map((log, idx) => [
      String(idx + 1),
      log.id,
      log.dispositivoHash,
      log.aceptaAnalitica ? 'Aceptado (SÍ)' : 'Rechazado (NO)',
      log.versionTerminos,
      log.fechaDecision,
    ]),
    theme: 'grid',
    showHead: 'everyPage',
    styles: {
      font: 'helvetica',
      fontSize: 7.6,
      cellPadding: 2,
      textColor: [15, 23, 42],
      lineColor: [203, 213, 225],
      lineWidth: 0.18,
      valign: 'middle',
    },
    headStyles: {
      fillColor: [2, 132, 199],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
    },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: {
      0: { halign: 'center', cellWidth: 10, textColor: [100, 116, 139] },
      2: { font: 'courier', fontSize: 7 },
    },
  });

  // Pie de página con numeración
  const totalPaginas = doc.getNumberOfPages();
  for (let i = 1; i <= totalPaginas; i++) {
    doc.setPage(i);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.2);
    doc.line(margenX, pageHeight - 10, pageWidth - margenX, pageHeight - 10);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(
      `Municipalidad Distrital de San Miguel · ${tituloCompleto}`,
      margenX,
      pageHeight - 5.8
    );
    doc.text(`Página ${i} de ${totalPaginas}`, pageWidth - margenX, pageHeight - 5.8, {
      align: 'right',
    });
  }

  const pdfBlob = doc.output('blob');
  descargarBlobArchivo(pdfBlob, 'Auditoria_Privacidad_Ley29733.pdf');
}
