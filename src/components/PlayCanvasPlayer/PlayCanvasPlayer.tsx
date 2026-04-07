/**
 * PlayCanvas Player Component
 * Простий компонент для рендерингу PlayCanvas плеєра з хардкодом
 */

import React, { useRef, useEffect, useState } from 'react';
import { useProduct } from '../../../hooks';
import s from './PlayCanvasPlayer.module.scss';

// Конфігурація
const PLAYCANVAS_CONFIG = {
  baseUrl: 'https://2d-render-admin-storage.fra1.cdn.digitaloceanspaces.com',
  idProject: '428',
  idProduct: '2669',
} as const;

// Типи для window
interface PlayCanvasWindow extends Window {
  pc?: any;
  pcBootstrap?: any;
  configurator?: any;
}

/**
 * Генерує URLs для завантаження
 */
const generateUrls = (
  baseUrl: string,
  idProject: string,
  idProduct: string
) => {
  const base = `${baseUrl}/projects/${idProject}/products/${idProduct}/playcanvas/`;
  return {
    base,
    indexScript: `${base}js/index.mjs`,
    styles: `${base}styles.css`,
    manifest: `${base}manifest.json`,
  };
};

type PlayCanvasUrls = ReturnType<typeof generateUrls>;

/**
 * Очищення всіх ресурсів PlayCanvas при unmount.
 *
 * Проблема: ES-модулі кешуються браузером у module registry за URL.
 * Навіть якщо видалити <script> тег — модуль не перевиконається.
 * Рішення:
 *  1. Знищити запущений застосунок PlayCanvas.
 *  2. Очистити глобальні змінні (window.pc, window.configurator, window.pcBootstrap).
 *  3. Видалити <script> теги та importmap з DOM.
 *  4. При наступному маунті завантажувати модулі з ?v=timestamp —
 *     новий URL = новий запис у module registry = модуль перевиконається.
 */
const cleanupPlayCanvas = (urls: PlayCanvasUrls) => {
  const win = window as PlayCanvasWindow;

  // Знищити запущений застосунок
  try {
    const pcApp =
      win.pc?.Application?.getApplication?.() ?? win.pcBootstrap?.app;
    pcApp?.destroy?.();
  } catch (e) {
    console.warn('PlayCanvas app destroy error:', e);
  }

  // Відписка від resize/orientationchange
  if (win.pcBootstrap?.reflowHandler) {
    window.removeEventListener('resize', win.pcBootstrap.reflowHandler);
    window.removeEventListener(
      'orientationchange',
      win.pcBootstrap.reflowHandler
    );
  }

  // Очистити глобальні змінні
  delete (win as any).pc;
  delete (win as any).configurator;
  delete (win as any).pcBootstrap;

  // Видалити module scripts що стосуються PlayCanvas
  document.querySelectorAll('script[type="module"]').forEach((el) => {
    const src = (el as HTMLScriptElement).src ?? '';
    if (src.includes(urls.base)) el.remove();
  });

  // Видалити importmap
  document.querySelector('script[type="importmap"]')?.remove();

  // Видалити styles
  document.querySelectorAll(`link[rel="stylesheet"]`).forEach((el) => {
    const href = (el as HTMLLinkElement).href ?? '';
    if (href.includes(urls.base)) el.remove();
  });
};

/**
 * Додавання link елемента
 */
const addLink = (href: string, rel: string, type?: string): void => {
  if (document.querySelector(`link[href="${href}"]`)) return;
  const link = document.createElement('link');
  link.rel = rel;
  link.href = href;
  if (type) link.type = type;
  document.head.appendChild(link);
};

/**
 * Додавання importmap.
 * cacheBust гарантує унікальний URL для playcanvas-stable,
 * щоб браузер не взяв старий запис із module registry.
 */
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

/**
 * Завантаження module script з cache-busting URL.
 * ?v=timestamp робить URL унікальним у module registry браузера,
 * тому модуль перевиконається навіть якщо раніше вже завантажувався.
 */
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
 * Очікування ініціалізації PlayCanvas
 */
const waitForPlayCanvas = async (timeoutMs = 15000): Promise<boolean> => {
  const startTime = Date.now();

  while (Date.now() - startTime < timeoutMs) {
    const win = window as PlayCanvasWindow;
    if (win.pc && document.getElementById('application-canvas')) {
      return true;
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  throw new Error('PlayCanvas initialization timeout');
};

/**
 * Компонент PlayCanvas Player
 */
export const PlayCanvasPlayer: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>(
    'idle'
  );
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    let isMounted = true;
    // Унікальний ідентифікатор для цього маунту — ключ для cache-busting
    const cacheBust = String(Date.now());

    app.eventEmitter.emit('configuratorProcessing', true);

    const urls = generateUrls(
      PLAYCANVAS_CONFIG.baseUrl,
      PLAYCANVAS_CONFIG.idProject,
      PLAYCANVAS_CONFIG.idProduct
    );

    const initPlayCanvas = async () => {
      try {
        // Очищаємо залишки попереднього сеансу перед ініціалізацією
        cleanupPlayCanvas(urls);

        setStatus('loading');

        // 1. Додаємо стилі та manifest
        addLink(urls.styles, 'stylesheet', 'text/css');
        addLink(urls.manifest, 'manifest');

        // 2. Додаємо importmap з cache-busting ПЕРЕД завантаженням модулів
        addImportMap(urls.base, cacheBust);

        // Затримка щоб importmap встиг застосуватися
        await new Promise((resolve) => setTimeout(resolve, 100));

        if (!isMounted) return;

        // 3. Завантажуємо головний модуль PlayCanvas (cache-busted URL)
        await loadModuleScript(urls.indexScript, cacheBust);

        if (!isMounted) return;

        // 4. Очікуємо ініціалізації PlayCanvas
        await waitForPlayCanvas(15000);

        if (!isMounted) return;

        setStatus('ready');

        const idInterval = setInterval(() => {
          if (!window.configurator) return;
          window.configurator.setConfiguration({
            frameId: keyFrame,
          });

          clearInterval(idInterval);
          app.eventEmitter.emit('configuratorProcessing', false);
          app.eventEmitter.emit('playerInitialized');
        }, 1000);
      } catch (err) {
        if (!isMounted) return;

        const errorMsg = err instanceof Error ? err.message : 'Unknown error';
        console.error('PlayCanvas initialization failed:', errorMsg, err);
        setStatus('error');
        setError(errorMsg);
      }
    };

    initPlayCanvas();

    return () => {
      isMounted = false;
      cleanupPlayCanvas(urls);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={s.container}
      data-status={status}
    >
      {/* Canvas для PlayCanvas */}
      <canvas
        id="application-canvas"
        className={s.canvas}
      />

      {status === 'loading' && (
        <div className={s.overlay}>
          <div className={s.loading}>
            <div className={s.title}>Loading PlayCanvas...</div>
            <div className={s.subtitle}>Please wait</div>
            <div className={s.spinner} />
          </div>
        </div>
      )}

      {status === 'error' && (
        <div className={s.overlay}>
          <div className={s.error}>
            <div className={s.error_title}>Error Loading PlayCanvas</div>
            <div className={s.error_message}>{error}</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlayCanvasPlayer;
