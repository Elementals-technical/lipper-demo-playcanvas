import { useMemo } from "react";
import { DatatablePart, useDatatableParts } from "./useDatatableParts";

/** Finds a part in the current product's table; returns null when absent. */
export const findDatatablePart = (parts: DatatablePart[], partNumber: string | number | null | undefined) => {
  if (partNumber === null || partNumber === undefined) return null;
  return parts.find((candidate) => candidate.partNumber === String(partNumber).trim()) ?? null;
};

/**
 * Resolves a selected part and its relationships exclusively inside the current product's table.
 *
 * @param partNumber Part number reported by PlayCanvas.
 */
export const useDataTablePart = (partNumber: string | null | undefined) => {
  const { parts, isLoading, error } = useDatatableParts();

  const part = useMemo(() => findDatatablePart(parts, partNumber), [partNumber, parts]);

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
