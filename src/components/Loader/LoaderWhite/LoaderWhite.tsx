import { Loader } from "../Loader/Loader";
import styles from "./LoaderWhite.module.scss";

export const LoaderWhite = () => {
  return (
    <div className={styles.wrapper}>
      <Loader />
      <div className={styles.loaderText}>
        <div className={styles.loaderTitle}>Lippert Builder loading</div>
        <span>This shouldn't take too long</span>
      </div>
    </div>
  );
};
