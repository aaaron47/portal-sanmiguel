'use client';

import React from 'react';
import { NotifyFn } from '@/types/ui.types';
import { IaDashboardsHubView } from '@/components/shared/ia-dashboards/IaDashboardsHubView';

interface AsistenteMcpViewProps {
  onNotify?: NotifyFn;
}

export const AsistenteMcpView: React.FC<AsistenteMcpViewProps> = ({ onNotify }) => {
  return <IaDashboardsHubView modulo="CONTROL_MUNICIPAL" onNotify={onNotify} />;
};
