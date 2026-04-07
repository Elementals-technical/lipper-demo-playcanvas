import { Btn3DIcon } from "../../../assets/img/svg/Btn3DIcon";
import { changeСonfiguratorView } from "../../../store/slices/configurator/Configurator.sclice";
import { getConfiguratorView } from "../../../store/slices/configurator/selectors/selectors";
import { ConfiguratorType } from "../../../store/slices/configurator/type";
import { useAppDispatch, useAppSelector } from "../../../store/store";
import Button from "../../Button/Button";
import s from "./PlayerWidgetBottomLeft.module.scss";

export const PlayerWidgetBottomLeft = () => {
  const dispatch = useAppDispatch();
  const configuratorView = useAppSelector(getConfiguratorView);

  const handleChangeView = () => {
    const value: ConfiguratorType = configuratorView === "2D" ? "3D" : "2D";
    dispatch(changeСonfiguratorView(value));
  };
  return (
    <div className={s.playerWidgetBottomLeft}>
      <Button
        className={`${s.btn} ${s.btn3d} ${configuratorView === "3D" ? s.active : ""}`}
        iconBefore={<Btn3DIcon />}
        onClick={handleChangeView}
      />
    </div>
  );
};
