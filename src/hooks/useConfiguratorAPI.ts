import { useEffect, useState, useCallback, useRef } from 'react';

export interface ConfiguratorState {
  explodeStatus: boolean;
  hubAssemblyVisible: boolean;
  spindleAssemblyVisible: boolean;
  springAssemblyVisible: boolean;
  brakeAssemblyVisible: boolean;
  cameraPosition: string;
  annotationsVisible: boolean;
}

export interface ConfiguratorAPI {
  setConfig(partial: Partial<ConfiguratorState>): Promise<void>;
  getConfig(): ConfiguratorState;
  subscribe(cb: (newState: ConfiguratorState, oldState: ConfiguratorState) => void): () => void;
  getAvailableOptions(): Record<string, unknown>;
  resetConfig(): Promise<void>;
  camera: any;
  outline: any;
  annotations: { show(): void; hide(): void; isVisible(): boolean };
}

declare global {
  interface Window {
    ConfiguratorAPI?: ConfiguratorAPI;
    __playcanvasIframe?: HTMLIFrameElement;
  }
}

/**
 * Sends a command to the PlayCanvas iframe via postMessage
 */
function postToIframe(type: string, payload?: unknown) {
  const iframe = window.__playcanvasIframe;
  if (iframe?.contentWindow) {
    iframe.contentWindow.postMessage({ type, payload }, '*');
  }
}

export function useConfiguratorAPI() {
  const [api, setApi] = useState<ConfiguratorAPI | null>(null);
  const [state, setState] = useState<ConfiguratorState | null>(null);
  const [isReady, setIsReady] = useState(false);
  const unsubRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    // Try direct API access (same-origin)
    const tryDirectAccess = () => {
      if (window.ConfiguratorAPI) {
        const configurator = window.ConfiguratorAPI;
        setApi(configurator);
        setState(configurator.getConfig());
        unsubRef.current = configurator.subscribe((newState) => {
          setState({ ...newState });
        });
        setIsReady(true);
        return true;
      }
      return false;
    };

    // Poll for direct API
    const interval = setInterval(() => {
      if (tryDirectAccess()) {
        clearInterval(interval);
      }
    }, 200);

    // Listen for state updates from iframe (cross-origin postMessage)
    const handleMessage = (e: MessageEvent) => {
      const data = e.data;
      if (!data?.type) return;

      if (data.type === 'configurator:ready') {
        setIsReady(true);
        // Try direct access one more time
        tryDirectAccess();
      }

      if (data.type === 'configurator:stateChange' && data.payload) {
        setState(data.payload);
        setIsReady(true);
      }
    };

    window.addEventListener('message', handleMessage);

    // Fallback: mark as ready when iframe exists (cross-origin without postMessage support)
    const fallbackTimeout = setTimeout(() => {
      if (window.__playcanvasIframe && !isReady) {
        setIsReady(true);
      }
    }, 3000);

    return () => {
      clearInterval(interval);
      clearTimeout(fallbackTimeout);
      window.removeEventListener('message', handleMessage);
      unsubRef.current?.();
    };
  }, []);

  const setConfig = useCallback(
    async (partial: Partial<ConfiguratorState>) => {
      if (api) {
        // Direct access
        await api.setConfig(partial);
      } else {
        // Cross-origin fallback via postMessage
        postToIframe('configurator:setConfig', partial);
      }
    },
    [api]
  );

  const resetConfig = useCallback(async () => {
    if (api) {
      await api.resetConfig();
    } else {
      postToIframe('configurator:resetConfig');
    }
  }, [api]);

  return { api, state, setConfig, resetConfig, isReady };
}
