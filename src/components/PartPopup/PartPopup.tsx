import { useMemo } from 'react';
import { usePartSelection } from '../../hooks/usePartSelection';
import { useDatatableParts } from '../../hooks/useDatatableParts';
import s from './PartPopup.module.scss';

const ArrowTopRightIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="7" y1="17" x2="17" y2="7" />
    <polyline points="7 7 17 7 17 17" />
  </svg>
);

const CloseIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

export const PartPopup = () => {
  const { selectedPart, deselect } = usePartSelection();
  const { parts } = useDatatableParts();

  const part = useMemo(() => {
    if (!selectedPart || !parts.length) return null;
    const exact = parts.find((p) => p.groupName === selectedPart.groupName);
    if (exact) return exact;
    if (selectedPart.partNumber) {
      return parts.find(
        (p) =>
          p.partNumber === selectedPart.partNumber &&
          selectedPart.groupName.includes(p.side),
      ) ?? null;
    }
    return null;
  }, [selectedPart, parts]);

  if (!part) return null;

  const displayTitle = [part.itemNumber, part.displayName]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={s.popup}>
      <div className={s.content}>
        <p className={s.title}>{displayTitle}</p>
        <button className={s.closeButton} onClick={deselect}>
          <CloseIcon />
        </button>
      </div>
      {part.storeLink && (
        <a
          href={part.storeLink}
          target="_blank"
          rel="noopener noreferrer"
          className={s.storeLink}
        >
          <span>{part.storeLinkText || 'Store Link'}</span>
          <ArrowTopRightIcon />
        </a>
      )}
    </div>
  );
};
