import { useEffect, useMemo, useState } from "react";
import { Outlet, useParams } from "react-router-dom";
import {
  DEFAULT_PRODUCT_ID,
  getMockAttributes,
  initProductAttributes,
} from "../configurator";
import { ProductNotFound } from "../pages/ProductNotFound/ProductNotFound";
import { useAppDispatch } from "../store/store";
import {
  setApiReady,
  setAttributes,
  setProductId,
} from "../store/slices/configurator/Configurator.sclice";
import type { AttributeState } from "../store/slices/configurator/type";

const parseProductId = (routeProductId?: string): number | null => {
  if (routeProductId === undefined) return DEFAULT_PRODUCT_ID;

  const productId = Number(routeProductId);
  return Number.isInteger(productId) && productId > 0 ? productId : null;
};

const buildInitialAttributes = (): Record<string, AttributeState> => {
  const result: Record<string, AttributeState> = {};

  for (const [name, attr] of Object.entries(getMockAttributes())) {
    if (!attr.values.length) continue;

    const isBoolean = attr.type === "Boolean";
    const currentValue = isBoolean
      ? attr.value
      : (attr.value as { assetId: string }).assetId;
    const selected =
      attr.values.find((value) =>
        isBoolean
          ? value.value === currentValue
          : value.assetId === currentValue,
      ) ?? attr.values[0];

    result[name] = {
      activeItem: selected.label,
      defaultItem: selected.label,
      img: selected.metadata._img ?? "",
    };
  }

  return result;
};

/** Synchronizes the route product ID and its attributes with the global store. */
export const ProductProvider = () => {
  const { productId: routeProductId } = useParams<{ productId: string }>();
  const dispatch = useAppDispatch();
  const productId = useMemo(
    () => parseProductId(routeProductId),
    [routeProductId],
  );
  const [readyProductId, setReadyProductId] = useState<number | null>(null);

  useEffect(() => {
    if (productId === null) return;

    let cancelled = false;
    setReadyProductId(null);
    dispatch(setProductId(productId));
    dispatch(setApiReady(false));
    dispatch(setAttributes({}));

    initProductAttributes(productId).then(() => {
      if (cancelled) return;
      dispatch(setAttributes(buildInitialAttributes()));
      dispatch(setApiReady(true));
      setReadyProductId(productId);
    });

    return () => {
      cancelled = true;
    };
  }, [dispatch, productId]);

  if (productId === null) return <ProductNotFound />;
  if (readyProductId !== productId) return null;

  return <Outlet />;
};
