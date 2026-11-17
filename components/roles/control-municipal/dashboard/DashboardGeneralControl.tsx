'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Building,
  Calendar,
  Download,
  BarChart3,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';
import { CardHeader, CardAside } from '@/components/shared/ui/CardHeader';
import { KpisReporte, ReportePorArea } from '@/controllers/reportes.controller';
import { ControlMunicipalKpis } from '../reportes/parts/ControlMunicipalKpis';
import { CumplimientoAreasTable } from '../reportes/parts/CumplimientoAreasTable';
import { SupersetSdkDashboard } from '@/components/superset/SupersetSdkDashboard';
import { iaDashboardsController } from '@/controllers/ia-dashboards.controller';
import { SupersetDashboardInfo } from '@/types/superset.types';
import { mensajeErrorApi } from '@/services/api-client.service';

interface DashboardGeneralControlProps {
  kpis: KpisReporte | null;
  areas: ReportePorArea[];
  periodo: string;
  onPeriodoChange: (periodo: string) => void;
  onDescargarReporte: () => void;
}

export const DashboardGeneralControl: React.FC<DashboardGeneralControlProps> = ({
  kpis,
  areas,
  periodo,
  onPeriodoChange,
  onDescargarReporte,
}) => {
  const [mostrarSuperset, setMostrarSuperset] = useState<boolean>(true);
  const [dashboardTributario, setDashboardTributario] = useState<SupersetDashboardInfo | null>(null);
  const [cargandoDashboard, setCargandoDashboard] = useState<boolean>(true);
  const [errorDashboard, setErrorDashboard] = useState<string | null>(null);
  const [recargaKey, setRecargaKey] = useState<number>(0);

  const reintentar = useCallback(() => {
    setCargandoDashboard(true);
    setErrorDashboard(null);
    setRecargaKey((k) => k + 1);
  }, []);

  useEffect(() => {
    let cancelado = false;

    iaDashboardsController
      .getDashboardOficialTributario('CONTROL_MUNICIPAL')
      .then((dash) => {
        if (cancelado) return;
        setDashboardTributario(dash);
        setErrorDashboard(null);
      })
      .catch((err) => {
        if (cancelado) return;
        setErrorDashboard(
          mensajeErrorApi(err, 'No se pudo cargar el dashboard de Reportes Tributarios desde la API.')
        );
      })
      .finally(() => {
        if (!cancelado) setCargandoDashboard(false);
      });

    return () => {
      cancelado = true;
    };
  }, [recargaKey]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* 1. Selector de Periodo y Descargas */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Calendar size={18} color="var(--sky-600)" />
          <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>Periodo de Evaluación:</span>
          <select
            value={periodo}
            onChange={(e) => onPeriodoChange(e.target.value)}
            style={{ padding: '0.4rem 0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '0.85rem' }}
          >
            <option value="2026-11">Noviembre 2026 (En Curso)</option>
            <option value="2026-10">Octubre 2026</option>
            <option value="2026-09">Setiembre 2026</option>
            <option value="2026-T3">Tercer Trimestre 2026</option>
          </select>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            onClick={() => setMostrarSuperset(!mostrarSuperset)}
            className={`btn ${mostrarSuperset ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: '0.85rem' }}
          >
            <BarChart3 size={15} />
            {mostrarSuperset ? 'Ocultar Dashboard Superset' : 'Mostrar Dashboard Superset'}
          </button>

          <button onClick={onDescargarReporte} className="btn btn-secondary" style={{ fontSize: '0.85rem' }}>
            <Download size={16} /> Exportar Informe de Control
          </button>
        </div>
      </div>

      {/* 2. KPIs Ejecutivos del Portal y Cumplimiento */}
      {kpis && <ControlMunicipalKpis kpis={kpis} />}

      {/* 3. Cumplimiento de Atención por Gerencia Municipal (OCI) */}
      <div className="card">
        <CardHeader
          icon={<Building size={20} />}
          title="Cumplimiento de Atención por Gerencia Municipal"
          aside={<CardAside>Indicador de efectividad y tiempo de respuesta</CardAside>}
        />
        <CumplimientoAreasTable areas={areas} />
      </div>

      {/* 4. Sección Embebida: Dashboard de Apache Superset (Obtenido vía API: Reportes Tributarios) */}
      {mostrarSuperset && (
        <div className="card" style={{ padding: '0.75rem', borderRadius: '16px' }}>
          {cargandoDashboard ? (
            <div
              style={{
                height: '420px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.75rem',
                color: 'var(--text-muted)',
              }}
            >
              <RefreshCw size={26} style={{ animation: 'spin 1s linear infinite' }} color="var(--sky-600)" />
              <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-main)' }}>
                Cargando Dashboard Oficial de Reportes Tributarios...
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Consultando dashboards publicados vía API
              </span>
            </div>
          ) : errorDashboard ? (
            <div
              style={{
                minHeight: '220px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.75rem',
                padding: '2rem',
                textAlign: 'center',
              }}
            >
              <AlertTriangle size={28} color="var(--red-600)" />
              <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-main)' }}>
                {errorDashboard}
              </div>
              <button
                type="button"
                onClick={reintentar}
                className="btn btn-secondary"
                style={{ fontSize: '0.8rem', padding: '0.4rem 0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <RefreshCw size={14} />
                <span>Reintentar</span>
              </button>
            </div>
          ) : dashboardTributario?.embedUuid ? (
            <SupersetSdkDashboard dashboardId={dashboardTributario.embedUuid} />
          ) : (
            <div
              style={{
                minHeight: '220px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                padding: '2rem',
                textAlign: 'center',
              }}
            >
              <AlertTriangle size={28} color="var(--amber-600)" />
              <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-main)' }}>
                El dashboard &quot;{dashboardTributario?.titulo || 'Reportes Tributarios'}&quot; no tiene embebido habilitado en Superset.
              </div>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                El identificador de embebido (embedUuid) devuelto por la API es nulo.
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
