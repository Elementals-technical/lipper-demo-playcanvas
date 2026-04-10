import { useEffect, useState, useCallback, useRef } from 'react';

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

const DRAG_THRESHOLD_PX = 5;

export function usePartSelection() {
  const [selectedPart, setSelectedPart] = useState<PartData | null>(null);
  const [isApiReady, setIsApiReady] = useState(false);
  const dragRef = useRef({ startX: 0, startY: 0, isDown: false, moved: false });

  useEffect(() => {
    const onDown = (e: PointerEvent) => {
      dragRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        isDown: true,
        moved: false,
      };
    };
    const onMove = (e: PointerEvent) => {
      const d = dragRef.current;
      if (!d.isDown || d.moved) return;
      const dx = e.clientX - d.startX;
      const dy = e.clientY - d.startY;
      if (dx * dx + dy * dy > DRAG_THRESHOLD_PX * DRAG_THRESHOLD_PX) {
        d.moved = true;
      }
    };
    const onUp = () => {
      dragRef.current.isDown = false;
    };

    window.addEventListener('pointerdown', onDown, true);
    window.addEventListener('pointermove', onMove, true);
    window.addEventListener('pointerup', onUp, true);

    return () => {
      window.removeEventListener('pointerdown', onDown, true);
      window.removeEventListener('pointermove', onMove, true);
      window.removeEventListener('pointerup', onUp, true);
    };
  }, []);

  useEffect(() => {
    let unsubSelect: (() => void) | null = null;
    let unsubDeselect: (() => void) | null = null;

    const init = () => {
      const api = window.ConfiguratorAPI;
      if (!api?.outline) return false;

      unsubSelect = api.outline.onSelect((data: PartData) => {
        if (dragRef.current.moved) return;
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
