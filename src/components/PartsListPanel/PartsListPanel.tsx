import { useState } from 'react';
import { useAttribute } from '../../configurator';
import { useConfiguratorAPI } from '../../hooks/useConfiguratorAPI';
import s from './PartsListPanel.module.scss';
import clsx from 'clsx';

const SUB_ASSEMBLIES = [
  'Hub Assembly',
  'Spindle Assembly',
  'Spring Assembly',
  'Brake Assembly',
];

const CogIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
  </svg>
);

const CloseIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const EyeIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EyeDisabledIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
    <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

const PartRow = ({ name }: { name: string }) => {
  const [attribute, setAttribute] = useAttribute(name);
  if (!attribute) return null;

  const isVisible = attribute.value === true;

  return (
    <div className={clsx(s.partRow, !isVisible && s.partRowHidden)}>
      <span className={s.partName}>{name}</span>
      <button className={s.eyeButton} onClick={() => setAttribute(!isVisible)}>
        {isVisible ? <EyeIcon /> : <EyeDisabledIcon />}
      </button>
    </div>
  );
};

const ExplodeToggle = () => {
  const { state, setConfig } = useConfiguratorAPI();
  const isOn = state?.explodeStatus ?? false;

  return (
    <div className={s.actionToggle}>
      <span className={s.actionLabel}>Explode</span>
      <button
        className={clsx(s.toggle, isOn && s.toggleOn)}
        onClick={() => setConfig({ explodeStatus: !isOn })}
      >
        <span className={s.toggleThumb} />
      </button>
    </div>
  );
};

const AnnotationsToggle = () => {
  const { state, setConfig } = useConfiguratorAPI();
  const isOn = state?.annotationsVisible ?? false;

  return (
    <div className={s.actionToggle}>
      <span className={s.actionLabel}>Show</span>
      <button
        className={clsx(s.toggle, isOn && s.toggleOn)}
        onClick={() => setConfig({ annotationsVisible: !isOn })}
      >
        <span className={s.toggleThumb} />
      </button>
    </div>
  );
};

export const PartsListPanel = () => {
  const [isOpen, setIsOpen] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showCollapsed, setShowCollapsed] = useState(false);

  const handleClose = () => {
    setIsAnimating(true);
    setTimeout(() => {
      setIsOpen(false);
      setShowCollapsed(true);
      setIsAnimating(false);
    }, 300);
  };

  const handleOpen = () => {
    setShowCollapsed(false);
    setIsOpen(true);
  };

  if (!isOpen) {
    return (
      <button
        className={clsx(s.collapsedButton, showCollapsed && s.collapsedButtonVisible)}
        onClick={handleOpen}
      >
        <CogIcon />
        <span>Parts List</span>
      </button>
    );
  }

  return (
    <div className={clsx(s.panel, isAnimating ? s.panelClosing : s.panelOpen)}>
      <div className={s.header} onClick={handleClose} role="button" tabIndex={0}>
        <div className={s.headerTitle}>
          <CogIcon />
          <span>Parts List</span>
        </div>
        <button
          className={s.closeButton}
          onClick={(e) => { e.stopPropagation(); handleClose(); }}
        >
          <CloseIcon />
        </button>
      </div>
      <div className={s.body}>
        {/* Parent assembly with explode */}
        <div className={s.parentRow}>
          <span className={s.parentName}>Axle Assembly</span>
          <ExplodeToggle />
        </div>

        {/* Annotations toggle */}
        <div className={s.parentRow}>
          <span className={s.parentName}>Annotations</span>
          <AnnotationsToggle />
        </div>

        {/* Sub-assembly list */}
        <div className={s.list}>
          {SUB_ASSEMBLIES.map((name) => (
            <PartRow key={name} name={name} />
          ))}
        </div>
      </div>
    </div>
  );
};
