/**
 * Captura de la pestaña actual con la API de pantalla compartida del navegador.
 *
 * El dashboard de Superset vive en un iframe de otro dominio: la página no puede leer sus píxeles.
 * La única forma de obtener la imagen real (con los filtros que el usuario aplicó) es pedirle permiso
 * al navegador para ver esta pestaña. La imagen no sale de la computadora del usuario.
 */

export class ErrorExportacionPdf extends Error {}

/** Pide permiso para capturar la pestaña. Se llama directamente en el clic (el navegador exige un gesto del usuario). */
export function pedirCapturaPestana(): Promise<MediaStream> {
  if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getDisplayMedia) {
    return Promise.reject(
      new ErrorExportacionPdf(
        'Este navegador no permite exportar el dashboard a PDF. Usa Google Chrome o Microsoft Edge en una computadora.'
      )
    );
  }
  // preferCurrentTab, selfBrowserSurface y surfaceSwitching son de Chrome y Edge; los demás navegadores los ignoran.
  const opciones = {
    video: { displaySurface: 'browser', frameRate: 30, width: { max: 4096 }, height: { max: 4096 } },
    audio: false,
    preferCurrentTab: true,
    selfBrowserSurface: 'include',
    surfaceSwitching: 'exclude',
    monitorTypeSurfaces: 'exclude',
  } as DisplayMediaStreamOptions;
  return navigator.mediaDevices.getDisplayMedia(opciones).catch((err: unknown) => {
    const nombre = err instanceof DOMException ? err.name : '';
    if (nombre === 'NotAllowedError' || nombre === 'AbortError') {
      throw new ErrorExportacionPdf(
        'No se generó el PDF porque no se dio permiso para ver la pestaña. Vuelve a intentarlo y elige "Permitir".'
      );
    }
    throw new ErrorExportacionPdf('El navegador no pudo capturar la pestaña para armar el PDF. Vuelve a intentarlo.');
  });
}

const esperarCuadroAnimacion = () => new Promise<void>((r) => requestAnimationFrame(() => r()));
export const esperar = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/** Video que reproduce la captura de la pestaña y permite copiar zonas de la pantalla a un canvas. */
export class CapturaPestana {
  private readonly video: HTMLVideoElement;

  private constructor(private readonly stream: MediaStream) {
    this.video = document.createElement('video');
    this.video.muted = true;
    this.video.playsInline = true;
    this.video.srcObject = stream;
  }

  static async iniciar(stream: MediaStream): Promise<CapturaPestana> {
    const captura = new CapturaPestana(stream);
    try {
      await captura.video.play();
      // Esperar a que lleguen las dimensiones reales del primer cuadro
      for (let i = 0; i < 40 && !captura.video.videoWidth; i++) await esperar(50);
      if (!captura.video.videoWidth) throw new ErrorExportacionPdf('No llegó la imagen de la pestaña. Vuelve a intentarlo.');
      captura.validarQueEsEstaPestana();
      return captura;
    } catch (err) {
      captura.detener();
      throw err;
    }
  }

  /** Si el usuario eligió otra pestaña o una ventana, la proporción de la imagen no coincide con esta página. */
  private validarQueEsEstaPestana() {
    const ajustes = this.stream.getVideoTracks()[0]?.getSettings();
    const esPestana = !ajustes?.displaySurface || ajustes.displaySurface === 'browser';
    const proporcionVideo = this.video.videoWidth / this.video.videoHeight;
    const proporcionPagina = window.innerWidth / window.innerHeight;
    // La barra "Compartiendo esta pestaña" puede aparecer y cambiar el alto: se deja margen
    if (!esPestana || Math.abs(proporcionVideo - proporcionPagina) / proporcionPagina > 0.12) {
      throw new ErrorExportacionPdf(
        'Se eligió otra pestaña o ventana. Vuelve a intentarlo y elige "Esta pestaña" en el aviso del navegador.'
      );
    }
  }

  /** Píxeles del video por cada píxel CSS de la página (depende del zoom y de la pantalla). */
  escala(): number {
    return this.video.videoWidth / window.innerWidth;
  }

  /** Espera a que la pantalla muestre los últimos cambios del DOM y a que llegue un cuadro nuevo del video. */
  async esperarCuadroNuevo(msMinimo = 250): Promise<void> {
    await esperarCuadroAnimacion();
    await esperarCuadroAnimacion();
    await esperar(msMinimo);
    const v = this.video as HTMLVideoElement & {
      requestVideoFrameCallback?: (cb: () => void) => number;
    };
    if (typeof v.requestVideoFrameCallback === 'function') {
      // La captura solo emite cuadros cuando algo cambia: si no llega ninguno, la pantalla ya está quieta
      await Promise.race([new Promise<void>((r) => v.requestVideoFrameCallback!(() => r())), esperar(400)]);
    }
  }

  /**
   * Copia una zona de la pantalla (en píxeles CSS) al canvas de destino.
   * `escalaDestino` convierte píxeles CSS en píxeles del canvas.
   */
  copiarZona(
    destino: CanvasRenderingContext2D,
    zona: { x: number; y: number; ancho: number; alto: number },
    yDestinoCss: number,
    escalaDestino: number
  ) {
    const s = this.escala();
    destino.drawImage(
      this.video,
      Math.round(zona.x * s),
      Math.round(zona.y * s),
      Math.round(zona.ancho * s),
      Math.round(zona.alto * s),
      0,
      Math.round(yDestinoCss * escalaDestino),
      Math.round(zona.ancho * escalaDestino),
      Math.round(zona.alto * escalaDestino)
    );
  }

  /** Miniatura de una zona de la pantalla, para saber si cambió (gráficos cargando o animándose). */
  huella(zona: { x: number; y: number; ancho: number; alto: number }): Uint8ClampedArray {
    const s = this.escala();
    const ancho = 240;
    const alto = Math.max(1, Math.round((zona.alto / zona.ancho) * ancho));
    const lienzo = document.createElement('canvas');
    lienzo.width = ancho;
    lienzo.height = alto;
    const ctx = lienzo.getContext('2d', { willReadFrequently: true });
    if (!ctx) return new Uint8ClampedArray();
    ctx.drawImage(this.video, zona.x * s, zona.y * s, zona.ancho * s, zona.alto * s, 0, 0, ancho, alto);
    return ctx.getImageData(0, 0, ancho, alto).data;
  }

  /**
   * Espera a que la zona deje de cambiar: dos miniaturas seguidas iguales (los spinners de "cargando" y las
   * animaciones de los gráficos las hacen distintas). Devuelve false si se llegó al tiempo máximo.
   */
  async esperarZonaQuieta(
    zona: { x: number; y: number; ancho: number; alto: number },
    msMaximo: number,
    cancelado: () => boolean
  ): Promise<boolean> {
    const inicio = Date.now();
    let previa = this.huella(zona);
    while (Date.now() - inicio < msMaximo) {
      await esperar(600);
      if (cancelado()) return false;
      const actual = this.huella(zona);
      let distintos = 0;
      for (let i = 0; i < actual.length && distintos <= 2; i += 4) {
        if (
          Math.abs(actual[i] - previa[i]) + Math.abs(actual[i + 1] - previa[i + 1]) + Math.abs(actual[i + 2] - previa[i + 2]) >
          30
        ) {
          distintos++;
        }
      }
      if (distintos <= 2 && actual.length === previa.length) return true;
      previa = actual;
    }
    return false;
  }

  detener() {
    this.stream.getTracks().forEach((t) => t.stop());
    this.video.srcObject = null;
  }
}
