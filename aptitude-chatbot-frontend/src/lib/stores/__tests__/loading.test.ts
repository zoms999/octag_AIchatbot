import { renderHook, act } from '@testing-library/react';
import { useLoadingStore, useLoading } from '../loading';

describe('Loading Store', () => {
  beforeEach(() => {
    // Reset store state
    useLoadingStore.getState().clearAllLoading();
  });

  describe('useLoadingStore', () => {
    it('should initialize with empty state', () => {
      const { result } = renderHook(() => useLoadingStore());
      
      expect(result.current.isGlobalLoading).toBe(false);
      expect(result.current.globalLoadingMessage).toBeUndefined();
      expect(result.current.loadingStates).toEqual({});
    });

    it('should set global loading state', () => {
      const { result } = renderHook(() => useLoadingStore());
      
      act(() => {
        result.current.setGlobalLoading(true, 'Loading application...');
      });

      expect(result.current.isGlobalLoading).toBe(true);
      expect(result.current.globalLoadingMessage).toBe('Loading application...');
    });

    it('should clear global loading state', () => {
      const { result } = renderHook(() => useLoadingStore());
      
      act(() => {
        result.current.setGlobalLoading(true, 'Loading...');
        result.current.setGlobalLoading(false);
      });

      expect(result.current.isGlobalLoading).toBe(false);
      expect(result.current.globalLoadingMessage).toBeUndefined();
    });

    it('should set specific loading state', () => {
      const { result } = renderHook(() => useLoadingStore());
      
      act(() => {
        result.current.setLoading('api-call', true, 'Fetching data...', 50);
      });

      expect(result.current.loadingStates['api-call']).toEqual({
        isLoading: true,
        message: 'Fetching data...',
        progress: 50,
      });
    });

    it('should clear specific loading state', () => {
      const { result } = renderHook(() => useLoadingStore());
      
      act(() => {
        result.current.setLoading('api-call', true, 'Loading...');
        result.current.clearLoading('api-call');
      });

      expect(result.current.loadingStates['api-call']).toBeUndefined();
    });

    it('should check if any loading is active', () => {
      const { result } = renderHook(() => useLoadingStore());
      
      expect(result.current.isLoading()).toBe(false);

      act(() => {
        result.current.setLoading('test', true);
      });

      expect(result.current.isLoading()).toBe(true);
    });

    it('should check specific loading state', () => {
      const { result } = renderHook(() => useLoadingStore());
      
      act(() => {
        result.current.setLoading('test', true);
      });

      expect(result.current.isLoading('test')).toBe(true);
      expect(result.current.isLoading('other')).toBe(false);
    });

    it('should get loading message', () => {
      const { result } = renderHook(() => useLoadingStore());
      
      act(() => {
        result.current.setGlobalLoading(true, 'Global message');
        result.current.setLoading('test', true, 'Specific message');
      });

      expect(result.current.getLoadingMessage()).toBe('Global message');
      expect(result.current.getLoadingMessage('test')).toBe('Specific message');
    });

    it('should get loading progress', () => {
      const { result } = renderHook(() => useLoadingStore());
      
      act(() => {
        result.current.setLoading('test', true, 'Loading...', 75);
      });

      expect(result.current.getLoadingProgress('test')).toBe(75);
    });

    it('should clear all loading states', () => {
      const { result } = renderHook(() => useLoadingStore());
      
      act(() => {
        result.current.setGlobalLoading(true, 'Global');
        result.current.setLoading('test1', true, 'Test 1');
        result.current.setLoading('test2', true, 'Test 2');
        result.current.clearAllLoading();
      });

      expect(result.current.isGlobalLoading).toBe(false);
      expect(result.current.loadingStates).toEqual({});
    });
  });

  describe('useLoading hook', () => {
    it('should work with global loading', () => {
      const { result } = renderHook(() => useLoading());
      
      expect(result.current.isLoading).toBe(false);

      act(() => {
        result.current.setLoading(true, 'Loading...');
      });

      expect(result.current.isLoading).toBe(true);
      expect(result.current.message).toBe('Loading...');
    });

    it('should work with specific loading key', () => {
      const { result } = renderHook(() => useLoading('api-call'));
      
      expect(result.current.isLoading).toBe(false);

      act(() => {
        result.current.setLoading(true, 'Fetching...', 25);
      });

      expect(result.current.isLoading).toBe(true);
      expect(result.current.message).toBe('Fetching...');
      expect(result.current.progress).toBe(25);
    });

    it('should clear loading state', () => {
      const { result } = renderHook(() => useLoading('test'));
      
      act(() => {
        result.current.setLoading(true, 'Loading...');
        result.current.clearLoading();
      });

      expect(result.current.isLoading).toBe(false);
    });
  });
});