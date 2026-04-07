import { useEffect, useState, useCallback } from 'react';

export interface PartData {
  groupName: string;
  itemNumber: number;
  partNumber: string | null;
  sku: string | null;
  displayName: string;
  category: string | null;
  description: string | null;
  technicalNotes: string | null;
  isMajorComponent: boolean;
  storeLink: string | null;
  storeLinkText: string | null;
  entities: string[];
  specifications: Record<string, string> | null;
  maintenance: {
    maintenance_interval: string;
    maintenance_task: string;
    common_issues: string;
  } | null;
}

export function usePartSelection() {
  const [selectedPart, setSelectedPart] = useState<PartData | null>(null);
  const [isApiReady, setIsApiReady] = useState(false);

  useEffect(() => {
    let unsubSelect: (() => void) | null = null;
    let unsubDeselect: (() => void) | null = null;

    const init = () => {
      const api = window.ConfiguratorAPI;
      if (!api?.outline) return false;

      unsubSelect = api.outline.onSelect((data: PartData) => {
        setSelectedPart(data);
      });
      unsubDeselect = api.outline.onDeselect(() => {
        setSelectedPart(null);
      });
      setIsApiReady(true);
      return true;
    };

    if (!init()) {
      const interval = setInterval(() => {
        if (init()) clearInterval(interval);
      }, 200);
      return () => {
        clearInterval(interval);
        unsubSelect?.();
        unsubDeselect?.();
      };
    }

    return () => {
      unsubSelect?.();
      unsubDeselect?.();
    };
  }, []);

  const deselect = useCallback(() => {
    window.ConfiguratorAPI?.outline.deselect();
  }, []);

  const selectPart = useCallback((groupName: string) => {
    window.ConfiguratorAPI?.outline.selectGroup(groupName);
  }, []);

  const highlightPart = useCallback((groupName: string) => {
    window.ConfiguratorAPI?.outline.highlightGroup(groupName);
  }, []);

  const clearHighlight = useCallback(() => {
    window.ConfiguratorAPI?.outline.clearHighlight();
  }, []);

  return { selectedPart, deselect, selectPart, highlightPart, clearHighlight, isApiReady };
}
