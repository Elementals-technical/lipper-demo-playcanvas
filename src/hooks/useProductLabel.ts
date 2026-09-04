import { useEffect, useState } from "react";

interface ProductTitleRow {
  variantId: string | number;
  label?: string;
}

interface ProductTitlesResponse {
  rows?: ProductTitleRow[];
}

const PRODUCT_TITLES_URL = "https://renderadmin.vivid3d.tech/datatables/576";
const PRODUCT_LABEL_PLACEHOLDER = "Product";

let cachedLabels: Map<string, string> | null = null;
let fetchPromise: Promise<Map<string, string>> | null = null;

const fetchProductLabels = (): Promise<Map<string, string>> => {
  if (cachedLabels) return Promise.resolve(cachedLabels);
  if (fetchPromise) return fetchPromise;

  fetchPromise = fetch(PRODUCT_TITLES_URL)
    .then((response) => {
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.json();
    })
    .then((data: ProductTitlesResponse) => {
      cachedLabels = new Map(
        (data.rows ?? [])
          .filter((row) => row.variantId !== undefined && row.variantId !== null && row.label)
          .map((row) => [String(row.variantId), row.label!])
      );

      return cachedLabels;
    })
    .catch((error) => {
      fetchPromise = null;
      throw error;
    });

  return fetchPromise;
};

/**
 * Loads the display label whose table row ID matches the current product ID.
 *
 * @param productId Product ID selected by the current route.
 * @returns The matching label, or a placeholder when it is unavailable.
 */
export const useProductLabel = (productId: number): string => {
  const [label, setLabel] = useState(() => cachedLabels?.get(String(productId)) ?? PRODUCT_LABEL_PLACEHOLDER);

  useEffect(() => {
    let cancelled = false;
    const productKey = String(productId);

    setLabel(cachedLabels?.get(productKey) ?? PRODUCT_LABEL_PLACEHOLDER);

    fetchProductLabels()
      .then((labels) => {
        if (!cancelled) {
          setLabel(labels.get(productKey) ?? PRODUCT_LABEL_PLACEHOLDER);
        }
      })
      .catch(() => {
        if (!cancelled) setLabel(PRODUCT_LABEL_PLACEHOLDER);
      });

    return () => {
      cancelled = true;
    };
  }, [productId]);

  return label;
};
