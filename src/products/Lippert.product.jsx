import { productsLippert } from "./products.config";
import { RouterProvider } from "react-router-dom";
import { ProductLayout } from "@threekit-tools/treble/dist";
import { router } from "./../router/router";

export default function Product() {
  return (
    <ProductLayout products={productsLippert}>
      <RouterProvider router={router} />
    </ProductLayout>
  );
}
