import type { EmbeddedDashboard } from '@superset-ui/embedded-sdk';
import { CapturaPestana, ErrorExportacionPdf, esperar } from './captura-pestana';
import { DatosReportePdf, descargarPdfDashboard, nombreArchivoPdf } from './pdf-dashboard';

/**
 * Exporta a PDF el dashboard de Superset tal como el usuario lo ve (con sus filtros):
 * 1. Saca el iframe del dashboard a pantalla completa con el ancho de la captura y el alto de todo su contenido.
 * 2. Lo va desplazando por tramos y copia cada tramo de la captura de la pestaña a un solo canvas.
 * 3. Devuelve el iframe a su lugar y arma el PDF con el formato del portal.
 *
 * El iframe se muestra en la capa superior del navegador (Popover API): queda por encima de toda la página aunque
 * esté dentro de tarjetas con su propio z-index o transform, y no se recarga porque no se mueve en el DOM.
 * Su fondo (::backdrop, clase `exportando-pdf` en globals.css) tapa la página de blanco. La barra de avance
 * (`[data-barra-exportacion-pdf]`) se vuelve a abrir encima del iframe y queda fuera de la zona que se copia.
 */

export class ExportacionCancelada extends ErrorExportacionPdf {}

/** Alto (px) de la barra de avance que se muestra arriba durante la captura. */
export const ALTO_BARRA_EXPORTACION = 56;
/**
 * Distancia (px) a los bordes de la ventana: mientras comparte la pestaña, el navegador dibuja un borde
 * alrededor que también sale en la captura.
 */
const MARGEN_BORDE_CAPTURA = 8;
/** Ancho máximo (px) con el que se dibuja el dashboard para el PDF. */
const ANCHO_MAXIMO = 1440;
/** Alto máximo (px) del dashboard que se exporta, para no exceder el tamaño de un canvas. */
const ALTO_MAXIMO = 12000;
/** Tiempo máximo (ms) que se espera a que termine de cargar cada tramo del dashboard. */
const ESPERA_MAXIMA_TRAMO = 20000;

export interface ProgresoExportacion {
  etapa: string;
  /** 0 a 100 */
  porcentaje: number;
}

interface OpcionesExportacion {
  stream: MediaStream;
  iframe: HTMLIFrameElement;
  dashboard: EmbeddedDashboard;
  datos: Omit<DatosReportePdf, 'filtros'>;
  /** Fecha `AAAA-MM-DD` para el nombre del archivo */
  fechaIso: string;
  /** Si el portal está en modo oscuro, el dashboard se pasa a claro solo durante la captura */
  temaOscuro: boolean;
  senal: AbortSignal;
  onProgreso: (p: ProgresoExportacion) => void;
}

function verificarCancelacion(senal: AbortSignal) {
  if (senal.aborted) throw new ExportacionCancelada('Se canceló la exportación del PDF.');
}

/** Texto legible de un valor de filtro de Superset (lista, rango de números o fechas, texto). */
function textoValorFiltro(valor: unknown): string {
  if (Array.isArray(valor)) {
    const partes = valor.filter((v) => v !== null && v !== undefined && v !== '').map(String);
    if (valor.length === 2 && partes.length && valor.every((v) => typeof v === 'number' || v === null)) {
      return `${valor[0] ?? '...'} a ${valor[1] ?? '...'}`;
    }
    return partes.join(', ');
  }
  if (valor === null || valor === undefined) return '';
  return typeof valor === 'object' ? '' : String(valor);
}

/** Valores de los filtros nativos y cruzados que están aplicados en el dashboard. */
async function leerFiltrosAplicados(dashboard: EmbeddedDashboard): Promise<string[]> {
  try {
    const mascara = await dashboard.getDataMask();
    const filtros: string[] = [];
    Object.entries(mascara || {}).forEach(([id, entrada]) => {
      const estado = (entrada as { filterState?: { value?: unknown; label?: unknown } })?.filterState;
      if (!estado || estado.value === undefined || estado.value === null) return;
      if (Array.isArray(estado.value) && estado.value.length === 0) return;
      const texto =
        typeof estado.label === 'string' && estado.label.trim() ? estado.label.trim() : textoValorFiltro(estado.value);
      if (!texto) return;
      filtros.push(id.startsWith('NATIVE_FILTER') ? texto : `${texto} (filtro desde un gráfico)`);
    });
    return filtros;
  } catch {
    return [];
  }
}

export async function exportarDashboardPdf({
  stream,
  iframe,
  dashboard,
  datos,
  fechaIso,
  temaOscuro,
  senal,
  onProgreso,
}: OpcionesExportacion): Promise<void> {
  if (typeof iframe.showPopover !== 'function') {
    stream.getTracks().forEach((t) => t.stop());
    throw new ErrorExportacionPdf(
      'Este navegador es muy antiguo para exportar el dashboard a PDF. Actualiza Google Chrome o Microsoft Edge.'
    );
  }
  const captura = await CapturaPestana.iniciar(stream);
  const estiloOriginal = iframe.getAttribute('style') ?? '';
  const barra = document.querySelector<HTMLElement>('[data-barra-exportacion-pdf]');
  let imagen: HTMLCanvasElement;
  let pxPorCss: number;
  let filtros: string[];

  try {
    onProgreso({ etapa: 'Preparando el dashboard', porcentaje: 5 });
    filtros = await leerFiltrosAplicados(dashboard);
    if (temaOscuro) {
      try {
        dashboard.setThemeMode('default');
      } catch {
        // Versión de Superset sin cambio de tema: se exporta como esté
      }
    }

    const ancho = Math.min(window.innerWidth - MARGEN_BORDE_CAPTURA * 2, ANCHO_MAXIMO);
    const izquierda = Math.max(MARGEN_BORDE_CAPTURA, Math.round((window.innerWidth - ancho) / 2));
    // Zona que se copia: debajo de la barra de avance y lejos de los bordes de la ventana
    const topeZona = ALTO_BARRA_EXPORTACION + MARGEN_BORDE_CAPTURA;
    const altoVisible = () => window.innerHeight - topeZona - MARGEN_BORDE_CAPTURA;
    const colocar = (alto: number, desplazamiento: number) => {
      Object.assign(iframe.style, {
        position: 'fixed',
        inset: 'auto',
        left: `${izquierda}px`,
        top: `${topeZona - desplazamiento}px`,
        width: `${ancho}px`,
        height: `${alto}px`,
        maxWidth: 'none',
        maxHeight: 'none',
        margin: '0',
        padding: '0',
        border: '0',
        borderRadius: '0',
        overflow: 'hidden',
        transform: 'none',
        colorScheme: 'light',
      });
    };

    // 1. Alto real del contenido: crece mientras cargan los gráficos, se mide hasta que se estabiliza
    let alto = altoVisible();
    colocar(alto, 0);
    iframe.classList.add('exportando-pdf');
    iframe.setAttribute('popover', 'manual');
    iframe.showPopover();
    // La barra de avance tiene que quedar encima del iframe: se vuelve a abrir después
    if (barra?.matches(':popover-open')) {
      barra.hidePopover();
      barra.showPopover();
    }
    let mediciones = 0;
    for (let i = 0, estables = 0; i < 16 && estables < 2; i++) {
      await esperar(i === 0 ? 1500 : 900);
      verificarCancelacion(senal);
      let medido = alto;
      try {
        medido = (await dashboard.getScrollSize()).height;
      } catch {
        // El iframe no respondió esta vez; se vuelve a medir
      }
      const nuevo = Math.min(Math.max(Math.ceil(medido), altoVisible()), ALTO_MAXIMO);
      if (Math.abs(nuevo - alto) < 4) {
        estables++;
      } else {
        estables = 0;
        alto = nuevo;
        colocar(alto, 0);
      }
      mediciones = i + 1;
      onProgreso({ etapa: 'Esperando a que carguen todos los gráficos', porcentaje: Math.min(10 + mediciones * 3, 40) });
    }
    // Los gráficos se vuelven a dibujar con el nuevo tamaño
    await esperar(1500);
    verificarCancelacion(senal);

    // 2. Copiar el dashboard por tramos a un solo canvas
    pxPorCss = Math.min(captura.escala(), 30000 / alto, 8000 / ancho);
    imagen = document.createElement('canvas');
    imagen.width = Math.round(ancho * pxPorCss);
    imagen.height = Math.round(alto * pxPorCss);
    const ctx = imagen.getContext('2d', { willReadFrequently: true });
    if (!ctx) throw new ErrorExportacionPdf('El navegador no pudo preparar la imagen del PDF.');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, imagen.width, imagen.height);

    let y = 0;
    while (y < alto) {
      verificarCancelacion(senal);
      const tramo = Math.min(altoVisible(), alto - y);
      colocar(alto, y);
      await captura.esperarCuadroNuevo(y === 0 ? 400 : 250);
      const zona = { x: izquierda, y: topeZona, ancho, alto: tramo };
      const avance = 40 + Math.round((y / alto) * 45);
      onProgreso({ etapa: 'Esperando a que terminen de cargar los gráficos', porcentaje: avance });
      await captura.esperarZonaQuieta(zona, ESPERA_MAXIMA_TRAMO, () => senal.aborted);
      verificarCancelacion(senal);
      onProgreso({ etapa: 'Capturando el dashboard', porcentaje: avance });
      captura.copiarZona(ctx, zona, y, pxPorCss);
      y += tramo;
      onProgreso({ etapa: 'Capturando el dashboard', porcentaje: 40 + Math.round((y / alto) * 45) });
    }
  } finally {
    captura.detener();
    if (iframe.matches(':popover-open')) iframe.hidePopover();
    iframe.removeAttribute('popover');
    iframe.classList.remove('exportando-pdf');
    iframe.setAttribute('style', estiloOriginal);
    if (temaOscuro) {
      try {
        dashboard.setThemeMode('dark');
      } catch {
        // Sin cambio de tema
      }
    }
  }

  // 3. Armar el PDF con el formato del portal
  onProgreso({ etapa: 'Armando el PDF', porcentaje: 90 });
  await descargarPdfDashboard(imagen, pxPorCss, { ...datos, filtros }, nombreArchivoPdf(datos.titulo, fechaIso));
  onProgreso({ etapa: 'Listo', porcentaje: 100 });
}
