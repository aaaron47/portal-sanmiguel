import type { NextConfig } from "next";

// Si se define BACKEND_URL (solo en el servidor, p. ej. en Vercel), las llamadas a /api/* se reenvían al backend.
// Así la página en https no llama directo a un backend en http, que el navegador bloquearía ("mixed content"),
// y no hace falta CORS. En ese caso, NEXT_PUBLIC_API_URL debe ser una ruta relativa, p. ej. /api/v1/portal.
const BACKEND_URL = process.env.BACKEND_URL?.replace(/\/+$/, '');

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  async rewrites() {
    if (!BACKEND_URL) return [];
    return [{ source: '/api/:path*', destination: `${BACKEND_URL}/api/:path*` }];
  },
};

export default nextConfig;
