import { useMemo, useEffect, useRef } from "react";
import { usePartSelection } from "../../hooks/usePartSelection";
import { findDatatablePart, useDataTablePart } from "../../hooks/useDataTablePart";
import { DatatablePart, useDatatableParts } from "../../hooks/useDatatableParts";
import { useAppSelector } from "../../store/store";
import { getProductId } from "../../store/slices/configurator/selectors/selectors";
import s from "./PartPopup.module.scss";

interface RelatedProduct {
  id: string;
  name: string;
  link: string;
}

const CONTACT_CUSTOMER_SERVICE = "Contact Customer Service for availability";

/** Returns a usable table store link, excluding unavailable/service-only values. */
const getStoreLink = (part: DatatablePart): string => {
  const link = part.storeLink?.trim() || "";
  return ["NLA", "N/A"].includes(link.toUpperCase()) || link.toLowerCase() === CONTACT_CUSTOMER_SERVICE.toLowerCase()
    ? ""
    : link;
};

/** Escapes literal table content for the PlayCanvas HTML tooltip renderer. */
const escapeHtml = (value: string): string =>
  value.replace(
    /[&<>"']/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[character]!
  );

/** Builds a relationship label and link exclusively from a table row. */
const toRelatedProduct = (part: DatatablePart): RelatedProduct => ({
  id: part.partNumber,
  name: part.displayName || part.groupName,
  link: getStoreLink(part),
});

const ArrowTopRightIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="7" y1="17" x2="17" y2="7" />
    <polyline points="7 7 17 7 17 17" />
  </svg>
);

const CloseIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const formatPartTitle = (partNumber?: string | null, displayName?: string | null, groupName?: string | null) => {
  const sku = String(partNumber || "").trim();
  const title = String(displayName || groupName || "").trim();

  if (!sku) return title;
  if (!title) return sku;

  const lowerTitle = title.toLowerCase();
  const lowerSku = sku.toLowerCase();
  const titleAlreadyStartsWithSku =
    lowerTitle === lowerSku || lowerTitle.startsWith(`${lowerSku} `) || lowerTitle.startsWith(`${lowerSku} -`);

  return titleAlreadyStartsWithSku ? title : `${sku} ${title}`;
};

/**
 * Override the built-in PlayCanvas hover tooltip with our design.
 * Finds OutlineService via PlayCanvas script instances and applies
 * custom styles + renderTooltip using only the current product table.
 * Restores the previous renderer and popup styles when the scene is unmounted.
 */
function useTooltipStyling() {
  const { parts } = useDatatableParts();
  const productId = useAppSelector(getProductId);
  const partsRef = useRef(parts);
  const popupRef = useRef<HTMLElement | null>(null);
  partsRef.current = parts;

  useEffect(() => {
    // A visible tooltip must not keep content from the previous table.
    if (popupRef.current) popupRef.current.innerHTML = "";
  }, [parts]);

  useEffect(() => {
    let restore: (() => void) | undefined;
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

      if (!os?._options) return false;
      const previousRenderer = os._options.renderTooltip;
      const previousInteractive = os._options.tooltipInteractive;
      const popup = os._popup as HTMLElement | undefined;
      const previousStyle = popup?.style.cssText;
      popupRef.current = popup ?? null;
      if (popup) popup.innerHTML = "";

      // 1. Override tooltip container styles
      if (os._popup) {
        Object.assign(os._popup.style, {
          backgroundColor: "#FFFFFF",
          color: "#343A40",
          fontFamily: '"Futura PT", "Roboto", sans-serif',
          border: "1px solid #E3E5FA",
          borderRadius: "12px",
          padding: "16px 20px",
          maxWidth: "320px",
          boxShadow: "0 8px 24px rgba(0,0,0,0.1), 0 2px 8px rgba(0,0,0,0.05)",
          pointerEvents: "auto",
        });
      }

      // 2. Custom renderTooltip via _options
      if (os._options) {
        os._options.tooltipInteractive = true;
        const renderTooltip = (data: { partNumber?: string | number | null }) => {
          const part = findDatatablePart(partsRef.current, data.partNumber);
          if (!part) return "";
          let html = `<strong style="font-size:15px;font-weight:600;color:#343A40;display:block;margin-bottom:6px;line-height:1.3;">`;
          html += escapeHtml(formatPartTitle(part.partNumber, part.displayName, part.groupName));
          html += `</strong>`;

          if (part.description) {
            html += `<span style="color:#6C757D;font-size:13px;font-weight:400;display:block;margin-bottom:10px;">${escapeHtml(part.description)}</span>`;
          }

          const link = getStoreLink(part);
          if (link) {
            html += `<a href="${escapeHtml(link)}" target="_blank" rel="noopener noreferrer"
              style="color:#37CC8F;font-size:13px;font-weight:500;text-decoration:none;display:inline-flex;align-items:center;gap:4px;">
              ${escapeHtml(part.storeLinkText || "Store Link")} ↗
            </a>`;
          } else {
            html += `<span style="color:#37CC8F;font-size:13px;font-weight:500;">Click for details</span>`;
          }

          return html;
        };
        os._options.renderTooltip = renderTooltip;
        restore = () => {
          if (os._options.renderTooltip === renderTooltip) {
            os._options.renderTooltip = previousRenderer;
            os._options.tooltipInteractive = previousInteractive;
          }
          if (popup) {
            popup.innerHTML = "";
            popup.style.cssText = previousStyle ?? "";
          }
          popupRef.current = null;
        };
      }

      return true;
    };

    const interval = apply()
      ? undefined
      : setInterval(() => {
          if (apply()) clearInterval(interval);
        }, 500);
    return () => {
      clearInterval(interval);
      restore?.();
    };
  }, [productId]);
}

export const PartPopup = () => {
  const { selectedPart, deselect } = usePartSelection();
  const {
    part: datatablePart,
    relatedParts,
    parentAssemblyParts,
    componentParts,
  } = useDataTablePart(selectedPart?.partNumber);

  useTooltipStyling();

  const relatedProducts = useMemo(() => relatedParts.map(toRelatedProduct).filter((part) => part.link), [relatedParts]);
  const parentAssemblies = useMemo(() => parentAssemblyParts.map(toRelatedProduct), [parentAssemblyParts]);
  const components = useMemo(() => componentParts.map(toRelatedProduct), [componentParts]);

  if (!datatablePart) return null;

  const displayTitle = datatablePart.displayName || datatablePart.groupName;
  const description = datatablePart.description;
  const technicalNotes = datatablePart.technicalNotes;
  const specs = datatablePart.specifications;
  const maintenance = datatablePart.maintenance;
  const storeLink = getStoreLink(datatablePart);
  const requiresCustomerService =
    datatablePart.storeLink?.trim().toLowerCase() === CONTACT_CUSTOMER_SERVICE.toLowerCase();
  const hasStoreLink = Boolean(storeLink);
  const storeLinkText = requiresCustomerService ? CONTACT_CUSTOMER_SERVICE : datatablePart.storeLinkText;
  const category = datatablePart.category;
  const sku = datatablePart.partNumber;
  const hasSpecs = Object.keys(specs).length > 0;

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
            {maintenance.interval && (
              <p className={s.maintenanceItem}>
                <strong>Interval:</strong> {maintenance.interval}
              </p>
            )}
            {maintenance.task && (
              <p className={s.maintenanceItem}>
                <strong>Task:</strong> {maintenance.task}
              </p>
            )}
            {maintenance.commonIssues && (
              <p className={s.maintenanceItem}>
                <strong>Common issues:</strong> {maintenance.commonIssues}
              </p>
            )}
          </div>
        )}

        {/* Parent assemblies */}
        {parentAssemblies.length > 0 && (
          <div className={s.section}>
            <h3 className={s.sectionTitle}>Parent Assemblies</h3>
            <ul className={s.relatedList}>
              {parentAssemblies.map((parent) => (
                <li key={parent.id} className={s.relatedItem}>
                  {parent.link ? (
                    <a href={parent.link} target="_blank" rel="noopener noreferrer">
                      {formatPartTitle(parent.id, parent.name)}
                    </a>
                  ) : (
                    <span>{formatPartTitle(parent.id, parent.name)}</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Components */}
        {components.length > 0 && (
          <div className={s.section}>
            <h3 className={s.sectionTitle}>Components</h3>
            <ul className={s.relatedList}>
              {components.map((component) => (
                <li key={component.id} className={s.relatedItem}>
                  {component.link ? (
                    <a href={component.link} target="_blank" rel="noopener noreferrer">
                      {formatPartTitle(component.id, component.name)}
                    </a>
                  ) : (
                    <span>{formatPartTitle(component.id, component.name)}</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Related products */}
        {relatedProducts.length > 0 && (
          <div className={s.section}>
            <h3 className={s.sectionTitle}>Related Products</h3>
            <ul className={s.relatedList}>
              {relatedProducts.map((related) => (
                <li key={related.id} className={s.relatedItem}>
                  <a href={related.link} target="_blank" rel="noopener noreferrer">
                    {related.id} {related.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Store Link */}
        {hasStoreLink ? (
          <a href={storeLink} target="_blank" rel="noopener noreferrer" className={s.storeLink}>
            <span>{storeLinkText || "Store Link"}</span>
            <ArrowTopRightIcon />
          </a>
        ) : (
          <button type="button" className={s.storeLink} disabled>
            <span>{storeLinkText || "Store Link"}</span>
          </button>
        )}
      </div>
    </div>
  );
};
