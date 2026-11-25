import React, { useMemo, useState } from 'react';
import { Users, ListChecks } from 'lucide-react';
import { AccionTicket, Ticket } from '@/types/ticket.types';
import { NotifyFn } from '@/types/ui.types';
import { CardHeader, CardAside } from '@/components/shared/ui/CardHeader';
import { ReporteExportMenu } from '@/components/shared/ui/ReporteExportMenu';
import { CargaFuncionario, SIN_ASIGNAR_ID, esActivo, textoEstado } from '@/utils/ticket.utils';
import { exportarCSV, exportarExcel } from '@/utils/csv.utils';
import { exportarReporteTributarioPdf } from '@/components/roles/control-municipal/tributarios/exportarReportePdf';
import { CargaFuncionariosTable, CriterioOrdenCarga } from './parts/CargaFuncionariosTable';
import { SupervisorTable } from '../supervision/parts/SupervisorTable';
import {
  FilterSelectWrapper,
  FilterResetButton,
  ESTILO_SELECT_FILTRO,
  ESTILO_LABEL_FILTRO,
} from '@/components/shared/ui/FilterControls';

interface ReasignacionPanelProps {
  tickets: Ticket[];
  carga: CargaFuncionario[];
  areas?: string[];
  onSelectTicket: (t: Ticket, accion?: AccionTicket) => void;
  onNotify?: NotifyFn;
}

export const ReasignacionPanel: React.FC<ReasignacionPanelProps> = ({
  tickets,
  carga,
  areas = [],
  onSelectTicket,
  onNotify,
}) => {
  const [seleccionadoId, setSeleccionadoId] = useState<string | null>(null);
  const [campoOrden, setCampoOrden] = useState<CriterioOrdenCarga>('activos');
  const [direccionOrden, setDireccionOrden] = useState<'asc' | 'desc'>('desc');
  const [areaFiltro, setAreaFiltro] = useState<string>('todas');

  const alternarOrden = (campo: CriterioOrdenCarga) => {
    if (campoOrden === campo) {
      setDireccionOrden((prev) => (prev === 'desc' ? 'asc' : 'desc'));
    } else {
      setCampoOrden(campo);
      setDireccionOrden(campo === 'nombre' ? 'asc' : 'desc');
    }
  };

  const cargaFiltradaYOrdenada = useMemo(() => {
    const filtrada =
      areaFiltro === 'todas'
        ? [...carga]
        : carga.filter((c) => c.area === areaFiltro || c.id === SIN_ASIGNAR_ID);

    return filtrada.sort((a, b) => {
      let comparacion = 0;
      switch (campoOrden) {
        case 'activos':
          comparacion = b.activos - a.activos || b.alta - a.alta;
          break;
        case 'alta':
          comparacion = b.alta - a.alta || b.activos - a.activos;
          break;
        case 'media':
          comparacion = b.media - a.media || b.activos - a.activos;
          break;
        case 'baja':
          comparacion = b.baja - a.baja || b.activos - a.activos;
          break;
        case 'porAprobar':
          comparacion = b.porAprobar - a.porAprobar || b.activos - a.activos;
          break;
        case 'nombre':
          comparacion = a.nombre.localeCompare(b.nombre);
          break;
      }
      return direccionOrden === 'desc' ? comparacion : -comparacion;
    });
  }, [carga, areaFiltro, campoOrden, direccionOrden]);

  // Si el supervisor aún no eligió, se muestra al primer funcionario con casos en el orden actual
  const idEfectivo =
    seleccionadoId ?? cargaFiltradaYOrdenada.find((c) => c.activos > 0)?.id ?? null;
  const seleccionado = carga.find((c) => c.id === idEfectivo);

  const ticketsDelFuncionario = tickets.filter(
    (t) =>
      esActivo(t) &&
      (idEfectivo === SIN_ASIGNAR_ID
        ? !t.funcionarioAsignadoId
        : t.funcionarioAsignadoId === idEfectivo)
  );

  const construirTablaCarga = () => {
    const cabeceras = [
      'Funcionario',
      'Estado Usuario',
      'Área Municipal',
      'Prioridad Alta',
      'Prioridad Media',
      'Prioridad Baja',
      'Por Aprobar',
      'Casos Activos',
    ];
    const filas = cargaFiltradaYOrdenada.map((c) => [
      c.nombre,
      c.activo ? 'Activo' : 'Inactivo',
      c.area || '—',
      String(c.alta),
      String(c.media),
      String(c.baja),
      String(c.porAprobar),
      String(c.activos),
    ]);
    return { cabeceras, filas };
  };

  const handleExportCargaCsv = () => {
    const { cabeceras, filas } = construirTablaCarga();
    exportarCSV('reasignacion_carga_funcionarios', cabeceras, filas);
    onNotify?.('success', 'Reporte CSV de carga por funcionario descargado');
  };

  const handleExportCargaExcel = () => {
    const { cabeceras, filas } = construirTablaCarga();
    exportarExcel('reasignacion_carga_funcionarios', cabeceras, filas);
    onNotify?.('success', 'Reporte Excel de carga por funcionario descargado');
  };

  const handleExportCargaPdf = async () => {
    if (cargaFiltradaYOrdenada.length === 0) return;
    const { cabeceras, filas } = construirTablaCarga();
    await exportarReporteTributarioPdf({
      tabla: {
        id: 0,
        nombre: 'Reasignación de Casos y Carga por Funcionario',
        descripcion: 'Distribución operativa de reclamos abiertos por funcionario y nivel de prioridad',
        certificadoPor: 'Supervisión General Municipal',
      },
      cabeceras,
      filas,
      busquedaTexto: areaFiltro !== 'todas' ? `Área: ${areaFiltro}` : '',
      subtituloDocumento: 'Reporte Oficial de Supervisión',
    });
    onNotify?.('success', 'Reporte PDF de carga por funcionario descargado');
  };

  const construirTablaReclamosFuncionario = () => {
    const cabeceras = [
      'Folio',
      'Ciudadano',
      'DNI',
      'Área Municipal',
      'Funcionario Asignado',
      'Asunto',
      'Estado',
      'Prioridad',
      'Fecha Ingreso',
    ];
    const filas = ticketsDelFuncionario.map((t) => [
      t.folio,
      t.ciudadanoNombre,
      t.ciudadanoDni,
      t.areaAsignada || 'Sin área',
      t.funcionarioAsignadoNombre || 'Sin asignar',
      t.asunto,
      textoEstado(t),
      t.prioridad,
      t.fechaCreacion,
    ]);
    return { cabeceras, filas };
  };

  const handleExportCasosCsv = () => {
    const { cabeceras, filas } = construirTablaReclamosFuncionario();
    exportarCSV('reclamos_abiertos_reasignacion', cabeceras, filas);
    onNotify?.('success', 'Reporte CSV de reclamos abiertos descargado');
  };

  const handleExportCasosExcel = () => {
    const { cabeceras, filas } = construirTablaReclamosFuncionario();
    exportarExcel('reclamos_abiertos_reasignacion', cabeceras, filas);
    onNotify?.('success', 'Reporte Excel de reclamos abiertos descargado');
  };

  const handleExportCasosPdf = async () => {
    if (!seleccionado || ticketsDelFuncionario.length === 0) return;
    const { cabeceras, filas } = construirTablaReclamosFuncionario();
    const tituloCasos =
      seleccionado.id === SIN_ASIGNAR_ID
        ? 'Reclamos Abiertos sin Funcionario Asignado'
        : `Reclamos Abiertos - ${seleccionado.nombre}`;
    await exportarReporteTributarioPdf({
      tabla: {
        id: 0,
        nombre: tituloCasos,
        descripcion: 'Casos activos sujetos a evaluación o reasignación operativa',
        certificadoPor: 'Supervisión General Municipal',
      },
      cabeceras,
      filas,
      busquedaTexto: seleccionado.area ? `Área: ${seleccionado.area}` : '',
      subtituloDocumento: 'Reporte Oficial de Supervisión',
    });
    onNotify?.('success', 'Reporte PDF de reclamos abiertos descargado');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div className="card">
        <CardHeader
          icon={<Users size={20} />}
          title="Carga de trabajo por funcionario"
          aside={<CardAside>Distribución de reclamos y reasignación operativa</CardAside>}
        />

        {/* Barra de Filtros y Ordenamiento */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            flexWrap: 'wrap',
            gap: '0.75rem',
            alignItems: 'flex-end',
            marginBottom: '1.25rem',
          }}
        >
          {/* Ordenar por (con etiqueta encima y selector estándar) */}
          <FilterSelectWrapper label="Ordenar por" width="180px">
            <select
              id="orden-reasignacion"
              aria-label="Ordenar por"
              value={`${campoOrden}-${direccionOrden}`}
              onChange={(e) => {
                const [campo, dir] = e.target.value.split('-') as [CriterioOrdenCarga, 'asc' | 'desc'];
                setCampoOrden(campo);
                setDireccionOrden(dir);
              }}
              style={{ ...ESTILO_SELECT_FILTRO, width: '180px' }}
            >
              <option value="activos-desc">Casos activos (Mayor)</option>
              <option value="activos-asc">Casos activos (Menor)</option>
              <option value="alta-desc">Prioridad alta (Mayor)</option>
              <option value="alta-asc">Prioridad alta (Menor)</option>
              <option value="media-desc">Prioridad media (Mayor)</option>
              <option value="baja-desc">Prioridad baja (Mayor)</option>
              <option value="porAprobar-desc">Por aprobar (Mayor)</option>
              <option value="nombre-asc">Funcionario (A → Z)</option>
              <option value="nombre-desc">Funcionario (Z → A)</option>
            </select>
          </FilterSelectWrapper>

          {/* Filtro por Área */}
          {areas.length > 0 && (
            <FilterSelectWrapper label="Área">
              <select
                id="filtro-area-reasignacion"
                aria-label="Filtrar por área"
                value={areaFiltro}
                onChange={(e) => setAreaFiltro(e.target.value)}
                style={ESTILO_SELECT_FILTRO}
              >
                <option value="todas">Todo</option>
                {areas.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </FilterSelectWrapper>
          )}

          {/* Botón Eliminar Filtros y restablecer orden */}
          <FilterResetButton
            onReset={() => {
              setAreaFiltro('todas');
              setCampoOrden('activos');
              setDireccionOrden('desc');
            }}
            activo={areaFiltro !== 'todas' || campoOrden !== 'activos' || direccionOrden !== 'desc'}
            title="Eliminar filtros y restablecer orden"
          />

          {/* Menú compacto de exportación (...) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', justifyContent: 'flex-end' }}>
            <span style={{ ...ESTILO_LABEL_FILTRO, visibility: 'hidden' }}>&nbsp;</span>
            <ReporteExportMenu
              onExportCsv={handleExportCargaCsv}
              onExportExcel={handleExportCargaExcel}
              onExportPdf={handleExportCargaPdf}
              disabled={cargaFiltradaYOrdenada.length === 0}
              title="Exportar carga de trabajo por funcionario (CSV, Excel, PDF)"
            />
          </div>
        </div>

        <CargaFuncionariosTable
          carga={cargaFiltradaYOrdenada}
          campoOrden={campoOrden}
          direccionOrden={direccionOrden}
          onAlternarOrden={alternarOrden}
          seleccionadoId={idEfectivo}
          onSeleccionar={setSeleccionadoId}
        />
      </div>

      {seleccionado && (
        <div className="card">
          <CardHeader
            icon={<ListChecks size={20} />}
            title={
              seleccionado.id === SIN_ASIGNAR_ID
                ? 'Reclamos abiertos sin funcionario'
                : `Reclamos abiertos de ${seleccionado.nombre}`
            }
            aside={
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                <CardAside>Usa “Reasignar” para pasar un reclamo a otro funcionario</CardAside>
                <ReporteExportMenu
                  onExportCsv={handleExportCasosCsv}
                  onExportExcel={handleExportCasosExcel}
                  onExportPdf={handleExportCasosPdf}
                  disabled={ticketsDelFuncionario.length === 0}
                  title="Exportar reclamos abiertos del funcionario (CSV, Excel, PDF)"
                />
              </div>
            }
          />
          <SupervisorTable
            tickets={ticketsDelFuncionario}
            onSelectTicket={onSelectTicket}
            modoReasignacion
            mensajeVacio="Este funcionario no tiene reclamos abiertos."
          />
        </div>
      )}
    </div>
  );
};
