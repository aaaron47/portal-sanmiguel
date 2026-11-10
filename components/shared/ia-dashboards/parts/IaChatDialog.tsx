'use client';

import React, { useEffect, useRef } from 'react';
import {
  ModoConsultaIA,
  ModuloAnalitico,
  ProveedorModeloIA,
  SupersetDashboardInfo,
} from '@/types/superset.types';
import { SupersetChatAssistant } from '@/components/roles/control-municipal/superset/SupersetChatAssistant';

interface IaChatDialogProps {
  isOpen: boolean;
  modulo: ModuloAnalitico;
  dashboardsDisponibles: SupersetDashboardInfo[];
  modoInicial: ModoConsultaIA;
  modeloInicial: ProveedorModeloIA;
  dashboardContextoInicialId: string;
  sessionKey: number;
  onClose: () => void;
  onVisualizarDashboard: (dashboardId: string, dashboardObj?: SupersetDashboardInfo) => void;
  onDashboardGenerado: (nuevoDashboard: SupersetDashboardInfo) => void;
}

export const IaChatDialog: React.FC<IaChatDialogProps> = ({
  isOpen,
  modulo,
  dashboardsDisponibles,
  modoInicial,
  modeloInicial,
  dashboardContextoInicialId,
  sessionKey,
  onClose,
  onVisualizarDashboard,
  onDashboardGenerado,
}) => {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      if (!dialog.open) {
        dialog.showModal();
      }
    } else if (dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

  // Fallback para navegadores sin soporte nativo de `closedby="any"` en <dialog>
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleClose = () => {
      dialog.returnValue = '';
      onClose();
    };

    dialog.addEventListener('close', handleClose);

    if (typeof HTMLDialogElement !== 'undefined' && !('closedBy' in HTMLDialogElement.prototype)) {
      let pressedOutside = false;
      const isOutside = (e: PointerEvent) => {
        const rect = dialog.getBoundingClientRect();
        return (
          e.clientX < rect.left ||
          e.clientX > rect.right ||
          e.clientY < rect.top ||
          e.clientY > rect.bottom
        );
      };
      const onPointerDown = (e: PointerEvent) => {
        pressedOutside = isOutside(e);
      };
      const onPointerUp = (e: PointerEvent) => {
        if (pressedOutside && isOutside(e)) {
          dialog.close();
        }
      };

      dialog.addEventListener('pointerdown', onPointerDown);
      dialog.addEventListener('pointerup', onPointerUp);

      return () => {
        dialog.removeEventListener('close', handleClose);
        dialog.removeEventListener('pointerdown', onPointerDown);
        dialog.removeEventListener('pointerup', onPointerUp);
      };
    }

    return () => {
      dialog.removeEventListener('close', handleClose);
    };
  }, [onClose]);

  return (
    <dialog
      ref={dialogRef}
      aria-label="Asistente de IA Analítico y Generador de Dashboards"
      className="ia-chat-modal-dialog"
      {...({ closedby: 'any' } as React.DialogHTMLAttributes<HTMLDialogElement>)}
    >
      {isOpen && (
        <SupersetChatAssistant
          key={sessionKey}
          modulo={modulo}
          dashboardsDisponibles={dashboardsDisponibles}
          modoInicial={modoInicial}
          modeloInicial={modeloInicial}
          dashboardContextoInicialId={dashboardContextoInicialId}
          onVisualizarDashboard={onVisualizarDashboard}
          onDashboardGenerado={onDashboardGenerado}
          onCerrar={onClose}
        />
      )}
    </dialog>
  );
};

