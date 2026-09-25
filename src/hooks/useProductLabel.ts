import { useEffect, useState } from "react";
import { fetchProducts } from "../services/productContent";

const PRODUCT_LABEL_PLACEHOLDER = "Product";

/** Loads the current product's label from the shared PRODUCTS request; defaults to Product. */
export const useProductLabel = (productId: number): string => {
  const [result, setResult] = useState({ productId, label: PRODUCT_LABEL_PLACEHOLDER });

  useEffect(() => {
    let cancelled = false;
    fetchProducts()
      .then((products) => {
        if (!cancelled)
          setResult({ productId, label: products.get(String(productId))?.label || PRODUCT_LABEL_PLACEHOLDER });
      })
      .catch(() => {
        if (!cancelled) setResult({ productId, label: PRODUCT_LABEL_PLACEHOLDER });
      });
    return () => {
      cancelled = true;
    };
  }, [productId]);

  return result.productId === productId ? result.label : PRODUCT_LABEL_PLACEHOLDER;
};
