/**
 * usePlayCanvasLoader Hook
 * Головний хук для завантаження та ініціалізації PlayCanvas
 */

import { useEffect, useState, useCallback, useMemo } from 'react';
import {
  LoadingStatus,
  PlayCanvasConfig,
  RenderData,
  RetryOptions,
} from '../types/playcanvas.types';
import { getPlayCanvasService } from '../services/playcanvas.service';
import { useScriptLoader } from './useScriptLoader';
import { usePlayCanvasConfig } from './usePlayCanvasConfig';
import {
  generatePlayCanvasUrls,
  setupImageCrossOrigin,
  log,
  logError,
} from '../utils/playcanvas.helpers';

interface UsePlayCanvasLoaderOptions {
  config: PlayCanvasConfig;
  initialRenderData?: RenderData;
  products?: unknown[];
  shouldApplyOnLoad?: boolean;
  retryOptions?: RetryOptions;
  onReady?: () => void;
  onError?: (error: Error) => void;
  onConfigApplied?: (config: unknown) => void;
}

interface UsePlayCanvasLoaderResult {
  status: LoadingStatus;
  isReady: boolean;
  error: Error | null;
  applyConfig: (renderData: RenderData) => Promise<void>;
  updateValue: (key: string, value: number | string | boolean) => Promise<void>;
}

/**
 * Головний хук для роботи з PlayCanvas плеєром
 */
export const usePlayCanvasLoader = (
  options: UsePlayCanvasLoaderOptions
): UsePlayCanvasLoaderResult => {
  const {
    config,
    initialRenderData,
    products,
    shouldApplyOnLoad = false,
    retryOptions,
    onReady,
    onError,
    onConfigApplied,
  } = options;

  const [status, setStatus] = useState<LoadingStatus>(LoadingStatus.IDLE);
  const [error, setError] = useState<Error | null>(null);

  // Генеруємо URLs (мемоізовано щоб не створювати нові масиви)
  const urls = useMemo(
    () =>
      generatePlayCanvasUrls(
        config.baseUrl || '',
        config.idProject,
        config.idProduct
      ),
    [config.baseUrl, config.idProject, config.idProduct]
  );

  // Ініціалізуємо сервіс
  const playCanvasService = getPlayCanvasService(retryOptions);

  // Завантаження скриптів
  const scriptLoader = useScriptLoader({
    scripts: urls.scripts,
    styles: urls.styles,
    onLoad: () => {
      log('Scripts loaded, waiting for PlayCanvas initialization...');
      setStatus(LoadingStatus.LOADING);
    },
    onError: (err) => {
      logError('Script loading failed', err);
      setStatus(LoadingStatus.ERROR);
      setError(err);
      onError?.(err);
    },
  });

  // Конфігурація
  const configManager = usePlayCanvasConfig({
    products,
    idProduct: config.idProduct,
    onConfigApplied,
    onError,
  });

  // Перевірка готовності PlayCanvas після завантаження скриптів
  useEffect(() => {
    if (!scriptLoader.isLoaded) return;
    if (status === LoadingStatus.READY) return;

    let isMounted = true;

    const checkReadiness = async () => {
      try {
        log('Checking PlayCanvas readiness...');

        await playCanvasService.waitForReady(10000);

        if (!isMounted) {
          log('Component unmounted during readiness check, aborting...');
          return;
        }

        log('PlayCanvas is ready!');
        setStatus(LoadingStatus.READY);

        // Застосовуємо початкову конфігурацію якщо потрібно
        if (shouldApplyOnLoad && initialRenderData) {
          log('Applying initial configuration...');

          setTimeout(async () => {
            if (!isMounted) return; // Check again before applying config

            const result = await configManager.applyConfig({
              renderData: initialRenderData,
              products,
              debugPrefix: '[INITIAL-LOAD]',
            });

            if (!isMounted) return; // Check after async operation

            if (result.success) {
              log('Initial config applied successfully');
              onReady?.();
            } else {
              logError('Initial config failed', result.error);
            }
          }, 500);
        } else {
          onReady?.();
        }
      } catch (err) {
        if (!isMounted) {
          log('Component unmounted, ignoring error');
          return; // Don't call onError if unmounted
        }

        const readyError =
          err instanceof Error
            ? err
            : new Error('PlayCanvas initialization failed');

        logError('Readiness check failed', readyError);
        setStatus(LoadingStatus.ERROR);
        setError(readyError);
        onError?.(readyError);
      }
    };

    checkReadiness();

    return () => {
      isMounted = false;
    };
  }, [
    scriptLoader.isLoaded,
    shouldApplyOnLoad,
    initialRenderData,
    products,
    status,
    playCanvasService,
    configManager,
    onReady,
    onError,
  ]);

  // Налаштування crossOrigin для зображень
  useEffect(() => {
    const disconnect = setupImageCrossOrigin();
    return disconnect;
  }, []);

  // Wrapper для applyConfig
  const applyConfig = useCallback(
    async (renderData: RenderData): Promise<void> => {
      const result = await configManager.applyConfig({
        renderData,
        products,
        debugPrefix: '[MANUAL-APPLY]',
      });

      if (!result.success) {
        throw result.error;
      }
    },
    [configManager, products]
  );

  // Wrapper для updateValue
  const updateValue = useCallback(
    async (key: string, value: number | string | boolean): Promise<void> => {
      const result = await configManager.updateValue(key, value);

      if (!result.success) {
        throw result.error;
      }
    },
    [configManager]
  );

  return {
    status,
    isReady: status === LoadingStatus.READY,
    error: error || scriptLoader.error,
    applyConfig,
    updateValue,
  };
};

export default usePlayCanvasLoader;
