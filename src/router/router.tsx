import { createBrowserRouter } from "react-router-dom";
import { MainLayout } from "../pages/MainLayout/MainLayout";
import { ConfiguratorPage } from "../pages/ConfiguratorPage/ConfiguratorPage";
import IframePlayerPage from "../pages/IframePlayerPage/IframePlayerPage";

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
      }, // fallback
    ],
  },
  { path: "/iframe", element: <IframePlayerPage /> },
  // { path: "/iframe", element: <IframePlayerPage /> },
]);
