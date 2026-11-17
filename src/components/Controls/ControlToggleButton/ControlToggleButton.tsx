import clsx from "clsx";
import s from "./ControlToggleButton.module.scss";

/** External state, accessible label, and click handler for the switch. */
type ControlToggleButtonProps = {
  controlLabel: string;
  value: boolean;
  onChange: () => void;
};

/** Renders a switch whose checked state is supplied by its caller. */
export const ControlToggleButton = ({ controlLabel, value, onChange }: ControlToggleButtonProps) => (
  <button
    type="button"
    role="switch"
    aria-label={controlLabel}
    aria-checked={value}
    className={clsx(s.toggle, value && s.toggleOn)}
    onClick={onChange}
  >
    <span className={s.toggleThumb} />
  </button>
);
