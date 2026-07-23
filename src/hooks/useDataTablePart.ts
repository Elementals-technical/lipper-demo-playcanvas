import { useMemo } from "react";
import { useDatatableParts } from "./useDatatableParts";

/**
 * Loads a datatable part matching the selected PlayCanvas part.
 *
 * @param partNumber Part number reported by PlayCanvas.
 */
export const useDataTablePart = (partNumber: string | null | undefined) => {
  const { parts, isLoading, error } = useDatatableParts();

  const part = useMemo(() => {
    if (!partNumber) return null;

    return parts.find((candidate) => candidate.partNumber === partNumber) ?? null;
  }, [partNumber, parts]);

  const relatedParts = useMemo(
    () =>
      (part?.relatedProducts ?? [])
        .map((relatedPartNumber) => parts.find((candidate) => candidate.partNumber === relatedPartNumber))
        .filter((candidate) => candidate !== undefined),
    [part, parts]
  );

  return { part, relatedParts, isLoading, error };
};
