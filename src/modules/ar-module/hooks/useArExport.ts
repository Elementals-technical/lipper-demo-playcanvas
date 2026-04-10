import { useState } from "react";

const checkIsIOS = () =>
  /iPad|iPhone|iPod/.test(navigator.userAgent) ||
  (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

const checkIsAndroid = () => /Android/i.test(navigator.userAgent);

// In dev the frontend (webpack-dev-server, port 5173) and the AR backend
// (Express server.js) run on different ports. Route AR calls to the backend.
// Override with window.__AR_API_BASE__ = "http://localhost:9000" if needed.
const AR_API_BASE: string = (() => {
  if (typeof window === "undefined") return "";
  const override = (window as any).__AR_API_BASE__;
  if (typeof override === "string") return override.replace(/\/$/, "");
  if (window.location.port === "5173") {
    return `${window.location.protocol}//${window.location.hostname}:8080`;
  }
  return "";
})();

function waitForConfigurator(timeoutMs: number): Promise<any | null> {
  return new Promise((resolve) => {
    const w = window as any;
    if (w.configurator) return resolve(w.configurator);
    const start = Date.now();
    const id = setInterval(() => {
      if (w.configurator) {
        clearInterval(id);
        resolve(w.configurator);
      } else if (Date.now() - start > timeoutMs) {
        clearInterval(id);
        resolve(null);
      }
    }, 200);
  });
}

export type ArStatus =
  | "idle"
  | "waiting"
  | "exporting"
  | "optimizing"
  | "done"
  | "error";

export type UseArExportReturn = {
  isLoading: boolean;
  isMobile: boolean;
  isIOS: boolean;
  qrValue: string;
  iosArUrl: string;
  status: ArStatus;
  trigger: () => Promise<void>;
};

export function useArExport(): UseArExportReturn {
  const ios = checkIsIOS();
  const android = checkIsAndroid();
  const isMobile = ios || android;

  const [status, setStatus] = useState<ArStatus>(!isMobile ? "waiting" : "idle");
  const [qrValue, setQrValue] = useState("");
  const [iosArUrl, setIosArUrl] = useState("");

  const isLoading = status !== "idle" && status !== "done" && status !== "error";

  const trigger = async () => {
    setStatus("waiting");
    setQrValue("");
    setIosArUrl("");

    try {
      const configurator = await waitForConfigurator(10000);
      if (!configurator) {
        throw new Error("[AR] window.configurator not ready after 10s");
      }

      setStatus("exporting");
      const [glb, usdz]: [Blob, Blob] = await Promise.all([
        configurator.exportGLBAsBlob(),
        configurator.exportUSDZAsBlob(),
      ]);

      if (ios) {
        setIosArUrl(URL.createObjectURL(usdz));
      }

      setStatus("optimizing");
      const timestamp = Date.now();
      const formData = new FormData();
      formData.append("configuration", JSON.stringify({ data: "lci-demo" }));
      formData.append(
        "glb",
        new File([glb], `ar_${timestamp}.glb`, { type: "model/gltf-binary" }),
      );
      formData.append(
        "usdz",
        new File([usdz], `ar_${timestamp}.usdz`, { type: "model/vnd.usdz+zip" }),
      );

      const response = await fetch(`${AR_API_BASE}/api/ar/upload`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error(`[AR] Upload failed: ${response.status}`);

      const data = (await response.json()) as { id?: number };
      const configId = data?.id;
      if (configId) {
        const viewOrigin = AR_API_BASE || window.location.origin;
        setQrValue(`${viewOrigin}/ar/view/${configId}`);
      }

      setStatus("done");
    } catch (err) {
      console.error("[AR] Export failed", err);
      if (ios && document.querySelector('a[rel="ar"]')) {
        setStatus("done");
      } else {
        setStatus("error");
      }
    }
  };

  return { isLoading, isMobile, isIOS: ios, qrValue, iosArUrl, status, trigger };
}
