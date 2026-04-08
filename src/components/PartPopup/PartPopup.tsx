import { useMemo, useEffect } from 'react';
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

/**
 * Override the built-in PlayCanvas hover tooltip with our design.
 * Finds OutlineService via PlayCanvas script instances and applies
 * custom styles + renderTooltip function.
 */
function useTooltipStyling() {
  useEffect(() => {
    const apply = () => {
      const api = (window as any).ConfiguratorAPI;
      if (!api) return false;

      // Find OutlineService through PlayCanvas entity scripts
      const pc = (window as any).pc;
      const app = pc?.app || pc?.Application?.getApplication?.();
      if (!app?.root) return false;

      let os: any = null;
      app.root.forEach((entity: any) => {
        const bridge = entity.script?.lippertBridge || entity.script?.globalBridge;
        if (bridge?._outlineService) {
          os = bridge._outlineService;
        }
      });

      if (!os) return false;

      // 1. Override tooltip container styles
      if (os._popup) {
        Object.assign(os._popup.style, {
          backgroundColor: '#FFFFFF',
          color: '#343A40',
          fontFamily: '"Futura PT", "Roboto", sans-serif',
          border: '1px solid #E3E5FA',
          borderRadius: '12px',
          padding: '16px 20px',
          maxWidth: '320px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.1), 0 2px 8px rgba(0,0,0,0.05)',
          pointerEvents: 'auto',
        });
      }

      // 2. Custom renderTooltip via _options
      if (os._options) {
        os._options.tooltipInteractive = true;
        os._options.renderTooltip = (data: any) => {
          let html = `<strong style="font-size:15px;font-weight:600;color:#343A40;display:block;margin-bottom:6px;line-height:1.3;">`;
          html += `${data.partNumber ? data.partNumber + ' ' : ''}${data.displayName}`;
          html += `</strong>`;

          if (data.description) {
            html += `<span style="color:#6C757D;font-size:13px;font-weight:400;display:block;margin-bottom:10px;">${data.description}</span>`;
          }

          if (data.storeLink) {
            html += `<a href="${data.storeLink}" target="_blank" rel="noopener noreferrer"
              style="color:#37CC8F;font-size:13px;font-weight:500;text-decoration:none;display:inline-flex;align-items:center;gap:4px;">
              Store Link ↗
            </a>`;
          } else {
            html += `<span style="color:#37CC8F;font-size:13px;font-weight:500;">Click for details</span>`;
          }

          return html;
        };
      }

      return true;
    };

    if (apply()) return;
    const interval = setInterval(() => {
      if (apply()) clearInterval(interval);
    }, 500);
    return () => clearInterval(interval);
  }, []);
}

export const PartPopup = () => {
  const { selectedPart, deselect } = usePartSelection();
  const { parts } = useDatatableParts();

  useTooltipStyling();

  const part = useMemo(() => {
    if (!selectedPart || !parts.length) return null;
    const exact = parts.find((p) => p.groupName === selectedPart.groupName);
    if (exact) return exact;
    if (selectedPart.partNumber) {
      return (
        parts.find(
          (p) =>
            p.partNumber === selectedPart.partNumber &&
            selectedPart.groupName.includes(p.side),
        ) ?? null
      );
    }
    return null;
  }, [selectedPart, parts]);

  // Use enriched data from selectedPart (ConfiguratorAPI) merged with datatable
  const enriched = selectedPart;
  const datatablePart = part;

  if (!enriched) return null;

  const displayTitle = [
    datatablePart?.itemNumber || enriched.itemNumber,
    datatablePart?.displayName || enriched.displayName,
  ]
    .filter(Boolean)
    .join(' ');

  const description = (enriched as any).description || datatablePart?.description;
  const technicalNotes = (enriched as any).technicalNotes || datatablePart?.technicalNotes;
  const specs = (enriched as any).specifications || datatablePart?.specifications;
  const maintenance = (enriched as any).maintenance || datatablePart?.maintenance;
  const storeLink = enriched.storeLink || datatablePart?.storeLink;
  const storeLinkText = enriched.storeLinkText || datatablePart?.storeLinkText;
  const category = (enriched as any).category || datatablePart?.category;
  const sku = enriched.sku || enriched.partNumber || datatablePart?.partNumber;
  const hasSpecs = specs && Object.keys(specs).length > 0;

  return (
    <div className={s.overlay} onClick={deselect}>
      <div className={s.popup} onClick={(e) => e.stopPropagation()}>
        {/* Close */}
        <button className={s.closeButton} onClick={deselect}>
          <CloseIcon />
        </button>

        {/* Header */}
        <div className={s.header}>
          <div className={s.headerMeta}>
            {category && <span className={s.badge}>{category}</span>}
            {sku && <span className={s.sku}>Part: {sku}</span>}
          </div>
          <h2 className={s.title}>{displayTitle}</h2>
        </div>

        {/* Description */}
        {description && <p className={s.description}>{description}</p>}

        {/* Technical Notes */}
        {technicalNotes && (
          <div className={s.section}>
            <h3 className={s.sectionTitle}>Technical Notes</h3>
            <p className={s.sectionText}>{technicalNotes}</p>
          </div>
        )}

        {/* Specifications */}
        {hasSpecs && (
          <div className={s.section}>
            <h3 className={s.sectionTitle}>Specifications</h3>
            <div className={s.specsList}>
              {Object.entries(specs).map(([key, val]) => (
                <div key={key} className={s.specRow}>
                  <span className={s.specKey}>{key}</span>
                  <span className={s.specVal}>{val as string}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Maintenance */}
        {maintenance && (
          <div className={s.maintenanceBlock}>
            <h3 className={s.sectionTitle}>Maintenance</h3>
            {maintenance.maintenance_interval && (
              <p className={s.maintenanceItem}>
                <strong>Interval:</strong> {maintenance.maintenance_interval}
              </p>
            )}
            {maintenance.maintenance_task && (
              <p className={s.maintenanceItem}>
                <strong>Task:</strong> {maintenance.maintenance_task}
              </p>
            )}
            {maintenance.common_issues && (
              <p className={s.maintenanceItem}>
                <strong>Common issues:</strong> {maintenance.common_issues}
              </p>
            )}
          </div>
        )}

        {/* Store Link */}
        {storeLink && (
          <a
            href={storeLink}
            target="_blank"
            rel="noopener noreferrer"
            className={s.storeLink}
          >
            <span>{storeLinkText || 'Store Link'}</span>
            <ArrowTopRightIcon />
          </a>
        )}
      </div>
    </div>
  );
};
