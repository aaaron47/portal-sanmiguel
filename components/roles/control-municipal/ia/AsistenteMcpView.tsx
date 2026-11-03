'use client';

import React from 'react';
import { SupersetChatAssistant } from '../superset/SupersetChatAssistant';

export const AsistenteMcpView: React.FC = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', minHeight: 'calc(100vh - 120px)', justifyContent: 'center' }}>
      <SupersetChatAssistant />
    </div>
  );
};
