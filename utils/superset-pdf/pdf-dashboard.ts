/**
 * Arma el PDF con el formato del portal a partir de la imagen completa del dashboard:
 * A4 horizontal, cabecera con el logo y los datos del reporte, pie con la numeración de páginas,
 * y cortes de página en los espacios vacíos entre gráficos (no por la mitad de un gráfico).
 */

export interface DatosReportePdf {
  titulo: string;
  descripcion?: string;
  /** Ej. "Control Municipal" */
  modulo?: string;
  /** Ej. "Lic. Mariana Rios (Control Municipal)" */
  generadoPor?: string;
  /** Valores de los filtros que el usuario dejó aplicados en el dashboard */
  filtros?: string[];
  /** Fecha y hora en Perú, ej. "24/11/2026, 15:42" */
  fechaHora: string;
}

// Medidas en milímetros (A4 horizontal: 297 x 210)
const PAGINA = { ancho: 297, alto: 210 };
const MARGEN = 12;
const ANCHO_UTIL = PAGINA.ancho - MARGEN * 2;
const TOPE_CONTENIDO_SIGUIENTES = 23;
const FONDO_CONTENIDO = 194;
const LINEA_PIE = 199;

// Colores (los del logo y los del tema claro del portal)
const CELESTE_MARCA: [number, number, number] = [61, 184, 232];
const TEXTO: [number, number, number] = [15, 23, 42];
const TEXTO_SUAVE: [number, number, number] = [71, 85, 105];
const TEXTO_TENUE: [number, number, number] = [100, 116, 139];
const BORDE: [number, number, number] = [226, 232, 240];

const INSTITUCION = 'Municipalidad Distrital de San Miguel';
const RUTA_LOGO = '/logo-san-miguel-light.png';
const PROPORCION_LOGO = 738 / 267;

type JsPdf = import('jspdf').jsPDF;

async function cargarLogo(): Promise<string | null> {
  try {
    const res = await fetch(RUTA_LOGO);
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise<string>((resolve, reject) => {
      const lector = new FileReader();
      lector.onload = () => resolve(String(lector.result));
      lector.onerror = () => reject(lector.error);
      lector.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

/** Escribe un texto con un máximo de líneas; si no entra, corta la última con "...". Devuelve el alto usado (mm). */
function textoAcotado(
  doc: JsPdf,
  texto: string,
  x: number,
  y: number,
  ancho: number,
  maxLineas: number,
  interlineado: number,
  alinear: 'left' | 'right' = 'left'
): number {
  let lineas = doc.splitTextToSize(texto, ancho) as string[];
  if (lineas.length > maxLineas) {
    lineas = lineas.slice(0, maxLineas);
    let ultima = lineas[maxLineas - 1];
    while (ultima.length > 1 && doc.getTextWidth(`${ultima}...`) > ancho) ultima = ultima.slice(0, -1);
    lineas[maxLineas - 1] = `${ultima.trimEnd()}...`;
  }
  lineas.forEach((linea, i) => doc.text(linea, x, y + i * interlineado, { align: alinear }));
  return lineas.length * interlineado;
}

/** Cabecera completa de la primera página. Devuelve dónde empieza el contenido (mm). */
function cabeceraPrimeraPagina(doc: JsPdf, datos: DatosReportePdf, logo: string | null): number {
  const altoLogo = 13;
  if (logo) doc.addImage(logo, 'PNG', MARGEN, 9, altoLogo * PROPORCION_LOGO, altoLogo);

  const derecha = PAGINA.ancho - MARGEN;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(...CELESTE_MARCA);
  // jsPDF alinea a la derecha sin contar el espaciado entre letras y el texto se corría hacia el margen: se calcula
  // el ancho real (letras + espacios entre ellas) y se escribe desde la izquierda.
  const etiqueta = 'REPORTE DE DASHBOARD';
  const espaciado = 0.4;
  const anchoEtiqueta = doc.getTextWidth(etiqueta) + espaciado * (etiqueta.length - 1);
  doc.setCharSpace(espaciado);
  doc.text(etiqueta, derecha - anchoEtiqueta, 12.5);
  doc.setCharSpace(0);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...TEXTO_SUAVE);
  doc.text(INSTITUCION, derecha, 17, { align: 'right' });
  doc.text(`${datos.fechaHora} (hora de Perú)`, derecha, 21, { align: 'right' });

  let y = 33;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(17);
  doc.setTextColor(...TEXTO);
  y += textoAcotado(doc, datos.titulo, MARGEN, y, ANCHO_UTIL, 2, 7);

  if (datos.descripcion?.trim()) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(...TEXTO_SUAVE);
    y += textoAcotado(doc, datos.descripcion.trim(), MARGEN, y, ANCHO_UTIL, 2, 4.4);
  }

  // Datos del reporte: etiqueta en negrita y valor
  y += 1.5;
  const datosFila: [string, string][] = [];
  if (datos.modulo) datosFila.push(['Módulo:', datos.modulo]);
  if (datos.generadoPor) datosFila.push(['Generado por:', datos.generadoPor]);
  datosFila.push(['Fuente:', 'Apache Superset']);
  doc.setFontSize(8.5);
  let x = MARGEN;
  datosFila.forEach(([etiqueta, valor]) => {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...TEXTO_SUAVE);
    doc.text(etiqueta, x, y);
    x += doc.getTextWidth(etiqueta) + 1.5;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...TEXTO_TENUE);
    doc.text(valor, x, y);
    x += doc.getTextWidth(valor) + 8;
  });
  y += 4.6;

  const filtros = (datos.filtros || []).filter(Boolean);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...TEXTO_SUAVE);
  doc.text('Filtros aplicados:', MARGEN, y);
  const xFiltros = MARGEN + doc.getTextWidth('Filtros aplicados:') + 1.5;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...TEXTO_TENUE);
  y += textoAcotado(
    doc,
    filtros.length ? filtros.join('  |  ') : 'ninguno (se muestran todos los datos del dashboard)',
    xFiltros,
    y,
    ANCHO_UTIL - (xFiltros - MARGEN),
    2,
    4
  );

  return y + 2;
}

function cabeceraPaginasSiguientes(doc: JsPdf, datos: DatosReportePdf, logo: string | null) {
  const altoLogo = 8;
  if (logo) doc.addImage(logo, 'PNG', MARGEN, 7.5, altoLogo * PROPORCION_LOGO, altoLogo);
  const derecha = PAGINA.ancho - MARGEN;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...TEXTO);
  textoAcotado(doc, datos.titulo, derecha, 11, 170, 1, 4, 'right');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...TEXTO_TENUE);
  doc.text(`Reporte de dashboard | ${datos.fechaHora} (hora de Perú)`, derecha, 15, { align: 'right' });
  doc.setDrawColor(...BORDE);
  doc.setLineWidth(0.3);
  doc.line(MARGEN, 18.5, derecha, 18.5);
}

function pieDePagina(doc: JsPdf, pagina: number, total: number) {
  const derecha = PAGINA.ancho - MARGEN;
  doc.setDrawColor(...BORDE);
  doc.setLineWidth(0.3);
  doc.line(MARGEN, LINEA_PIE, derecha, LINEA_PIE);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...TEXTO_TENUE);
  doc.text(
    `${INSTITUCION}  |  Portal de reclamos  |  Documento generado desde el portal, de uso interno`,
    MARGEN,
    LINEA_PIE + 4.5
  );
  doc.setFont('helvetica', 'bold');
  doc.text(`Página ${pagina} de ${total}`, derecha, LINEA_PIE + 4.5, { align: 'right' });
}

type Rgb = [number, number, number];

/**
 * Color de fondo del dashboard (el gris entre las tarjetas): el más repetido en el borde derecho de la imagen,
 * que en Superset es margen del tablero.
 */
function colorFondo(ctx: CanvasRenderingContext2D, ancho: number, alto: number): Rgb {
  const columna = ctx.getImageData(Math.max(0, ancho - 3), 0, 1, alto).data;
  const conteo = new Map<number, number>();
  for (let y = 0; y < alto; y += 3) {
    const p = y * 4;
    const clave = ((columna[p] >> 2) << 12) | ((columna[p + 1] >> 2) << 6) | (columna[p + 2] >> 2);
    conteo.set(clave, (conteo.get(clave) || 0) + 1);
  }
  let mejor = 0;
  let maximo = -1;
  conteo.forEach((n, clave) => {
    if (n > maximo) {
      maximo = n;
      mejor = clave;
    }
  });
  return [((mejor >> 12) & 63) << 2, ((mejor >> 6) & 63) << 2, (mejor & 63) << 2];
}

/**
 * Pinta de blanco el fondo gris del tablero (entre y alrededor de los gráficos): rellena desde los bordes de la
 * imagen todos los píxeles del color de fondo conectados entre sí. El interior de las tarjetas queda intacto aunque
 * tenga el mismo gris, porque el borde blanco de la tarjeta corta el relleno.
 * `datos` es RGBA (ImageData.data) de `ancho` x `alto`; se modifica en el lugar.
 */
export function blanquearFondo(datos: Uint8ClampedArray, ancho: number, alto: number, fondo: Rgb, tolerancia = 12) {
  const total = ancho * alto;
  if (!total) return;
  const visto = new Uint8Array(total);
  const pila = new Int32Array(total);
  let tope = 0;
  const esFondo = (i: number) => {
    const p = i * 4;
    return (
      Math.abs(datos[p] - fondo[0]) + Math.abs(datos[p + 1] - fondo[1]) + Math.abs(datos[p + 2] - fondo[2]) <=
      tolerancia
    );
  };
  const agregar = (i: number) => {
    if (!visto[i] && esFondo(i)) {
      visto[i] = 1;
      pila[tope++] = i;
    }
  };
  for (let x = 0; x < ancho; x++) {
    agregar(x);
    agregar((alto - 1) * ancho + x);
  }
  for (let y = 0; y < alto; y++) {
    agregar(y * ancho);
    agregar(y * ancho + ancho - 1);
  }
  while (tope > 0) {
    const i = pila[--tope];
    const p = i * 4;
    datos[p] = 255;
    datos[p + 1] = 255;
    datos[p + 2] = 255;
    const x = i % ancho;
    if (x > 0) agregar(i - 1);
    if (x < ancho - 1) agregar(i + 1);
    if (i >= ancho) agregar(i - ancho);
    if (i < total - ancho) agregar(i + ancho);
  }
}

/**
 * Busca dónde cortar la página, de abajo hacia arriba desde el corte ideal:
 * 1. Mejor: una franja del color de fondo que cruza todo el ancho (el espacio entre dos filas de gráficos).
 * 2. Si no hay (un gráfico alto ocupa dos filas): una franja de fondo que cruza buena parte del ancho; el corte
 *    solo pasa por ese gráfico alto.
 * 3. Si tampoco: el corte ideal.
 */
function buscarCorte(
  ctx: CanvasRenderingContext2D,
  ancho: number,
  desde: number,
  idealHasta: number,
  filasMinimas: number,
  fondo: Rgb
): number {
  const recorrido = idealHasta - desde;
  const inicio = Math.max(desde + Math.round(recorrido * 0.4), 1);
  const alto = idealHasta - inicio;
  if (alto < filasMinimas + 2) return idealHasta;

  const datos = ctx.getImageData(0, inicio, ancho, alto).data;
  // La barra de filtros de Superset ocupa el borde izquierdo de todo el alto: no cuenta
  const xInicial = Math.round(ancho * 0.06);
  const paso = 4;
  const fraccionFondo: number[] = new Array(alto);
  for (let i = 0; i < alto; i++) {
    const a = i * ancho * 4;
    let iguales = 0;
    let total = 0;
    for (let x = xInicial; x < ancho; x += paso) {
      const p = a + x * 4;
      total++;
      if (Math.abs(datos[p] - fondo[0]) + Math.abs(datos[p + 1] - fondo[1]) + Math.abs(datos[p + 2] - fondo[2]) <= 15) {
        iguales++;
      }
    }
    fraccionFondo[i] = total ? iguales / total : 0;
  }

  const buscarFranja = (minimaFraccion: number, minimoFilas: number): number | null => {
    let racha = 0;
    for (let i = alto - 1; i >= 0; i--) {
      if (fraccionFondo[i] >= minimaFraccion) {
        racha++;
      } else {
        if (racha >= minimoFilas) return inicio + i + 1 + Math.floor(racha / 2);
        racha = 0;
      }
    }
    return racha >= minimoFilas ? inicio + Math.floor(racha / 2) : null;
  };

  return buscarFranja(0.94, filasMinimas) ?? buscarFranja(0.45, filasMinimas) ?? idealHasta;
}

/**
 * Genera el PDF y lo descarga.
 * @param imagen   dashboard completo (un solo canvas, de arriba a abajo)
 * @param pxPorCss píxeles del canvas por cada píxel CSS de la página (para medir los espacios entre gráficos)
 */
export async function descargarPdfDashboard(
  imagen: HTMLCanvasElement,
  pxPorCss: number,
  datos: DatosReportePdf,
  nombreArchivo: string
): Promise<void> {
  const [{ jsPDF }, logo] = await Promise.all([import('jspdf'), cargarLogo()]);
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4', compress: true });
  doc.setProperties({
    title: `${datos.titulo} - Reporte de dashboard`,
    subject: 'Reporte de dashboard de Apache Superset',
    author: INSTITUCION,
    creator: 'Portal de reclamos - Municipalidad Distrital de San Miguel',
  });

  const ctx = imagen.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('No se pudo leer la imagen del dashboard.');

  const mmPorPx = ANCHO_UTIL / imagen.width;
  const fondo = colorFondo(ctx, imagen.width, imagen.height);
  const filasMinimas = Math.max(3, Math.round(5 * pxPorCss));
  const recorte = document.createElement('canvas');
  const ctxRecorte = recorte.getContext('2d');
  if (!ctxRecorte) throw new Error('No se pudo preparar la imagen del PDF.');

  let yImagen = 0;
  let pagina = 1;
  while (yImagen < imagen.height - 1) {
    let tope: number;
    if (pagina === 1) {
      tope = cabeceraPrimeraPagina(doc, datos, logo);
    } else {
      doc.addPage();
      cabeceraPaginasSiguientes(doc, datos, logo);
      tope = TOPE_CONTENIDO_SIGUIENTES;
    }

    const disponiblePx = Math.floor((FONDO_CONTENIDO - tope) / mmPorPx);
    const ideal = yImagen + disponiblePx;
    const hasta = ideal >= imagen.height ? imagen.height : buscarCorte(ctx, imagen.width, yImagen, ideal, filasMinimas, fondo);
    const altoPx = hasta - yImagen;

    recorte.width = imagen.width;
    recorte.height = altoPx;
    ctxRecorte.fillStyle = '#ffffff';
    ctxRecorte.fillRect(0, 0, recorte.width, recorte.height);
    ctxRecorte.drawImage(imagen, 0, yImagen, imagen.width, altoPx, 0, 0, imagen.width, altoPx);
    // Sin el gris del tablero: los gráficos quedan sobre blanco, como el resto de la hoja
    const pixeles = ctxRecorte.getImageData(0, 0, recorte.width, recorte.height);
    blanquearFondo(pixeles.data, recorte.width, recorte.height, fondo);
    ctxRecorte.putImageData(pixeles, 0, 0);

    const altoMm = altoPx * mmPorPx;
    doc.addImage(recorte.toDataURL('image/jpeg', 0.92), 'JPEG', MARGEN, tope, ANCHO_UTIL, altoMm, undefined, 'FAST');
    doc.setDrawColor(...BORDE);
    doc.setLineWidth(0.25);
    doc.roundedRect(MARGEN, tope, ANCHO_UTIL, altoMm, 1.2, 1.2, 'S');

    yImagen = hasta;
    pagina++;
  }

  const total = doc.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    pieDePagina(doc, i, total);
  }

  doc.save(nombreArchivo);
}

/** "Dashboard - Recaudación tributaria - 2026-11-24.pdf", sin caracteres que Windows no acepta. */
export function nombreArchivoPdf(titulo: string, fechaIso: string): string {
  const limpio = titulo.replace(/[\\/:*?"<>|]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 80) || 'Dashboard';
  return `Dashboard - ${limpio} - ${fechaIso}.pdf`;
}
