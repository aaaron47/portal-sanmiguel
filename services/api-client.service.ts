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

export async function apiClient<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { params, headers, ...restOptions } = options;
  
  let url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  
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

  const defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  try {
    const response = await fetch(url, {
      ...restOptions,
      headers: {
        ...defaultHeaders,
        ...headers,
      },
    });

    if (!response.ok) {
      let errorBody: unknown;
      try {
        errorBody = await response.json();
      } catch {
        errorBody = await response.text();
      }
      throw new ApiError(
        `Error HTTP ${response.status}: ${response.statusText}`,
        response.status,
        errorBody
      );
    }

    if (response.status === 204) {
      return {} as T;
    }

    return (await response.json()) as T;
  } catch (err: unknown) {
    if (err instanceof ApiError) {
      throw err;
    }
    // Si hay fallo de red (ej. Backend remoto apagado), propagar un error estructurado
    const message = err instanceof Error ? err.message : 'Error de conexión de red';
    throw new ApiError(message, 0, null);
  }
}

/** true si no se pudo llegar al backend (red caída o backend apagado): solo entonces se usan datos simulados. */
export function esSinConexion(err: unknown): boolean {
  return err instanceof ApiError && err.status === 0;
}

/** Mensaje para el usuario según la respuesta del backend; `porDefecto` para el resto de casos. */
export function mensajeErrorApi(err: unknown, porDefecto: string): string {
  if (!(err instanceof ApiError)) return porDefecto;
  if (err.status === 401) return 'Tu sesión venció. Cierra sesión y vuelve a entrar.';
  if (err.status === 403) return 'No tienes permiso para hacer esta acción.';
  if (err.status === 404) return 'No encontramos este reclamo. Recarga la página para ver la lista actualizada.';
  if (err.status === 409) {
    return 'Otra persona cambió este reclamo mientras lo tenías abierto. Cierra el detalle y vuelve a abrirlo para ver los cambios.';
  }
  return porDefecto;
}
