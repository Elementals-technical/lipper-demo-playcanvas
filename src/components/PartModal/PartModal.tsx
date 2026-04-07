import { usePartSelection } from '../../hooks/usePartSelection';
import s from './PartModal.module.scss';

export const PartModal: React.FC = () => {
  const { selectedPart, deselect } = usePartSelection();

  if (!selectedPart) return null;

  return (
    <div className={s.overlay} onClick={deselect}>
      <div className={s.card} onClick={(e) => e.stopPropagation()}>
        <button className={s.close} onClick={deselect}>&times;</button>

        {/* Header */}
        <div className={s.header}>
          <div className={s.headerMeta}>
            {selectedPart.category && (
              <span className={s.badge}>{selectedPart.category}</span>
            )}
            {selectedPart.sku && (
              <span className={s.sku}>SKU: {selectedPart.sku}</span>
            )}
          </div>
          <h2 className={s.title}>{selectedPart.displayName}</h2>
          {selectedPart.itemNumber && (
            <span className={s.itemNum}>#{selectedPart.itemNumber}</span>
          )}
        </div>

        {/* Description */}
        {selectedPart.description && (
          <p className={s.description}>{selectedPart.description}</p>
        )}

        {/* Technical Notes */}
        {selectedPart.technicalNotes && (
          <div className={s.section}>
            <h3 className={s.sectionTitle}>Technical Notes</h3>
            <p className={s.sectionText}>{selectedPart.technicalNotes}</p>
          </div>
        )}

        {/* Specifications */}
        {selectedPart.specifications && (
          <div className={s.section}>
            <h3 className={s.sectionTitle}>Specifications</h3>
            <dl className={s.specsList}>
              {Object.entries(selectedPart.specifications).map(([key, val]) => (
                <div key={key} className={s.specRow}>
                  <dt>{key.replace(/_/g, ' ')}</dt>
                  <dd>{val}</dd>
                </div>
              ))}
            </dl>
          </div>
        )}

        {/* Maintenance */}
        {selectedPart.maintenance && (
          <div className={s.section}>
            <h3 className={s.sectionTitle}>Maintenance</h3>
            <div className={s.maintenanceList}>
              <div className={s.maintenanceItem}>
                <span className={s.maintenanceLabel}>Interval</span>
                <span>{selectedPart.maintenance.maintenance_interval}</span>
              </div>
              <div className={s.maintenanceItem}>
                <span className={s.maintenanceLabel}>Task</span>
                <span>{selectedPart.maintenance.maintenance_task}</span>
              </div>
              <div className={s.maintenanceItem}>
                <span className={s.maintenanceLabel}>Common issues</span>
                <span>{selectedPart.maintenance.common_issues}</span>
              </div>
            </div>
          </div>
        )}

        {/* Store Link */}
        {selectedPart.storeLink && (
          <a
            href={selectedPart.storeLink}
            target="_blank"
            rel="noopener noreferrer"
            className={s.storeBtn}
          >
            {selectedPart.storeLinkText || 'View on Store'} &rarr;
          </a>
        )}
      </div>
    </div>
  );
};
