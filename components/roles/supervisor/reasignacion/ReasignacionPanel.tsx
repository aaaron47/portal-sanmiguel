import React, { useMemo, useState } from 'react';
import { Users, ListChecks } from 'lucide-react';
import { AccionTicket, Ticket } from '@/types/ticket.types';
import { CardHeader, CardAside } from '@/components/shared/ui/CardHeader';
import { CargaFuncionario, SIN_ASIGNAR_ID, esActivo } from '@/utils/ticket.utils';
import { CargaFuncionariosTable, CriterioOrdenCarga } from './parts/CargaFuncionariosTable';
import { SupervisorTable } from '../supervision/parts/SupervisorTable';
import {
  FilterSelectWrapper,
  FilterResetButton,
  ESTILO_SELECT_FILTRO,
} from '@/components/shared/ui/FilterControls';

interface ReasignacionPanelProps {
  tickets: Ticket[];
  carga: CargaFuncionario[];
  areas?: string[];
  onSelectTicket: (t: Ticket, accion?: AccionTicket) => void;
}

export const ReasignacionPanel: React.FC<ReasignacionPanelProps> = ({
  tickets,
  carga,
  areas = [],
  onSelectTicket,
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
            aside={<CardAside>Usa “Reasignar” para pasar un reclamo a otro funcionario</CardAside>}
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
