import { PlayerToolEvent } from "@threekit-tools/treble/dist/types";
import { AppDispatch } from "../../../store/store";
import { sendToParent } from "../../iframeUtils";

export const toolMouseUp = () => {
  return {
    active: true,
    enabled: true,
    key: "toolMouseUp",
    handlers: {
      mousedown: (ev: PlayerToolEvent) => {
        return false;
      },
      mouseup: (ev: PlayerToolEvent) => {
        sendToParent({
          type: "TK_STAGE_CAMERA",
          // @ts-ignore
          payload: Number(window.tkStageConfigurator.getConfiguration()?.["Camera"]),
        });
        return false;
      },
      drag: (ev: PlayerToolEvent) => {
        return false;
      },
    },
  };
};
