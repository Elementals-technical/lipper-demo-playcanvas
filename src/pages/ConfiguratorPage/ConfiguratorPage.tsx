import s from "./ConfiguratorPage.module.scss";
import { PlayCanvasPlayer } from "../../components/PlayCanvasPlayer/PlayCanvasPlayer";
import { PartsListPanel } from "../../components/PartsListPanel/PartsListPanel";
import { CameraController } from "../../components/CameraController/CameraController";
import { PartPopup } from "../../components/PartPopup/PartPopup";
import { PlayerWidgetBottomCenter } from "../../components/PlayerWidgets/PlayerWidgetBottomCenter/PlayerWidgetBottomCenter";
import { ProductHeader } from "../../components/ProductHeader/ProductHeader";

export const ConfiguratorPage = () => {
  return (
    <div className={s.page}>
      <PlayCanvasPlayer />
      <PartsListPanel />
      <CameraController />
      <PartPopup />
      <ProductHeader />
    </div>
  );
};
