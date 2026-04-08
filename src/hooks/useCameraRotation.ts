import { useState, useEffect, useRef, useCallback } from 'react';

export interface CameraRotation {
  yaw: number;   // 0-360 degrees (horizontal)
  pitch: number; // -30 to +60 degrees (vertical)
}

const USE_MOCK = true;

// Mock yaw/pitch for each camera preset
const MOCK_PRESETS: Record<string, CameraRotation> = {
  front:  { yaw: 0,   pitch: 0 },
  back:   { yaw: 180, pitch: 0 },
  left:   { yaw: 90,  pitch: 0 },
  right:  { yaw: 270, pitch: 0 },
  top:    { yaw: 0,   pitch: 60 },
  bot:    { yaw: 0,   pitch: -30 },
  iso:    { yaw: 45,  pitch: 35 },
};

export function useCameraRotation(): CameraRotation {
  const [rotation, setRotation] = useState<CameraRotation>({ yaw: 45, pitch: 35 });
  const targetRef = useRef<CameraRotation>({ yaw: 45, pitch: 35 });
  const currentRef = useRef<CameraRotation>({ yaw: 45, pitch: 35 });
  const rafRef = useRef<number>(0);

  // Animate smoothly toward target
  const animateToTarget = useCallback(() => {
    const current = currentRef.current;
    const target = targetRef.current;

    // Shortest path for yaw (handle 0/360 wrap)
    let dyaw = target.yaw - current.yaw;
    if (dyaw > 180) dyaw -= 360;
    if (dyaw < -180) dyaw += 360;

    const dpitch = target.pitch - current.pitch;
    const ease = 0.08;

    if (Math.abs(dyaw) < 0.1 && Math.abs(dpitch) < 0.1) {
      currentRef.current = { ...target };
      setRotation({ ...target });
      return; // stop animating — reached target
    }

    const nextYaw = (current.yaw + dyaw * ease + 360) % 360;
    const nextPitch = current.pitch + dpitch * ease;

    currentRef.current = { yaw: nextYaw, pitch: nextPitch };
    setRotation({ yaw: nextYaw, pitch: nextPitch });
    rafRef.current = requestAnimationFrame(animateToTarget);
  }, []);

  // Listen for cameraPosition state changes (mock mode)
  useEffect(() => {
    if (USE_MOCK) {
      const checkPreset = () => {
        const api = (window as any).ConfiguratorAPI;
        if (api) {
          const pos = api.getConfig?.()?.cameraPosition;
          if (pos && MOCK_PRESETS[pos]) {
            const preset = MOCK_PRESETS[pos];
            if (preset.yaw !== targetRef.current.yaw || preset.pitch !== targetRef.current.pitch) {
              targetRef.current = preset;
              cancelAnimationFrame(rafRef.current);
              rafRef.current = requestAnimationFrame(animateToTarget);
            }
          }
        }
      };

      // Poll for preset changes
      const interval = setInterval(checkPreset, 100);

      // Also listen to UI clicks via custom event
      const handler = (e: CustomEvent<string>) => {
        const preset = MOCK_PRESETS[e.detail];
        if (preset) {
          targetRef.current = preset;
          cancelAnimationFrame(rafRef.current);
          rafRef.current = requestAnimationFrame(animateToTarget);
        }
      };
      window.addEventListener('camera-preset', handler as EventListener);

      return () => {
        clearInterval(interval);
        cancelAnimationFrame(rafRef.current);
        window.removeEventListener('camera-preset', handler as EventListener);
      };
    }

    // Real API: poll camera.getYaw()/getPitch() via rAF
    const poll = () => {
      const cam = (window as any).ConfiguratorAPI?.camera;
      if (cam) {
        const yaw = cam.getYaw?.() ?? 0;
        const pitch = cam.getPitch?.() ?? 0;
        setRotation((prev) => {
          if (Math.abs(prev.yaw - yaw) > 0.1 || Math.abs(prev.pitch - pitch) > 0.1) {
            return { yaw, pitch };
          }
          return prev;
        });
      }
      rafRef.current = requestAnimationFrame(poll);
    };
    rafRef.current = requestAnimationFrame(poll);
    return () => cancelAnimationFrame(rafRef.current);
  }, [animateToTarget]);

  return rotation;
}
