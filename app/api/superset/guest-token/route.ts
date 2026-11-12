import { NextResponse } from 'next/server';

const SUPERSET_URL = (process.env.NEXT_PUBLIC_SUPERSET_URL || '').replace(/\/$/, '');
const SUPERSET_ADMIN_USER = process.env.SUPERSET_ADMIN_USERNAME || '';
const SUPERSET_ADMIN_PASSWORD = process.env.SUPERSET_ADMIN_PASSWORD || '';

interface CachedSession {
  accessToken: string;
  csrfToken: string;
  cookies: string;
  expiresAt: number;
}

let cachedSession: CachedSession | null = null;

async function getAdminSession(url: string, user: string, pass: string, forceRefresh = false): Promise<CachedSession> {
  // Reutilizar sesión en memoria si está vigente (con 5 minutos de margen)
  if (!forceRefresh && cachedSession && Date.now() < cachedSession.expiresAt - 5 * 60 * 1000) {
    return cachedSession;
  }

  // 1. Login admin para obtener access token
  const loginRes = await fetch(`${url}/api/v1/security/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: user,
      password: pass,
      provider: 'db',
      refresh: true,
    }),
    cache: 'no-store',
  });

  if (!loginRes.ok) {
    const detalle = await loginRes.text();
    cachedSession = null;
    throw new Error(`Error autenticando en Superset (${loginRes.status}): ${detalle}`);
  }

  const { access_token } = await loginRes.json();

  // 2. Token CSRF + cookies de sesión asociadas
  const csrfRes = await fetch(`${url}/api/v1/security/csrf_token/`, {
    headers: { Authorization: `Bearer ${access_token}` },
    cache: 'no-store',
  });

  if (!csrfRes.ok) {
    const detalle = await csrfRes.text();
    cachedSession = null;
    throw new Error(`Error obteniendo CSRF token (${csrfRes.status}): ${detalle}`);
  }

  const { result: csrfToken } = await csrfRes.json();
  const cookies = csrfRes.headers
    .getSetCookie()
    .map((c) => c.split(';')[0])
    .join('; ');

  cachedSession = {
    accessToken: access_token,
    csrfToken,
    cookies,
    expiresAt: Date.now() + 2 * 60 * 60 * 1000, // 2 horas
  };

  return cachedSession;
}

export async function POST(req: Request) {
  try {
    if (!SUPERSET_URL || !SUPERSET_ADMIN_USER || !SUPERSET_ADMIN_PASSWORD) {
      return NextResponse.json(
        { error: 'Faltan variables de entorno de Superset en el servidor' },
        { status: 500 }
      );
    }

    const body = await req.json();
    const dashboardId = body?.dashboardId;
    const rlsRules = Array.isArray(body?.rls) ? body.rls : [];

    if (!dashboardId || typeof dashboardId !== 'string') {
      return NextResponse.json({ error: 'dashboardId requerido' }, { status: 400 });
    }

    // Obtener sesión con token en caché
    let session = await getAdminSession(SUPERSET_URL, SUPERSET_ADMIN_USER, SUPERSET_ADMIN_PASSWORD);

    // Función auxiliar para solicitar el guest token
    const pedirGuestToken = async (s: CachedSession) => {
      return fetch(`${SUPERSET_URL}/api/v1/security/guest_token/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${s.accessToken}`,
          'X-CSRFToken': s.csrfToken,
          Referer: SUPERSET_URL,
          ...(s.cookies ? { Cookie: s.cookies } : {}),
        },
        body: JSON.stringify({
          user: {
            username: 'portal_sanmiguel_user',
            first_name: 'Portal',
            last_name: 'San Miguel',
          },
          resources: [{ type: 'dashboard', id: dashboardId }],
          rls: rlsRules,
        }),
        cache: 'no-store',
      });
    };

    let guestRes = await pedirGuestToken(session);

    // Si expiró el token en Superset (401), refrescamos la sesión y reintentamos una sola vez
    if (guestRes.status === 401) {
      session = await getAdminSession(SUPERSET_URL, SUPERSET_ADMIN_USER, SUPERSET_ADMIN_PASSWORD, true);
      guestRes = await pedirGuestToken(session);
    }

    if (!guestRes.ok) {
      const detalle = await guestRes.text();
      return NextResponse.json({ error: 'Error generando guest token en Superset', detalle }, { status: guestRes.status });
    }

    const { token } = await guestRes.json();
    return NextResponse.json({ token });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}


