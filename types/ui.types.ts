export type NotifyType = 'success' | 'error' | 'info';

export type NotifyFn = (type: NotifyType, message: string) => void;

/** Props comunes de todas las vistas de rol. */
export interface RoleViewProps {
  initialTab?: string;
  onNotify: NotifyFn;
  /** Avisa a la página que se eligió otra opción, para marcarla en el menú lateral. */
  onTabChange?: (tab: string) => void;
}
