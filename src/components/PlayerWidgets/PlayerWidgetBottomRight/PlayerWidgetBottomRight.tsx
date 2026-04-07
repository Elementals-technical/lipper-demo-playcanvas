import { BtnFullScreenIcon } from "../../../assets/img/svg/BtnFullScreenIcon";
import Button from "../../Button/Button";
import s from "./PlayerWidgetBottomRight.module.scss";

export const PlayerWidgetBottomRight = () => {
  const handleFullScreen = () => {
    const playerContainer = document.querySelector('[data-status]') as HTMLElement;
    if (playerContainer) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        playerContainer.requestFullscreen();
      }
    }
  };

  return (
    <div className={s.playerWidgetBottomRight}>
      <Button className={s.btn} iconBefore={<BtnFullScreenIcon />} onClick={handleFullScreen} />
    </div>
  );
};
