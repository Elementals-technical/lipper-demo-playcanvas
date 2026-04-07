import { Link, useParams } from "react-router-dom";
import s from "./ProductNotFound.module.scss";

export const ProductNotFound = () => {
  const { productId } = useParams();

  return (
    <div className={s.notFound}>
      <div className={s.code}>404</div>
      <div className={s.title}>Product Not Found</div>
      <div className={s.description}>
        {productId
          ? `Product with ID "${productId}" does not exist or is no longer available.`
          : "The requested page was not found."}
      </div>
      <Link to="/" className={s.backLink}>
        ← Back to home
      </Link>
    </div>
  );
};
