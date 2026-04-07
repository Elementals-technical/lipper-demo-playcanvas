import { createBrowserRouter } from "react-router-dom";
import { MainLayout } from "../pages/MainLayout/MainLayout";
import { ConfiguratorPage } from "../pages/ConfiguratorPage/ConfiguratorPage";

export const router = createBrowserRouter([
  {
    element: <MainLayout />,
    children: [
      {
        index: true,
        element: <ConfiguratorPage />,
      },
      {
        path: "*",
        element: <ConfiguratorPage />,
      },
    ],
  },
]);
