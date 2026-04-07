/**
 * PlayCanvas Player Component
 * Завантажує PlayCanvas скрипти напряму.
 * Не переміщує елементи — тільки ховає зайвий UI (SuperSplat панелі).
 * ConfiguratorAPI доступний через window.ConfiguratorAPI.
 */

import React, { useRef, useEffect, useState } from 'react';
import s from './PlayCanvasPlayer.module.scss';

const PLAYCANVAS_CONFIG = {
  baseUrl: 'https://2d-render-admin-storage.fra1.cdn.digitaloceanspaces.com',
  idProject: '428',
  idProduct: '2669',
} as const;

const generateUrls = (baseUrl: string, idProject: string, idProduct: string) => {
  const base = `${baseUrl}/projects/${idProject}/products/${idProduct}/playcanvas/`;
  return {
    base,
    indexScript: `${base}js/index.mjs`,
    styles: `${base}styles.css`,
    manifest: `${base}manifest.json`,
  };
};

type PlayCanvasUrls = ReturnType<typeof generateUrls>;

const cleanupPlayCanvas = (urls: PlayCanvasUrls) => {
  const win = window as any;
  try {
    const pcApp = win.pc?.Application?.getApplication?.() ?? win.pcBootstrap?.app;
    pcApp?.destroy?.();
  } catch (e) {
    console.warn('PlayCanvas app destroy error:', e);
  }

  if (win.pcBootstrap?.reflowHandler) {
    window.removeEventListener('resize', win.pcBootstrap.reflowHandler);
    window.removeEventListener('orientationchange', win.pcBootstrap.reflowHandler);
  }

  delete win.pc;
  delete win.configurator;
  delete win.pcBootstrap;
  delete win.ConfiguratorAPI;

  document.querySelectorAll('script[type="module"]').forEach((el) => {
    const src = (el as HTMLScriptElement).src ?? '';
    if (src.includes(urls.base)) el.remove();
  });
  document.querySelector('script[type="importmap"]')?.remove();
  document.querySelectorAll('link[rel="stylesheet"]').forEach((el) => {
    const href = (el as HTMLLinkElement).href ?? '';
    if (href.includes(urls.base)) el.remove();
  });
};

const addLink = (href: string, rel: string, type?: string): void => {
  if (document.querySelector(`link[href="${href}"]`)) return;
  const link = document.createElement('link');
  link.rel = rel;
  link.href = href;
  if (type) link.type = type;
  document.head.appendChild(link);
};

const addImportMap = (baseUrl: string, cacheBust: string) => {
  const script = document.createElement('script');
  script.type = 'importmap';
  script.textContent = JSON.stringify({
    imports: {
      playcanvas: `${baseUrl}js/playcanvas-stable.min.mjs?v=${cacheBust}`,
    },
  });
  document.head.appendChild(script);
};

const loadModuleScript = (src: string, cacheBust: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.type = 'module';
    script.src = `${src}?v=${cacheBust}`;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load: ${src}`));
    document.body.appendChild(script);
  });
};

/**
 * CSS-інжекція: ховає SuperSplat UI, обмежує canvas та анотації контейнером.
 * PlayCanvas елементи залишаються в body, але візуально обмежені рамками плеєра.
 */
const injectContainmentStyles = () => {
  const styleId = 'playcanvas-containment-styles';
  if (document.getElementById(styleId)) return;

  const style = document.createElement('style');
  style.id = styleId;
  style.textContent = `
    /* Clip PlayCanvas canvas and overlays to our container bounds */
    #application-canvas {
      position: absolute !important;
      clip-path: none;
    }

    /* Hide SuperSplat editor UI */
    body > div:not(#tk-treble-root):not([class*="pcui"]):not(.annotation-container) {
      /* Don't hide by default — be selective below */
    }

    /* Hide specific SuperSplat panels */
    .pcui-panel,
    .pcui-container,
    [class*="toolbar"],
    [class*="menu-bar"],
    [class*="scene-manager"],
    [id*="panel"] {
      display: none !important;
    }
  `;
  document.head.appendChild(style);
};

const removeContainmentStyles = () => {
  document.getElementById('playcanvas-containment-styles')?.remove();
};

/**
 * Синхронізує розмір та позицію PlayCanvas canvas з нашим контейнером.
 */
const syncCanvasToContainer = (containerRef: React.RefObject<HTMLDivElement | null>) => {
  const sync = () => {
    const container = containerRef.current;
    const canvas = document.getElementById('application-canvas') as HTMLCanvasElement;
    if (!container || !canvas) return;

    const rect = container.getBoundingClientRect();
    canvas.style.position = 'fixed';
    canvas.style.left = `${rect.left}px`;
    canvas.style.top = `${rect.top}px`;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;
    canvas.style.zIndex = '1';
  };

  sync();
  const interval = setInterval(sync, 200);
  window.addEventListener('resize', sync);
  window.addEventListener('scroll', sync);

  return () => {
    clearInterval(interval);
    window.removeEventListener('resize', sync);
    window.removeEventListener('scroll', sync);
  };
};

/**
 * Синхронізує анотації (labels) — зсуває їх відносно контейнера.
 */
const syncAnnotations = (containerRef: React.RefObject<HTMLDivElement | null>) => {
  const observer = new MutationObserver(() => {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();

    // PlayCanvas annotations — зазвичай div з абсолютним/фіксованим позиціонуванням
    document.querySelectorAll('.annotation, [class*="annotation"], [class*="label-"]').forEach((el) => {
      const htmlEl = el as HTMLElement;
      // Clip annotations to container bounds
      const elRect = htmlEl.getBoundingClientRect();
      if (
        elRect.right < rect.left ||
        elRect.left > rect.right ||
        elRect.bottom < rect.top ||
        elRect.top > rect.bottom
      ) {
        htmlEl.style.visibility = 'hidden';
      } else {
        htmlEl.style.visibility = 'visible';
      }
    });
  });

  observer.observe(document.body, { childList: true, subtree: true });
  return () => observer.disconnect();
};

const waitForConfiguratorAPI = async (timeoutMs = 30000): Promise<boolean> => {
  const startTime = Date.now();
  while (Date.now() - startTime < timeoutMs) {
    if ((window as any).ConfiguratorAPI) return true;
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  return false;
};

const CONTAINER_ID = 'playcanvas-player-container';

export const PlayCanvasPlayer: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  useEffect(() => {
    let isMounted = true;
    const cacheBust = String(Date.now());
    const urls = generateUrls(
      PLAYCANVAS_CONFIG.baseUrl,
      PLAYCANVAS_CONFIG.idProject,
      PLAYCANVAS_CONFIG.idProduct
    );

    let cleanupSync: (() => void) | undefined;
    let cleanupAnnotations: (() => void) | undefined;

    const init = async () => {
      try {
        cleanupPlayCanvas(urls);
        setStatus('loading');

        injectContainmentStyles();

        addLink(urls.styles, 'stylesheet', 'text/css');
        addLink(urls.manifest, 'manifest');
        addImportMap(urls.base, cacheBust);

        await new Promise((resolve) => setTimeout(resolve, 100));
        if (!isMounted) return;

        await loadModuleScript(urls.indexScript, cacheBust);
        if (!isMounted) return;

        await waitForConfiguratorAPI(30000);
        if (!isMounted) return;

        // Start syncing canvas position/size to our container
        cleanupSync = syncCanvasToContainer(containerRef);
        cleanupAnnotations = syncAnnotations(containerRef);

        setStatus('ready');
      } catch (err) {
        if (!isMounted) return;
        console.error('PlayCanvas init failed:', err);
        setStatus('error');
      }
    };

    init();

    return () => {
      isMounted = false;
      cleanupSync?.();
      cleanupAnnotations?.();
      removeContainmentStyles();
      cleanupPlayCanvas(urls);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      id={CONTAINER_ID}
      className={s.container}
      data-status={status}
    >
      {status === 'loading' && (
        <div className={s.overlay}>
          <div className={s.loading}>
            <div className={s.title}>Loading 3D Model...</div>
            <div className={s.spinner} />
          </div>
        </div>
      )}
    </div>
  );
};

export default PlayCanvasPlayer;
