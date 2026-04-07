import s from "./PlayerLoader.module.scss";

export const PlayerLoader = () => {
  return (
    <div className={s.playerLoader}>
      <div className={s.loader} />
    </div>
  );
};
