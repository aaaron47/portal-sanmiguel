import React from 'react';
import { CheckCircle2, ClipboardCheck, Wallet, XCircle } from 'lucide-react';
import { KpiCard } from '@/components/shared/ui/KpiCard';
import { EstadoSolicitudConstancia } from '@/types/constancia.types';

interface ConstanciasKpisProps {
  conteos: Partial<Record<EstadoSolicitudConstancia, number>> | null;
}

const valor = (n: number | undefined) => (n === undefined ? '—' : n.toLocaleString('es-PE'));

export const ConstanciasKpis: React.FC<ConstanciasKpisProps> = ({ conteos }) => (
  <div className="kpi-grid">
    <KpiCard icon={ClipboardCheck} label="Por evaluar (en verificación)" value={valor(conteos?.EN_VERIFICACION)} bg="var(--sky-100)" color="var(--sky-600)" />
    <KpiCard icon={Wallet} label="Esperando el pago de la tasa" value={valor(conteos?.PENDIENTE_PAGO)} bg="var(--amber-100)" color="var(--amber-700)" />
    <KpiCard icon={CheckCircle2} label="Aprobadas (emitidas)" value={valor(conteos?.EMITIDA)} bg="var(--green-100)" color="var(--green-600)" />
    <KpiCard icon={XCircle} label="Desaprobadas" value={valor(conteos?.RECHAZADA)} bg="var(--fuchsia-100)" color="var(--fuchsia-800)" />
  </div>
);
