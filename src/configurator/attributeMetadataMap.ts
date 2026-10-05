import type { LippertVariantMetadata } from "./types";

// ── Hub Assembly (toggle) ──
const HUB_ASSEMBLY: Record<string, LippertVariantMetadata> = {
  true: { assetId: "hub-on", pcOption: true, pcAsset: null },
  false: { assetId: "hub-off", pcOption: false, pcAsset: null },
};

// ── Brake Assembly (toggle) ──
const BRAKE_ASSEMBLY: Record<string, LippertVariantMetadata> = {
  true: { assetId: "brake-on", pcOption: true, pcAsset: null },
  false: { assetId: "brake-off", pcOption: false, pcAsset: null },
};

// ── Spring Assembly (toggle) ──
const SPRING_ASSEMBLY: Record<string, LippertVariantMetadata> = {
  true: { assetId: "spring-on", pcOption: true, pcAsset: null },
  false: { assetId: "spring-off", pcOption: false, pcAsset: null },
};

// ── Spindle Assembly (toggle) ──
const SPINDLE_ASSEMBLY: Record<string, LippertVariantMetadata> = {
  true: { assetId: "spindle-on", pcOption: true, pcAsset: null },
  false: { assetId: "spindle-off", pcOption: false, pcAsset: null },
};

// ── Stationary Part (toggle) ──
const STATIONARY_PART: Record<string, LippertVariantMetadata> = {
  true: { assetId: "stationary-on", pcOption: true, pcAsset: null },
  false: { assetId: "stationary-off", pcOption: false, pcAsset: null },
};

// ── Moving Part (toggle) ──
const MOVING_PART: Record<string, LippertVariantMetadata> = {
  true: { assetId: "moving-on", pcOption: true, pcAsset: null },
  false: { assetId: "moving-off", pcOption: false, pcAsset: null },
};

// ── Slide Outs visibility (toggles) ──
const VEHICLE_STRUCTURE: Record<string, LippertVariantMetadata> = {
  true: { assetId: "vehicle-structure-on", pcOption: true, pcAsset: null },
  false: { assetId: "vehicle-structure-off", pcOption: false, pcAsset: null },
};

const SLIDE_OUT_BOX: Record<string, LippertVariantMetadata> = {
  true: { assetId: "slide-out-box-on", pcOption: true, pcAsset: null },
  false: { assetId: "slide-out-box-off", pcOption: false, pcAsset: null },
};

const SLIDE_ASSEMBLY: Record<string, LippertVariantMetadata> = {
  true: { assetId: "slide-assembly-on", pcOption: true, pcAsset: null },
  false: { assetId: "slide-assembly-off", pcOption: false, pcAsset: null },
};

const SILL_PAN_ASSEMBLY: Record<string, LippertVariantMetadata> = {
  true: { assetId: "sill-pan-assembly-on", pcOption: true, pcAsset: null },
  false: { assetId: "sill-pan-assembly-off", pcOption: false, pcAsset: null },
};

// ── Explode (toggle) ──
const EXPLODE: Record<string, LippertVariantMetadata> = {
  true: { assetId: "explode-on", pcOption: true, pcAsset: null },
  false: { assetId: "explode-off", pcOption: false, pcAsset: null },
};

// ── Assembly Explode (toggle) ──
const ASSEMBLY_EXPLODE: Record<string, LippertVariantMetadata> = {
  true: { assetId: "assembly-explode-on", pcOption: true, pcAsset: null },
  false: { assetId: "assembly-explode-off", pcOption: false, pcAsset: null },
};

// ── Annotations (toggle) ──
const ANNOTATIONS: Record<string, LippertVariantMetadata> = {
  true: { assetId: "annotations-on", pcOption: true, pcAsset: null },
  false: { assetId: "annotations-off", pcOption: false, pcAsset: null },
};

// ── Master lookup ──
export const LIPPERT_ATTRIBUTE_METADATA: Record<string, Record<string, LippertVariantMetadata>> = {
  "Hub Assembly": HUB_ASSEMBLY,
  "Brake Assembly": BRAKE_ASSEMBLY,
  "Spring Assembly": SPRING_ASSEMBLY,
  "Spindle Assembly": SPINDLE_ASSEMBLY,
  "Stationary Part": STATIONARY_PART,
  "Moving Part": MOVING_PART,
  "Vehicle Structure": VEHICLE_STRUCTURE,
  "Slide Out Box": SLIDE_OUT_BOX,
  "Slide Assembly": SLIDE_ASSEMBLY,
  "Sill Pan Assembly": SILL_PAN_ASSEMBLY,
  Explode: EXPLODE,
  "Spring Assembly Explode": ASSEMBLY_EXPLODE,
  "Brake Assembly Explode": ASSEMBLY_EXPLODE,
  "Slide Pan Assembly Explode": ASSEMBLY_EXPLODE,
  Annotations: ANNOTATIONS,
};

export function getLippertVariantMetadata(attributeName: string, variantName: string): LippertVariantMetadata {
  const attrMap = LIPPERT_ATTRIBUTE_METADATA[attributeName];
  if (attrMap?.[variantName]) {
    return attrMap[variantName];
  }
  // Auto-generate fallback
  const slug = variantName.toLowerCase().replace(/[\s/]+/g, "-");
  return { assetId: slug, pcOption: slug, pcAsset: null };
}
