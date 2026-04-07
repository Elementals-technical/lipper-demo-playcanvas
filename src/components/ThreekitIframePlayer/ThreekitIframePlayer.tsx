import React, { useEffect, useMemo, useRef } from "react";
import { getAssetIdByProductsConfig } from "../../utils/getAssetIdByProductsConfig";
import { useAppDispatch } from "../../store/store";
import { changeIsLoadedIframePlayer, setStageCamera } from "../../store/slices/configurator/Configurator.sclice";

export type ThreekitIframePlayerProps = {
  style?: React.CSSProperties;
  className?: string;
  assetId: string;
};

declare global {
  interface Window {
    iframePlayer?: React.RefObject<HTMLIFrameElement>;
  }
}

/** Типи повідомлень від iframe */
export type IframeToParentMsg =
  | { type: "READY" }
  | { type: "TK_STAGE_CAMERA"; payload: number }
  | { type: "CUSTOM"; payload: unknown };

export function ThreekitIframePlayer({ assetId: assetIdProp, style, className }: any) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const dispatch = useAppDispatch();

  useEffect(() => {
    // @ts-ignore
    window.iframePlayer = iframeRef;
  }, []);

  const resolvedAssetId = assetIdProp ?? getAssetIdByProductsConfig();
  const src = (() => {
    if (!resolvedAssetId) return "";
    const url = new URL("/iframe", window.location.origin);
    url.searchParams.set("assetId", resolvedAssetId);
    return url.toString();
  })();

  // ===== Прийом повідомлень від iframe =====
  useEffect(() => {
    if (!iframeRef.current) return;

    const handler = (e: MessageEvent) => {
      // 1) Перевірка походження
      if (e.origin !== window.location.origin) return;

      // 2) Переконатися, що це саме наше iframe
      const cw = iframeRef.current?.contentWindow;
      if (cw && e.source !== cw) return;

      // 3) Переконатися, що формат повідомлення наш
      const data = e.data as IframeToParentMsg | undefined;
      if (!data || typeof (data as any).type !== "string") return;

      // 4) Користувацький хендлер (опційний)
      // if (onIframeMessage) {
      //   onIframeMessage(data, e);
      // }

      // 5) Власна обробка типових подій
      switch (data.type) {
        case "READY":
          dispatch(changeIsLoadedIframePlayer(true));
          break;

        case "TK_STAGE_CAMERA":
          console.log("data.payload --- ==== ", data.payload);
          dispatch(setStageCamera(data.payload));
          break;

        case "CUSTOM":
          // eslint-disable-next-line no-console
          console.log("[Parent] custom payload: ====", data.payload);
          break;

        default:
          // невідомий тип – ігноруємо
          break;
      }
    };

    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

  if (!resolvedAssetId) return null;

  return (
    <iframe
      id="tk-iframe-player"
      ref={iframeRef}
      title="threekit-iframe-player"
      src={src}
      style={{ width: "100%", height: "100%", border: 0, background: "#fff", ...style }}
      className={className}
      allow="fullscreen; autoplay; xr-spatial-tracking; camera; microphone"
    />
  );
}
