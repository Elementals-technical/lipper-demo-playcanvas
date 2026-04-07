import { useAttribute } from "@threekit-tools/treble/dist";
import { BtnARIcon } from "../../../assets/img/svg/BtnARIcon";
import { BtnDimentionsIcon } from "../../../assets/img/svg/BtnDimentionsIcon";
import { BtnExplodeIcon } from "../../../assets/img/svg/BtnExplodeIcon";
import { BtnFullScreenIcon } from "../../../assets/img/svg/BtnFullScreenIcon";
import { getConfiguratorView } from "../../../store/slices/configurator/selectors/selectors";
import { useAppSelector } from "../../../store/store";
import Button from "../../Button/Button";
import s from "./PlayerWidgetBottomRight.module.scss";
import { ATTRIBUTE_TYPES } from "@threekit-tools/treble/dist/types";
import { BtnOpenIcon } from "../../../assets/img/svg/BtnOpenIcon";
import { BtnCloseIcon } from "../../../assets/img/svg/BtnCloseIcon";

export const PlayerWidgetBottomRight = () => {
  const configuratorView = useAppSelector(getConfiguratorView);
  const [attrExplode, setAttrExplode] = useAttribute("explode");
  const [attrDimensions, setAttrDimensions] = useAttribute("OnDimensions");
  const [attrOpenClosed, setAttrOpenClosed] = useAttribute("Open/Closed");
  const [attrOpenClosedWindow1, setAttrOpenClosedWindow1] = useAttribute("Open/Closed Window 1");
  const [attrOpenClosedWindow2, setAttrOpenClosedWindow2] = useAttribute("Open/Closed Window 2");

  const handleExplode = () => {
    if (attrExplode && attrExplode.type === ATTRIBUTE_TYPES.BOOLEAN) {
      setAttrExplode(!attrExplode.value);
    }
  };

  const handleDimentions = () => {
    if (attrDimensions && attrDimensions.type === ATTRIBUTE_TYPES.BOOLEAN) {
      setAttrDimensions(!attrDimensions.value);
    }
  };
  const handleOpenClosed = () => {
    if (attrOpenClosed && attrOpenClosed.type === ATTRIBUTE_TYPES.BOOLEAN) {
      setAttrOpenClosed(!attrOpenClosed.value);
    }
  };
  const handleOpenClosedTwo = () => {
    if (attrOpenClosedWindow1 && attrOpenClosedWindow1.type === ATTRIBUTE_TYPES.BOOLEAN) {
      setAttrOpenClosedWindow1(!attrOpenClosedWindow1.value);
    }
    if (attrOpenClosedWindow2 && attrOpenClosedWindow2.type === ATTRIBUTE_TYPES.BOOLEAN) {
      setAttrOpenClosedWindow2(!attrOpenClosedWindow2.value);
    }
  };

  const handleAR = () => {
    const element = document.querySelector('[data-id="arButton"]') as HTMLElement | null;
    if (element) {
      element.click();
    }
  };

  const handleFullScreen = () => {
    const element = document.querySelector('[data-id="BTN_player_full_screen"]') as HTMLElement | null;
    if (element) {
      element.click();
    }
  };

  return (
    <div className={s.playerWidgetBottomRight}>
      {configuratorView === "3D" && (
        <>
          {attrOpenClosed && (
            <Button
              className={`${s.btn} ${attrOpenClosed && attrOpenClosed.type === ATTRIBUTE_TYPES.BOOLEAN && attrOpenClosed.value ? s.active : ""}`}
              iconBefore={
                attrOpenClosed && attrOpenClosed.type === ATTRIBUTE_TYPES.BOOLEAN && attrOpenClosed.value ? (
                  <BtnCloseIcon />
                ) : (
                  <BtnOpenIcon />
                )
              }
              onClick={handleOpenClosed}
            />
          )}
          {attrOpenClosedWindow1 && (
            <Button
              className={`${s.btn} ${attrOpenClosedWindow1 && attrOpenClosedWindow1.type === ATTRIBUTE_TYPES.BOOLEAN && attrOpenClosedWindow1.value ? s.active : ""}`}
              iconBefore={
                attrOpenClosedWindow1 &&
                attrOpenClosedWindow1.type === ATTRIBUTE_TYPES.BOOLEAN &&
                attrOpenClosedWindow1.value ? (
                  <BtnCloseIcon />
                ) : (
                  <BtnOpenIcon />
                )
              }
              onClick={handleOpenClosedTwo}
            />
          )}
          {attrExplode && (
            <Button
              className={`${s.btn} ${attrExplode && attrExplode.type === ATTRIBUTE_TYPES.BOOLEAN && attrExplode.value ? s.active : ""}`}
              iconBefore={<BtnExplodeIcon />}
              onClick={handleExplode}
            />
          )}
          {attrDimensions && (
            <Button
              className={`${s.btn} ${attrDimensions && attrDimensions.type === ATTRIBUTE_TYPES.BOOLEAN && attrDimensions.value ? s.active : ""}`}
              iconBefore={<BtnDimentionsIcon />}
              onClick={handleDimentions}
            />
          )}

          <Button className={s.btn} iconBefore={<BtnARIcon />} onClick={handleAR} />
        </>
      )}
      <Button className={s.btn} iconBefore={<BtnFullScreenIcon />} onClick={handleFullScreen} />
    </div>
  );
};
