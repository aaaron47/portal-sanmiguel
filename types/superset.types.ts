export interface SupersetDashboardInfo {
  id: string;
  slug: string;
  titulo: string;
  descripcion: string;
  categoria: 'cumplimiento' | 'sla' | 'tipologia';
  urlRelativa: string;
}

export interface SupersetMetricItem {
  label: string;
  valor: string | number;
  cambio?: string;
  positivo?: boolean;
}

export interface SupersetChatMessage {
  id: string;
  rol: 'user' | 'assistant';
  texto: string;
  fecha: string;
  dashboardSugeridoId?: string;
  graficoTitulo?: string;
  metricas?: SupersetMetricItem[];
  sqlGenerado?: string;
  estado?: 'pensando' | 'completado' | 'error';
  /** true si el asistente no respondió y se muestra un ejemplo con datos ficticios (se avisa en pantalla). */
  esEjemplo?: boolean;
}
