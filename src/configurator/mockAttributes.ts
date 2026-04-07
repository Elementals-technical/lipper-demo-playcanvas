/**
 * Mock Attributes
 *
 * Merges Vivid API data + Proxy metadata into unified attribute objects.
 * Manages product cache and provides useAttribute hook.
 */

import { useState, useEffect, useCallback } from 'react';
import type { ProductDataAttributes } from '../services/productAttributes';
import { lippertProductService, PRODUCT_ID } from './productInstance';
import { getLippertVariantMetadata } from './attributeMetadataMap';
import { isBooleanAttr, setPlayCanvasAttribute } from './playcanvasBridge';

// ── Types ──

export interface MockVariant {
  label: string;
  value: string | boolean;
  assetId: string;
  metadata: {
    _id: string;
    option: string | boolean;
    asset: string | null;
    _img: string | null;
    [key: string]: unknown;
  };
}

export interface MockAttribute {
  type: 'Boolean' | 'Asset';
  value: boolean | { assetId: string };
  defaultValue: boolean | { assetId: string };
  values: MockVariant[];
}

// ── Cache ──

let productCache: Record<string, MockAttribute> | null = null;
let initPromise: Promise<void> | null = null;
let _initialized = false;

// ── Build a single mock attribute ──

const DEFAULT_OVERRIDES: Record<string, string> = {
  'Hub Assembly': 'true',
  'Brake Assembly': 'true',
  'Spring Assembly': 'true',
  'Spindle Assembly': 'true',
  Explode: 'false',
  Annotations: 'false',
};

function buildMockAttribute(
  attrName: string,
  apiAttr: ProductDataAttributes,
): MockAttribute {
  const isBoolean = isBooleanAttr(attrName);

  const enabledVariants = apiAttr.values.filter((v) => v.enabled);

  const values: MockVariant[] = enabledVariants.map((variant) => {
    const meta = getLippertVariantMetadata(attrName, variant.name);

    return {
      label: variant.name,
      value: meta.pcOption,
      assetId: meta.assetId,
      metadata: {
        _id: String(variant.id),
        option: meta.pcOption,
        asset: meta.pcAsset,
        _img: variant.image ?? null,
        ...meta.extra,
      },
    };
  });

  // Determine default selection
  const defaultName = DEFAULT_OVERRIDES[attrName];
  const defaultEntry = defaultName
    ? values.find((v) => v.label === defaultName) ?? values[0]
    : values[0];

  const defaultVal = isBoolean
    ? (defaultEntry?.value as boolean)
    : { assetId: defaultEntry?.assetId ?? '' };

  return {
    type: isBoolean ? 'Boolean' : 'Asset',
    value: defaultVal,
    defaultValue: defaultVal,
    values,
  };
}

// ── Initialization ──

export async function initProductAttributes(): Promise<void> {
  if (_initialized) return;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    const apiAttrs = await lippertProductService.getAttributes(PRODUCT_ID);

    const built: Record<string, MockAttribute> = {};
    for (const [name, data] of Object.entries(apiAttrs)) {
      built[name] = buildMockAttribute(name, data);
    }

    productCache = built;
    _initialized = true;
  })();

  return initPromise;
}

export function isInitialized(): boolean {
  return _initialized;
}

export function getMockAttributes(): Record<string, MockAttribute> {
  return productCache ?? {};
}

// ── useAttribute hook ──

export function useAttribute(
  attributeName: string,
): [MockAttribute | null, (newValue: string | boolean) => void] {
  const [attr, setAttr] = useState<MockAttribute | null>(
    productCache?.[attributeName] ?? null,
  );

  useEffect(() => {
    if (!_initialized) {
      initProductAttributes().then(() => {
        setAttr(productCache?.[attributeName] ?? null);
      });
    }
  }, [attributeName]);

  const setAttribute = useCallback(
    (newValue: string | boolean) => {
      if (!productCache?.[attributeName]) return;

      const mockAttr = productCache[attributeName];

      // Update mock cache
      if (mockAttr.type === 'Boolean') {
        mockAttr.value = newValue as boolean;
      } else {
        mockAttr.value = { assetId: String(newValue) };
      }

      // Forward to PlayCanvas
      setPlayCanvasAttribute(attributeName, newValue);

      // Trigger re-render
      setAttr({ ...mockAttr });
    },
    [attributeName],
  );

  return [attr, setAttribute];
}
