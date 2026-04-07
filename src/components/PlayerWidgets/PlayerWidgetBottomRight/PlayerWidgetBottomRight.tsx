import { BtnDimentionsIcon } from "../../../assets/img/svg/BtnDimentionsIcon";
import { BtnExplodeIcon } from "../../../assets/img/svg/BtnExplodeIcon";
import { BtnFullScreenIcon } from "../../../assets/img/svg/BtnFullScreenIcon";
import { useConfiguratorAPI } from "../../../hooks/useConfiguratorAPI";
import Button from "../../Button/Button";
import s from "./PlayerWidgetBottomRight.module.scss";

export const PlayerWidgetBottomRight = () => {
  const { state, setConfig, isReady } = useConfiguratorAPI();

  const handleExplode = () => {
    if (state) {
      setConfig({ explodeStatus: !state.explodeStatus });
    }
  };

  const handleAnnotations = () => {
    if (state) {
      setConfig({ annotationsVisible: !state.annotationsVisible });
    }
  };

  const handleFullScreen = () => {
    const element = document.querySelector('[data-id="BTN_player_full_screen"]') as HTMLElement | null;
    if (element) {
      element.click();
    }
  };

  if (!isReady || !state) return null;

  return (
    <div className={s.playerWidgetBottomRight}>
      <Button
        className={`${s.btn} ${state.explodeStatus ? s.active : ""}`}
        iconBefore={<BtnExplodeIcon />}
        onClick={handleExplode}
      />
      <Button
        className={`${s.btn} ${state.annotationsVisible ? s.active : ""}`}
        iconBefore={<BtnDimentionsIcon />}
        onClick={handleAnnotations}
      />
      <Button className={s.btn} iconBefore={<BtnFullScreenIcon />} onClick={handleFullScreen} />
    </div>
  );
};
