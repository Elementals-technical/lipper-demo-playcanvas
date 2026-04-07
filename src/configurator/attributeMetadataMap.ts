import type { LippertVariantMetadata } from './types';

// ── Hub Assembly (toggle) ──
const HUB_ASSEMBLY: Record<string, LippertVariantMetadata> = {
  true: { assetId: 'hub-on', pcOption: true, pcAsset: null },
  false: { assetId: 'hub-off', pcOption: false, pcAsset: null },
};

// ── Brake Assembly (toggle) ──
const BRAKE_ASSEMBLY: Record<string, LippertVariantMetadata> = {
  true: { assetId: 'brake-on', pcOption: true, pcAsset: null },
  false: { assetId: 'brake-off', pcOption: false, pcAsset: null },
};

// ── Spring Assembly (toggle) ──
const SPRING_ASSEMBLY: Record<string, LippertVariantMetadata> = {
  true: { assetId: 'spring-on', pcOption: true, pcAsset: null },
  false: { assetId: 'spring-off', pcOption: false, pcAsset: null },
};

// ── Spindle Assembly (toggle) ──
const SPINDLE_ASSEMBLY: Record<string, LippertVariantMetadata> = {
  true: { assetId: 'spindle-on', pcOption: true, pcAsset: null },
  false: { assetId: 'spindle-off', pcOption: false, pcAsset: null },
};

// ── Explode (toggle) ──
const EXPLODE: Record<string, LippertVariantMetadata> = {
  true: { assetId: 'explode-on', pcOption: true, pcAsset: null },
  false: { assetId: 'explode-off', pcOption: false, pcAsset: null },
};

// ── Annotations (toggle) ──
const ANNOTATIONS: Record<string, LippertVariantMetadata> = {
  true: { assetId: 'annotations-on', pcOption: true, pcAsset: null },
  false: { assetId: 'annotations-off', pcOption: false, pcAsset: null },
};

// ── Master lookup ──
export const LIPPERT_ATTRIBUTE_METADATA: Record<
  string,
  Record<string, LippertVariantMetadata>
> = {
  'Hub Assembly': HUB_ASSEMBLY,
  'Brake Assembly': BRAKE_ASSEMBLY,
  'Spring Assembly': SPRING_ASSEMBLY,
  'Spindle Assembly': SPINDLE_ASSEMBLY,
  Explode: EXPLODE,
  Annotations: ANNOTATIONS,
};

export function getLippertVariantMetadata(
  attributeName: string,
  variantName: string,
): LippertVariantMetadata {
  const attrMap = LIPPERT_ATTRIBUTE_METADATA[attributeName];
  if (attrMap?.[variantName]) {
    return attrMap[variantName];
  }
  // Auto-generate fallback
  const slug = variantName.toLowerCase().replace(/[\s/]+/g, '-');
  return { assetId: slug, pcOption: slug, pcAsset: null };
}
