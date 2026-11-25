import { useCallback, useEffect, useState } from 'react';
import { usuariosController } from '@/controllers/usuarios.controller';
import { Usuario, ROLE_LABELS } from '@/types/auth.types';
import { NotifyFn } from '@/types/ui.types';
import { exportarCSV, exportarExcel } from '@/utils/csv.utils';
import { exportarReporteTributarioPdf } from '@/components/roles/control-municipal/tributarios/exportarReportePdf';
import { mensajeErrorApi } from '@/services/api-client.service';
import { iaDashboardsController } from '@/controllers/ia-dashboards.controller';
import { NivelMcp } from '@/types/superset.types';

export type NuevoUsuario = Omit<Usuario, 'id' | 'creadoEn' | 'activo'>;

/** Datos de acceso de una cuenta recién creada: solo en memoria, hasta que el Admin cierra el aviso. */
export interface CredencialNueva {
  nombreCompleto: string;
  usuario: string;
  contrasenaTemporal: string;
}

/** Estado y acciones de la viñeta "Usuarios del Sistema". */
export function useUsuarios(onNotify: NotifyFn) {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filtroRol, setFiltroRol] = useState<string>('todos');
  const [filtroArea, setFiltroArea] = useState<string>('todas');
  const [filtroEstado, setFiltroEstado] = useState<string>('todos');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [credencialNueva, setCredencialNueva] = useState<CredencialNueva | null>(null);

  useEffect(() => {
    usuariosController
      .getUsuarios()
      .then(setUsuarios)
      .catch((err) => onNotify('error', mensajeErrorApi(err, 'No se pudieron cargar los usuarios. Recarga la página.')));
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
    } catch (err) {
      onNotify('error', mensajeErrorApi(err, 'No se pudo cambiar el estado de los usuarios. Inténtalo de nuevo.'));
    }
  };

  const crearUsuario = async (data: NuevoUsuario) => {
    try {
      const { contrasenaTemporal, ...creado } = await usuariosController.crearUsuario(data);
      setUsuarios((prev) => [creado, ...prev]);
      setIsCreating(false);
      if (contrasenaTemporal) {
        // El usuario de acceso es el DNI (lo define el backend al crear la cuenta).
        setCredencialNueva({ nombreCompleto: creado.nombreCompleto, usuario: creado.dni, contrasenaTemporal });
      }
      onNotify('success', `Usuario ${creado.nombreCompleto} creado correctamente`);
    } catch (err) {
      // El formulario queda abierto (isCreating sigue en true) para corregir y reintentar.
      onNotify(
        'error',
        mensajeErrorApi(err, 'No se pudo crear el usuario. Inténtalo de nuevo.', {
          dni_exists: 'Ya existe una cuenta con ese DNI. Revisa los datos.',
          email_exists: 'Ya existe una cuenta con ese correo. Revisa los datos.',
          409: 'Ya existe un usuario con ese DNI o correo. Revisa los datos.',
        })
      );
    }
  };

  const construirTablaExportacion = () => {
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
    return { cabeceras, filas };
  };

  const descargarCSV = () => {
    const { cabeceras, filas } = construirTablaExportacion();
    exportarCSV('usuarios', cabeceras, filas);
    onNotify('success', `Se exportaron ${filas.length} registros a CSV`);
  };

  const descargarExcel = () => {
    const { cabeceras, filas } = construirTablaExportacion();
    exportarExcel('usuarios', cabeceras, filas);
    onNotify('success', `Se exportaron ${filas.length} registros a Excel`);
  };

  const descargarPDF = async () => {
    if (filtrados.length === 0) return;
    const { cabeceras, filas } = construirTablaExportacion();
    const resumenFiltros = [
      filtroRol !== 'todos' ? `Rol: ${ROLE_LABELS[filtroRol as keyof typeof ROLE_LABELS] || filtroRol}` : '',
      filtroArea !== 'todas' ? `Área: ${filtroArea}` : '',
      filtroEstado !== 'todos' ? `Estado: ${filtroEstado === 'activo' ? 'Activos' : 'Inactivos'}` : '',
      searchQuery.trim(),
    ]
      .filter(Boolean)
      .join(' | ');

    await exportarReporteTributarioPdf({
      tabla: {
        id: 0,
        nombre: 'Cuentas de Acceso y Gestión de Personal',
        descripcion: 'Directorio institucional de cuentas de acceso, roles asignados, áreas municipales y estado operativo',
        certificadoPor: 'Administración del Sistema y Seguridad TI',
      },
      cabeceras,
      filas,
      busquedaTexto: resumenFiltros,
      subtituloDocumento: 'Reporte Oficial Municipal',
    });
    onNotify('success', `Se exportaron ${filas.length} registros a PDF`);
  };

  const cambiarAccesoMcp = async (usuarioId: string, nuevoNivel: NivelMcp | 'DESHABILITADO') => {
    try {
      if (nuevoNivel === 'DESHABILITADO') {
        const resp = await iaDashboardsController.retirarMcpPersonal(usuarioId);
        setUsuarios((prev) =>
          prev.map((u) =>
            u.id === usuarioId
              ? {
                  ...u,
                  mcpHabilitado: false,
                  mcpNivel: undefined,
                  supersetUsuario: resp.supersetUsuario,
                }
              : u
          )
        );
        onNotify('success', 'Acceso a reportes retirado correctamente');
      } else {
        const resp = await iaDashboardsController.habilitarMcpPersonal(usuarioId, nuevoNivel);
        setUsuarios((prev) =>
          prev.map((u) =>
            u.id === usuarioId
              ? {
                  ...u,
                  mcpHabilitado: true,
                  mcpNivel: resp.nivel,
                  supersetUsuario: resp.supersetUsuario,
                  rolesSuperset: resp.rolesSuperset,
                }
              : u
          )
        );
        onNotify(
          'success',
          `Acceso a reportes habilitado (${resp.nivel === 'CONSULTA' ? 'Solo consulta' : 'Consulta y construcción'}) para ${resp.supersetUsuario || 'usuario'}`
        );
      }
    } catch (err) {
      onNotify(
        'error',
        mensajeErrorApi(err, 'No se pudo actualizar el acceso a reportes del usuario.', {
          mcp_sin_usuario_superset:
            'El personal no tiene una cuenta de analítica asociada. Debe crearse primero en el sistema de reportes.',
          bi_no_es_dueno: 'Solo el administrador o dueño puede modificar este acceso.',
        })
      );
    }
  };

  const limpiarFiltros = () => {
    setSearchQuery('');
    setFiltroRol('todos');
    setFiltroArea('todas');
    setFiltroEstado('todos');
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
    limpiarFiltros,
    selectedIds,
    todosSeleccionados,
    toggleSeleccion,
    toggleTodos,
    cambiarEstadoSeleccion,
    isCreating,
    setIsCreating,
    crearUsuario,
    credencialNueva,
    cerrarCredencialNueva: () => setCredencialNueva(null),
    descargarCSV,
    descargarExcel,
    descargarPDF,
    cambiarAccesoMcp,
  };
}
