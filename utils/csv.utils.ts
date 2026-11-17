/**
 * Exporta y descarga un archivo CSV con el formato de nombre solicitado:
 * <Contenido objetivo>_<Fecha>_<Hora>.csv
 * Incluye BOM UTF-8 (\ufeff) para compatibilidad con acentos y caracteres especiales en Microsoft Excel y Google Sheets.
 */
export function exportarCSV(
  nombreObjetivo: string,
  cabeceras: string[],
  filas: (string | number | boolean | null | undefined)[][]
): void {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');

  const fechaStr = `${year}-${month}-${day}`;
  const horaStr = `${hours}-${minutes}-${seconds}`;
  const nombreArchivo = `${nombreObjetivo}_${fechaStr}_${horaStr}.csv`;

  const escapeCSV = (val: unknown): string => {
    if (val === null || val === undefined) return '""';
    const s = String(val).replace(/"/g, '""');
    return `"${s}"`;
  };

  const lineas = [
    cabeceras.map(escapeCSV).join(','),
    ...filas.map((fila) => fila.map(escapeCSV).join(',')),
  ];

  const contenido = lineas.join('\r\n');
  const blob = new Blob(['\ufeff' + contenido], { type: 'text/csv;charset=utf-8;' });
  descargarBlobArchivo(blob, nombreArchivo);
}

/**
 * Descarga en el navegador un Blob con el nombre de archivo especificado.
 */
export function descargarBlobArchivo(blob: Blob, nombreArchivo: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', nombreArchivo);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Parsea un contenido CSV (con soporte para comillas escapadas, BOM UTF-8 y separador coma o punto y coma)
 * y devuelve sus cabeceras y filas para previsualización tabular.
 */
export function parsearCSV(textoRaw: string): { cabeceras: string[]; filas: string[][] } {
  const texto = textoRaw.replace(/^\ufeff/, '').trim();
  if (!texto) {
    return { cabeceras: [], filas: [] };
  }

  // Detectar si el delimitador principal de la primera línea es ';' o ','
  const primeraLineaFin = texto.indexOf('\n');
  const primeraLinea = primeraLineaFin >= 0 ? texto.slice(0, primeraLineaFin) : texto;
  const comas = (primeraLinea.match(/,/g) || []).length;
  const puntosYComa = (primeraLinea.match(/;/g) || []).length;
  const delimitador = puntosYComa > comas ? ';' : ',';

  const filasTotales: string[][] = [];
  let filaActual: string[] = [];
  let celdaActual = '';
  let enComillas = false;

  for (let i = 0; i < texto.length; i++) {
    const ch = texto[i];
    const sig = texto[i + 1];

    if (enComillas) {
      if (ch === '"' && sig === '"') {
        celdaActual += '"';
        i++;
      } else if (ch === '"') {
        enComillas = false;
      } else {
        celdaActual += ch;
      }
    } else {
      if (ch === '"') {
        enComillas = true;
      } else if (ch === delimitador) {
        filaActual.push(celdaActual.trim());
        celdaActual = '';
      } else if (ch === '\r' && sig === '\n') {
        filaActual.push(celdaActual.trim());
        filasTotales.push(filaActual);
        filaActual = [];
        celdaActual = '';
        i++;
      } else if (ch === '\n' || ch === '\r') {
        filaActual.push(celdaActual.trim());
        filasTotales.push(filaActual);
        filaActual = [];
        celdaActual = '';
      } else {
        celdaActual += ch;
      }
    }
  }

  if (celdaActual.length > 0 || filaActual.length > 0) {
    filaActual.push(celdaActual.trim());
    filasTotales.push(filaActual);
  }

  const filasNoVacias = filasTotales.filter((f) => f.some((c) => c !== ''));
  if (filasNoVacias.length === 0) {
    return { cabeceras: [], filas: [] };
  }

  const [cabeceras, ...filas] = filasNoVacias;
  return { cabeceras, filas };
}
