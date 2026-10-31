'use client';

import React from 'react';
import { ShieldAlert } from 'lucide-react';
import { NotifyFn } from '@/types/ui.types';
import { CardHeader, CardAside } from '@/components/shared/ui/CardHeader';
import { useAuditoria } from './useAuditoria';
import { AuditoriaToolbar } from './parts/AuditoriaToolbar';
import { AuditoriaTable } from './parts/AuditoriaTable';

export const AuditoriaPanel: React.FC<{ onNotify: NotifyFn }> = ({ onNotify }) => {
  const a = useAuditoria(onNotify);

  return (
    <div className="card">
      <CardHeader
        icon={<ShieldAlert size={20} />}
        title="Registros de Auditoría y Trazabilidad Administrativa"
        aside={
          <CardAside>
            Base de Datos: Tabla <code>auditoria</code> SANMI_APP
          </CardAside>
        }
      />

      <AuditoriaToolbar
        searchQuery={a.query}
        onSearch={a.setQuery}
        filtroFecha={a.filtroFecha}
        onFiltroFechaChange={a.setFiltroFecha}
        filtroResponsable={a.filtroResponsable}
        onFiltroResponsableChange={a.setFiltroResponsable}
        filtroAccion={a.filtroAccion}
        onFiltroAccionChange={a.setFiltroAccion}
        responsablesDisponibles={a.responsablesDisponibles}
        accionesDisponibles={a.accionesDisponibles}
        onDescargarCSV={a.descargarCSV}
        onResetFiltros={a.resetFiltros}
      />

      <AuditoriaTable logs={a.filtrados} />
    </div>
  );
};
