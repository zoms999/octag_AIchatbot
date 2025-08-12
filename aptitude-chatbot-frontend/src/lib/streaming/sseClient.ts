import { StreamingChatResponse } from '../../types';

export interface SSEClientOptions {
  url: string;
  data: any;
  headers?: Record<string, string>;
  onMessage?: (data: StreamingChatResponse) => void;
  onError?: (error: Error) => void;
  onComplete?: () => void;
  onConnectionChange?: (
    status: 'connecting' | 'connected' | 'disconnected' | 'error'
  ) => void;
  retryAttempts?: number;
  retryDelay?: number;
}

export class SSEClient {
  private abortController: AbortController | null = null;
  private retryCount = 0;
  private isConnected = false;
  private options: SSEClientOptions;

  constructor(options: SSEClientOptions) {
    this.options = {
      retryAttempts: 3,
      retryDelay: 1000,
      ...options,
    };
  }

  async connect(): Promise<void> {
    this.abortController = new AbortController();
    this.retryCount = 0;

    return this.attemptConnection();
  }

  private async attemptConnection(): Promise<void> {
    if (!this.abortController) {
      throw new Error('Connection aborted');
    }

    try {
      this.options.onConnectionChange?.('connecting');

      const response = await fetch(this.options.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'text/event-stream',
          'Cache-Control': 'no-cache',
          ...this.options.headers,
        },
        body: JSON.stringify(this.options.data),
        signal: this.abortController.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      if (!response.body) {
        throw new Error('Response body is not available for streaming');
      }

      this.isConnected = true;
      this.options.onConnectionChange?.('connected');

      await this.processStream(response.body);
    } catch (error: any) {
      if (error.name === 'AbortError') {
        // Connection was intentionally aborted
        return;
      }

      this.isConnected = false;
      this.options.onConnectionChange?.('error');

      // Retry logic
      if (this.retryCount < (this.options.retryAttempts || 3)) {
        this.retryCount++;

        console.warn(
          `SSE connection failed, retrying (${this.retryCount}/${this.options.retryAttempts})...`,
          error
        );

        await new Promise((resolve) =>
          setTimeout(
            resolve,
            (this.options.retryDelay || 1000) * this.retryCount
          )
        );

        if (this.abortController && !this.abortController.signal.aborted) {
          return this.attemptConnection();
        }
      } else {
        this.options.onError?.(error);
        throw error;
      }
    }
  }

  private async processStream(body: ReadableStream<Uint8Array>): Promise<void> {
    const reader = body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          this.options.onComplete?.();
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');

        // Keep the last incomplete line in the buffer
        buffer = lines.pop() || '';

        for (const line of lines) {
          await this.processLine(line);
        }
      }
    } finally {
      reader.releaseLock();
      this.isConnected = false;
      this.options.onConnectionChange?.('disconnected');
    }
  }

  private async processLine(line: string): Promise<void> {
    const trimmedLine = line.trim();

    if (!trimmedLine || trimmedLine.startsWith(':')) {
      // Empty line or comment, ignore
      return;
    }

    if (trimmedLine.startsWith('data: ')) {
      const data = trimmedLine.slice(6);

      if (data === '[DONE]') {
        this.options.onComplete?.();
        return;
      }

      try {
        const parsed: StreamingChatResponse = JSON.parse(data);
        this.options.onMessage?.(parsed);
      } catch (error) {
        console.warn('Failed to parse SSE message:', error, 'Raw data:', data);
      }
    } else if (trimmedLine.startsWith('event: ')) {
      // Handle different event types if needed
      const eventType = trimmedLine.slice(7);
      console.debug('SSE event type:', eventType);
    } else if (trimmedLine.startsWith('retry: ')) {
      // Handle retry directive
      const retryMs = parseInt(trimmedLine.slice(7), 10);
      if (!isNaN(retryMs)) {
        this.options.retryDelay = retryMs;
      }
    }
  }

  disconnect(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
    this.isConnected = false;
    this.options.onConnectionChange?.('disconnected');
  }

  isActive(): boolean {
    return this.isConnected && this.abortController !== null;
  }

  getRetryCount(): number {
    return this.retryCount;
  }
}
