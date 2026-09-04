import { useProductLabel } from "../../hooks/useProductLabel";
import { getProductId } from "../../store/slices/configurator/selectors/selectors";
import { useAppSelector } from "../../store/store";
import s from "./ProductHeader.module.scss";

/** Displays the title associated with the current route product. */
export const ProductHeader: React.FC = () => {
  const productId = useAppSelector(getProductId);
  const productLabel = useProductLabel(productId);

  return (
    <div className={s.productHeader}>
      <h1 className={s.productTitle}>{productLabel}</h1>
    </div>
  );
};
