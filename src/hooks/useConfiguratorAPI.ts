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
  outline: {
    getGroups(): Array<{ itemNumber: number; groupName: string; partNumber: string }>;
    getSelectedGroup(): any | null;
    getGroupData(name: string): any | null;
    selectGroup(groupName: string): void;
    deselect(): void;
    highlightGroup(groupName: string): void;
    clearHighlight(): void;
    onSelect(cb: (data: any) => void): () => void;
    onDeselect(cb: () => void): () => void;
  };
  annotations: { show(): void; hide(): void; isVisible(): boolean };
}

declare global {
  interface Window {
    ConfiguratorAPI?: ConfiguratorAPI;
  }
}

export function useConfiguratorAPI() {
  const [api, setApi] = useState<ConfiguratorAPI | null>(null);
  const [state, setState] = useState<ConfiguratorState | null>(null);
  const [isReady, setIsReady] = useState(false);
  const unsubRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      if (window.ConfiguratorAPI) {
        clearInterval(interval);
        const configurator = window.ConfiguratorAPI;
        setApi(configurator);
        setState(configurator.getConfig());
        setIsReady(true);

        unsubRef.current = configurator.subscribe((newState) => {
          setState({ ...newState });
        });
      }
    }, 200);

    return () => {
      clearInterval(interval);
      unsubRef.current?.();
    };
  }, []);

  const setConfig = useCallback(
    async (partial: Partial<ConfiguratorState>) => {
      if (api) await api.setConfig(partial);
    },
    [api]
  );

  const resetConfig = useCallback(async () => {
    if (api) await api.resetConfig();
  }, [api]);

  return { api, state, setConfig, resetConfig, isReady };
}
