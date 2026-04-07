import s from "./ProductSettings.module.scss";
import { LogoIcon } from "../../assets/img/svg/LogoIconIcon";
import { StarFillIcon } from "../../assets/img/svg/StarFillIcon";
import { StarIcon } from "../../assets/img/svg/StarIcon";
import { ArrowFromLineBottomIcon } from "../../assets/img/svg/ArrowFromLineBottomIcon";
import { ToCardIcon } from "../../assets/img/svg/ToCardIcon";
import { HeartIcon } from "../../assets/img/svg/HeartIcon";
import { AttrColor } from "../Attributes/AttrColor/AttrColor";

export const ProductSettings: React.FC = () => {
  return (
    <div className={s.productSettings}>
      <div className={s.productInfo}>
        <div className={s.logo}>
          <LogoIcon />
          <button className={`${s.btn} ${s.btnLike}`}>
            <HeartIcon /> Add to wishlist
          </button>
        </div>
        <div className={s.title}>Right Hinge RV Square Entry Door with Screen Door</div>
        <div className={s.sku}>SKU #: RH-SQ-ENTRY-DOOR</div>
        <div className={s.price}>
          <span className={s.label}>From:</span> <span className={s.value}>$722.95</span>
        </div>
        <div className={s.rating}>
          <div className={s.stars}>
            <StarFillIcon />
            <StarFillIcon />
            <StarFillIcon />
            <StarFillIcon />
            <StarIcon />
          </div>
          <div className={s.review}>1 Review</div>
          <div className={s.question}>
            <button className={`${s.btn} ${s.question}`}>Ask a question</button>
          </div>
        </div>
        <div className={s.descr}>Replace or upgrade your RV's square entry door with Lippert®.</div>
        <div className={s.note}>
          <span className={s.label}>Note:</span> RV entry doors are built to order and non-returnable.
        </div>
        <div className={s.more}>
          <button className={`${s.btn} ${s.more}`}>
            More details <ArrowFromLineBottomIcon />
          </button>
        </div>
      </div>
      <div className={s.attributes}>
        <div className={s.attrBtns}>
          <div className={s.label}>Door Size</div>
          <div className={s.values}>
            <div className={`${s.value} ${s.active}`}>24” x 70”</div>
            <div className={s.value}>24” x 76”</div>
            <div className={s.value}>28” x 68”</div>
            <div className={s.value}>30” x 72”</div>
            <div className={s.value}>36” x 72”</div>
          </div>
        </div>
        <AttrColor />
      </div>
      <div className={s.footer}>
        <div className={s.counter}>
          <div className={s.btnMinus}>-</div>
          <div className={s.value}>1</div>
          <div className={s.btnPlus}>+</div>
        </div>
        <div className={s.toCardWrap}>
          <button className={`${s.btn} ${s.cart}`}>
            <ToCardIcon /> Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
};
