import { useState } from "react";
import { BtnDimentionsIcon } from "../../../assets/img/svg/BtnDimentionsIcon";
import { BtnExplodeIcon } from "../../../assets/img/svg/BtnExplodeIcon";
import { BtnFullScreenIcon } from "../../../assets/img/svg/BtnFullScreenIcon";
import { useConfiguratorAPI } from "../../../hooks/useConfiguratorAPI";
import Button from "../../Button/Button";
import s from "./PlayerWidgetBottomRight.module.scss";

export const PlayerWidgetBottomRight = () => {
  const { state, setConfig, isReady } = useConfiguratorAPI();

  // Local state fallback for cross-origin mode (when direct API state is unavailable)
  const [localExplode, setLocalExplode] = useState(false);
  const [localAnnotations, setLocalAnnotations] = useState(false);

  const explodeActive = state?.explodeStatus ?? localExplode;
  const annotationsActive = state?.annotationsVisible ?? localAnnotations;

  const handleExplode = () => {
    const newValue = !explodeActive;
    setLocalExplode(newValue);
    setConfig({ explodeStatus: newValue });
  };

  const handleAnnotations = () => {
    const newValue = !annotationsActive;
    setLocalAnnotations(newValue);
    setConfig({ annotationsVisible: newValue });
  };

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

  if (!isReady) return null;

  return (
    <div className={s.playerWidgetBottomRight}>
      <Button
        className={`${s.btn} ${explodeActive ? s.active : ""}`}
        iconBefore={<BtnExplodeIcon />}
        onClick={handleExplode}
      />
      <Button
        className={`${s.btn} ${annotationsActive ? s.active : ""}`}
        iconBefore={<BtnDimentionsIcon />}
        onClick={handleAnnotations}
      />
      <Button
        className={s.btn}
        iconBefore={<BtnFullScreenIcon />}
        onClick={handleFullScreen}
      />
    </div>
  );
};
