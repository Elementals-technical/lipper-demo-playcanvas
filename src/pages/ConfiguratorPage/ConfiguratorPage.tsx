import s from "./ConfiguratorPage.module.scss";
import { useParams } from "react-router-dom";
import { ProductSettings } from "../../components/ProductSettings/ProductSettings";
import { PlayerWidgets } from "../../components/PlayerWidgets/PlayerWidgets";
import { PlayCanvasPlayer } from "../../components/PlayCanvasPlayer/PlayCanvasPlayer";
import { PartModal } from "../../components/PartModal/PartModal";

export const ConfiguratorPage = () => {
  const { productId } = useParams<{ productId: string }>();

  return (
    <div className={s.configuratorPage}>
      <div className={s.playerContent}>
        <div className={s.playerWrap}>
          <PlayCanvasPlayer productId={productId} />
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
