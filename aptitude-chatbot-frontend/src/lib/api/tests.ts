import { apiClient } from './client';
import {
  TestResult,
  ProcessingJob,
  ETLJobRequest,
  ETLJobResponse,
  ApiResponse,
} from '../../types';

export class TestsApi {
  /**
   * Get all test results for the authenticated user
   */
  async getTestResults(): Promise<ApiResponse<TestResult[]>> {
    return apiClient.get<TestResult[]>('/tests/results');
  }

  /**
   * Get a specific test result by ID
   */
  async getTestResult(testId: string): Promise<ApiResponse<TestResult>> {
    return apiClient.get<TestResult>(`/tests/results/${testId}`);
  }

  /**
   * Get test results for a specific user (admin only)
   */
  async getUserTestResults(userId: string): Promise<ApiResponse<TestResult[]>> {
    return apiClient.get<TestResult[]>(`/tests/results/user/${userId}`);
  }

  /**
   * Request ETL processing for a test
   */
  async requestETLProcessing(
    request: ETLJobRequest
  ): Promise<ApiResponse<ETLJobResponse>> {
    return apiClient.post<ETLJobResponse>('/etl/process', request);
  }

  /**
   * Get ETL job status
   */
  async getETLJobStatus(jobId: string): Promise<ApiResponse<ProcessingJob>> {
    return apiClient.get<ProcessingJob>(`/etl/jobs/${jobId}`);
  }

  /**
   * Get all ETL jobs for the authenticated user
   */
  async getETLJobs(): Promise<ApiResponse<ProcessingJob[]>> {
    return apiClient.get<ProcessingJob[]>('/etl/jobs');
  }

  /**
   * Get active ETL jobs
   */
  async getActiveETLJobs(): Promise<ApiResponse<ProcessingJob[]>> {
    return apiClient.get<ProcessingJob[]>('/etl/jobs/active');
  }

  /**
   * Cancel an ETL job
   */
  async cancelETLJob(jobId: string): Promise<ApiResponse<{ message: string }>> {
    return apiClient.post<{ message: string }>(`/etl/jobs/${jobId}/cancel`);
  }

  /**
   * Retry a failed ETL job
   */
  async retryETLJob(jobId: string): Promise<ApiResponse<ETLJobResponse>> {
    return apiClient.post<ETLJobResponse>(`/etl/jobs/${jobId}/retry`);
  }

  /**
   * Delete a test result
   */
  async deleteTestResult(
    testId: string
  ): Promise<ApiResponse<{ message: string }>> {
    return apiClient.delete<{ message: string }>(`/tests/results/${testId}`);
  }

  /**
   * Reprocess test data (convenience method)
   */
  async reprocessTestData(
    userId: string,
    anpSeq: number,
    forceReprocess = true
  ): Promise<ApiResponse<ETLJobResponse>> {
    return this.requestETLProcessing({
      userId,
      anpSeq,
      forceReprocess,
    });
  }

  /**
   * Create EventSource for ETL job monitoring
   */
  createETLJobEventSource(jobId?: string): EventSource {
    const token = this.getAccessToken();
    const baseURL =
      process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

    let url: string;
    if (jobId) {
      url = `${baseURL}/etl/jobs/${jobId}/stream`;
    } else {
      url = `${baseURL}/etl/jobs/stream`;
    }

    const eventSourceUrl = new URL(url);
    if (token) {
      eventSourceUrl.searchParams.set('token', token);
    }

    return new EventSource(eventSourceUrl.toString(), {
      withCredentials: true,
    });
  }

  /**
   * Create EventSource for all ETL jobs monitoring
   */
  createETLJobsEventSource(): EventSource {
    return this.createETLJobEventSource();
  }

  private getAccessToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('access_token');
    }
    return null;
  }

  /**
   * Helper method to monitor a specific ETL job progress
   */
  async *monitorETLJob(jobId: string): AsyncGenerator<ProcessingJob> {
    const eventSource = this.createETLJobEventSource(jobId);

    try {
      while (true) {
        const event = await new Promise<MessageEvent>((resolve, reject) => {
          eventSource.onmessage = resolve;
          eventSource.onerror = reject;

          // Set a timeout to avoid hanging forever
          setTimeout(() => reject(new Error('EventSource timeout')), 30000);
        });

        const job: ProcessingJob = JSON.parse(event.data);
        yield job;

        // Stop monitoring if job is complete or failed
        if (['completed', 'failed', 'cancelled'].includes(job.status)) {
          break;
        }
      }
    } finally {
      eventSource.close();
    }
  }
}

export const testsApi = new TestsApi();
