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
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', nombreArchivo);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
