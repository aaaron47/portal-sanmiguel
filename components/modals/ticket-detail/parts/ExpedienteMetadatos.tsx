import React from 'react';
import { User, MapPin, Clock, Radio } from 'lucide-react';
import { Ticket } from '@/types/ticket.types';

interface ExpedienteMetadatosProps {
  ticket: Ticket;
}

export const ExpedienteMetadatos: React.FC<ExpedienteMetadatosProps> = ({ ticket }) => (
  <div style={{ 
    display: 'grid', 
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
    gap: '1rem',
    background: 'var(--bg-card-subtle)',
    padding: '1rem',
    borderRadius: '10px',
    marginBottom: '1.25rem',
    border: '1px solid var(--border-color)',
    fontSize: '0.825rem'
  }}>
    <div>
      <div style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
        <User size={14} color="var(--primary-500)" /> Ciudadano:
      </div>
      <div style={{ fontWeight: 600, color: 'var(--text-main)', marginTop: '2px' }}>
        {ticket.ciudadanoNombre} (DNI: {ticket.ciudadanoDni || '—'})
      </div>
    </div>
    <div>
      <div style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
        <MapPin size={14} color="var(--primary-500)" /> Área Responsable:
      </div>
      <div style={{ fontWeight: 600, color: 'var(--text-main)', marginTop: '2px' }}>
        {ticket.areaAsignada || 'Sin área asignada'}
      </div>
    </div>
    <div>
      <div style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
        <Clock size={14} color="var(--primary-500)" /> Ingreso:
      </div>
      <div style={{ fontWeight: 600, color: 'var(--text-main)', marginTop: '2px' }}>
        {ticket.fechaCreacion}
      </div>
    </div>
    <div>
      <div style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
        <Radio size={14} color="var(--primary-500)" /> Canal del inconveniente:
      </div>
      <div style={{ fontWeight: 600, color: 'var(--text-main)', marginTop: '2px' }}>
        {ticket.canalIncidente || 'No indicado'}
      </div>
    </div>
  </div>
);
