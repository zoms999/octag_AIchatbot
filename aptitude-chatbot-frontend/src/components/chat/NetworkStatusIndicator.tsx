'use client';

import React from 'react';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { ConnectionStatus } from './ConnectionStatus';
import { Alert, AlertDescription } from '../ui/alert';
import { Wifi, WifiOff, AlertTriangle } from 'lucide-react';

interface NetworkStatusIndicatorProps {
  className?: string;
}

export const NetworkStatusIndicator: React.FC<NetworkStatusIndicatorProps> = ({
  className,
}) => {
  const { status, isOffline, isSlow } = useNetworkStatus({
    pingInterval: 30000, // Check every 30 seconds
    slowThreshold: 3000, // Consider slow if ping > 3s
  });

  // Don't show anything if connection is good
  if (status === 'online') {
    return null;
  }

  const getAlertConfig = () => {
    if (isOffline) {
      return {
        icon: WifiOff,
        title: '인터넷 연결 끊김',
        description: '인터넷 연결을 확인하고 다시 시도해주세요.',
        variant: 'destructive' as const,
      };
    }

    if (isSlow) {
      return {
        icon: AlertTriangle,
        title: '연결 상태가 불안정합니다',
        description: '네트워크 연결이 느려 응답이 지연될 수 있습니다.',
        variant: 'default' as const,
      };
    }

    return null;
  };

  const config = getAlertConfig();
  if (!config) return null;

  const { icon: Icon, title, description, variant } = config;

  return (
    <Alert variant={variant} className={className}>
      <Icon className="h-4 w-4" />
      <AlertDescription>
        <div>
          <div className="font-medium">{title}</div>
          <div className="text-sm">{description}</div>
        </div>
      </AlertDescription>
    </Alert>
  );
};
