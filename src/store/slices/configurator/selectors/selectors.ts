import { RootState } from "../../../store";

export const getProcessing = (state: RootState) => state.configurator.isProcessing;
export const getStageCamera = (state: RootState) => state.configurator.stageCamera;
export const getAttributes = (state: RootState) => state.configurator.attributes;
export const getApiReady = (state: RootState) => state.configurator.apiReady;
export const getAttribute = (name: string) => (state: RootState) =>
  state.configurator.attributes[name];
