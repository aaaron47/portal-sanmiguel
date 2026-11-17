import { storageService } from './storage.service';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

export interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
}

export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

/** Hace la llamada con el token y lanza `ApiError` si no hay conexión o si el backend responde con error. */
async function pedir(endpoint: string, options: RequestOptions = {}): Promise<Response> {
  const { params, headers, ...restOptions } = options;
  
  let url: string;
  if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
    url = endpoint;
  } else if (endpoint.startsWith('/api/')) {
    // Si el endpoint ya incluye el prefijo global /api/ (p. ej. /api/v1/admin/bi/ia/chat),
    // se remueve /api/v1/portal, /api/v1/admin o /api de API_BASE_URL para obtener la raíz del host.
    const raizBackend = API_BASE_URL.replace(/\/api(\/v1)?(\/portal|\/admin)?\/?$/, '');
    url = `${raizBackend}${endpoint}`;
  } else {
    url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  }
  
  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      url += (url.includes('?') ? '&' : '?') + queryString;
    }
  }

  const token = storageService.getToken();

  // Con un archivo (FormData) el navegador pone el Content-Type con su separador: no se fija a mano.
  const esFormulario = typeof FormData !== 'undefined' && restOptions.body instanceof FormData;
  const defaultHeaders: Record<string, string> = {
    ...(esFormulario ? {} : { 'Content-Type': 'application/json' }),
    'Accept': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  let response: Response;
  try {
    response = await fetch(url, {
      ...restOptions,
      headers: {
        ...defaultHeaders,
        ...headers,
      },
    });
  } catch (err: unknown) {
    // Solo un fallo de fetch es "sin conexión" (status 0): backend apagado, sin red o CORS.
    const message = err instanceof Error ? err.message : 'Error de conexión de red';
    throw new ApiError(message, 0, null);
  }

  if (!response.ok) {
    // El cuerpo se lee como texto: leerlo como JSON y, si falla, como texto, fallaba porque ya estaba leído.
    const texto = await response.text();
    let errorBody: unknown = texto;
    try {
      errorBody = texto ? JSON.parse(texto) : null;
    } catch {
      // El cuerpo del error no es JSON: se guarda como texto.
    }
    throw new ApiError(`Error HTTP ${response.status}: ${response.statusText}`, response.status, errorBody);
  }
  return response;
}

export async function apiClient<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const response = await pedir(endpoint, options);

  if (response.status === 204) {
    return {} as T;
  }
  const texto = await response.text();

  // El backend respondió bien pero sin un JSON válido: es un error del backend, no "sin conexión"
  // (si no, se aplicaría la acción también en los datos simulados).
  try {
    return JSON.parse(texto) as T;
  } catch {
    throw new ApiError('La respuesta del servidor no es válida', response.status, texto);
  }
}

/** Descarga un archivo con la sesión del portal (p. ej. un adjunto): no sirve un enlace sin token. */
export async function apiClientArchivo(endpoint: string, options: RequestOptions = {}): Promise<Blob> {
  const response = await pedir(endpoint, { ...options, headers: { Accept: '*/*', ...options.headers } });
  return response.blob();
}

export interface ArchivoDescargado {
  blob: Blob;
  nombreArchivo: string | null;
  tablaIncompleta: boolean;
  tablaFilas: number;
}

/**
 * Descarga un archivo con la sesión del portal y devuelve además las cabeceras de metadatos
 * (`Content-Disposition`, `X-Tabla-Incompleta`, `X-Tabla-Filas`).
 */
export async function apiClientArchivoConMeta(
  endpoint: string,
  options: RequestOptions = {}
): Promise<ArchivoDescargado> {
  const response = await pedir(endpoint, {
    ...options,
    headers: { Accept: '*/*', ...options.headers },
  });
  const disposition = response.headers.get('Content-Disposition') ?? '';
  const match = /filename="?([^";]+)"?/i.exec(disposition);
  const nombreArchivo = match?.[1]?.trim() || null;
  const tablaIncompleta = response.headers.get('X-Tabla-Incompleta') === 'true';
  const filasHeader = response.headers.get('X-Tabla-Filas');
  const tablaFilas =
    filasHeader !== null && filasHeader.trim() !== '' && !Number.isNaN(Number(filasHeader))
      ? Number(filasHeader)
      : -1;
  const blob = await response.blob();

  return {
    blob,
    nombreArchivo,
    tablaIncompleta,
    tablaFilas,
  };
}

/**
 * Si se permiten los datos simulados. En desarrollo (`npm run dev`) sí; en un build de producción solo con
 * `NEXT_PUBLIC_MODO_DEMO=true`. Así, si el backend real se cae, nadie entra sin contraseña ni "guarda" en datos falsos.
 */
export const MODO_DEMO =
  process.env.NEXT_PUBLIC_MODO_DEMO !== undefined
    ? process.env.NEXT_PUBLIC_MODO_DEMO === 'true'
    : process.env.NODE_ENV !== 'production';

/** true si no se pudo llegar al backend (red caída, backend apagado o CORS). */
export function esSinConexion(err: unknown): boolean {
  return err instanceof ApiError && err.status === 0;
}

/** Los controladores usan los datos simulados solo sin conexión y con el modo demo activo. */
export function usarDatosDemo(err: unknown): boolean {
  return MODO_DEMO && esSinConexion(err);
}

const MENSAJES_POR_ESTADO: Record<number, string> = {
  0: 'No se pudo conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.',
  401: 'Tu sesión venció. Cierra sesión y vuelve a entrar.',
  403: 'No tienes permiso para hacer esta acción.',
  404: 'No encontramos este registro. Recarga la página para ver la lista actualizada.',
  409: 'Otra persona cambió estos datos mientras los tenías abiertos. Recarga la página para ver los cambios.',
  501: 'Esta acción todavía no está disponible.',
};

/** Mensajes según el código que manda el backend (`error.code`), más precisos que el estado HTTP. */
const MENSAJES_POR_CODIGO: Record<string, string> = {
  account_locked:
    'Tu cuenta está bloqueada por varios intentos fallidos. Vuelve a intentarlo más tarde o pide ayuda al administrador.',
  invalid_session: 'Tu sesión se cerró por inactividad o venció. Cierra sesión y vuelve a entrar.',
  not_implemented: 'Esta acción todavía no está disponible.',
  attachment_unavailable:
    'Este archivo se subió desde la app y todavía no está disponible en el portal.',
  // Módulo BI / Superset / IA / MCP (Sección 8 de la guía BI)
  bi_no_configurado: 'Esta función de Business Intelligence aún no está configurada en el servidor.',
  bi_area_sin_rol_datos: 'El área de la persona no tiene un grupo de datos asignado. Avisa a un administrador.',
  bi_rol_datos_invalido: 'El grupo de datos asignado al área no es válido. Avisa a un administrador.',
  bi_superset_no_disponible: 'Apache Superset no está disponible o tarda en responder. Inténtalo de nuevo.',
  bi_no_es_dueno: 'No eres dueño de ese dashboard en Apache Superset.',
  bi_sin_cuenta_superset: 'La persona no tiene usuario en Superset. Habilita su acceso MCP primero.',
  bi_graficos_sin_query_context:
    'Los gráficos recién creados se están preparando en Superset. Reintenta en unos segundos.',
  bi_dominios_no_configurados:
    'Falta configurar los dominios permitidos de embebido en el servidor. Avisa al administrador del sistema.',
  bi_ambito_invalido: 'El parámetro de ámbito solicitado no es válido.',
  bi_formato_invalido: 'El formato de descarga solicitado no es válido (usa CSV o XLSX).',
  bi_descarga_no_lista: 'El archivo comprimido (ZIP) aún no termina de generarse. Espera unos segundos.',
  bi_tabla_sin_columnas: 'La tabla seleccionada no tiene columnas disponibles.',
  bi_rol_superset_no_existe: 'Falta un rol requerido en Apache Superset. Avisa al administrador del sistema.',
  bi_usuario_superset_ajeno:
    'El nombre de usuario ya existe en Superset como cuenta humana independiente y no se puede modificar.',
  bi_usuario_superset_en_uso: 'Ese usuario de Superset ya está en uso por otra persona.',
  bi_cuenta_inactiva: 'La cuenta del personal está inactiva. Actívala antes de habilitar MCP.',
  bi_lector_rechazado:
    'Superset no aceptó la cuenta de servicio de lectura del grupo. Avisa al administrador del sistema.',
  bi_descarga_rechazada:
    'Superset no aceptó la cuenta de servicio para descargar la tabla. Avisa al administrador del sistema.',
  bi_descarga_muy_grande: 'El archivo ZIP superó el límite de 150 MB. Descarga las tablas una por una.',
  bi_descarga_error: 'Ocurrió un error al generar la descarga comprimida de las tablas.',
  ia_no_configurada: 'El modelo local de IA no está disponible o no está configurado en el servidor.',
  ia_api_no_configurada: 'El modelo por API (Claude) no está disponible o no está configurado en el servidor.',
  ia_ocupada: 'La cola del modelo local está llena en este momento. Reintenta en unos minutos o usa el modelo API.',
  llm_no_disponible: 'El modelo de IA no respondió a tiempo. Inténtalo de nuevo.',
  llm_respuesta_invalida: 'El modelo de IA devolvió una respuesta inválida. Inténtalo de nuevo.',
  llm_limite: 'La API de Claude alcanzó su límite de uso. Reintenta más tarde.',
  llm_credencial_invalida: 'La clave de la API de Claude falló. Avisa al administrador del sistema.',
  llm_rechazo: 'Claude declinó responder esta consulta por sus filtros de seguridad. Reformula la pregunta.',
  ia_limite_iteraciones: 'El asistente dio demasiadas vueltas sin concluir. Reformula tu pregunta.',
  mcp_no_disponible: 'No se pudo conectar con el servidor MCP. Avisa al administrador del sistema.',
  mcp_no_autorizado: 'Falla de autorización en la conexión con el MCP. Avisa al administrador.',
  mcp_error: 'Ocurrió un error en la conexión con el MCP. Avisa al administrador.',
  not_found: 'No existe este recurso o no pertenece al grupo de datos de tu área.',
};

/** Códigos en los que el backend manda un mensaje más preciso que el del front (p. ej. los minutos del bloqueo o 409 de MCP). */
const CODIGOS_CON_MENSAJE_DEL_BACKEND = new Set([
  'account_locked',
  'bi_area_sin_rol_datos',
  'bi_rol_datos_invalido',
  'bi_rol_superset_no_existe',
  'bi_cuenta_inactiva',
  'bi_usuario_superset_ajeno',
  'bi_usuario_superset_en_uso',
]);

/** Cuerpo de error del backend: `{"error": {"code", "message", "details"?}}`. */
function cuerpoError(err: unknown): { code?: string; message?: string } | undefined {
  if (!(err instanceof ApiError) || typeof err.data !== 'object' || err.data === null) return undefined;
  const error = (err.data as { error?: unknown }).error;
  return typeof error === 'object' && error !== null ? (error as { code?: string; message?: string }) : undefined;
}

/** Código de error del backend (p. ej. `account_locked`, `dni_exists`), o undefined si no lo trae. */
export function codigoErrorApi(err: unknown): string | undefined {
  return cuerpoError(err)?.code;
}

/**
 * Mensaje para el usuario según la respuesta del backend; `porDefecto` para el resto de casos.
 * `propios` reemplaza el texto por código del backend (p. ej. `dni_exists`) o por estado HTTP (p. ej. 409).
 * Orden: propio por código, código conocido, mensaje del backend en 409/422 (salvo conflicto de versión),
 * propio por estado, estado conocido y, al final, `porDefecto`.
 */
export function mensajeErrorApi(
  err: unknown,
  porDefecto: string,
  propios: Partial<Record<number | string, string>> = {}
): string {
  if (!(err instanceof ApiError)) return porDefecto;
  const cuerpo = cuerpoError(err);
  const codigo = cuerpo?.code;
  if (codigo && propios[codigo]) return propios[codigo] as string;
  // El tiempo de bloqueo lo configura el administrador: el backend lo dice en su mensaje.
  if (codigo && CODIGOS_CON_MENSAJE_DEL_BACKEND.has(codigo) && cuerpo?.message) return cuerpo.message;
  // Un código conocido gana sobre el texto por estado: p. ej. account_locked también llega como 401.
  if (codigo && MENSAJES_POR_CODIGO[codigo]) return MENSAJES_POR_CODIGO[codigo];
  // En validaciones (422) y en reglas de negocio (409, p. ej. invalid_state) el backend explica qué pasó
  // ("Esta acción solo se puede hacer con el reclamo en evaluación"). El conflicto de versión usa el texto por estado.
  if ((err.status === 409 || err.status === 422) && codigo && codigo !== 'version_conflict' && cuerpo?.message) {
    return cuerpo.message;
  }
  if (propios[err.status]) return propios[err.status] as string;
  return MENSAJES_POR_ESTADO[err.status] ?? porDefecto;
}
