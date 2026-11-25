import React from 'react';
import { RefreshCw } from 'lucide-react';
import {
  FilterSelectWrapper,
  FilterResetButton,
  ESTILO_SELECT_FILTRO,
} from '@/components/shared/ui/FilterControls';
import { UsoSistema } from '@/types/telemetria.types';
import { etiquetaCanal, etiquetaFuncionalidad, etiquetaSistema } from '@/utils/telemetria.utils';
import { PERIODOS_USO, SeleccionUso } from '../../useControlTi';
import { MenuDescargaTelemetria } from '../../MenuDescargaTelemetria';

interface UsoFiltrosProps {
  seleccion: SeleccionUso;
  disponibles?: UsoSistema['filtrosDisponibles'];
  actualizadoEn?: string;
  actualizando?: boolean;
  exportandoPdf?: boolean;
  descargaDeshabilitada?: boolean;
  /** En Privacidad y Onboarding solo se muestran Período, Sistema operativo y Versión de la app. */
  modoOnboarding?: boolean;
  onCambiar: <K extends keyof SeleccionUso>(campo: K, valor: SeleccionUso[K]) => void;
  onLimpiar: () => void;
  onActualizar?: () => void;
  onExportarCsv?: () => void;
  onExportarExcel?: () => void;
  onExportarPdf?: () => void | Promise<void>;
}

/** Filtros del dashboard de uso (Req 4) y de Privacidad y Onboarding: una sola fila sobre todo lo que filtran. */
export const UsoFiltros: React.FC<UsoFiltrosProps> = ({
  seleccion,
  disponibles,
  actualizando = false,
  exportandoPdf = false,
  descargaDeshabilitada = false,
  modoOnboarding = false,
  onCambiar,
  onLimpiar,
  onActualizar,
  onExportarCsv,
  onExportarExcel,
  onExportarPdf,
}) => {
  const hayFiltros = modoOnboarding
    ? seleccion.periodo !== '7d' || !!seleccion.sistemaOperativo || !!seleccion.appVersion
    : seleccion.periodo !== '7d' ||
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

        {!modoOnboarding && (
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
        )}

        {!modoOnboarding && (
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
        )}

        <FilterSelectWrapper label="Sistema operativo">
          <select
            aria-label="Sistema operativo"
            value={seleccion.sistemaOperativo}
            onChange={(e) => onCambiar('sistemaOperativo', e.target.value)}
            style={ESTILO_SELECT_FILTRO}
          >
            <option value="">Todos</option>
            {(modoOnboarding
              ? ['ANDROID', 'IOS']
              : disponibles?.sistemasOperativos ?? ['ANDROID', 'IOS']
            ).map((so) => (
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

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', minHeight: '38px', marginLeft: 'auto' }}>
        {onActualizar && (
          <button
            type="button"
            onClick={onActualizar}
            disabled={actualizando}
            className="btn btn-secondary"
            title={actualizando ? 'Actualizando métricas...' : 'Actualizar métricas'}
            aria-label={actualizando ? 'Actualizando métricas...' : 'Actualizar métricas'}
            style={{
              width: '38px',
              height: '38px',
              minWidth: '38px',
              padding: 0,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '8px',
              boxSizing: 'border-box',
            }}
          >
            <RefreshCw
              size={16}
              className={actualizando ? 'spin-anim' : ''}
              style={{ animation: actualizando ? 'spin 1s linear infinite' : 'none' }}
            />
          </button>
        )}

        {onExportarCsv && onExportarExcel && onExportarPdf && (
          <MenuDescargaTelemetria
            disabled={descargaDeshabilitada}
            exportandoPdf={exportandoPdf}
            label="Exportar reporte de telemetría (CSV, Excel, PDF)"
            onExportarCsv={onExportarCsv}
            onExportarExcel={onExportarExcel}
            onExportarPdf={onExportarPdf}
          />
        )}
      </div>
    </div>
  );
};
