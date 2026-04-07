import type { BaseVariantMetadata } from '../services/productAttributes';

export interface LippertVariantMetadata extends BaseVariantMetadata {
  assetId: string;
  pcOption: string | boolean;
  pcAsset: string | null;
  extra?: Record<string, unknown>;
}
