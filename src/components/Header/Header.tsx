import clsx from "clsx";
import Button from "../Button/Button";
import { SearchInput } from "../SearchInput/SearchInput";
import s from "./Header.module.scss";
import { LogoIcon } from "../../assets/img/svg/LogoIconIcon";
type HeaderT = {
  className?: string;
};

export const Header: React.FC<HeaderT> = ({ className }) => {
  return (
    <div className={clsx(s.wrap, className)}>
      <div className={s.head}>
        <div className={s.btnsGroup}>
          <Button variant="secondary" className={s.btn}>
            Shop
          </Button>
          <Button variant="secondary" className={s.btn}>
            Business Login
          </Button>
          <Button variant="secondary" className={s.btn}>
            Corporate Site
          </Button>
        </div>
        <div className={s.btnsGroup}>
          <Button variant="secondary" className={s.btn}>
            Investors
          </Button>
          <Button variant="secondary" className={s.btn}>
            Careers
          </Button>
          <Button variant="secondary" className={s.btn}>
            Support
          </Button>
        </div>
      </div>
      <div className={s.body}>
        <LogoIcon />
        <SearchInput className={s.searchBar} />
        <div className={s.btnsGroup}>
          <Button variant="secondary" className={s.btnBlack}>
            Login
          </Button>
          <Button variant="secondary" className={s.btnBlack}>
            Wishlist
          </Button>
          <Button variant="secondary" className={s.btnBlack}>
            Cart Empty
          </Button>
        </div>
      </div>
      <div className={s.bottom}>
        <div className={s.btnsGroup}>
          <Button variant="secondary" className={s.btnPrimary}>
            RV & Camping
          </Button>
          <Button variant="secondary" className={s.btnPrimary}>
            Boating & Watersports
          </Button>
          <Button variant="secondary" className={s.btnPrimary}>
            Towing & Trailering
          </Button>

          <Button variant="secondary" className={s.btnPrimary}>
            More
          </Button>

          <Button variant="secondary" className={s.btnPrimary}>
            Sale
          </Button>
          <Button variant="secondary" className={s.btnPrimary}>
            Brands
          </Button>

          <Button variant="secondary" className={s.btnPrimary}>
            Customer Resources
          </Button>
        </div>
        <div className={s.btnsGroup}>
          <Button variant="secondary" className={s.btnRounded}>
            Buy Local
          </Button>
          <Button variant="secondary" className={s.btnRounded}>
            Configurator
          </Button>
        </div>
      </div>
    </div>
  );
};
