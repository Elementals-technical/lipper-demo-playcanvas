import { THREEKIT_PARAMS } from "../config/threekit/threekitConfig";
import { productsLippert, ProductSource } from "../products/products.config";

export const getAssetIdByProductsConfig = () => {
  const params = new URLSearchParams(window.location.search);
  const tkProduct = params.get("tkProduct");
  const source: ProductSource = (THREEKIT_PARAMS.THREEKIT_ENV ?? "preview") as ProductSource;

  // Якщо є параметр tkProduct і він присутній у productsLippert
  if (tkProduct && tkProduct in productsLippert) {
    const key = tkProduct as keyof typeof productsLippert;
    return productsLippert[key][source]?.assetId;
  }

  // Якщо немає параметра tkProduct → беремо перший елемент
  const firstKey = Object.keys(productsLippert)[0] as keyof typeof productsLippert;
  return productsLippert[firstKey][source]?.assetId;
};
