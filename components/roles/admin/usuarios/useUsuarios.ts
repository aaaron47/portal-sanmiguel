import { useCallback, useEffect, useState } from 'react';
import { usuariosController } from '@/controllers/usuarios.controller';
import { Usuario, ROLE_LABELS } from '@/types/auth.types';
import { NotifyFn } from '@/types/ui.types';
import { exportarCSV } from '@/utils/csv.utils';

export type NuevoUsuario = Omit<Usuario, 'id' | 'creadoEn' | 'activo'>;

/** Estado y acciones de la viñeta "Usuarios del Sistema". */
export function useUsuarios(onNotify: NotifyFn) {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filtroRol, setFiltroRol] = useState<string>('todos');
  const [filtroArea, setFiltroArea] = useState<string>('todas');
  const [filtroEstado, setFiltroEstado] = useState<string>('todos');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    usuariosController
      .getUsuarios()
      .then(setUsuarios)
      .catch(() => onNotify('error', 'Error al cargar datos administrativos'));
  }, [onNotify]);

  const filtrados = usuarios.filter((u) => {
    if (filtroRol !== 'todos' && u.rol !== filtroRol) return false;
    if (filtroArea !== 'todas' && u.area !== filtroArea) return false;
    if (filtroEstado !== 'todos') {
      const activo = filtroEstado === 'activo';
      if (u.activo !== activo) return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        u.nombreCompleto.toLowerCase().includes(q) ||
        u.dni.includes(searchQuery) ||
        u.email.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const todosSeleccionados = filtrados.length > 0 && filtrados.every((u) => selectedIds.includes(u.id));

  const toggleSeleccion = useCallback((id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }, []);

  const toggleTodos = () => setSelectedIds(todosSeleccionados ? [] : filtrados.map((u) => u.id));

  const cambiarEstadoSeleccion = async (activo: boolean) => {
    if (selectedIds.length === 0) return;
    try {
      await Promise.all(selectedIds.map((id) => usuariosController.cambiarEstadoUsuario(id, activo)));
      setUsuarios((prev) => prev.map((u) => (selectedIds.includes(u.id) ? { ...u, activo } : u)));
      onNotify('success', `${selectedIds.length} usuario(s) ${activo ? 'activado(s)' : 'desactivado(s)'}`);
      setSelectedIds([]);
    } catch {
      onNotify('error', 'No se pudo cambiar el estado de los usuarios');
    }
  };

  const crearUsuario = async (data: NuevoUsuario) => {
    try {
      const creado = await usuariosController.crearUsuario(data);
      setUsuarios((prev) => [creado, ...prev]);
      setIsCreating(false);
      onNotify('success', `Usuario ${creado.nombreCompleto} creado correctamente`);
    } catch {
      onNotify('error', 'Error al crear usuario');
    }
  };

  const descargarCSV = () => {
    const cabeceras = ['ID', 'DNI', 'Nombre Completo', 'Correo Institucional', 'Rol', 'Área Municipal', 'Estado'];
    const filas = filtrados.map((u) => [
      u.id,
      u.dni,
      u.nombreCompleto,
      u.email,
      ROLE_LABELS[u.rol] || u.rol,
      u.area || 'Sin área',
      u.activo ? 'Activo' : 'Inactivo',
    ]);
    exportarCSV('usuarios', cabeceras, filas);
    onNotify('success', `Se exportaron ${filas.length} registros a CSV`);
  };

  return {
    filtrados,
    searchQuery,
    setSearchQuery,
    filtroRol,
    setFiltroRol,
    filtroArea,
    setFiltroArea,
    filtroEstado,
    setFiltroEstado,
    selectedIds,
    todosSeleccionados,
    toggleSeleccion,
    toggleTodos,
    cambiarEstadoSeleccion,
    isCreating,
    setIsCreating,
    crearUsuario,
    descargarCSV,
  };
}
