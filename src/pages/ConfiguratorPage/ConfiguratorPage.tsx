import { Player, useThreekitInitStatus } from "@threekit-tools/treble/dist";
import s from "./ConfiguratorPage.module.scss";
import { ProductSettings } from "../../components/ProductSettings/ProductSettings";
import { PlayerWidgets } from "../../components/PlayerWidgets/PlayerWidgets";
import { useAppSelector } from "../../store/store";
import { getConfiguratorView, getIsLoadedIframePlayer } from "../../store/slices/configurator/selectors/selectors";
import { PhotoSlider } from "../../components/PhotoSlider/PhotoSlider";
import { useEffect } from "react";
import { PlayerWidgetBottomLeft } from "../../components/PlayerWidgets/PlayerWidgetBottomLeft/PlayerWidgetBottomLeft";
import { ThreekitIframePlayer } from "../../components/ThreekitIframePlayer/ThreekitIframePlayer";
import { PlayerLoader } from "../../components/Loader/PlayerLoader/PlayerLoader";
import { LoaderWhite } from "../../components/Loader/LoaderWhite/LoaderWhite";

export const ConfiguratorPage = () => {
  const hasLoaded = useThreekitInitStatus();
  const configuratorView = useAppSelector(getConfiguratorView);
  const isLoadedIframePlayer = useAppSelector(getIsLoadedIframePlayer);
  const isLoaded = hasLoaded && isLoadedIframePlayer;

  useEffect;

  return (
    <div className={s.configuratorPage}>
      <div className={s.playerContent}>
        {!isLoaded && <LoaderWhite />}
        {/* {!isLoaded && <PlayerLoader />} */}
        <div className={s.playerWrap}>
          <div className={`${s.webglWrap} ${configuratorView === "2D" ? s.hided : ""}`}>
            <Player />
            <PlayerWidgets />
            <PlayerWidgetBottomLeft />
          </div>
          <div className={`${s.imageWrap} ${configuratorView === "3D" ? s.hided : ""}`}>
            <div className={s.iframeWrap}>
              <ThreekitIframePlayer
                className={s.player}
                // assetId="12f1762e-7ade-4336-b02e-131651d66c13"
                // orgId={THREEKIT_ORG_ID() || ""}
                // publicToken={THREEKIT_PUBLIC_TOKEN() || ""}
                // host="https://preview.threekit.com"
              />
              <PlayerWidgetBottomLeft />
            </div>
          </div>
        </div>
        <div className={s.sliderWrap}>{isLoaded && <PhotoSlider />}</div>

        {/* {configuratorView === "3D" ? (
          <Player />
        ) : (
          <ThreekitIframePlayer
            className={s.player}
            assetId="12f1762e-7ade-4336-b02e-131651d66c13"
            // orgId={THREEKIT_ORG_ID() || ""}
            // publicToken={THREEKIT_PUBLIC_TOKEN() || ""}
            // host="https://preview.threekit.com"
          />
        )} */}
        {/* <Player /> */}
      </div>
      <div className={s.productSettingsContent}>
        <ProductSettings />
        {/* <FlatForm /> */}
      </div>
    </div>
  );
};
