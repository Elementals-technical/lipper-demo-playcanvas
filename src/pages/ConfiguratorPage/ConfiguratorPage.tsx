import s from "./ConfiguratorPage.module.scss";
import { useParams } from "react-router-dom";
import { PlayCanvasPlayer } from "../../components/PlayCanvasPlayer/PlayCanvasPlayer";
import { PartsListPanel } from "../../components/PartsListPanel/PartsListPanel";
import { CameraController } from "../../components/CameraController/CameraController";
import { PartPopup } from "../../components/PartPopup/PartPopup";
import { PlayerWidgetBottomCenter } from "../../components/PlayerWidgets/PlayerWidgetBottomCenter/PlayerWidgetBottomCenter";

export const ConfiguratorPage = () => {
  const { productId } = useParams<{ productId: string }>();

  return (
    <div className={s.page}>
      <PlayCanvasPlayer productId={productId} />
      <PartsListPanel />
      <CameraController />
      <PartPopup />
      <PlayerWidgetBottomCenter />
    </div>
  );
};
