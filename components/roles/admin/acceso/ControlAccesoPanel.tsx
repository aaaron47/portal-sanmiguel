'use client';

import React from 'react';
import { KeyRound, ShieldCheck } from 'lucide-react';
import { NotifyFn } from '@/types/ui.types';
import { CardHeader, CardAside } from '@/components/shared/ui/CardHeader';
import { useControlAcceso } from './useControlAcceso';
import { ControlAccesoToolbar } from './parts/ControlAccesoToolbar';
import { VariablesAccesoCards } from './parts/VariablesAccesoCards';
import { MatrizPermisosTable } from './parts/MatrizPermisosTable';

export const ControlAccesoPanel: React.FC<{ onNotify: NotifyFn }> = ({ onNotify }) => {
  const c = useControlAcceso(onNotify);

  return (
    <div className="card">
      <CardHeader
        icon={<KeyRound size={20} />}
        title="Control de Acceso y Políticas de Seguridad"
        aside={
          <CardAside>
            Políticas de autenticación, sesión y matriz RBAC municipal
          </CardAside>
        }
      />

      <ControlAccesoToolbar
        isSaving={c.isSaving}
        onGuardar={c.guardarCambios}
        onRestablecer={c.restablecerValores}
        onDescargarCSV={c.descargarCSV}
      />

      {/* Sección 1: Variables de configuración de acceso */}
      <h4 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.75rem' }}>
        Variables de Sesión y Reglas de Autenticación
      </h4>
      <VariablesAccesoCards variables={c.variables} onChange={c.updateVariable} />

      {/* Sección 2: Matriz de Control de Acceso por Roles (RBAC) */}
      <div style={{ marginTop: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
          <ShieldCheck size={18} style={{ color: 'var(--sky-600)' }} />
          <h4 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-main)' }}>
            Matriz de Permisos y Alcance Institucional por Rol
          </h4>
        </div>
        <MatrizPermisosTable permisos={c.matrizPermisos} />
      </div>
    </div>
  );
};
