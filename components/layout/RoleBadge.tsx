import React from 'react';
import { UserRole } from '@/types/auth.types';
import { Shield, UserCheck, Eye, Activity, FileText } from 'lucide-react';

interface RoleBadgeProps {
  rol: UserRole;
  showIcon?: boolean;
}

const ROLE_CONFIG: Record<UserRole, { label: string; icon: React.ComponentType<{ size?: number }> }> = {
  ADMIN: { label: 'Administrador (Usuarios / Auditoría)', icon: Shield },
  FUNCIONARIO: { label: 'Funcionario (Atención / Constancias)', icon: UserCheck },
  SUPERVISOR: { label: 'Supervisor (Aprobación / Reasignación)', icon: Eye },
  CONTROL_MUNICIPAL: { label: 'Control Municipal (Lectura / Reportes)', icon: FileText },
  CONTROL_TI: { label: 'Control TI (Lectura / Telemetría App)', icon: Activity },
};

export const RoleBadge: React.FC<RoleBadgeProps> = ({ rol, showIcon = true }) => {
  const config = ROLE_CONFIG[rol] || { label: rol, icon: Shield };
  const IconComponent = config.icon;

  return (
    <span className={`badge-role ${rol}`}>
      {showIcon && <IconComponent size={14} />}
      {config.label}
    </span>
  );
};
