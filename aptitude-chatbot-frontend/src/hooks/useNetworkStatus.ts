'use client';

import { useState, useEffect, useRef } from 'react';
import { NetworkMonitor, NetworkStatus } from '../lib/streaming/networkMonitor';

export interface UseNetworkStatusOptions {
  pingUrl?: string;
  pingInterval?: number;
  slowThreshold?: number;
}

export const useNetworkStatus = (options: UseNetworkStatusOptions = {}) => {
  const [status, setStatus] = useState<NetworkStatus>('online');
  const monitorRef = useRef<NetworkMonitor | null>(null);

  useEffect(() => {
    // Create network monitor
    monitorRef.current = new NetworkMonitor({
      ...options,
      onStatusChange: setStatus,
    });

    // Start monitoring
    monitorRef.current.start();

    // Set initial status
    setStatus(monitorRef.current.getStatus());

    // Cleanup on unmount
    return () => {
      if (monitorRef.current) {
        monitorRef.current.destroy();
        monitorRef.current = null;
      }
    };
  }, [options.pingUrl, options.pingInterval, options.slowThreshold]);

  return {
    status,
    isOnline: status === 'online',
    isOffline: status === 'offline',
    isSlow: status === 'slow',
    monitor: monitorRef.current,
  };
};
