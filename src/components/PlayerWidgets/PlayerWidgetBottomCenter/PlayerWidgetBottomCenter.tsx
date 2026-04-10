import { useState } from "react";
import { useArExport } from "../../../modules/ar-module/hooks/useArExport";
import { ArPopup } from "../../../modules/ar-module/ui/ArPopup/ArPopup";
import { ArIcon } from "../../../modules/ar-module/assets/ArIcon";
import s from "./PlayerWidgetBottomCenter.module.scss";

export const PlayerWidgetBottomCenter = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { trigger, isLoading, qrValue, iosArUrl, isIOS } = useArExport();

  const handleClick = () => {
    setIsOpen(true);
    trigger();
  };

  return (
    <>
      <div className={s.playerWidgetBottomCenter}>
        <button className={s.arBtn} onClick={handleClick}>
          <ArIcon />
          View in AR
        </button>
      </div>

      <ArPopup
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        isLoading={isLoading}
        qrValue={qrValue}
        iosArUrl={iosArUrl}
        isIOS={isIOS}
      />
    </>
  );
};
