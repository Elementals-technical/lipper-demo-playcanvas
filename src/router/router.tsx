import { createBrowserRouter } from "react-router-dom";
import { ConfiguratorPage } from "../pages/ConfiguratorPage/ConfiguratorPage";
import { ProductNotFound } from "../pages/ProductNotFound/ProductNotFound";
import { ProductProvider } from "./ProductProvider";

export const router = createBrowserRouter([
  {
    element: <ProductProvider />,
    children: [
      {
        index: true,
        element: <ConfiguratorPage />,
      },
      {
        path: ":productId",
        element: <ConfiguratorPage />,
      },
    ],
  },
  {
    path: "*",
    element: <ProductNotFound />,
  },
]);
