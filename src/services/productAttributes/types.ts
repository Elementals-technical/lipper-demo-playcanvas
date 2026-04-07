// ── Config ──
export interface ProductAttributesConfig {
  apiBaseUrl: string;
  productId: number;
}

// ── Transformed output (what the app works with) ──
export interface ProductDataAttributes {
  id: number;
  name: string; // proxyName from API
  type: 'option' | 'geometry';
  values: ProductAttributeValue[];
}

export interface ProductAttributeValue {
  id: number;
  name: string;
  enabled: boolean;
  image: string | null;
  description: string | null;
}

// ── Base variant metadata (extended per-project) ──
export interface BaseVariantMetadata {
  assetId: string;
  pcOption: string | boolean;
  pcAsset: string | null;
}

// ── Raw API response types ──
export interface ProductData {
  id: number;
  name: string;
  availableOptions: AvailableOption[];
  availableGeometryOptions: AvailableGeometryOption[];
}

export interface AvailableOption {
  id: number;
  proxyName: string;
  dependencies: unknown[];
  layerOrder: number;
  enabled: boolean;
  options: RawOption[];
}

export interface AvailableGeometryOption {
  id: number;
  proxyName: string;
  dependencies: unknown[];
  layerOrder: number;
  enabled: boolean;
  options: RawOption[];
}

export interface RawOption {
  id: number;
  name: string;
  variants: RawVariant[];
}

export interface RawVariant {
  id: number;
  name: string;
  image: string | null;
  enabled: boolean;
  description: string | null;
}
