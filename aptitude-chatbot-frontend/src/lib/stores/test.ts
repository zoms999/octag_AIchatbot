import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import {
  TestResult,
  ProcessingJob,
  ETLJobRequest,
  JobStatus,
} from '../../types';
import { testsApi } from '../api/tests';

export interface TestState {
  // Test results state
  tests: TestResult[];
  currentTest: TestResult | null;
  isLoadingTests: boolean;
  testsError: string | null;

  // ETL jobs state
  processingJobs: ProcessingJob[];
  isLoadingJobs: boolean;
  jobsError: string | null;

  // UI state
  selectedTestId: string | null;
  filterStatus: 'all' | 'completed' | 'processing' | 'failed';

  // Actions
  loadTests: () => Promise<void>;
  loadTestById: (testId: string) => Promise<void>;
  reprocessTest: (
    userId: string,
    anpSeq: number,
    forceReprocess?: boolean
  ) => Promise<string | null>;
  loadETLJobs: () => Promise<void>;
  monitorJob: (jobId: string) => Promise<void>;
  cancelJob: (jobId: string) => Promise<void>;
  retryJob: (jobId: string) => Promise<void>;
  deleteTest: (testId: string) => Promise<void>;

  // UI actions
  setSelectedTest: (testId: string | null) => void;
  setFilterStatus: (
    status: 'all' | 'completed' | 'processing' | 'failed'
  ) => void;
  clearErrors: () => void;

  // Job status updates (for SSE)
  updateJobStatus: (jobId: string, updates: Partial<ProcessingJob>) => void;
  addJob: (job: ProcessingJob) => void;
  removeJob: (jobId: string) => void;
}

export const useTestStore = create<TestState>()(
  devtools(
    (set, get) => ({
      // Initial state
      tests: [],
      currentTest: null,
      isLoadingTests: false,
      testsError: null,

      processingJobs: [],
      isLoadingJobs: false,
      jobsError: null,

      selectedTestId: null,
      filterStatus: 'all',

      // Test results actions
      loadTests: async () => {
        set({ isLoadingTests: true, testsError: null });

        try {
          const response = await testsApi.getTestResults();

          if (response.success) {
            set({
              tests: response.data,
              isLoadingTests: false,
            });
          } else {
            set({
              testsError: response.error?.message || 'Failed to load tests',
              isLoadingTests: false,
            });
          }
        } catch (error) {
          set({
            testsError:
              error instanceof Error ? error.message : 'Failed to load tests',
            isLoadingTests: false,
          });
        }
      },

      loadTestById: async (testId: string) => {
        try {
          const response = await testsApi.getTestResult(testId);

          if (response.success) {
            set({ currentTest: response.data });

            // Update the test in the tests array if it exists
            const { tests } = get();
            const updatedTests = tests.map((test) =>
              test.id === testId ? response.data : test
            );
            set({ tests: updatedTests });
          } else {
            set({
              testsError:
                response.error?.message || 'Failed to load test details',
            });
          }
        } catch (error) {
          set({
            testsError:
              error instanceof Error
                ? error.message
                : 'Failed to load test details',
          });
        }
      },

      reprocessTest: async (
        userId: string,
        anpSeq: number,
        forceReprocess = false
      ) => {
        try {
          const request: ETLJobRequest = {
            userId,
            anpSeq,
            forceReprocess,
          };

          const response = await testsApi.requestETLProcessing(request);

          if (response.success) {
            // Refresh jobs list to include the new job
            await get().loadETLJobs();
            return response.data.jobId;
          } else {
            set({
              jobsError:
                response.error?.message || 'Failed to start reprocessing',
            });
            return null;
          }
        } catch (error) {
          set({
            jobsError:
              error instanceof Error
                ? error.message
                : 'Failed to start reprocessing',
          });
          return null;
        }
      },

      // ETL jobs actions
      loadETLJobs: async () => {
        set({ isLoadingJobs: true, jobsError: null });

        try {
          const response = await testsApi.getETLJobs();

          if (response.success) {
            set({
              processingJobs: response.data,
              isLoadingJobs: false,
            });
          } else {
            set({
              jobsError: response.error?.message || 'Failed to load jobs',
              isLoadingJobs: false,
            });
          }
        } catch (error) {
          set({
            jobsError:
              error instanceof Error ? error.message : 'Failed to load jobs',
            isLoadingJobs: false,
          });
        }
      },

      monitorJob: async (jobId: string) => {
        try {
          const response = await testsApi.getETLJobStatus(jobId);

          if (response.success) {
            get().updateJobStatus(jobId, response.data);
          }
        } catch (error) {
          console.error('Failed to monitor job:', error);
        }
      },

      cancelJob: async (jobId: string) => {
        try {
          const response = await testsApi.cancelETLJob(jobId);

          if (response.success) {
            // Update job status to cancelled
            get().updateJobStatus(jobId, { status: 'cancelled' });
          } else {
            set({
              jobsError: response.error?.message || 'Failed to cancel job',
            });
          }
        } catch (error) {
          set({
            jobsError:
              error instanceof Error ? error.message : 'Failed to cancel job',
          });
        }
      },

      retryJob: async (jobId: string) => {
        try {
          const response = await testsApi.retryETLJob(jobId);

          if (response.success) {
            // Refresh jobs list to get the new job
            await get().loadETLJobs();
          } else {
            set({
              jobsError: response.error?.message || 'Failed to retry job',
            });
          }
        } catch (error) {
          set({
            jobsError:
              error instanceof Error ? error.message : 'Failed to retry job',
          });
        }
      },

      deleteTest: async (testId: string) => {
        try {
          const response = await testsApi.deleteTestResult(testId);

          if (response.success) {
            // Remove test from local state
            const { tests } = get();
            const updatedTests = tests.filter((test) => test.id !== testId);
            set({ tests: updatedTests });

            // Clear current test if it was the deleted one
            const { currentTest } = get();
            if (currentTest?.id === testId) {
              set({ currentTest: null });
            }
          } else {
            set({
              testsError: response.error?.message || 'Failed to delete test',
            });
          }
        } catch (error) {
          set({
            testsError:
              error instanceof Error ? error.message : 'Failed to delete test',
          });
        }
      },

      // UI actions
      setSelectedTest: (testId: string | null) => {
        set({ selectedTestId: testId });

        if (testId) {
          get().loadTestById(testId);
        } else {
          set({ currentTest: null });
        }
      },

      setFilterStatus: (
        status: 'all' | 'completed' | 'processing' | 'failed'
      ) => {
        set({ filterStatus: status });
      },

      clearErrors: () => {
        set({ testsError: null, jobsError: null });
      },

      // Job status updates for SSE
      updateJobStatus: (jobId: string, updates: Partial<ProcessingJob>) => {
        const { processingJobs } = get();
        const updatedJobs = processingJobs.map((job) =>
          job.jobId === jobId ? { ...job, ...updates } : job
        );
        set({ processingJobs: updatedJobs });
      },

      addJob: (job: ProcessingJob) => {
        const { processingJobs } = get();
        const existingJobIndex = processingJobs.findIndex(
          (j) => j.jobId === job.jobId
        );

        if (existingJobIndex >= 0) {
          // Update existing job
          const updatedJobs = [...processingJobs];
          updatedJobs[existingJobIndex] = job;
          set({ processingJobs: updatedJobs });
        } else {
          // Add new job
          set({ processingJobs: [job, ...processingJobs] });
        }
      },

      removeJob: (jobId: string) => {
        const { processingJobs } = get();
        const updatedJobs = processingJobs.filter((job) => job.jobId !== jobId);
        set({ processingJobs: updatedJobs });
      },
    }),
    {
      name: 'test-store',
    }
  )
);

// Selectors for computed values
export const useFilteredTests = () => {
  return useTestStore((state) => {
    if (state.filterStatus === 'all') {
      return state.tests;
    }
    return state.tests.filter((test) => test.status === state.filterStatus);
  });
};

export const useActiveJobs = () => {
  return useTestStore((state) =>
    state.processingJobs.filter(
      (job) => job.status === 'pending' || job.status === 'running'
    )
  );
};

export const useCompletedJobs = () => {
  return useTestStore((state) =>
    state.processingJobs.filter(
      (job) =>
        job.status === 'completed' ||
        job.status === 'failed' ||
        job.status === 'cancelled'
    )
  );
};
