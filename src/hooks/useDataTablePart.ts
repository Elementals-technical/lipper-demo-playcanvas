import { useMemo } from "react";
import { useAppSelector } from "../store/store";
import { getProductId } from "../store/slices/configurator/selectors/selectors";
import { useDatatableParts } from "./useDatatableParts";

/**
 * Loads the selected PlayCanvas part, preferring a row for the current route product.
 * Falls back to the first matching part number when no product-specific row exists.
 *
 * @param partNumber Part number reported by PlayCanvas.
 */
export const useDataTablePart = (partNumber: string | null | undefined) => {
  const productId = useAppSelector(getProductId);
  const { parts, isLoading, error } = useDatatableParts();

  const part = useMemo(() => {
    if (!partNumber) return null;

    return (
      parts.find(
        (candidate) => candidate.partNumber === partNumber && candidate.productVariantId === String(productId)
      ) ??
      parts.find((candidate) => candidate.partNumber === partNumber) ??
      null
    );
  }, [partNumber, parts, productId]);

  const relatedParts = useMemo(
    () =>
      (part?.relatedProducts ?? [])
        .map((relatedPartNumber) => parts.find((candidate) => candidate.partNumber === relatedPartNumber))
        .filter((candidate) => candidate !== undefined),
    [part, parts]
  );

  const parentAssemblyParts = useMemo(
    () =>
      (part?.parentAssemblies ?? [])
        .map((parentPartNumber) => parts.find((candidate) => candidate.partNumber === parentPartNumber))
        .filter((candidate) => candidate !== undefined),
    [part, parts]
  );

  const componentParts = useMemo(
    () =>
      (part?.components ?? [])
        .map((componentPartNumber) => parts.find((candidate) => candidate.partNumber === componentPartNumber))
        .filter((candidate) => candidate !== undefined),
    [part, parts]
  );

  return { part, relatedParts, parentAssemblyParts, componentParts, isLoading, error };
};
