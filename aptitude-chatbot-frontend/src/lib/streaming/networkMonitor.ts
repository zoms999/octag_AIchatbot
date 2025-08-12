export type NetworkStatus = 'online' | 'offline' | 'slow';

export interface NetworkMonitorOptions {
  onStatusChange?: (status: NetworkStatus) => void;
  pingUrl?: string;
  pingInterval?: number;
  slowThreshold?: number; // ms
}

export class NetworkMonitor {
  private status: NetworkStatus = 'online';
  private options: NetworkMonitorOptions;
  private pingTimer: NodeJS.Timeout | null = null;
  private listeners: Set<(status: NetworkStatus) => void> = new Set();

  constructor(options: NetworkMonitorOptions = {}) {
    this.options = {
      pingUrl: '/api/health',
      pingInterval: 30000, // 30 seconds
      slowThreshold: 5000, // 5 seconds
      ...options,
    };

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    if (typeof window === 'undefined') return;

    // Listen to browser online/offline events
    window.addEventListener('online', this.handleOnline);
    window.addEventListener('offline', this.handleOffline);

    // Listen to connection type changes (if supported)
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      connection?.addEventListener('change', this.handleConnectionChange);
    }
  }

  private handleOnline = (): void => {
    this.updateStatus('online');
  };

  private handleOffline = (): void => {
    this.updateStatus('offline');
  };

  private handleConnectionChange = (): void => {
    if (typeof window === 'undefined') return;

    const connection = (navigator as any).connection;
    if (connection) {
      // Check if connection is slow based on effective type
      const slowConnections = ['slow-2g', '2g'];
      if (slowConnections.includes(connection.effectiveType)) {
        this.updateStatus('slow');
      } else if (navigator.onLine) {
        this.updateStatus('online');
      }
    }
  };

  private updateStatus(newStatus: NetworkStatus): void {
    if (this.status !== newStatus) {
      this.status = newStatus;
      this.options.onStatusChange?.(newStatus);
      this.listeners.forEach((listener) => listener(newStatus));
    }
  }

  start(): void {
    this.startPinging();
  }

  stop(): void {
    this.stopPinging();
  }

  private startPinging(): void {
    if (this.pingTimer || !this.options.pingUrl) return;

    this.pingTimer = setInterval(async () => {
      await this.performPing();
    }, this.options.pingInterval);

    // Perform initial ping
    this.performPing();
  }

  private stopPinging(): void {
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
  }

  private async performPing(): Promise<void> {
    if (!this.options.pingUrl) return;

    try {
      const startTime = Date.now();

      const response = await fetch(this.options.pingUrl, {
        method: 'HEAD',
        cache: 'no-cache',
        signal: AbortSignal.timeout(this.options.slowThreshold || 5000),
      });

      const duration = Date.now() - startTime;

      if (response.ok) {
        if (duration > (this.options.slowThreshold || 5000)) {
          this.updateStatus('slow');
        } else {
          this.updateStatus('online');
        }
      } else {
        // Server responded but with error status
        this.updateStatus('slow');
      }
    } catch (error: any) {
      if (error.name === 'TimeoutError') {
        this.updateStatus('slow');
      } else {
        this.updateStatus('offline');
      }
    }
  }

  getStatus(): NetworkStatus {
    return this.status;
  }

  isOnline(): boolean {
    return this.status === 'online';
  }

  isOffline(): boolean {
    return this.status === 'offline';
  }

  isSlow(): boolean {
    return this.status === 'slow';
  }

  addListener(listener: (status: NetworkStatus) => void): () => void {
    this.listeners.add(listener);

    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  destroy(): void {
    this.stop();

    if (typeof window !== 'undefined') {
      window.removeEventListener('online', this.handleOnline);
      window.removeEventListener('offline', this.handleOffline);

      if ('connection' in navigator) {
        const connection = (navigator as any).connection;
        connection?.removeEventListener('change', this.handleConnectionChange);
      }
    }

    this.listeners.clear();
  }
}
