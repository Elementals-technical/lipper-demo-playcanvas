import { useState, useCallback } from 'react';
import { useConfiguratorAPI } from '../../hooks/useConfiguratorAPI';
import s from './CameraController.module.scss';
import clsx from 'clsx';

type CameraDirection = 'front' | 'back' | 'top' | 'bot' | 'left' | 'right' | 'iso';

const CAMERA_BUTTONS: { dir: CameraDirection; label: string }[] = [
  { dir: 'iso', label: 'Isometric' },
  { dir: 'top', label: 'Top' },
  { dir: 'front', label: 'Front' },
  { dir: 'back', label: 'Back' },
  { dir: 'left', label: 'Left' },
  { dir: 'right', label: 'Right' },
];

const ResetIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 12a9 9 0 1 1 3 6.9" />
    <path d="M3 21v-6h6" />
  </svg>
);

export const CameraController = () => {
  const { state, setConfig, resetConfig } = useConfiguratorAPI();
  const [isResetting, setIsResetting] = useState(false);
  const activePosition = state?.cameraPosition ?? 'iso';

  const handleDirection = (dir: CameraDirection) => {
    setConfig({ cameraPosition: dir });
  };

  const handleReset = useCallback(async () => {
    if (isResetting) return;
    setIsResetting(true);
    await resetConfig();
    setTimeout(() => setIsResetting(false), 800);
  }, [resetConfig, isResetting]);

  return (
    <div className={s.panel}>
      <div className={s.grid}>
        {CAMERA_BUTTONS.map(({ dir, label }) => (
          <button
            key={dir}
            className={clsx(s.cameraBtn, activePosition === dir && s.cameraBtnActive)}
            onClick={() => handleDirection(dir)}
          >
            {label}
          </button>
        ))}
      </div>
      <button
        className={clsx(s.resetBtn, isResetting && s.resetBtnActive)}
        onClick={handleReset}
      >
        <span className={clsx(s.resetIcon, isResetting && s.resetIconSpin)}>
          <ResetIcon />
        </span>
      </button>
    </div>
  );
};
