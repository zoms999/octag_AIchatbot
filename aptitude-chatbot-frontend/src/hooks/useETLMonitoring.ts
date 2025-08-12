import { useEffect, useRef, useCallback } from 'react';
import { useTestStore } from '../lib/stores/test';
import { testsApi } from '../lib/api/tests';
import { ProcessingJob } from '../types';

interface ETLMonitoringOptions {
  autoConnect?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

export const useETLMonitoring = (options: ETLMonitoringOptions = {}) => {
  const {
    autoConnect = true,
    reconnectInterval = 5000,
    maxReconnectAttempts = 5,
  } = options;

  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { updateJobStatus, addJob, removeJob } = useTestStore();

  const handleJobUpdate = useCallback(
    (data: {
      type: string;
      job?: ProcessingJob;
      jobId?: string;
    }) => {
      if (data.type === 'job_update' && data.job) {
        updateJobStatus(data.job.jobId, data.job);
      } else if (data.type === 'job_created' && data.job) {
        addJob(data.job);
      } else if (data.type === 'job_removed' && data.jobId) {
        removeJob(data.jobId);
      }
    },
    [updateJobStatus, addJob, removeJob]
  );

  const connect = useCallback(() => {
    if (eventSourceRef.current) {
      return; // Already connected
    }

    try {
      const eventSource = testsApi.createETLJobsEventSource();

      eventSource.onopen = () => {
        console.log('ETL monitoring connected');
        reconnectAttemptsRef.current = 0;
      };

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleJobUpdate(data);
        } catch (error) {
          console.error('Failed to parse ETL job update:', error);
        }
      };

      eventSource.onerror = (error) => {
        console.error('ETL monitoring error:', error);
        eventSource.close();
        eventSourceRef.current = null;

        // Attempt to reconnect
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current++;
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, reconnectInterval);
        }
      };

      // Handle specific event types
      eventSource.addEventListener('job_started', (event) => {
        try {
          const job: ProcessingJob = JSON.parse(event.data);
          addJob(job);
        } catch (error) {
          console.error('Failed to parse job_started event:', error);
        }
      });

      eventSource.addEventListener('job_progress', (event) => {
        try {
          const update = JSON.parse(event.data);
          updateJobStatus(update.jobId, update);
        } catch (error) {
          console.error('Failed to parse job_progress event:', error);
        }
      });

      eventSource.addEventListener('job_completed', (event) => {
        try {
          const update = JSON.parse(event.data);
          updateJobStatus(update.jobId, {
            ...update,
            status: 'completed',
            progress: 100,
          });
        } catch (error) {
          console.error('Failed to parse job_completed event:', error);
        }
      });

      eventSource.addEventListener('job_failed', (event) => {
        try {
          const update = JSON.parse(event.data);
          updateJobStatus(update.jobId, {
            ...update,
            status: 'failed',
          });
        } catch (error) {
          console.error('Failed to parse job_failed event:', error);
        }
      });

      eventSource.addEventListener('job_cancelled', (event) => {
        try {
          const update = JSON.parse(event.data);
          updateJobStatus(update.jobId, {
            ...update,
            status: 'cancelled',
          });
        } catch (error) {
          console.error('Failed to parse job_cancelled event:', error);
        }
      });

      eventSourceRef.current = eventSource;
    } catch (error) {
      console.error('Failed to connect to ETL monitoring:', error);
    }
  }, [
    handleJobUpdate,
    maxReconnectAttempts,
    reconnectInterval,
    addJob,
    updateJobStatus,
  ]);

  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    reconnectAttemptsRef.current = 0;
  }, []);

  // Auto-connect on mount
  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [autoConnect, connect, disconnect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    connect,
    disconnect,
    isConnected: eventSourceRef.current !== null,
    reconnectAttempts: reconnectAttemptsRef.current,
  };
};
