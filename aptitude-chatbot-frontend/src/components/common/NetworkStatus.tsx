'use client';

import React from 'react';
import { useNetworkStatus } from '@/lib/errors/networkMonitor';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Wifi, WifiOff, Signal, SignalLow } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NetworkStatusProps {
  showDetails?: boolean;
  className?: string;
}

export function NetworkStatus({ showDetails = false, className }: NetworkStatusProps) {
  const networkStatus = useNetworkStatus();

  if (networkStatus.isOnline && !networkStatus.isSlowConnection && !showDetails) {
    return null; // Don't show anything when connection is good
  }

  const getStatusIcon = () => {
    if (!networkStatus.isOnline) {
      return <WifiOff className="h-4 w-4" />;
    }
    if (networkStatus.isSlowConnection) {
      return <SignalLow className="h-4 w-4" />;
    }
    return <Wifi className="h-4 w-4" />;
  };

  const getStatusText = () => {
    if (!networkStatus.isOnline) {
      return 'Offline';
    }
    if (networkStatus.isSlowConnection) {
      return 'Slow Connection';
    }
    return 'Online';
  };

  const getStatusVariant = (): 'default' | 'secondary' | 'destructive' | 'outline' => {
    if (!networkStatus.isOnline) {
      return 'destructive';
    }
    if (networkStatus.isSlowConnection) {
      return 'secondary';
    }
    return 'default';
  };

  const getAlertVariant = (): 'default' | 'destructive' => {
    return !networkStatus.isOnline ? 'destructive' : 'default';
  };

  if (!networkStatus.isOnline) {
    return (
      <Alert variant={getAlertVariant()} className={cn('mb-4', className)}>
        <WifiOff className="h-4 w-4" />
        <AlertDescription>
          You're currently offline. Some features may not work properly.
        </AlertDescription>
      </Alert>
    );
  }

  if (networkStatus.isSlowConnection) {
    return (
      <Alert className={cn('mb-4', className)}>
        <SignalLow className="h-4 w-4" />
        <AlertDescription>
          Your connection seems slow. Some features may take longer to load.
        </AlertDescription>
      </Alert>
    );
  }

  if (showDetails) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <Badge variant={getStatusVariant()} className="flex items-center gap-1">
          {getStatusIcon()}
          {getStatusText()}
        </Badge>
        
        {networkStatus.effectiveType && (
          <Badge variant="outline" className="text-xs">
            {networkStatus.effectiveType.toUpperCase()}
          </Badge>
        )}
        
        {networkStatus.downlink && (
          <Badge variant="outline" className="text-xs">
            {networkStatus.downlink.toFixed(1)} Mbps
          </Badge>
        )}
        
        {networkStatus.rtt && (
          <Badge variant="outline" className="text-xs">
            {networkStatus.rtt}ms
          </Badge>
        )}
      </div>
    );
  }

  return null;
}

// Compact version for header/status bar
export function NetworkStatusIndicator({ className }: { className?: string }) {
  const networkStatus = useNetworkStatus();

  return (
    <div className={cn('flex items-center gap-1', className)}>
      {getStatusIcon()}
      <span className="text-xs text-muted-foreground">
        {getStatusText()}
      </span>
    </div>
  );

  function getStatusIcon() {
    if (!networkStatus.isOnline) {
      return <WifiOff className="h-3 w-3 text-destructive" />;
    }
    if (networkStatus.isSlowConnection) {
      return <SignalLow className="h-3 w-3 text-yellow-500" />;
    }
    return <Signal className="h-3 w-3 text-green-500" />;
  }

  function getStatusText() {
    if (!networkStatus.isOnline) {
      return 'Offline';
    }
    if (networkStatus.isSlowConnection) {
      return 'Slow';
    }
    return 'Online';
  }
}