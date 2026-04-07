import styles from "./Loader.module.scss";

export const Loader = () => {
  return (
    <svg className={styles.loader} viewBox="0 0 50 50">
      <circle cx="25" cy="25" r="20"></circle>
      <circle className={styles.progress} cx="25" cy="25" r="20"></circle>
    </svg>
  );
};
