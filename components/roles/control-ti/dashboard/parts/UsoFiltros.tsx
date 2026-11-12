import React from 'react';
import { Clock } from 'lucide-react';
import {
  FilterSelectWrapper,
  FilterResetButton,
  ESTILO_SELECT_FILTRO,
} from '@/components/shared/ui/FilterControls';
import { UsoSistema } from '@/types/telemetria.types';
import { fechaHoraPeru } from '@/utils/fecha-peru.utils';
import { etiquetaCanal, etiquetaFuncionalidad, etiquetaSistema } from '@/utils/telemetria.utils';
import { PERIODOS_USO, SeleccionUso } from '../../useControlTi';

interface UsoFiltrosProps {
  seleccion: SeleccionUso;
  disponibles?: UsoSistema['filtrosDisponibles'];
  actualizadoEn?: string;
  onCambiar: <K extends keyof SeleccionUso>(campo: K, valor: SeleccionUso[K]) => void;
  onLimpiar: () => void;
}

/** Filtros del dashboard de uso (Req 4): una sola fila sobre todo lo que filtran. */
export const UsoFiltros: React.FC<UsoFiltrosProps> = ({ seleccion, disponibles, actualizadoEn, onCambiar, onLimpiar }) => {
  const hayFiltros =
    seleccion.periodo !== '7d' ||
    !!seleccion.canal ||
    !!seleccion.funcionalidad ||
    !!seleccion.sistemaOperativo ||
    !!seleccion.appVersion;

  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        gap: '0.75rem',
        marginBottom: '1rem',
      }}
    >
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem', alignItems: 'flex-end' }}>
        <FilterSelectWrapper label="Período">
          <select
            aria-label="Período"
            value={seleccion.periodo}
            onChange={(e) => onCambiar('periodo', e.target.value as SeleccionUso['periodo'])}
            style={ESTILO_SELECT_FILTRO}
          >
            {PERIODOS_USO.map((p) => (
              <option key={p.valor} value={p.valor}>
                {p.etiqueta}
              </option>
            ))}
          </select>
        </FilterSelectWrapper>

        <FilterSelectWrapper label="Canal">
          <select
            aria-label="Canal"
            value={seleccion.canal}
            onChange={(e) => onCambiar('canal', e.target.value as SeleccionUso['canal'])}
            style={ESTILO_SELECT_FILTRO}
          >
            <option value="">Todos</option>
            {(disponibles?.canales ?? ['MOVIL', 'WEB']).map((c) => (
              <option key={c} value={c}>
                {etiquetaCanal(c)}
              </option>
            ))}
          </select>
        </FilterSelectWrapper>

        <FilterSelectWrapper label="Funcionalidad">
          <select
            aria-label="Funcionalidad"
            value={seleccion.funcionalidad}
            onChange={(e) => onCambiar('funcionalidad', e.target.value)}
            style={{ ...ESTILO_SELECT_FILTRO, width: '190px' }}
          >
            <option value="">Todas</option>
            {(disponibles?.funcionalidades ?? []).map((f) => (
              <option key={f} value={f}>
                {etiquetaFuncionalidad(f)}
              </option>
            ))}
          </select>
        </FilterSelectWrapper>

        <FilterSelectWrapper label="Sistema operativo">
          <select
            aria-label="Sistema operativo"
            value={seleccion.sistemaOperativo}
            onChange={(e) => onCambiar('sistemaOperativo', e.target.value)}
            style={ESTILO_SELECT_FILTRO}
          >
            <option value="">Todos</option>
            {(disponibles?.sistemasOperativos ?? ['ANDROID', 'IOS']).map((so) => (
              <option key={so} value={so}>
                {etiquetaSistema(so)}
              </option>
            ))}
          </select>
        </FilterSelectWrapper>

        <FilterSelectWrapper label="Versión de la app">
          <select
            aria-label="Versión de la app"
            value={seleccion.appVersion}
            onChange={(e) => onCambiar('appVersion', e.target.value)}
            style={ESTILO_SELECT_FILTRO}
          >
            <option value="">Todas</option>
            {(disponibles?.versiones ?? []).map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </FilterSelectWrapper>

        <FilterResetButton onReset={onLimpiar} activo={hayFiltros} title="Quitar los filtros" />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
        <Clock size={14} />
        {actualizadoEn ? (
          <span>
            Último dato registrado: <strong style={{ color: 'var(--text-main)' }}>{fechaHoraPeru(actualizadoEn)}</strong>{' '}
            (hora de Perú)
          </span>
        ) : (
          <span>Último dato registrado: —</span>
        )}
      </div>
    </div>
  );
};
