/**
 * PlayCanvas Player Component
 *
 * Рендерить <canvas id="application-canvas"> всередині контейнера.
 * PlayCanvas скрипти (вже патчені для embeddable mode) знаходять цей canvas
 * і заповнюють батьківський контейнер через ResizeObserver.
 * ConfiguratorAPI доступний через window.ConfiguratorAPI.
 */

import React, { useRef, useEffect, useState } from 'react';
import s from './PlayCanvasPlayer.module.scss';

const PLAYCANVAS_DEFAULTS = {
  baseUrl: 'https://2d-render-admin-storage.fra1.cdn.digitaloceanspaces.com',
  idProject: '428',
  idProduct: '2669',
} as const;

export interface PlayCanvasPlayerProps {
  productId?: string;
}

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

  // Remove PlayCanvas native loading screen if still present
  document.getElementById('application-spinner')?.remove();
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
  if (document.querySelector('script[type="importmap"]')) return;
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
  const fullSrc = `${src}?v=${cacheBust}`;
  const existing = document.querySelector(`script[src="${fullSrc}"]`);
  if (existing) return Promise.resolve();

  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.type = 'module';
    script.src = fullSrc;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load: ${src}`));
    document.body.appendChild(script);
  });
};

const waitForConfiguratorAPI = async (timeoutMs = 30000): Promise<boolean> => {
  const startTime = Date.now();
  while (Date.now() - startTime < timeoutMs) {
    if ((window as any).ConfiguratorAPI) return true;
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  return false;
};

export const PlayCanvasPlayer: React.FC<PlayCanvasPlayerProps> = ({ productId }) => {
  const resolvedProductId = productId || PLAYCANVAS_DEFAULTS.idProduct;
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<'loading' | 'fading' | 'ready' | 'error'>('loading');

  useEffect(() => {
    let isMounted = true;
    const cacheBust = resolvedProductId;
    const urls = generateUrls(
      PLAYCANVAS_DEFAULTS.baseUrl,
      PLAYCANVAS_DEFAULTS.idProject,
      resolvedProductId
    );

    const init = async () => {
      try {
        // Skip re-init if ConfiguratorAPI already loaded for this product
        if ((window as any).ConfiguratorAPI) {
          setStatus('ready');
          return;
        }

        cleanupPlayCanvas(urls);
        setStatus('loading');

        addLink(urls.styles, 'stylesheet', 'text/css');
        addLink(urls.manifest, 'manifest');
        addImportMap(urls.base, cacheBust);

        await new Promise((resolve) => setTimeout(resolve, 100));
        if (!isMounted) return;

        await loadModuleScript(urls.indexScript, cacheBust);
        if (!isMounted) return;

        await waitForConfiguratorAPI(30000);
        if (!isMounted) return;

        // Remove PlayCanvas native loader
        document.getElementById('application-spinner')?.remove();

        // Fake 1s delay — let first frame render
        await new Promise((resolve) => setTimeout(resolve, 1000));
        if (!isMounted) return;

        // Start fade-out
        setStatus('fading');

        // After fade animation completes
        setTimeout(() => {
          if (isMounted) setStatus('ready');
        }, 500);
      } catch (err) {
        if (!isMounted) return;
        console.error('PlayCanvas init failed:', err);
        setStatus('error');
      }
    };

    init();

    return () => {
      isMounted = false;
      cleanupPlayCanvas(urls);
    };
  }, [resolvedProductId]);

  const showOverlay = status === 'loading' || status === 'fading';

  return (
    <div ref={containerRef} className={s.container} data-status={status}>
      <canvas id="application-canvas" className={s.canvas} />

      {showOverlay && (
        <div className={`${s.overlay} ${status === 'fading' ? s.fadeOut : ''}`}>
          <div className={s.splash}>
            <div className={s.loader}>
              <div className={s.loaderDot} />
              <div className={s.loaderDot} />
            </div>
            <div className={s.splashText}>Personalising your experience...</div>
          </div>
        </div>
      )}

      {status === 'error' && (
        <div className={s.overlay}>
          <div className={s.splash}>
            <div className={s.splashText}>Product not found or failed to load.</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlayCanvasPlayer;
