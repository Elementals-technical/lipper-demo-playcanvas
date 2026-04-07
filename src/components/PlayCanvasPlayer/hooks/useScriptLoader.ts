/**
 * useScriptLoader Hook
 * Хук для завантаження PlayCanvas скриптів та стилів
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import type { ScriptLoadOptions } from '../types/playcanvas.types';
import {
  loadScriptsSequentially,
  addLinkElement,
  cleanupPlayCanvasResources,
  log,
  logError,
} from '../utils/playcanvas.helpers';

interface UseScriptLoaderResult {
  isLoaded: boolean;
  error: Error | null;
  reload: () => void;
}

/**
 * Хук для завантаження скриптів та стилів PlayCanvas
 */
export const useScriptLoader = (
  options: ScriptLoadOptions
): UseScriptLoaderResult => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [reloadTrigger, setReloadTrigger] = useState(0);

  const { scripts, styles = [], onLoad, onError } = options;

  // Зберігаємо стабільні референції
  const scriptsRef = useRef(scripts);
  const stylesRef = useRef(styles);
  const onLoadRef = useRef(onLoad);
  const onErrorRef = useRef(onError);

  // Оновлюємо refs
  useEffect(() => {
    scriptsRef.current = scripts;
    stylesRef.current = styles;
    onLoadRef.current = onLoad;
    onErrorRef.current = onError;
  });

  const reload = useCallback(() => {
    setReloadTrigger((prev) => prev + 1);
    setIsLoaded(false);
    setError(null);
  }, []);

  useEffect(() => {
    let isMounted = true;
    let disconnectImageObserver: (() => void) | undefined;

    const loadResources = async () => {
      try {
        // Check if scripts already loaded (prevent duplicate loading)
        const firstScript = scriptsRef.current[0];
        if (document.querySelector(`script[src="${firstScript}"]`)) {
          log('Scripts already loaded, skipping...');
          setIsLoaded(true);
          onLoadRef.current?.();
          return;
        }

        log('Starting resource loading...', {
          scripts: scriptsRef.current,
          styles: stylesRef.current,
        });

        // Завантажуємо стилі
        stylesRef.current.forEach((style) => {
          addLinkElement(style);
          log('Style added:', style.href);
        });

        // Послідовно завантажуємо скрипти
        await loadScriptsSequentially(scriptsRef.current);

        if (!isMounted) return;

        log('All scripts loaded successfully');
        setIsLoaded(true);
        onLoadRef.current?.();
      } catch (err) {
        if (!isMounted) return;

        const loadError =
          err instanceof Error
            ? err
            : new Error('Failed to load PlayCanvas resources');

        logError('Resource loading failed', loadError);
        setError(loadError);
        onErrorRef.current?.(loadError);
      }
    };

    loadResources();

    return () => {
      isMounted = false;

      // Cleanup при unmount - використовуємо поточні значення з refs
      cleanupPlayCanvasResources({
        scripts: scriptsRef.current,
        styles: stylesRef.current,
      });

      if (disconnectImageObserver) {
        disconnectImageObserver();
      }

      log('Resources cleaned up');
    };
  }, [
    JSON.stringify(scripts), // Стабільна референція через stringify
    JSON.stringify(styles), // Стабільна референція через stringify
    reloadTrigger,
  ]);

  return {
    isLoaded,
    error,
    reload,
  };
};

export default useScriptLoader;
