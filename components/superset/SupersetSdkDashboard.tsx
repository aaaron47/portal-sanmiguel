'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { embedDashboard, EmbeddedDashboard, ThemeMode } from '@superset-ui/embedded-sdk';
import { RefreshCw, AlertTriangle } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { iaDashboardsController } from '@/controllers/ia-dashboards.controller';
import { mensajeErrorApi } from '@/services/api-client.service';

export interface SupersetSdkDashboardProps {
  /** UUID del dashboard obtenido en Superset mediante "Embed dashboard" */
  dashboardId?: string;
  height?: string;
  hideTitle?: boolean;
  hideTab?: boolean;
  hideChartControls?: boolean;
  filtersExpanded?: boolean;
  /** Tema forzado opcional; si no se especifica, se sincroniza automáticamente con ThemeContext */
  theme?: 'light' | 'dark';
  className?: string;
  style?: React.CSSProperties;
}

export const SupersetSdkDashboard: React.FC<SupersetSdkDashboardProps> = ({
  dashboardId,
  height = '750px',
  hideTitle = true,
  hideTab = false,
  hideChartControls = false,
  filtersExpanded = false,
  theme: temaProp,
  className,
  style,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const dashboardInstanceRef = useRef<EmbeddedDashboard | null>(null);
  const { theme: temaContexto } = useTheme();
  const temaActivo = temaProp || temaContexto;
  const temaActivoRef = useRef(temaActivo);

  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState<boolean>(Boolean(dashboardId));
  const [recargaKey, setRecargaKey] = useState<number>(0);

  const reintentar = useCallback(() => {
    setRecargaKey((k) => k + 1);
  }, []);

  // Mantener actualizado el ref del tema sin mutarlo en la fase de render
  useEffect(() => {
    temaActivoRef.current = temaActivo;
  }, [temaActivo]);

  // Montar el dashboard embebido con la configuración inicial
  useEffect(() => {
    const el = containerRef.current;
    if (!el || !dashboardId) return;

    let cancelado = false;
    el.innerHTML = '';
    setError(null);
    setCargando(true);

    let supersetDomain = (process.env.NEXT_PUBLIC_SUPERSET_URL || '').replace(/\/$/, '');
    const temaInicial = temaActivoRef.current;
    const modoTemaInicial: ThemeMode = temaInicial === 'dark' ? 'dark' : 'default';

    const montar = async () => {
      // 1. Obtener el guest token inicial del backend para resolver la URL de Superset si viene dinámicamente
      let tokenInicial: string | null = null;
      try {
        const guestData = await iaDashboardsController.getGuestToken(dashboardId);
        tokenInicial = guestData.token;
        if (guestData.supersetUrl) {
          supersetDomain = guestData.supersetUrl.replace(/\/$/, '');
        }
      } catch (errInicial) {
        // Fallback al endpoint interno de Next.js si el backend no está disponible
        try {
          const res = await fetch('/api/superset/guest-token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ dashboardId }),
          });
          if (res.ok) {
            const data = await res.json();
            tokenInicial = data.token;
          } else {
            throw errInicial;
          }
        } catch {
          if (!cancelado) {
            setCargando(false);
            setError(mensajeErrorApi(errInicial, 'No se pudo obtener el guest token de Superset.'));
          }
          return;
        }
      }

      if (cancelado) return;

      try {
        const embeddedDashboard = await embedDashboard({
          id: dashboardId,
          supersetDomain,
          mountPoint: el,
          fetchGuestToken: async () => {
            if (cancelado) throw new Error('Operación cancelada');
            if (tokenInicial) {
              const t = tokenInicial;
              tokenInicial = null; // Usar el inicial para la primera petición
              return t;
            }
            try {
              const res = await iaDashboardsController.getGuestToken(dashboardId);
              return res.token;
            } catch (err) {
              // Reintento con fallback local
              const res = await fetch('/api/superset/guest-token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ dashboardId }),
              });
              if (res.ok) {
                const data = await res.json();
                return data.token;
              }
              throw err;
            }
          },
          dashboardUiConfig: {
            hideTitle,
            hideTab,
            hideChartControls,
            filters: { expanded: filtersExpanded, visible: !filtersExpanded },
            urlParams: {
              themeMode: modoTemaInicial,
              theme: temaInicial,
            },
          },
        });

        if (cancelado) {
          try {
            embeddedDashboard.unmount();
          } catch {
            // Silencioso
          }
          return;
        }

        dashboardInstanceRef.current = embeddedDashboard;

        try {
          embeddedDashboard.setThemeMode(modoTemaInicial);
        } catch {
          // Ignorado si la instancia no implementa setThemeMode aún
        }

        setCargando(false);
        const iframe = el.querySelector('iframe');
        if (iframe) {
          iframe.style.width = '100%';
          iframe.style.height = '100%';
          iframe.style.border = 'none';
          iframe.style.borderRadius = '8px';
          iframe.style.colorScheme = temaInicial;
        }
      } catch (e: unknown) {
        if (cancelado) return;
        setCargando(false);
        setError(mensajeErrorApi(e, 'No se pudo incrustar el dashboard de Superset.'));
      }
    };

    montar();

    return () => {
      cancelado = true;
      if (dashboardInstanceRef.current) {
        try {
          dashboardInstanceRef.current.unmount();
        } catch {
          // Silencioso
        }
        dashboardInstanceRef.current = null;
      }
      if (el) el.innerHTML = '';
    };
  }, [dashboardId, hideTitle, hideTab, hideChartControls, filtersExpanded, recargaKey]);

  // Sincronizar dinámicamente el tema en tiempo de ejecución (sin recargar el iframe)
  useEffect(() => {
    const modo: ThemeMode = temaActivo === 'dark' ? 'dark' : 'default';

    if (dashboardInstanceRef.current) {
      try {
        dashboardInstanceRef.current.setThemeMode(modo);
      } catch (err) {
        console.warn('[SupersetSdkDashboard] No se pudo cambiar el modo de tema dinámicamente:', err);
      }
    }

    if (containerRef.current) {
      const iframe = containerRef.current.querySelector('iframe');
      if (iframe) {
        iframe.style.colorScheme = temaActivo;
      }
    }
  }, [temaActivo]);

  return (
    <div
      className={className}
      style={{
        width: '100%',
        height,
        borderRadius: '12px',
        overflow: 'hidden',
        position: 'relative',
        background: 'var(--bg-card, #ffffff)',
        display: 'flex',
        flexDirection: 'column',
        ...style,
      }}
    >
      {/* Estado de carga */}
      {cargando && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.75rem',
            background:
              temaActivo === 'dark' ? 'rgba(19, 29, 49, 0.88)' : 'rgba(255, 255, 255, 0.85)',
            zIndex: 2,
            backdropFilter: 'blur(2px)',
          }}
        >
          <RefreshCw size={26} color="var(--sky-500, #0ea5e9)" style={{ animation: 'spin 1s linear infinite' }} />
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted, #64748b)' }}>
            Cargando dashboard de Superset...
          </span>
        </div>
      )}

      {/* Estado cuando no se proporciona dashboardId */}
      {!dashboardId && !cargando && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem',
            textAlign: 'center',
            background: 'var(--bg-card, #ffffff)',
            zIndex: 3,
            gap: '0.75rem',
          }}
        >
          <AlertTriangle size={26} color="var(--amber-600, #d97706)" />
          <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-main, #0f172a)' }}>
            No se especificó un identificador de dashboard (dashboardId)
          </div>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted, #64748b)', maxWidth: '420px' }}>
            Se requiere el UUID de embebido generado por Apache Superset para montar el tablero.
          </span>
        </div>
      )}

      {/* Estado de error */}
      {error && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem',
            textAlign: 'center',
            background: 'var(--bg-card, #ffffff)',
            zIndex: 3,
            gap: '1rem',
          }}
        >
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              background:
                temaActivo === 'dark' ? 'rgba(245, 158, 11, 0.15)' : 'var(--amber-50, #fffbeb)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: temaActivo === 'dark' ? '#fbbf24' : 'var(--amber-600, #d97706)',
            }}
          >
            <AlertTriangle size={24} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-main, #0f172a)' }}>
              No se pudo sincronizar con Apache Superset
            </div>
            <div
              style={{
                fontSize: '0.8rem',
                color: 'var(--text-muted, #64748b)',
                marginTop: '0.35rem',
                maxWidth: '480px',
              }}
            >
              {error}
            </div>
          </div>
          <button
            onClick={reintentar}
            className="btn btn-secondary"
            style={{ fontSize: '0.8rem', padding: '0.45rem 1rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <RefreshCw size={14} />
            <span>Reintentar conexión</span>
          </button>
        </div>
      )}

      {/* Contenedor donde el SDK inyecta el iframe */}
      <div ref={containerRef} style={{ width: '100%', height: '100%', flex: 1 }} />
    </div>
  );
};
