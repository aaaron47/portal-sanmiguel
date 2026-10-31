'use client';

import React from 'react';
import { RoleViewProps } from '@/types/ui.types';
import { UsuariosPanel } from './usuarios/UsuariosPanel';
import { AuditoriaPanel } from './auditoria/AuditoriaPanel';
import { ControlAccesoPanel } from './acceso/ControlAccesoPanel';

export const AdminView: React.FC<RoleViewProps> = ({ initialTab = 'admin-usuarios', onNotify }) => {
  return (
    <div>
      {initialTab === 'admin-usuarios' && <UsuariosPanel onNotify={onNotify} />}
      {initialTab === 'admin-auditoria' && <AuditoriaPanel onNotify={onNotify} />}
      {initialTab === 'admin-acceso' && <ControlAccesoPanel onNotify={onNotify} />}
    </div>
  );
};
