/**
 * PlayCanvas Player Component
 * Завантажує PlayCanvas скрипти напряму, ховає вбудований UI,
 * залишає тільки canvas з 3D моделлю.
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
 * Ховає весь вбудований UI PlayCanvas (SuperSplat панелі, тулбари),
 * залишає тільки canvas.
 */
const hidePlayCanvasUI = (containerRef: React.RefObject<HTMLDivElement | null>) => {
  // Ховаємо весь контент body, який PlayCanvas додав поза нашим контейнером
  const observer = new MutationObserver(() => {
    // Приховати всі прямі дочірні елементи body, окрім нашого React root та стандартних
    document.body.querySelectorAll(':scope > div, :scope > header, :scope > footer, :scope > nav, :scope > aside').forEach((el) => {
      const htmlEl = el as HTMLElement;
      // Пропускаємо React root та наші елементи
      if (
        htmlEl.id === 'tk-treble-root' ||
        htmlEl.id === 'application-canvas' ||
        htmlEl.closest('#tk-treble-root')
      ) return;
      // Ховаємо елементи PlayCanvas UI
      if (!htmlEl.dataset.reactRoot) {
        htmlEl.style.display = 'none';
      }
    });

    // Знаходимо canvas і переміщуємо в наш контейнер
    const canvas = document.getElementById('application-canvas') as HTMLCanvasElement;
    if (canvas && containerRef.current && !containerRef.current.contains(canvas)) {
      containerRef.current.appendChild(canvas);
      canvas.className = s.canvas;
    }
  });

  observer.observe(document.body, { childList: true, subtree: false });

  // Також одразу виконуємо
  setTimeout(() => {
    const canvas = document.getElementById('application-canvas') as HTMLCanvasElement;
    if (canvas && containerRef.current && !containerRef.current.contains(canvas)) {
      containerRef.current.appendChild(canvas);
      canvas.className = s.canvas;
    }
  }, 500);

  return () => observer.disconnect();
};

/**
 * Очікування ConfiguratorAPI
 */
const waitForConfiguratorAPI = async (timeoutMs = 30000): Promise<boolean> => {
  const startTime = Date.now();
  while (Date.now() - startTime < timeoutMs) {
    if ((window as any).ConfiguratorAPI) return true;
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  return false;
};

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

    // Приховуємо зайвий UI
    const disconnectObserver = hidePlayCanvasUI(containerRef);

    const init = async () => {
      try {
        cleanupPlayCanvas(urls);
        setStatus('loading');

        addLink(urls.styles, 'stylesheet', 'text/css');
        addLink(urls.manifest, 'manifest');
        addImportMap(urls.base, cacheBust);

        await new Promise((resolve) => setTimeout(resolve, 100));
        if (!isMounted) return;

        await loadModuleScript(urls.indexScript, cacheBust);
        if (!isMounted) return;

        const apiReady = await waitForConfiguratorAPI(30000);
        if (!isMounted) return;

        if (apiReady) {
          setStatus('ready');
        } else {
          // API не з'явився, але canvas може працювати
          setStatus('ready');
        }
      } catch (err) {
        if (!isMounted) return;
        console.error('PlayCanvas init failed:', err);
        setStatus('error');
      }
    };

    init();

    return () => {
      isMounted = false;
      disconnectObserver();
      cleanupPlayCanvas(urls);
    };
  }, []);

  return (
    <div ref={containerRef} className={s.container} data-status={status}>
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
