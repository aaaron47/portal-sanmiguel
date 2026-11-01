'use client';

import React from 'react';
import { FileCheck, Building, Calendar, Download } from 'lucide-react';
import { RoleViewProps } from '@/types/ui.types';
import { CardHeader } from '@/components/shared/ui/CardHeader';
import { useControlMunicipal } from './useControlMunicipal';
import { ControlMunicipalKpis } from './reportes/parts/ControlMunicipalKpis';
import { CumplimientoAreasTable } from './reportes/parts/CumplimientoAreasTable';
import { ConstanciasBalanceCards } from './constancias/parts/ConstanciasBalanceCards';

export const ControlMunicipalView: React.FC<RoleViewProps> = ({ 
  initialTab = 'control-reportes', 
  onNotify 
}) => {
  const c = useControlMunicipal(onNotify);

  const soloConstancias = initialTab === 'control-constancias';

  return (
    <div>
      {/* Selector de Periodo y Descargas */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Calendar size={18} color="var(--sky-600)" />
          <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>Periodo de Evaluación:</span>
          <select
            value={c.periodo}
            onChange={(e) => c.setPeriodo(e.target.value)}
            style={{ padding: '0.4rem 0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '0.85rem' }}
          >
            <option value="2026-10">Octubre 2026 (Mes Actual)</option>
            <option value="2026-09">Setiembre 2026</option>
            <option value="2026-T3">Tercer Trimestre 2026</option>
          </select>
        </div>

        <button onClick={c.descargarReporte} className="btn btn-secondary" style={{ fontSize: '0.85rem' }}>
          <Download size={16} /> Exportar Informe de Control
        </button>
      </div>

      {c.kpis && !soloConstancias && <ControlMunicipalKpis kpis={c.kpis} />}

      {/* Viñeta 1: Reportes de Cumplimiento por Gerencia */}
      {!soloConstancias && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <CardHeader
            icon={<Building size={20} />}
            title="Cumplimiento de Atención por Gerencia Municipal"
            aside={<span style={{ fontSize: '0.8rem', color: 'var(--slate-500)' }}>Indicador de efectividad en respuesta</span>}
          />
          <CumplimientoAreasTable areas={c.areas} />
        </div>
      )}

      {/* Viñeta 2: Balance de Constancias */}
      {c.kpis && (
        <div className="card">
          <CardHeader
            icon={<FileCheck size={20} />}
            title="Balance de Constancias de Recepción Ciudadana"
            aside={<span style={{ fontSize: '0.8rem', color: 'var(--slate-500)' }}>Base de control de trámites vecinales</span>}
          />
          <ConstanciasBalanceCards kpis={c.kpis} />
        </div>
      )}
    </div>
  );
};
