import { TablaCertificadaBi } from '@/types/reportes-tributarios.types';
import { descargarBlobArchivo } from '@/utils/csv.utils';

interface OpcionesExportarReportePdf {
  tabla: TablaCertificadaBi;
  cabeceras: string[];
  filas: string[][];
  busquedaTexto?: string;
  enmascararPrivacidad?: boolean;
  tablaIncompleta?: boolean;
  enmascararValor?: (valor: string, colIdx: number) => string;
  subtituloDocumento?: string;
}

/**
 * Convierte nombres técnicos de vistas/tablas (p. ej. `rpt_antiguedad_deuda` o `V_REP_R01_MOROSOS`)
 * en un título legible con formato de título.
 */
export function formatearNombreReporte(nombreRaw: string): string {
  const limpio = nombreRaw.trim();
  if (!limpio) return 'Reporte Tributario';

  const sinPrefijo = limpio.replace(/^(?:v_rep_(?:r\d+_)?|rpt_|rep_)/i, '');
  const base = sinPrefijo || limpio;

  if (!base.includes('_') && /[a-záéíóúñ]/i.test(base) && base !== base.toUpperCase()) {
    return base;
  }

  return base
    .replace(/_+/g, ' ')
    .trim()
    .split(/\s+/)
    .map((palabra) => {
      if (!palabra) return '';
      return palabra.charAt(0).toUpperCase() + palabra.slice(1).toLowerCase();
    })
    .join(' ');
}

interface LogoCargado {
  dataUrl: string;
  aspectRatio: number;
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

/**
 * Genera y descarga un archivo PDF real del reporte tributario certificado,
 * con membrete de la Municipalidad de San Miguel, nombre legible y paginación.
 */
export async function exportarReporteTributarioPdf({
  tabla,
  cabeceras,
  filas,
  busquedaTexto = '',
  enmascararPrivacidad = false,
  tablaIncompleta = false,
  enmascararValor = (valor) => valor,
  subtituloDocumento = 'Reporte Tributario Oficial',
}: OpcionesExportarReportePdf): Promise<void> {
  const [{ jsPDF }, { default: autoTable }, logo] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable'),
    cargarLogoSanMiguel(),
  ]);

  const tituloBase = formatearNombreReporte(tabla.nombre);
  const tituloCompleto = subtituloDocumento
    ? `${tituloBase} - ${subtituloDocumento}`
    : tituloBase;

  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  doc.setProperties({
    title: tituloCompleto,
    subject: tabla.descripcion || 'Reporte Tributario Oficial',
    creator: 'Portal Municipal de San Miguel',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margenX = 12;
  let cursorY = 11;

  // Cabecera institucional con logo de San Miguel
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
  doc.text('MUNICIPALIDAD DISTRITAL DE SAN MIGUEL', textoX, cursorY + 3.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(15, 23, 42);
  const lineasTitulo = doc.splitTextToSize(tituloCompleto, pageWidth - margenX - textoX);
  doc.text(lineasTitulo, textoX, cursorY + 9);

  let headerBottomY = Math.max(cursorY + logoAlto, cursorY + 9 + (lineasTitulo.length - 1) * 5.2);

  if (tabla.descripcion && tabla.descripcion.trim().toLowerCase() !== tituloBase.toLowerCase()) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(71, 85, 105);
    const lineasDesc = doc.splitTextToSize(tabla.descripcion.trim(), pageWidth - margenX - textoX);
    doc.text(lineasDesc, textoX, headerBottomY + 4.2);
    headerBottomY += 4.2 + (lineasDesc.length - 1) * 3.8;
  }

  cursorY = headerBottomY + 4.5;

  // Línea separadora institucional
  doc.setDrawColor(2, 132, 199);
  doc.setLineWidth(0.5);
  doc.line(margenX, cursorY, pageWidth - margenX, cursorY);
  cursorY += 4.5;

  // Metadatos del reporte
  const fechaGeneracion = new Intl.DateTimeFormat('es-PE', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date());
  const filtroLimpio = busquedaTexto.trim();

  const partesMeta = [
    `Registros: ${filas.length}`,
    tabla.certificadoPor ? `Certificado por: ${tabla.certificadoPor}` : null,
    filtroLimpio ? `Filtro: "${filtroLimpio}"` : null,
    enmascararPrivacidad ? 'Privacidad: Activa (Ley 29733)' : null,
    `Generado: ${fechaGeneracion}`,
  ].filter(Boolean);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);
  const lineasMeta = doc.splitTextToSize(partesMeta.join('   •   '), pageWidth - margenX * 2);
  doc.text(lineasMeta, margenX, cursorY);
  cursorY += lineasMeta.length * 3.8 + 1.5;

  if (tablaIncompleta) {
    doc.setFillColor(255, 251, 235);
    doc.setDrawColor(245, 158, 11);
    doc.setLineWidth(0.25);
    doc.roundedRect(margenX, cursorY, pageWidth - margenX * 2, 6.5, 1, 1, 'FD');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(146, 64, 14);
    doc.text(
      'Aviso: El reporte superó el límite de 100,000 filas del servidor; el contenido exportado puede estar incompleto.',
      margenX + 2.5,
      cursorY + 4.3
    );
    cursorY += 8.5;
  }

  // Tabla principal
  const columnas = ['#', ...cabeceras];
  const cuerpo = filas.map((fila, idx) => [
    String(idx + 1),
    ...fila.map((celda, cIdx) => enmascararValor(celda || '—', cIdx)),
  ]);

  autoTable(doc, {
    startY: cursorY,
    margin: { left: margenX, right: margenX, top: 12, bottom: 14 },
    head: [columnas],
    body: cuerpo,
    theme: 'grid',
    showHead: 'everyPage',
    styles: {
      font: 'helvetica',
      fontSize: 7.8,
      cellPadding: 2.1,
      textColor: [15, 23, 42],
      lineColor: [203, 213, 225],
      lineWidth: 0.18,
      overflow: 'linebreak',
      valign: 'middle',
    },
    headStyles: {
      fillColor: [2, 132, 199],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: {
        halign: 'center',
        cellWidth: 10,
        textColor: [100, 116, 139],
      },
    },
  });

  // Pie de página con numeración en todas las páginas
  const totalPaginas = doc.getNumberOfPages();
  for (let i = 1; i <= totalPaginas; i++) {
    doc.setPage(i);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.2);
    doc.line(margenX, pageHeight - 10.5, pageWidth - margenX, pageHeight - 10.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(
      `Municipalidad Distrital de San Miguel · ${tituloCompleto}`,
      margenX,
      pageHeight - 6.2
    );
    doc.text(`Página ${i} de ${totalPaginas}`, pageWidth - margenX, pageHeight - 6.2, {
      align: 'right',
    });
  }

  const slugNombre = tituloBase
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
  const slugSubtitulo = (subtituloDocumento || 'Reporte_Oficial')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
  const nombreArchivo = `${slugNombre || 'Reporte'}_${slugSubtitulo || 'Reporte_Oficial'}.pdf`;

  const pdfBlob = doc.output('blob');
  descargarBlobArchivo(pdfBlob, nombreArchivo);
}
