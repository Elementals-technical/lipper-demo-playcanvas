import { useState, useCallback, useRef, useEffect } from 'react';
import { useConfiguratorAPI } from '../../hooks/useConfiguratorAPI';
import { useCameraRotation } from '../../hooks/useCameraRotation';
import s from './CameraController.module.scss';
import clsx from 'clsx';

type CameraDirection = 'front' | 'back' | 'top' | 'bot' | 'left' | 'right' | 'iso';

const ResetIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 12a9 9 0 1 1 3 6.9" />
    <path d="M3 21v-6h6" />
  </svg>
);

// ── 3D Gizmo drawn on Canvas ──

interface Axis {
  dir: CameraDirection;
  oppositeDir: CameraDirection;
  label: string;
  color: string;
  // Unit vector in 3D space (right-hand: X=right, Y=up, Z=toward viewer)
  vec: [number, number, number];
}

const AXES: Axis[] = [
  { dir: 'right', oppositeDir: 'left',  label: 'X',     color: '#FF4B4B', vec: [1, 0, 0] },
  { dir: 'top',   oppositeDir: 'bot',   label: 'Y',     color: '#37CC8F', vec: [0, 1, 0] },
  { dir: 'front', oppositeDir: 'back',  label: 'Z',     color: '#2A8EFA', vec: [0, 0, 1] },
];

function project3D(
  x: number, y: number, z: number,
  yawDeg: number, pitchDeg: number,
): [number, number, number] {
  const yr = (yawDeg * Math.PI) / 180;
  const pr = (pitchDeg * Math.PI) / 180;

  // Rotate around Y axis (yaw)
  const x1 = x * Math.cos(yr) + z * Math.sin(yr);
  const z1 = -x * Math.sin(yr) + z * Math.cos(yr);
  const y1 = y;

  // Rotate around X axis (pitch)
  const y2 = y1 * Math.cos(pr) - z1 * Math.sin(pr);
  const z2 = y1 * Math.sin(pr) + z1 * Math.cos(pr);
  const x2 = x1;

  return [x2, -y2, z2]; // flip Y for canvas coords
}

interface GizmoCanvasProps {
  yaw: number;
  pitch: number;
  onDirectionClick: (dir: CameraDirection) => void;
}

const GizmoCanvas = ({ yaw, pitch, onDirectionClick }: GizmoCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hitAreasRef = useRef<{ x: number; y: number; r: number; dir: CameraDirection }[]>([]);
  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
  const SIZE = 120;
  const CENTER = SIZE / 2;
  const AXIS_LEN = 38;
  const DOT_R = 7;
  const DOT_SMALL = 4;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = SIZE * dpr;
    canvas.height = SIZE * dpr;
    ctx.scale(dpr, dpr);

    // Clear
    ctx.clearRect(0, 0, SIZE, SIZE);

    // Background circle
    ctx.beginPath();
    ctx.arc(CENTER, CENTER, 54, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.95)';
    ctx.fill();
    ctx.strokeStyle = '#E3E5FA';
    ctx.lineWidth = 1;
    ctx.stroke();

    const hits: typeof hitAreasRef.current = [];

    // Sort axes by z-depth so front-most draws last
    const projected = AXES.map((axis) => {
      const [px, py, pz] = project3D(...axis.vec, yaw, pitch);
      const [nx, ny, nz] = project3D(-axis.vec[0], -axis.vec[1], -axis.vec[2], yaw, pitch);
      return { axis, px, py, pz, nx, ny, nz };
    });

    // Draw back items first (lower z), then front
    const allItems: {
      x: number; y: number; z: number;
      color: string; label: string; dir: CameraDirection;
      isNeg: boolean;
    }[] = [];

    for (const { axis, px, py, pz, nx, ny, nz } of projected) {
      allItems.push({ x: px, y: py, z: pz, color: axis.color, label: axis.label, dir: axis.dir, isNeg: false });
      allItems.push({ x: nx, y: ny, z: nz, color: axis.color, label: '', dir: axis.oppositeDir, isNeg: true });
    }

    // Sort by z (draw farthest first)
    allItems.sort((a, b) => a.z - b.z);

    for (const item of allItems) {
      const sx = CENTER + item.x * AXIS_LEN;
      const sy = CENTER + item.y * AXIS_LEN;

      // Line from center to point
      ctx.beginPath();
      ctx.moveTo(CENTER, CENTER);
      ctx.lineTo(sx, sy);
      ctx.strokeStyle = item.color;
      ctx.globalAlpha = item.isNeg ? 0.25 : 0.8;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.globalAlpha = 1;

      // Dot
      const r = item.isNeg ? DOT_SMALL : DOT_R;
      ctx.beginPath();
      ctx.arc(sx, sy, r, 0, Math.PI * 2);
      ctx.fillStyle = item.color;
      ctx.globalAlpha = item.isNeg ? 0.3 : 1;
      ctx.fill();
      ctx.globalAlpha = 1;

      // Label for primary dots
      if (!item.isNeg) {
        ctx.font = `600 10px "Futura PT", "Roboto", sans-serif`;
        ctx.fillStyle = item.color;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        // Position label outside the dot
        const labelDist = AXIS_LEN + 14;
        const lx = CENTER + item.x * labelDist;
        const ly = CENTER + item.y * labelDist;
        ctx.fillText(item.label, lx, ly);
      }

      // Hit area
      hits.push({ x: sx, y: sy, r: item.isNeg ? 10 : 14, dir: item.dir });
    }

    // Center dot
    ctx.beginPath();
    ctx.arc(CENTER, CENTER, 3, 0, Math.PI * 2);
    ctx.fillStyle = '#9CA3AF';
    ctx.fill();

    hitAreasRef.current = hits;
  }, [yaw, pitch, dpr]);

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    // Check hits in reverse (front-most first)
    for (let i = hitAreasRef.current.length - 1; i >= 0; i--) {
      const h = hitAreasRef.current[i];
      const dx = mx - h.x;
      const dy = my - h.y;
      if (dx * dx + dy * dy <= h.r * h.r) {
        onDirectionClick(h.dir);
        return;
      }
    }
  };

  return (
    <canvas
      ref={canvasRef}
      className={s.gizmoCanvas}
      width={SIZE * dpr}
      height={SIZE * dpr}
      style={{ width: SIZE, height: SIZE }}
      onClick={handleClick}
    />
  );
};

// ── Main CameraController ──

export const CameraController = () => {
  const { state, setConfig, resetConfig } = useConfiguratorAPI();
  const { yaw, pitch } = useCameraRotation();
  const [isResetting, setIsResetting] = useState(false);

  const handleDirection = (dir: CameraDirection) => {
    setConfig({ cameraPosition: dir });
    window.dispatchEvent(new CustomEvent('camera-preset', { detail: dir }));
  };

  const handleResetDirection = useCallback(async () => {
    if (isResetting) return;
    setIsResetting(true);
    await resetConfig();
    window.dispatchEvent(new CustomEvent('camera-preset', { detail: 'front' }));
    setTimeout(() => setIsResetting(false), 800);
  }, [resetConfig, isResetting]);

  return (
    <div className={s.container}>
      <button
        className={clsx(s.pillButton, s.resetButton, isResetting && s.resetActive)}
        onClick={handleResetDirection}
      >
        <span className={clsx(s.resetIcon, isResetting && s.resetIconSpin)}>
          <ResetIcon />
        </span>
        <span>Reset</span>
      </button>
      <GizmoCanvas
        yaw={yaw}
        pitch={pitch}
        onDirectionClick={handleDirection}
      />
      <button
        className={s.pillButton}
        onClick={() => handleDirection('iso')}
      >
        Isometric
      </button>
    </div>
  );
};
