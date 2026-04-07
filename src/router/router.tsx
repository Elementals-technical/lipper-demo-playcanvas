import { createBrowserRouter } from "react-router-dom";
import { MainLayout } from "../pages/MainLayout/MainLayout";
import { ConfiguratorPage } from "../pages/ConfiguratorPage/ConfiguratorPage";
import { ProductNotFound } from "../pages/ProductNotFound/ProductNotFound";

export const router = createBrowserRouter([
  {
    element: <MainLayout />,
    children: [
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
    ],
  },
]);
