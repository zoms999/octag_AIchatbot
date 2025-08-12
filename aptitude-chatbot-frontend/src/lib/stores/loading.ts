import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface LoadingState {
  // Global loading states
  isGlobalLoading: boolean;
  globalLoadingMessage?: string;
  
  // Specific loading states
  loadingStates: Record<string, {
    isLoading: boolean;
    message?: string;
    progress?: number;
  }>;
  
  // Actions
  setGlobalLoading: (isLoading: boolean, message?: string) => void;
  setLoading: (key: string, isLoading: boolean, message?: string, progress?: number) => void;
  clearLoading: (key: string) => void;
  clearAllLoading: () => void;
  isLoading: (key?: string) => boolean;
  getLoadingMessage: (key?: string) => string | undefined;
  getLoadingProgress: (key: string) => number | undefined;
}

export const useLoadingStore = create<LoadingState>()(
  devtools(
    (set, get) => ({
      isGlobalLoading: false,
      globalLoadingMessage: undefined,
      loadingStates: {},

      setGlobalLoading: (isLoading, message) =>
        set(
          (state) => ({
            isGlobalLoading: isLoading,
            globalLoadingMessage: isLoading ? message : undefined,
          }),
          false,
          'setGlobalLoading'
        ),

      setLoading: (key, isLoading, message, progress) =>
        set(
          (state) => ({
            loadingStates: {
              ...state.loadingStates,
              [key]: isLoading
                ? {
                    isLoading: true,
                    message,
                    progress,
                  }
                : { isLoading: false },
            },
          }),
          false,
          `setLoading:${key}`
        ),

      clearLoading: (key) =>
        set(
          (state) => {
            const newStates = { ...state.loadingStates };
            delete newStates[key];
            return { loadingStates: newStates };
          },
          false,
          `clearLoading:${key}`
        ),

      clearAllLoading: () =>
        set(
          {
            isGlobalLoading: false,
            globalLoadingMessage: undefined,
            loadingStates: {},
          },
          false,
          'clearAllLoading'
        ),

      isLoading: (key) => {
        const state = get();
        if (key) {
          return state.loadingStates[key]?.isLoading ?? false;
        }
        return (
          state.isGlobalLoading ||
          Object.values(state.loadingStates).some((s) => s.isLoading)
        );
      },

      getLoadingMessage: (key) => {
        const state = get();
        if (key) {
          return state.loadingStates[key]?.message;
        }
        return state.globalLoadingMessage;
      },

      getLoadingProgress: (key) => {
        const state = get();
        return state.loadingStates[key]?.progress;
      },
    }),
    {
      name: 'loading-store',
    }
  )
);

// Hook for easier usage
export function useLoading(key?: string) {
  const store = useLoadingStore();
  
  return {
    isLoading: store.isLoading(key),
    message: store.getLoadingMessage(key),
    progress: key ? store.getLoadingProgress(key) : undefined,
    setLoading: (isLoading: boolean, message?: string, progress?: number) => {
      if (key) {
        store.setLoading(key, isLoading, message, progress);
      } else {
        store.setGlobalLoading(isLoading, message);
      }
    },
    clearLoading: () => {
      if (key) {
        store.clearLoading(key);
      } else {
        store.setGlobalLoading(false);
      }
    },
  };
}