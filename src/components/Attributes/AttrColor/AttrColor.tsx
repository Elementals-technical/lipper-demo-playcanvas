import { useState } from "react";
import s from "./AttrColor.module.scss";

const COLORS = [
  { label: "White", value: "white" },
  { label: "Black", value: "black" },
  { label: "Gray", value: "gray" },
  { label: "Brown", value: "brown" },
  { label: "Tan", value: "tan" },
];

export const AttrColor = () => {
  const [selected, setSelected] = useState(COLORS[0].value);

  return (
    <div className={s.attrColors}>
      <div className={s.label}>Product Color</div>
      <div className={s.values}>
        {COLORS.map((color) => {
          const isActive = selected === color.value;
          return (
            <div
              key={color.value}
              className={`${s.value} ${isActive ? s.active : ""}`}
              onClick={() => setSelected(color.value)}
            >
              <div className={s.color} style={{ background: color.value }}></div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
