import { RotateIcon } from "../../../assets/img/svg/RotateIcon";
import { getConfiguratorView } from "../../../store/slices/configurator/selectors/selectors";
import { useAppSelector } from "../../../store/store";
import s from "./PlayerWidgetBottomCenter.module.scss";

export const PlayerWidgetBottomCenter = () => {
  const configuratorView = useAppSelector(getConfiguratorView);

  if (configuratorView === "3D") return null;

  return (
    <div className={s.playerWidgetBottomCenter}>
      <div className={`${s.icon}`}>
        <RotateIcon />
      </div>
    </div>
  );
};
