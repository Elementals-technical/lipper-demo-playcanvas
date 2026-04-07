import s from "./ConfiguratorPage.module.scss";
import { ProductSettings } from "../../components/ProductSettings/ProductSettings";
import { PlayerWidgets } from "../../components/PlayerWidgets/PlayerWidgets";
import { PlayCanvasPlayer } from "../../components/PlayCanvasPlayer/PlayCanvasPlayer";
import { PartModal } from "../../components/PartModal/PartModal";

export const ConfiguratorPage = () => {
  return (
    <div className={s.configuratorPage}>
      <div className={s.playerContent}>
        <div className={s.playerWrap}>
          <PlayCanvasPlayer />
          <PlayerWidgets />
        </div>
      </div>
      <div className={s.productSettingsContent}>
        <ProductSettings />
      </div>
      <PartModal />
    </div>
  );
};
