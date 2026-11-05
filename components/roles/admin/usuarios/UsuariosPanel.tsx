'use client';

import React from 'react';
import { Users } from 'lucide-react';
import { NotifyFn } from '@/types/ui.types';
import { CardHeader } from '@/components/shared/ui/CardHeader';
import { useUsuarios } from './useUsuarios';
import { CrearUsuarioForm } from './parts/CrearUsuarioForm';
import { ContrasenaTemporalAviso } from './parts/ContrasenaTemporalAviso';
import { UsuariosToolbar } from './parts/UsuariosToolbar';
import { UsuariosTable } from './parts/UsuariosTable';

export const UsuariosPanel: React.FC<{ onNotify: NotifyFn }> = ({ onNotify }) => {
  const u = useUsuarios(onNotify);

  return (
    <div className="card">
      <CardHeader icon={<Users size={20} />} title="Cuentas de Acceso y Gestión de Personal" />

      {u.credencialNueva && (
        <ContrasenaTemporalAviso credencial={u.credencialNueva} onCerrar={u.cerrarCredencialNueva} />
      )}

      {u.isCreating && <CrearUsuarioForm onSubmit={u.crearUsuario} onCancel={() => u.setIsCreating(false)} />}

      <UsuariosToolbar
        searchQuery={u.searchQuery}
        onSearch={u.setSearchQuery}
        filtroRol={u.filtroRol}
        onFiltroRolChange={u.setFiltroRol}
        filtroArea={u.filtroArea}
        onFiltroAreaChange={u.setFiltroArea}
        filtroEstado={u.filtroEstado}
        onFiltroEstadoChange={u.setFiltroEstado}
        selectedCount={u.selectedIds.length}
        isCreating={u.isCreating}
        onActivar={() => u.cambiarEstadoSeleccion(true)}
        onDesactivar={() => u.cambiarEstadoSeleccion(false)}
        onToggleCrear={() => u.setIsCreating(!u.isCreating)}
        onDescargarCSV={u.descargarCSV}
      />

      <UsuariosTable
        usuarios={u.filtrados}
        selectedIds={u.selectedIds}
        todosSeleccionados={u.todosSeleccionados}
        onToggle={u.toggleSeleccion}
        onToggleTodos={u.toggleTodos}
      />
    </div>
  );
};
