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
  const [status, setStatus] = useState<'loading' | 'ready'>('loading');

  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (e.data?.type === 'configurator:ready') {
        setStatus('ready');
        // Store iframe ref globally for useConfiguratorAPI hook
        (window as any).__playcanvasIframe = iframeRef.current;
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleLoad = useCallback(() => {
    // Try direct access first (same-origin)
    try {
      const iframe = iframeRef.current;
      if (iframe?.contentWindow?.ConfiguratorAPI) {
        (window as any).ConfiguratorAPI = iframe.contentWindow.ConfiguratorAPI;
        setStatus('ready');
        return;
      }
    } catch {
      // Cross-origin — expected
    }

    // Store iframe ref for postMessage communication
    (window as any).__playcanvasIframe = iframeRef.current;

    // Mark ready after short delay for cross-origin case
    // The iframe content is rendering, we just can't access API directly
    setTimeout(() => setStatus('ready'), 1000);
  }, []);

  useEffect(() => {
    return () => {
      delete (window as any).ConfiguratorAPI;
      delete (window as any).__playcanvasIframe;
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
            <div className={s.title}>Loading 3D Model...</div>
            <div className={s.spinner} />
          </div>
        </div>
      )}
    </div>
  );
};

export default PlayCanvasPlayer;
