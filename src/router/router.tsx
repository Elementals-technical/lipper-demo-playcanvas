import { createBrowserRouter } from "react-router-dom";
import { ConfiguratorPage } from "../pages/ConfiguratorPage/ConfiguratorPage";
import { ProductNotFound } from "../pages/ProductNotFound/ProductNotFound";

export const router = createBrowserRouter([
  {
    index: true,
    element: <ConfiguratorPage />,
  },
  {
    path: ":productId",
    element: <ConfiguratorPage />,
  },
  {
    path: "*",
    element: <ProductNotFound />,
  },
]);
