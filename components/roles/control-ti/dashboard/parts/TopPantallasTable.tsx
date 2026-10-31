import React from 'react';
import { Eye } from 'lucide-react';
import { PantallaTrafico } from '@/types/telemetria.types';
import { CardHeader, CardAside } from '@/components/shared/ui/CardHeader';

export const TopPantallasTable: React.FC<{ pantallas: PantallaTrafico[] }> = ({ pantallas }) => (
  <div className="card">
    <CardHeader
      icon={<Eye size={18} />}
      title="Pantallas Más Visitadas de la App Vecinal"
      aside={<CardAside>Tráfico de navegación silenciosa</CardAside>}
    />

    <div className="table-container">
      <table className="data-table">
        <thead>
          <tr>
            <th>Pantalla Móvil</th>
            <th>Vistas Totales</th>
            <th>Usuarios Únicos</th>
            <th>Permanencia Media</th>
          </tr>
        </thead>
        <tbody>
          {pantallas.map((p, idx) => (
            <tr key={idx}>
              <td style={{ fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{p.pantalla}</td>
              <td>{p.vistas.toLocaleString()}</td>
              <td>{p.usuariosUnicos.toLocaleString()}</td>
              <td>{p.tiempoPromedioSegundos} seg</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);
