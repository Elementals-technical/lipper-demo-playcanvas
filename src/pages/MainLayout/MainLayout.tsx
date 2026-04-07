import s from "./MainLayout.module.scss";
import { Outlet } from "react-router-dom";
import { Header } from "../../components/Header/Header";
import { Breadcrumbs } from "../../components/Breadcrumbs/Breadcrumbs";

export const MainLayout = () => {
  return (
    <div className={s.mainLayout}>
      <Header />
      <Breadcrumbs />
      <div className={s.contentWrap}>
        <Outlet />
      </div>
    </div>
  );
};
