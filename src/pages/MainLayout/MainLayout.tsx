import { useThreekitInitStatus } from "@threekit-tools/treble/dist";
import s from "./MainLayout.module.scss";
import { Outlet } from "react-router-dom";
import { Header } from "../../components/Header/Header";
import { Breadcrumbs } from "../../components/Breadcrumbs/Breadcrumbs";

export const MainLayout = () => {
  const hasLoaded = useThreekitInitStatus();
  // const isFullLoader = useAppSelector(getFullLoader);

  return (
    <div className={s.mainLayout}>
      <Header />
      <Breadcrumbs />
      {/* <LoaderFull isLoading={isFullLoader} /> */}
      <div className={s.contentWrap} aria-hidden={!hasLoaded}>
        <Outlet />
      </div>
    </div>
  );
};
