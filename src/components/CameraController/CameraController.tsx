import { useState, useCallback } from 'react';
import { useConfiguratorAPI } from '../../hooks/useConfiguratorAPI';
import s from './CameraController.module.scss';
import clsx from 'clsx';

type CameraDirection = 'front' | 'back' | 'top' | 'bot' | 'left' | 'right' | 'iso';

const DIRECTION_COLORS: Record<string, string> = {
  top: '#37CC8F',
  left: '#FF4B4B',
  front: '#2A8EFA',
  bot: '#E3E5FA',
  right: '#E3E5FA',
  back: '#E3E5FA',
};

const ResetIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 12a9 9 0 1 1 3 6.9" />
    <path d="M3 21v-6h6" />
  </svg>
);

interface ControllerOrbProps {
  activeDirection: string;
  onDirectionClick: (dir: CameraDirection) => void;
}

const ControllerOrb = ({ activeDirection, onDirectionClick }: ControllerOrbProps) => {
  const getColor = (dir: string) => {
    return DIRECTION_COLORS[dir] || '#E3E5FA';
  };

  return (
    <div className={s.orb}>
      {/* Top arm */}
      <button
        className={clsx(s.arm, s.armTop)}
        onClick={() => onDirectionClick('top')}
      >
        <span className={s.dot} style={{ background: getColor('top') }} />
        <span className={s.line} style={{ background: getColor('top') }} />
      </button>

      {/* Bottom arm */}
      <button
        className={clsx(s.arm, s.armBot)}
        onClick={() => onDirectionClick('bot')}
      >
        <span className={s.line} style={{ background: getColor('bot') }} />
        <span className={s.dot} style={{ background: getColor('bot') }} />
      </button>

      {/* Left arm */}
      <button
        className={clsx(s.arm, s.armLeft)}
        onClick={() => onDirectionClick('left')}
      >
        <span className={s.line} style={{ background: getColor('left') }} />
        <span className={s.dot} style={{ background: getColor('left') }} />
      </button>

      {/* Right arm */}
      <button
        className={clsx(s.arm, s.armRight)}
        onClick={() => onDirectionClick('right')}
      >
        <span className={s.dot} style={{ background: getColor('right') }} />
        <span className={s.line} style={{ background: getColor('right') }} />
      </button>

      {/* Center dot */}
      <button
        className={s.center}
        style={{ background: getColor('front') }}
        onClick={() => onDirectionClick('front')}
      />
    </div>
  );
};

export const CameraController = () => {
  const { state, setConfig, resetConfig } = useConfiguratorAPI();
  const [isResetting, setIsResetting] = useState(false);

  const handleReset = useCallback(async () => {
    if (isResetting) return;
    setIsResetting(true);
    await resetConfig();
    setTimeout(() => setIsResetting(false), 800);
  }, [resetConfig, isResetting]);

  const handleDirection = (dir: CameraDirection) => {
    setConfig({ cameraPosition: dir });
  };

  return (
    <div className={s.container}>
      <button
        className={clsx(s.pillButton, s.resetButton, isResetting && s.resetActive)}
        onClick={handleReset}
      >
        <span className={clsx(s.resetIcon, isResetting && s.resetIconSpin)}>
          <ResetIcon />
        </span>
        <span>Reset</span>
      </button>
      <ControllerOrb
        activeDirection={state?.cameraPosition ?? 'front'}
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
