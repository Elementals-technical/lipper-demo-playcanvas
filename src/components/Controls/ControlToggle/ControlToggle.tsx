import { ControlToggleButton } from "../ControlToggleButton/ControlToggleButton";
import s from "./ControlToggle.module.scss";

/** Visible labels, switch state, and click handler supplied by the caller. */
type ControlToggleProps = {
  controlLabel: string;
  toggleLabel: string;
  value: boolean;
  onChange: () => void;
};

/** Renders an attribute label and its action label alongside a switch. */
export const ControlToggle = ({ controlLabel, toggleLabel, value, onChange }: ControlToggleProps) => (
  <div className={s.row}>
    <span className={s.label}>{controlLabel}</span>
    <div className={s.actionToggle}>
      <span className={s.actionLabel}>{toggleLabel}</span>
      <ControlToggleButton controlLabel={`${controlLabel} ${toggleLabel}`} value={value} onChange={onChange} />
    </div>
  </div>
);
