/**
 * PlayCanvas Context
 * Контекст для управління станом PlayCanvas плеєра
 */

import React, { createContext, useContext, useMemo, useCallback } from 'react';
import type {
  PlayCanvasContextValue,
  PlayCanvasPlayerProps,
  ApplyConfigParams,
  ConfigResult,
} from '../types/playcanvas.types';
import { usePlayCanvasLoader } from '../hooks/usePlayCanvasLoader';

/**
 * Context для PlayCanvas
 */
const PlayCanvasContext = createContext<PlayCanvasContextValue | null>(null);

/**
 * Props для Provider
 */
interface PlayCanvasProviderProps extends PlayCanvasPlayerProps {
  children: React.ReactNode;
}

/**
 * Provider для PlayCanvas контексту
 */
export const PlayCanvasProvider: React.FC<PlayCanvasProviderProps> = ({
  children,
  idProject,
  idProduct,
  baseUrl,
  initialRenderData,
  products,
  retryOptions,
  onReady,
  onError,
  onConfigApplied,
}) => {
  const config = useMemo(
    () => ({
      idProject,
      idProduct,
      baseUrl,
    }),
    [idProject, idProduct, baseUrl]
  );

  const loader = usePlayCanvasLoader({
    config,
    initialRenderData,
    products,
    shouldApplyOnLoad: !!initialRenderData,
    retryOptions,
    onReady,
    onError,
    onConfigApplied,
  });

  const applyConfig = useCallback(
    async (params: ApplyConfigParams): Promise<ConfigResult> => {
      try {
        await loader.applyConfig(params.renderData);
        return {
          success: true,
          config: params.renderData,
        };
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        return {
          success: false,
          error: err,
        };
      }
    },
    [loader]
  );

  const updateValue = useCallback(
    async (
      key: string,
      value: number | string | boolean
    ): Promise<ConfigResult> => {
      try {
        await loader.updateValue(key, value);
        return {
          success: true,
          config: { [key]: value },
        };
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        return {
          success: false,
          error: err,
        };
      }
    },
    [loader]
  );

  const contextValue: PlayCanvasContextValue = useMemo(
    () => ({
      status: loader.status,
      isReady: loader.isReady,
      applyConfig,
      updateValue,
      error: loader.error,
      config,
    }),
    [
      loader.status,
      loader.isReady,
      loader.error,
      config,
      applyConfig,
      updateValue,
    ]
  );

  // log('Context value updated', contextValue); // Removed to reduce noise

  return (
    <PlayCanvasContext.Provider value={contextValue}>
      {children}
    </PlayCanvasContext.Provider>
  );
};

/**
 * Хук для використання PlayCanvas контексту
 */
export const usePlayCanvas = (): PlayCanvasContextValue => {
  const context = useContext(PlayCanvasContext);

  if (!context) {
    throw new Error('usePlayCanvas must be used within PlayCanvasProvider');
  }

  return context;
};

/**
 * Хук для перевірки готовності PlayCanvas (опціональний)
 */
export const usePlayCanvasOptional = (): PlayCanvasContextValue | null => {
  return useContext(PlayCanvasContext);
};

export default PlayCanvasContext;
