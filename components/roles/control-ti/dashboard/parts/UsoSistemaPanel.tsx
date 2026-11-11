import React from 'react';
import { Users, MonitorSmartphone, CheckCircle2, XCircle, Info, CalendarDays, Clock3, ListChecks } from 'lucide-react';
import { UsoSistema } from '@/types/telemetria.types';
import { KpiCard } from '@/components/shared/ui/KpiCard';
import { CardHeader, CardAside } from '@/components/shared/ui/CardHeader';
import { diaCorto } from '@/utils/fecha-peru.utils';
import { GraficoColumnas, DatoColumna } from './GraficoColumnas';

const formato = (n: number) => n.toLocaleString('es-PE');
const porcentaje = (parte: number, total: number) => (total ? `${(Math.round((parte / total) * 1000) / 10).toFixed(1)}%` : '—');

/** Uso del sistema en el período y filtros elegidos (Req 4). */
export const UsoSistemaPanel: React.FC<{ uso: UsoSistema }> = ({ uso }) => {
  const dias = uso.actividadPorDia;
  // Con muchos días se rotula uno de cada N para que las etiquetas no se monten.
  const cadaDia = dias.length <= 10 ? 1 : Math.ceil(dias.length / 8);
  const datosDia: DatoColumna[] = dias.map((d, i) => ({
    clave: d.fecha,
    etiqueta: diaCorto(d.fecha),
    etiquetaEje: i % cadaDia === 0 ? diaCorto(d.fecha) : '',
    valor: d.eventos,
    detalle: `${formato(d.sesiones)} sesiones`,
  }));
  const datosHora: DatoColumna[] = uso.actividadPorHora.map((h) => ({
    clave: String(h.hora),
    etiqueta: `${String(h.hora).padStart(2, '0')}:00 – ${String(h.hora).padStart(2, '0')}:59`,
    etiquetaEje: h.hora % 3 === 0 ? `${h.hora}h` : '',
    valor: h.eventos,
    detalle: `${formato(h.sesiones)} sesiones`,
  }));
  const funcionalidades = [...uso.funcionalidades].sort((a, b) => b.iniciadas - a.iniciadas);

  return (
    <div>
      <div className="kpi-grid">
        <KpiCard icon={Users} label="Usuarios únicos" value={formato(uso.usuariosUnicos)} bg="var(--sky-100)" color="var(--sky-600)" />
        <KpiCard icon={MonitorSmartphone} label="Sesiones" value={formato(uso.sesiones)} bg="var(--sky-100)" color="var(--sky-600)" />
        <KpiCard
          icon={CheckCircle2}
          label="Consultas completadas"
          value={`${uso.porcentajeCompletadas.toFixed(1)}%`}
          bg="var(--green-50)"
          color="var(--green-600)"
        />
        <KpiCard
          icon={XCircle}
          label="Consultas fallidas"
          value={formato(uso.consultasFallidas)}
          bg="var(--red-50)"
          color="var(--red-600)"
        />
      </div>

      <p
        style={{
          display: 'flex',
          gap: '0.4rem',
          alignItems: 'flex-start',
          fontSize: '0.775rem',
          color: 'var(--text-muted)',
          margin: '-0.5rem 0 1.25rem',
          lineHeight: 1.45,
        }}
      >
        <Info size={14} style={{ flexShrink: 0, marginTop: '2px' }} />
        <span>
          <strong>Cómo se cuenta:</strong> usuario único = identificador seudónimo distinto en el período (sin nombre,
          correo ni DNI). Sesión = uso continuo de un dispositivo; termina tras 30 minutos sin actividad. Consulta
          completada = la acción terminó bien; fallida = terminó con error. El porcentaje compara las completadas con
          las iniciadas ({formato(uso.consultasCompletadas)} de {formato(uso.consultasIniciadas)}).
        </span>
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.25rem' }}>
        <div className="card">
          <CardHeader
            icon={<CalendarDays size={18} />}
            title="Actividad por día"
            aside={<CardAside>Eventos por día, hora de Perú</CardAside>}
          />
          <GraficoColumnas titulo="Actividad por día" nombreCategoria="Día" nombreValor="eventos" datos={datosDia} />
        </div>
        <div className="card">
          <CardHeader
            icon={<Clock3 size={18} />}
            title="Actividad por hora"
            aside={<CardAside>Eventos por hora del día, hora de Perú</CardAside>}
          />
          <GraficoColumnas titulo="Actividad por hora" nombreCategoria="Hora" nombreValor="eventos" datos={datosHora} />
        </div>
      </div>

      <div className="card" style={{ marginTop: '1.25rem' }}>
        <CardHeader
          icon={<ListChecks size={18} />}
          title="Funcionalidades más usadas"
          aside={<CardAside>Consultas iniciadas, completadas y fallidas</CardAside>}
        />
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Funcionalidad</th>
                <th style={{ textAlign: 'right' }}>Iniciadas</th>
                <th style={{ textAlign: 'right' }}>Completadas</th>
                <th style={{ textAlign: 'right' }}>Fallidas</th>
                <th style={{ textAlign: 'right' }}>% completadas</th>
              </tr>
            </thead>
            <tbody>
              {funcionalidades.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '1.25rem' }}>
                    No hay consultas en este período.
                  </td>
                </tr>
              )}
              {funcionalidades.map((f) => (
                <tr key={f.funcionalidad}>
                  <td style={{ fontWeight: 600 }}>{f.funcionalidad}</td>
                  <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{formato(f.iniciadas)}</td>
                  <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{formato(f.completadas)}</td>
                  <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{formato(f.fallidas)}</td>
                  <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>
                    {porcentaje(f.completadas, f.iniciadas)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
