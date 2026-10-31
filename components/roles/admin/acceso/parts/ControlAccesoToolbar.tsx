import React from 'react';
import { Download, Save, RotateCcw } from 'lucide-react';

interface ControlAccesoToolbarProps {
  isSaving: boolean;
  onGuardar: () => void;
  onRestablecer: () => void;
  onDescargarCSV: () => void;
}

export const ControlAccesoToolbar: React.FC<ControlAccesoToolbarProps> = ({
  isSaving,
  onGuardar,
  onRestablecer,
  onDescargarCSV,
}) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      <button
        onClick={onGuardar}
        disabled={isSaving}
        className="btn btn-primary"
        style={{ fontSize: '0.825rem' }}
      >
        <Save size={15} /> {isSaving ? 'Guardando...' : 'Guardar Configuración'}
      </button>

      <button
        onClick={onRestablecer}
        className="btn btn-secondary"
        style={{ fontSize: '0.825rem' }}
        title="Restablecer variables de acceso a valores por defecto"
      >
        <RotateCcw size={14} /> Valores por Defecto
      </button>
    </div>

    <button
      onClick={onDescargarCSV}
      className="btn btn-secondary"
      style={{ fontSize: '0.825rem' }}
      title="Exportar matriz de permisos en formato CSV"
    >
      <Download size={15} /> Exportar Matriz CSV
    </button>
  </div>
);
