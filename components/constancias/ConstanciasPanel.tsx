'use client';

import React, { useState } from 'react';
import { FileCheck } from 'lucide-react';
import { NotifyFn } from '@/types/ui.types';
import { SolicitudConstancia } from '@/types/constancia.types';
import { CardHeader, CardAside } from '@/components/shared/ui/CardHeader';
import { constanciasController } from '@/controllers/constancias.controller';
import { mensajeErrorApi } from '@/services/api-client.service';
import { exportarCSV } from '@/utils/csv.utils';
import { fechaHoraPeru } from '@/utils/fecha-peru.utils';
import { useConstancias, MENSAJES_CONSTANCIAS } from './useConstancias';
import { ConstanciasKpis } from './parts/ConstanciasKpis';
import { ConstanciasFiltros } from './parts/ConstanciasFiltros';
import { ConstanciasTable } from './parts/ConstanciasTable';
import { ConstanciaDetalleModal } from './parts/ConstanciaDetalleModal';

interface ConstanciasPanelProps {
  onNotify: NotifyFn;
}

/**
 * Evaluación de solicitudes de constancia de no adeudo (Req 2). La usan el funcionario y el supervisor: los dos pueden
 * aprobar y desaprobar. Los botones salen de `accionesPermitidas` del backend.
 */
export const ConstanciasPanel: React.FC<ConstanciasPanelProps> = ({ onNotify }) => {
  const c = useConstancias();
  const [abierta, setAbierta] = useState<SolicitudConstancia | null>(null);
  const [exportando, setExportando] = useState(false);

  // Exporta todas las solicitudes que cumplen los filtros, no solo la página visible.
  const exportar = async () => {
    setExportando(true);
    try {
      const filtros = { estado: c.estado || undefined, busqueda: c.busquedaAplicada, tamano: 50 };
      const primera = await constanciasController.listar({ ...filtros, pagina: 1 });
      const todas = [...primera.items];
      for (let p = 2; p <= primera.totalPaginas; p++) todas.push(...(await constanciasController.listar({ ...filtros, pagina: p })).items);
      if (todas.length === 0) {
        onNotify('info', 'No hay solicitudes para exportar con estos filtros.');
        return;
      }
      exportarCSV(
        'solicitudes_constancia_no_adeudo',
        ['Número', 'Estado', 'Solicitada', 'Contribuyente', 'Código contribuyente', 'Documento', 'Predio', 'Dirección', 'Tasa pagada', 'Deuda pendiente', 'Cuotas pendientes', 'Atendida por', 'Atendida el', 'Motivo', 'Vigente hasta'],
        todas.map((s) => [
          s.numero,
          s.estadoEtiqueta,
          fechaHoraPeru(s.solicitadoEn),
          s.contribuyente.nombre,
          s.contribuyente.codigo,
          `${s.contribuyente.tipoDocumento} ${s.contribuyente.documento}`,
          s.predio.codigo,
          s.predio.direccion,
          s.pago ? 'Sí' : 'No',
          s.deuda?.montoPendiente ?? '',
          s.deuda?.cuotasPendientes ?? '',
          s.atendidoPor ?? '',
          s.atendidoEn ? fechaHoraPeru(s.atendidoEn) : '',
          s.motivoRechazo ?? '',
          s.constancia?.vigenteHasta ?? '',
        ])
      );
      onNotify('success', `Se exportaron ${todas.length} solicitud(es) a CSV.`);
    } catch (err) {
      onNotify('error', mensajeErrorApi(err, 'No se pudo exportar. Inténtalo de nuevo.', MENSAJES_CONSTANCIAS));
    } finally {
      setExportando(false);
    }
  };

  return (
    <div>
      <ConstanciasKpis conteos={c.conteos} />

      <div className="card">
        <CardHeader
          icon={<FileCheck size={20} />}
          title="Constancias de No Adeudo"
          aside={<CardAside>Aprueba las que están en verificación con la tasa pagada y sin deuda</CardAside>}
        />

        <ConstanciasFiltros
          busqueda={c.busqueda}
          onBusquedaChange={c.setBusqueda}
          estado={c.estado}
          onEstadoChange={c.setEstado}
          filtrosActivos={c.filtrosActivos}
          onLimpiar={c.limpiarFiltros}
          onExportar={exportar}
          exportando={exportando}
        />

        <ConstanciasTable
          listado={c.listado}
          cargando={c.cargando}
          error={c.error}
          filtrosActivos={c.filtrosActivos}
          tamano={c.tamano}
          onTamanoChange={c.setTamano}
          onPaginaChange={c.setPagina}
          onAbrir={setAbierta}
        />
      </div>

      {abierta && (
        <ConstanciaDetalleModal
          key={abierta.id}
          solicitud={abierta}
          onClose={() => setAbierta(null)}
          onCambio={c.refrescar}
          onExito={(m) => onNotify('success', m)}
        />
      )}
    </div>
  );
};
