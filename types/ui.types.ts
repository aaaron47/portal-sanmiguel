export type NotifyType = 'success' | 'error' | 'info';

export type NotifyFn = (type: NotifyType, message: string) => void;

/** Props comunes de todas las vistas de rol. */
export interface RoleViewProps {
  initialTab?: string;
  onNotify: NotifyFn;
}
