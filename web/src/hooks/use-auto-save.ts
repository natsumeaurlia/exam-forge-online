import { useEffect, useRef, useCallback, useState } from 'react';
import { useDebounce } from './use-debounce';

interface UseAutoSaveOptions {
  data: any;
  onSave: (data: any) => Promise<void>;
  delay?: number;
  enabled?: boolean;
  maxRetries?: number;
  onError?: (error: Error) => void;
}

export function useAutoSave({
  data,
  onSave,
  delay = 2000,
  enabled = true,
  maxRetries = 3,
  onError,
}: UseAutoSaveOptions) {
  const debouncedData = useDebounce(data, delay);
  const previousDataRef = useRef<any>(undefined);
  const isSavingRef = useRef(false);
  const retryCountRef = useRef(0);
  const [lastError, setLastError] = useState<Error | null>(null);

  const save = useCallback(async () => {
    if (!enabled || isSavingRef.current) return;

    const attemptSave = async (retryCount: number): Promise<void> => {
      try {
        isSavingRef.current = true;
        await onSave(debouncedData);
        previousDataRef.current = debouncedData;
        retryCountRef.current = 0;
        setLastError(null);
      } catch (error) {
        const err =
          error instanceof Error ? error : new Error('Auto-save failed');
        console.error('Auto-save failed:', err);

        if (retryCount < maxRetries) {
          console.log(
            `Retrying auto-save... (attempt ${retryCount + 1}/${maxRetries})`
          );
          // Exponential backoff: 1s, 2s, 4s
          const retryDelay = Math.pow(2, retryCount) * 1000;
          await new Promise(resolve => setTimeout(resolve, retryDelay));
          return attemptSave(retryCount + 1);
        } else {
          setLastError(err);
          if (onError) {
            onError(err);
          }
          throw err;
        }
      } finally {
        isSavingRef.current = false;
      }
    };

    await attemptSave(0);
  }, [debouncedData, onSave, enabled, maxRetries, onError]);

  useEffect(() => {
    // Skip initial render and when data hasn't changed
    if (
      !enabled ||
      previousDataRef.current === undefined ||
      JSON.stringify(previousDataRef.current) === JSON.stringify(debouncedData)
    ) {
      previousDataRef.current = debouncedData;
      return;
    }

    save();
  }, [debouncedData, save, enabled]);

  return {
    isSaving: isSavingRef.current,
    save,
    lastError,
  };
}
