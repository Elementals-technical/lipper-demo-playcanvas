import { useMemo, useEffect } from "react";
import { usePartSelection } from "../../hooks/usePartSelection";
import { useDataTablePart } from "../../hooks/useDataTablePart";
import s from "./PartPopup.module.scss";

interface RelatedProduct {
  id: string;
  name: string;
  link: string;
}

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
        os._options.renderTooltip = (data: any) => {
          let html = `<strong style="font-size:15px;font-weight:600;color:#343A40;display:block;margin-bottom:6px;line-height:1.3;">`;
          html += formatPartTitle(data.partNumber, data.displayName, data.groupName);
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
  const { part: datatablePart, relatedParts, parentAssemblyParts, componentParts } = useDataTablePart(
    selectedPart?.partNumber
  );
  console.log("selectedPart --- ==== ", selectedPart);
  console.log("datatablePart --- ==== ", datatablePart);
  console.log("relatedParts --- ==== ", relatedParts);

  useTooltipStyling();

  // Use enriched data from selectedPart (ConfiguratorAPI) merged with datatable
  const enriched = selectedPart;

  const relatedProducts = useMemo<RelatedProduct[]>(() => {
    if (!enriched) return [];

    const datatableRelatedProducts = relatedParts
      .filter((related) => related.storeLink)
      .map((related) => ({
        id: related.partNumber,
        name: related.displayName || related.groupName,
        link: related.storeLink as string,
      }));

    if (datatableRelatedProducts.length) return datatableRelatedProducts;

    return (enriched.relationProducts ?? [])
      .filter((related) => related.storeLink)
      .map((related) => ({
        id: related.partNumber,
        name: related.groupName,
        link: related.storeLink as string,
      }));
  }, [enriched, relatedParts]);
  console.log("relatedProducts --- ==== ", relatedProducts);

  const parentAssemblies = useMemo<RelatedProduct[]>(() => {
    if (!enriched) return [];

    const playcanvasParents = enriched.parentAssemblies ?? [];
    const parentNumbers = datatablePart?.parentAssemblies.length
      ? datatablePart.parentAssemblies
      : playcanvasParents.map((parent) => parent.partNumber);

    // Resolve each reference independently so missing table rows can use PlayCanvas data.
    return parentNumbers
      .map((partNumber) => {
        const datatableParent = parentAssemblyParts.find((parent) => parent.partNumber === partNumber);
        const parent = datatableParent ?? playcanvasParents.find((parent) => parent.partNumber === partNumber);
        if (!parent) return null;

        const link = parent.storeLink?.trim() || "";
        return {
          id: parent.partNumber,
          name: datatableParent?.displayName || parent.groupName,
          link: ["NLA", "N/A"].includes(link.toUpperCase()) ? "" : link,
        };
      })
      .filter((parent) => parent !== null);
  }, [enriched, datatablePart, parentAssemblyParts]);

  const components = useMemo<RelatedProduct[]>(() => {
    if (!enriched) return [];

    const playcanvasComponents = enriched.components ?? [];
    const componentNumbers = datatablePart?.components.length
      ? datatablePart.components
      : playcanvasComponents.map((component) => component.partNumber);

    // Resolve each reference independently so missing table rows can use PlayCanvas data.
    return componentNumbers
      .map((partNumber) => {
        const datatableComponent = componentParts.find((component) => component.partNumber === partNumber);
        const component =
          datatableComponent ?? playcanvasComponents.find((component) => component.partNumber === partNumber);
        if (!component) return null;

        const link = component.storeLink?.trim() || "";
        return {
          id: component.partNumber,
          name: datatableComponent?.displayName || component.groupName,
          link: ["NLA", "N/A"].includes(link.toUpperCase()) ? "" : link,
        };
      })
      .filter((component) => component !== null);
  }, [enriched, datatablePart, componentParts]);

  if (!enriched) return null;

  const displayTitle = datatablePart?.displayName || enriched.displayName;
  const description = datatablePart?.description || enriched.description;
  const technicalNotes = datatablePart?.technicalNotes || enriched.technicalNotes;
  const specs =
    datatablePart && Object.keys(datatablePart.specifications).length
      ? datatablePart.specifications
      : enriched.specifications;
  const maintenance =
    datatablePart?.maintenance || enriched.maintenance
      ? {
          interval: datatablePart?.maintenance?.interval || enriched.maintenance?.maintenance_interval,
          task: datatablePart?.maintenance?.task || enriched.maintenance?.maintenance_task,
          commonIssues: datatablePart?.maintenance?.commonIssues || enriched.maintenance?.common_issues,
        }
      : null;
  const storeLink = (datatablePart ? datatablePart.storeLink : enriched.storeLink)?.trim() || "";
  const contactCustomerServiceText = "Contact Customer Service for availability";
  const requiresCustomerService = storeLink.toLowerCase() === contactCustomerServiceText.toLowerCase();
  const hasStoreLink =
    Boolean(storeLink) && !["NLA", "N/A"].includes(storeLink.toUpperCase()) && !requiresCustomerService;
  const storeLinkText = requiresCustomerService
    ? contactCustomerServiceText
    : datatablePart?.storeLinkText || enriched.storeLinkText;
  const category = datatablePart?.category || enriched.category;
  const sku = datatablePart?.partNumber || enriched.sku || enriched.partNumber;
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
