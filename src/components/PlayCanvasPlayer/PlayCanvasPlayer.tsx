/**
 * PlayCanvas Player Component
 * Рендерить PlayCanvas плеєр через iframe
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import s from './PlayCanvasPlayer.module.scss';

const PLAYCANVAS_CONFIG = {
  baseUrl: 'https://2d-render-admin-storage.fra1.cdn.digitaloceanspaces.com',
  idProject: '428',
  idProduct: '2669',
} as const;

const getPlayerUrl = () => {
  const { baseUrl, idProject, idProduct } = PLAYCANVAS_CONFIG;
  return `${baseUrl}/projects/${idProject}/products/${idProduct}/playcanvas/index.html`;
};

export const PlayCanvasPlayer: React.FC = () => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  const handleLoad = useCallback(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    // Poll for ConfiguratorAPI inside iframe
    const interval = setInterval(() => {
      try {
        const api = (iframe.contentWindow as any)?.ConfiguratorAPI;
        if (api) {
          clearInterval(interval);
          // Expose on parent window so useConfiguratorAPI hook can access it
          (window as any).ConfiguratorAPI = api;
          setStatus('ready');
        }
      } catch {
        // Cross-origin — fallback to postMessage (handled by useConfiguratorAPI)
      }
    }, 100);

    // Timeout after 30s
    setTimeout(() => {
      clearInterval(interval);
      if (status === 'loading') {
        setStatus('error');
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [status]);

  useEffect(() => {
    return () => {
      // Cleanup: remove global API reference on unmount
      delete (window as any).ConfiguratorAPI;
    };
  }, []);

  return (
    <div className={s.container} data-status={status}>
      <iframe
        ref={iframeRef}
        src={getPlayerUrl()}
        className={s.iframe}
        onLoad={handleLoad}
        allow="autoplay; fullscreen; xr-spatial-tracking"
        allowFullScreen
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
            <div className={s.error_message}>ConfiguratorAPI initialization timeout</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlayCanvasPlayer;
