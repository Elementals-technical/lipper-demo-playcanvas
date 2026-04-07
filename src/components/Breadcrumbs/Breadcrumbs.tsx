import clsx from "clsx";
import s from "./Breadcrumbs.module.scss";
import { BusinessLoginIcon } from "../../assets/img/svg/BusinessLoginIcon";

type BreadcrumbsT = {
  className?: string;
};

export const Breadcrumbs: React.FC<BreadcrumbsT> = ({ className }) => {
  return (
    <div className={clsx(s.wrap, className)}>
      <div className={s.crumbs}>
        Home / RV Parts, Accessories & Upgrades / Campsite, RV Patio & Entryway / RV Doors & Accessories / RV Entry
        Doors
      </div>
      <div className={s.btnWrap}>
        <button className={s.btn}>
          Business Login <BusinessLoginIcon />
        </button>
      </div>
    </div>
  );
};
