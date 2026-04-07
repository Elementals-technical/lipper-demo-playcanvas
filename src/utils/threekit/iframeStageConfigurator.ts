import { IThreekitConfigurator } from "@threekit-tools/treble/dist/types";

export function getIftameStageConfigurator(): IThreekitConfigurator | undefined {
  // @ts-ignore
  return window.iframePlayer?.current.contentWindow.tkStageConfigurator;
}
