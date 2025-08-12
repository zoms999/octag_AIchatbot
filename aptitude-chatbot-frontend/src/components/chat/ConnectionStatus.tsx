'use client';

import React from 'react';
import { Wifi, WifiOff, Loader2, AlertTriangle } from 'lucide-react';
import { cn } from '../../lib/utils';

interface ConnectionStatusProps {
  status: 'connected' | 'disconnected' | 'connecting' | 'error';
  className?: string;
}

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({
  status,
  className,
}) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'connected':
        return {
          icon: Wifi,
          text: '연결됨',
          className: 'text-green-600 dark:text-green-400',
        };
      case 'connecting':
        return {
          icon: Loader2,
          text: '연결 중...',
          className: 'text-yellow-600 dark:text-yellow-400 animate-spin',
        };
      case 'error':
        return {
          icon: AlertTriangle,
          text: '연결 오류',
          className: 'text-red-600 dark:text-red-400',
        };
      case 'disconnected':
      default:
        return {
          icon: WifiOff,
          text: '연결 끊김',
          className: 'text-gray-600 dark:text-gray-400',
        };
    }
  };

  const { icon: Icon, text, className: statusClassName } = getStatusConfig();

  return (
    <div className={cn('flex items-center gap-1.5 text-xs', className)}>
      <Icon className={cn('h-3 w-3', statusClassName)} />
      <span className={statusClassName}>{text}</span>
    </div>
  );
};
