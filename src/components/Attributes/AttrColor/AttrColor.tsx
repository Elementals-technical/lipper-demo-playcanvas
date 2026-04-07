import { useAttribute } from "@threekit-tools/treble/dist";
import s from "./AttrColor.module.scss";
import { ATTRIBUTE_TYPES } from "@threekit-tools/treble/dist/types";

export const AttrColor = () => {
  const [attribute, setAttribute] = useAttribute("Set Color");
  console.log("attribute --- ==== ", attribute);
  if (attribute === undefined) return null;
  return (
    <div className={s.attrColors}>
      <div className={s.label}>Product Color</div>
      <div className={s.values}>
        {attribute &&
          attribute.type === ATTRIBUTE_TYPES.STRING &&
          attribute.values.map((value) => {
            const isActive = attribute.value === value.value;
            return (
              <div className={`${s.value} ${isActive ? s.active : ""}`} onClick={() => value.handleSelect()}>
                <div className={s.color} style={{ background: value.value.toLowerCase() }}></div>
              </div>
            );
          })}
      </div>
    </div>
  );
};
