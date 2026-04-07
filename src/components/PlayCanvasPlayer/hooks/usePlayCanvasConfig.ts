/**
 * usePlayCanvasConfig Hook
 * Хук для управління конфігурацією PlayCanvas
 */

import { useCallback, useRef } from 'react';
import type {
  RenderData,
  ApplyConfigParams,
  ConfigResult,
} from '../types/playcanvas.types';
import { getPlayCanvasService } from '../services/playcanvas.service';
import {
  transformRenderDataToArray,
  buildConfigForApi,
  log,
  logError,
} from '../utils/playcanvas.helpers';

interface UsePlayCanvasConfigOptions {
  products?: unknown[];
  idProduct?: string;
  onConfigApplied?: (config: unknown) => void;
  onError?: (error: Error) => void;
}

interface UsePlayCanvasConfigResult {
  applyConfig: (params: ApplyConfigParams) => Promise<ConfigResult>;
  updateValue: (
    key: string,
    value: number | string | boolean
  ) => Promise<ConfigResult>;
  isApplying: boolean;
}

/**
 * Хук для роботи з конфігурацією PlayCanvas
 */
export const usePlayCanvasConfig = (
  options: UsePlayCanvasConfigOptions = {}
): UsePlayCanvasConfigResult => {
  const { products, idProduct, onConfigApplied, onError } = options;
  const isApplyingRef = useRef(false);
  const playCanvasService = getPlayCanvasService();

  /**
   * Застосування конфігурації
   */
  const applyConfig = useCallback(
    async (params: ApplyConfigParams): Promise<ConfigResult> => {
      const { renderData, products: customProducts, debugPrefix } = params;

      if (isApplyingRef.current) {
        log('Config application already in progress, skipping...');
        return { success: false, error: new Error('Already applying config') };
      }

      try {
        isApplyingRef.current = true;

        log('Building config...', { renderData, debugPrefix });

        // Перетворюємо renderData в масив
        const transformedData = transformRenderDataToArray(renderData);

        // Будуємо конфігурацію для API
        const config = await buildConfigForApi({
          body: transformedData,
          products: customProducts || products,
          idProduct: idProduct,
        });

        // Skip if config is null (waiting for initialization)
        if (config === null) {
          log('Config is null, skipping application');
          return { success: true, config: null };
        }

        log('Config built successfully', config);

        // Застосовуємо конфігурацію з retry
        const result = await playCanvasService.applyConfigWithRetry(
          config,
          debugPrefix
        );

        if (result.success) {
          log('Config applied successfully');
          onConfigApplied?.(config);
        } else {
          logError('Failed to apply config', result.error);
          onError?.(result.error!);
        }

        return result;
      } catch (error) {
        const err =
          error instanceof Error
            ? error
            : new Error('Unknown error during config application');

        logError('Config application error', err);
        onError?.(err);

        return {
          success: false,
          error: err,
        };
      } finally {
        isApplyingRef.current = false;
      }
    },
    [products, idProduct, onConfigApplied, onError, playCanvasService]
  );

  /**
   * Оновлення одного значення
   */
  const updateValue = useCallback(
    async (
      key: string,
      value: number | string | boolean
    ): Promise<ConfigResult> => {
      log(`Updating value: ${key} = ${value}`);

      // Очищаємо кеш (legacy support)
      playCanvasService.clearCache();

      // Створюємо новий renderData з оновленим значенням
      const renderData: RenderData = {
        [key]: value,
      };

      return applyConfig({
        renderData,
        debugPrefix: `[UPDATE-${key}:${value}]`,
      });
    },
    [applyConfig, playCanvasService]
  );

  return {
    applyConfig,
    updateValue,
    isApplying: isApplyingRef.current,
  };
};

export default usePlayCanvasConfig;
