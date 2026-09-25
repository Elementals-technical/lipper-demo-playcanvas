import { useEffect, useState } from "react";
import { useAppSelector } from "../store/store";
import { getProductId } from "../store/slices/configurator/selectors/selectors";
import { DatatablePart, fetchProductParts } from "../services/productContent";

export type { DatatablePart } from "../services/productContent";

const EMPTY_PARTS: DatatablePart[] = [];

/** Loads only the current product's content, hiding stale results on route changes and unmount. */
export function useDatatableParts() {
  const productId = useAppSelector(getProductId);
  const [result, setResult] = useState<{
    productId: number;
    parts: DatatablePart[];
    isLoading: boolean;
    error: string | null;
  }>({ productId, parts: EMPTY_PARTS, isLoading: true, error: null });

  useEffect(() => {
    let cancelled = false;
    setResult({ productId, parts: EMPTY_PARTS, isLoading: true, error: null });
    fetchProductParts(productId)
      .then((parts) => {
        if (!cancelled) setResult({ productId, parts, isLoading: false, error: null });
      })
      .catch((error) => {
        if (!cancelled)
          setResult({
            productId,
            parts: EMPTY_PARTS,
            isLoading: false,
            error: error instanceof Error ? error.message : "Failed to load parts",
          });
      });
    return () => {
      cancelled = true;
    };
  }, [productId]);

  return result.productId === productId
    ? { parts: result.parts, isLoading: result.isLoading, error: result.error }
    : { parts: EMPTY_PARTS, isLoading: true, error: null };
}
