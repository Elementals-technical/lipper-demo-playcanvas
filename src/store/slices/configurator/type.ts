export type ConfiguratorType = "2D" | "3D";
export interface ConfiguratorStateI {
  isProcessing: boolean;
  configuratorView: ConfiguratorType;
  isLoadedIframePlayer: boolean;
  stageCamera: number;
}
