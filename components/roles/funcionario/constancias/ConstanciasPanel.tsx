'use client';

import React, { useState } from 'react';
import { FileCheck } from 'lucide-react';
import { Ticket } from '@/types/ticket.types';
import { NotifyFn } from '@/types/ui.types';
import { CardHeader, CardAside } from '@/components/shared/ui/CardHeader';
import { exportarCSV } from '@/utils/csv.utils';
import { ConstanciasKpis } from './parts/ConstanciasKpis';
import { ConstanciasFiltros, DictamenFiltro } from './parts/ConstanciasFiltros';
import { ConstanciasTable } from './parts/ConstanciasTable';

interface ConstanciasPanelProps {
  tickets: Ticket[];
  onSelectTicket: (ticket: Ticket) => void;
  onNotify?: NotifyFn;
}

export const ConstanciasPanel: React.FC<ConstanciasPanelProps> = ({
  tickets,
  onSelectTicket,
  onNotify,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filtroDictamen, setFiltroDictamen] = useState<DictamenFiltro>('todos');

  // Solo tickets con solicitud de constancia
  const baseConstancias = tickets.filter((t) => t.tieneConstancia);

  const constanciasFiltradas = baseConstancias.filter((t) => {
    // Filtro por dictamen
    if (filtroDictamen === 'por_evaluar') {
      if (t.estadoConstancia && t.estadoConstancia !== 'sin_evaluar') return false;
    } else if (filtroDictamen === 'aprobada') {
      if (t.estadoConstancia !== 'aprobada') return false;
    } else if (filtroDictamen === 'observada') {
      if (t.estadoConstancia !== 'observada') return false;
    }

    // Filtro por búsqueda
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      return (
        t.folio.toLowerCase().includes(q) ||
        t.ciudadanoNombre.toLowerCase().includes(q) ||
        t.ciudadanoDni.includes(q) ||
        t.asunto.toLowerCase().includes(q)
      );
    }

    return true;
  });

  const handleDescargarCSV = () => {
    const cabeceras = [
      'Folio',
      'Ciudadano',
      'DNI',
      'Asunto',
      'Estado Reclamo',
      'Dictamen Constancia',
      'Fecha Ingreso',
      'Área Asignada',
    ];
    const filas = constanciasFiltradas.map((t) => [
      t.folio,
      t.ciudadanoNombre,
      t.ciudadanoDni,
      t.asunto,
      t.estado,
      t.estadoConstancia === 'aprobada'
        ? 'Aprobada'
        : t.estadoConstancia === 'observada'
        ? 'Observada'
        : 'Por Evaluar',
      t.fechaCreacion,
      t.areaAsignada,
    ]);

    exportarCSV('evaluacion_constancias', cabeceras, filas);
    if (onNotify) {
      onNotify('success', 'Archivo CSV de constancias descargado con éxito');
    }
  };

  return (
    <div>
      <ConstanciasKpis tickets={tickets} />

      <div className="card">
        <CardHeader
          icon={<FileCheck size={20} />}
          title="Evaluación de Constancias Formales"
          aside={
            <CardAside bold>
              {constanciasFiltradas.length} de {baseConstancias.length} caso(s)
            </CardAside>
          }
        />

        <ConstanciasFiltros
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          filtroDictamen={filtroDictamen}
          onDictamenChange={setFiltroDictamen}
          onDescargarCSV={handleDescargarCSV}
        />

        <ConstanciasTable
          tickets={constanciasFiltradas}
          onSelectTicket={(t) => onSelectTicket(t)}
        />
      </div>
    </div>
  );
};
