interface NetworkStatus {
  isOnline: boolean;
  isSlowConnection: boolean;
  connectionType?: string;
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
}

type NetworkStatusListener = (status: NetworkStatus) => void;

class NetworkMonitorService {
  private listeners: Set<NetworkStatusListener> = new Set();
  private currentStatus: NetworkStatus = {
    isOnline: true,
    isSlowConnection: false,
  };

  constructor() {
    this.initializeStatus();
    this.setupEventListeners();
  }

  private initializeStatus() {
    if (typeof window === 'undefined') return;

    this.currentStatus = {
      isOnline: navigator.onLine,
      isSlowConnection: this.detectSlowConnection(),
      ...this.getConnectionInfo(),
    };
  }

  private setupEventListeners() {
    if (typeof window === 'undefined') return;

    // Online/offline events
    window.addEventListener('online', this.handleOnline);
    window.addEventListener('offline', this.handleOffline);

    // Connection change events
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      connection?.addEventListener('change', this.handleConnectionChange);
    }

    // Periodic connection quality check
    setInterval(() => {
      this.checkConnectionQuality();
    }, 30000); // Check every 30 seconds
  }

  private handleOnline = () => {
    this.updateStatus({ isOnline: true });
  };

  private handleOffline = () => {
    this.updateStatus({ isOnline: false });
  };

  private handleConnectionChange = () => {
    const connectionInfo = this.getConnectionInfo();
    this.updateStatus({
      ...connectionInfo,
      isSlowConnection: this.detectSlowConnection(),
    });
  };

  private getConnectionInfo(): Partial<NetworkStatus> {
    if (typeof window === 'undefined' || !('connection' in navigator)) {
      return {};
    }

    const connection = (navigator as any).connection;
    return {
      connectionType: connection?.type,
      effectiveType: connection?.effectiveType,
      downlink: connection?.downlink,
      rtt: connection?.rtt,
    };
  }

  private detectSlowConnection(): boolean {
    if (typeof window === 'undefined' || !('connection' in navigator)) {
      return false;
    }

    const connection = (navigator as any).connection;
    
    // Consider connection slow if:
    // - Effective type is 'slow-2g' or '2g'
    // - RTT is greater than 1000ms
    // - Downlink is less than 0.5 Mbps
    return (
      connection?.effectiveType === 'slow-2g' ||
      connection?.effectiveType === '2g' ||
      (connection?.rtt && connection.rtt > 1000) ||
      (connection?.downlink && connection.downlink < 0.5)
    );
  }

  private async checkConnectionQuality() {
    if (!this.currentStatus.isOnline) return;

    try {
      const startTime = performance.now();
      
      // Make a small request to check connection quality
      const response = await fetch('/api/health', {
        method: 'HEAD',
        cache: 'no-cache',
      });

      const endTime = performance.now();
      const responseTime = endTime - startTime;

      // Update slow connection status based on response time
      const isSlowConnection = responseTime > 3000 || !response.ok;
      
      if (isSlowConnection !== this.currentStatus.isSlowConnection) {
        this.updateStatus({ isSlowConnection });
      }
    } catch (error) {
      // If health check fails, we might be offline or have a very poor connection
      this.updateStatus({ isSlowConnection: true });
    }
  }

  private updateStatus(updates: Partial<NetworkStatus>) {
    const previousStatus = { ...this.currentStatus };
    this.currentStatus = { ...this.currentStatus, ...updates };

    // Only notify if status actually changed
    if (this.hasStatusChanged(previousStatus, this.currentStatus)) {
      this.notifyListeners();
    }
  }

  private hasStatusChanged(prev: NetworkStatus, current: NetworkStatus): boolean {
    return (
      prev.isOnline !== current.isOnline ||
      prev.isSlowConnection !== current.isSlowConnection ||
      prev.effectiveType !== current.effectiveType
    );
  }

  private notifyListeners() {
    this.listeners.forEach(listener => {
      try {
        listener(this.currentStatus);
      } catch (error) {
        console.error('Error in network status listener:', error);
      }
    });
  }

  // Public API
  getStatus(): NetworkStatus {
    return { ...this.currentStatus };
  }

  subscribe(listener: NetworkStatusListener): () => void {
    this.listeners.add(listener);
    
    // Immediately call with current status
    listener(this.currentStatus);

    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  // Test connection by making a request
  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch('/api/health', {
        method: 'HEAD',
        cache: 'no-cache',
        signal: AbortSignal.timeout(5000), // 5 second timeout
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  cleanup() {
    if (typeof window === 'undefined') return;

    window.removeEventListener('online', this.handleOnline);
    window.removeEventListener('offline', this.handleOffline);

    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      connection?.removeEventListener('change', this.handleConnectionChange);
    }

    this.listeners.clear();
  }
}

export const NetworkMonitor = new NetworkMonitorService();

// React hook for using network status
export function useNetworkStatus() {
  const [status, setStatus] = React.useState<NetworkStatus>(() => 
    NetworkMonitor.getStatus()
  );

  React.useEffect(() => {
    return NetworkMonitor.subscribe(setStatus);
  }, []);

  return status;
}

// Import React for the hook
import React from 'react';