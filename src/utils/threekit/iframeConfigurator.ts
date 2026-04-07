import { IThreekitConfigurator } from "@threekit-tools/treble/dist/types";

export function getIftameConfigurator(): IThreekitConfigurator | undefined {
  // @ts-ignore
  return window.iframePlayer?.current.contentWindow.tkConfigurator;
}
