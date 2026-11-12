'use client';

import React from 'react';
import { Download, Save, RotateCcw, Undo2 } from 'lucide-react';

interface ControlAccesoToolbarProps {
  isSaving: boolean;
  hayCambios: boolean;
  /** false si no se pudo leer la configuración del servidor (o aún se está leyendo). */
  puedeGuardar: boolean;
  onGuardar: () => void;
  onDescartar: () => void;
  onRestablecer: () => void;
  onDescargarCSV: () => void;
}

export const ControlAccesoToolbar: React.FC<ControlAccesoToolbarProps> = ({
  isSaving,
  hayCambios,
  puedeGuardar,
  onGuardar,
  onDescartar,
  onRestablecer,
  onDescargarCSV,
}) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
      <button
        onClick={onGuardar}
        disabled={isSaving || !hayCambios || !puedeGuardar}
        className="btn btn-primary"
        style={{
          fontSize: '0.825rem',
          opacity: hayCambios && !isSaving && puedeGuardar ? 1 : 0.65,
          position: 'relative',
        }}
        title={
          !puedeGuardar
            ? 'No se puede guardar: no se pudo leer la configuración actual del servidor'
            : hayCambios
            ? 'Guardar todos los cambios de la pestaña con validación de seguridad'
            : 'No hay cambios pendientes de guardar'
        }
      >
        <Save size={15} /> {isSaving ? 'Guardando...' : 'Guardar Configuración'}
        {hayCambios && (
          <span style={{
            position: 'absolute',
            top: '-5px',
            right: '-5px',
            width: '10px',
            height: '10px',
            background: 'var(--amber-500)',
            borderRadius: '50%',
          }} />
        )}
      </button>

      {hayCambios && (
        <button
          onClick={onDescartar}
          disabled={isSaving}
          className="btn btn-secondary"
          style={{ fontSize: '0.825rem' }}
          title="Descartar las modificaciones en borrador y volver al estado guardado"
        >
          <Undo2 size={14} /> Descartar Cambios
        </button>
      )}

      <button
        onClick={onRestablecer}
        disabled={isSaving}
        className="btn btn-secondary"
        style={{ fontSize: '0.825rem' }}
        title="Cargar en borrador los valores recomendados de las políticas y activar la telemetría"
      >
        <RotateCcw size={14} /> Valores recomendados
      </button>
    </div>

    <button
      onClick={onDescargarCSV}
      className="btn btn-secondary"
      style={{ fontSize: '0.825rem' }}
      title="Exportar matriz de permisos en formato CSV"
    >
      <Download size={15} /> Exportar CSV
    </button>
  </div>
);
