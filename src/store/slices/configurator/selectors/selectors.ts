import { RootState } from "../../../store";

export const getProcessing = (state: RootState) => state.configurator.isProcessing;
export const getConfiguratorView = (state: RootState) => state.configurator.configuratorView;
export const getIsLoadedIframePlayer = (state: RootState) => state.configurator.isLoadedIframePlayer;
export const getStageCamera = (state: RootState) => state.configurator.stageCamera;
