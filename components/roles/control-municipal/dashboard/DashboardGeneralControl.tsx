'use client';

import React, { useState } from 'react';
import {
  Building,
  Calendar,
  Download,
  BarChart3,
  Layers,
} from 'lucide-react';
import { CardHeader, CardAside } from '@/components/shared/ui/CardHeader';
import { KpisReporte, ReportePorArea } from '@/controllers/reportes.controller';
import { ControlMunicipalKpis } from '../reportes/parts/ControlMunicipalKpis';
import { CumplimientoAreasTable } from '../reportes/parts/CumplimientoAreasTable';
import { SupersetEmbedViewer } from '../superset/SupersetEmbedViewer';

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

      {/* 4. Sección Embebida: Dashboard de Apache Superset (Un solo cuadro general) */}
      {mostrarSuperset && (
        <SupersetEmbedViewer
          dashboardSeleccionadoId="reportes-tributarios"
          modoFijo
          mostrarCatalogoPlantillas={false}
        />
      )}
    </div>
  );
};
