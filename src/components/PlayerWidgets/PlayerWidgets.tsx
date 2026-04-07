import { useThreekitInitStatus } from "@threekit-tools/treble/dist";
import React from "react";
import { PlayerWidgetBottomLeft } from "./PlayerWidgetBottomLeft/PlayerWidgetBottomLeft";
import { PlayerWidgetBottomRight } from "./PlayerWidgetBottomRight/PlayerWidgetBottomRight";
import { PlayerWidgetBottomCenter } from "./PlayerWidgetBottomCenter/PlayerWidgetBottomCenter";

export const PlayerWidgets: React.FC = () => {
  // const hasLoaded = useThreekitInitStatus();

  // if (!hasLoaded) return null;
  return (
    <>
      {/* <PlayerWidgetBottomLeft /> */}
      <PlayerWidgetBottomCenter />
      <PlayerWidgetBottomRight />
    </>
  );
};
