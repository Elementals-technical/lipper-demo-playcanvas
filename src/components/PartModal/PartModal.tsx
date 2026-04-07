import { useMemo } from 'react';
import { usePartSelection } from '../../hooks/usePartSelection';
import { useDatatableParts } from '../../hooks/useDatatableParts';
import s from './PartModal.module.scss';

export const PartModal: React.FC = () => {
  const { selectedPart, deselect } = usePartSelection();
  const { parts } = useDatatableParts();

  const part = useMemo(() => {
    if (!selectedPart || !parts.length) return null;
    // Exact match by groupName
    const exact = parts.find((p) => p.groupName === selectedPart.groupName);
    if (exact) return exact;
    // Fallback: match by partNumber + side (from groupName)
    if (selectedPart.partNumber) {
      return parts.find(
        (p) => p.partNumber === selectedPart.partNumber &&
          selectedPart.groupName.includes(p.side),
      ) ?? null;
    }
    return null;
  }, [selectedPart, parts]);

  if (!part) return null;

  const hasSpecs = Object.keys(part.specifications).length > 0;

  return (
    <div className={s.overlay} onClick={deselect}>
      <div className={s.card} onClick={(e) => e.stopPropagation()}>
        <button className={s.close} onClick={deselect}>&times;</button>

        {/* Header */}
        <div className={s.header}>
          <div className={s.headerMeta}>
            {part.category && (
              <span className={s.badge}>{part.category}</span>
            )}
            {part.partNumber && (
              <span className={s.sku}>Part: {part.partNumber}</span>
            )}
          </div>
          <h2 className={s.title}>{part.displayName}</h2>
          {part.itemNumber && (
            <span className={s.itemNum}>#{part.itemNumber}</span>
          )}
        </div>

        {/* Description */}
        {part.description && (
          <p className={s.description}>{part.description}</p>
        )}

        {/* Technical Notes */}
        {part.technicalNotes && (
          <div className={s.section}>
            <h3 className={s.sectionTitle}>Technical Notes</h3>
            <p className={s.sectionText}>{part.technicalNotes}</p>
          </div>
        )}

        {/* Specifications */}
        {hasSpecs && (
          <div className={s.section}>
            <h3 className={s.sectionTitle}>Specifications</h3>
            <dl className={s.specsList}>
              {Object.entries(part.specifications).map(([key, val]) => (
                <div key={key} className={s.specRow}>
                  <dt>{key}</dt>
                  <dd>{val}</dd>
                </div>
              ))}
            </dl>
          </div>
        )}

        {/* Maintenance */}
        {part.maintenance && (
          <div className={s.section}>
            <h3 className={s.sectionTitle}>Maintenance</h3>
            <div className={s.maintenanceList}>
              {part.maintenance.interval && (
                <div className={s.maintenanceItem}>
                  <span className={s.maintenanceLabel}>Interval</span>
                  <span>{part.maintenance.interval}</span>
                </div>
              )}
              {part.maintenance.task && (
                <div className={s.maintenanceItem}>
                  <span className={s.maintenanceLabel}>Task</span>
                  <span>{part.maintenance.task}</span>
                </div>
              )}
              {part.maintenance.commonIssues && (
                <div className={s.maintenanceItem}>
                  <span className={s.maintenanceLabel}>Common issues</span>
                  <span>{part.maintenance.commonIssues}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Store Link */}
        {part.storeLink && (
          <a
            href={part.storeLink}
            target="_blank"
            rel="noopener noreferrer"
            className={s.storeBtn}
          >
            {part.storeLinkText || 'View on Store'} &rarr;
          </a>
        )}
      </div>
    </div>
  );
};
