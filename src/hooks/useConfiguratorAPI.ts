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

interface CameraAPI {
  getYaw(): number;
  setYaw(degrees: number): void;
  getPitch(): number;
  setPitch(degrees: number): void;
  getDistance(): number;
  setDistance(value: number): void;
  getPivotPoint(): { x: number; y: number; z: number };
  setPivotPoint(x: number | { x: number; y: number; z: number }, y?: number, z?: number): void;
  reset(yaw: number, pitch: number, distance: number): void;
  focus(entityName: string): void;
  transitionTo(id: string, options?: { duration?: number; onComplete?: () => void }): void;
  cancelTransition(): void;
  resetToDefault(options?: { duration?: number }): void;
  isTransitioning(): boolean;
  setMouseInputEnabled(enabled: boolean): void;
  setTouchInputEnabled(enabled: boolean): void;
  setInputEnabled(enabled: boolean): void;
  setAutoOrbitSpeed(speed: number): void;
  setIdleAutoOrbitDelay(seconds: number): void;
  setDistanceMin(value: number): void;
  setDistanceMax(value: number): void;
  setPitchAngleMin(degrees: number): void;
  setPitchAngleMax(degrees: number): void;
  getPosition(): { x: number; y: number; z: number };
  getForward(): { x: number; y: number; z: number };
}

interface OutlineAPI {
  getGroups(): Array<{ itemNumber: number; groupName: string; partNumber: string }>;
  getSelectedGroup(): { itemNumber: number; groupName: string; partNumber: string } | null;
  selectGroup(groupName: string): void;
  deselect(): void;
  highlightGroup(groupName: string): void;
  clearHighlight(): void;
}

interface AnnotationsAPI {
  show(): void;
  hide(): void;
  isVisible(): boolean;
}

export interface ConfiguratorAPI {
  setConfig(partial: Partial<ConfiguratorState>): Promise<void>;
  getConfig(): ConfiguratorState;
  subscribe(cb: (newState: ConfiguratorState, oldState: ConfiguratorState) => void): () => void;
  getAvailableOptions(): Record<string, unknown>;
  resetConfig(): Promise<void>;
  camera: CameraAPI;
  outline: OutlineAPI;
  annotations: AnnotationsAPI;
}

declare global {
  interface Window {
    ConfiguratorAPI?: ConfiguratorAPI;
  }
}

export function useConfiguratorAPI() {
  const [api, setApi] = useState<ConfiguratorAPI | null>(null);
  const [state, setState] = useState<ConfiguratorState | null>(null);
  const unsubRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      if (window.ConfiguratorAPI) {
        clearInterval(interval);
        const configurator = window.ConfiguratorAPI;
        setApi(configurator);
        setState(configurator.getConfig());
        unsubRef.current = configurator.subscribe((newState) => {
          setState({ ...newState });
        });
      }
    }, 100);

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

  return { api, state, setConfig, resetConfig, isReady: !!api };
}
