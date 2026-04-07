import { RootState } from "../../../store";

export const getProcessing = (state: RootState) => state.configurator.isProcessing;
export const getStageCamera = (state: RootState) => state.configurator.stageCamera;
