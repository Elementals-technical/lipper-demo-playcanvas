import clsx from "clsx";
import { memo } from "react";
import s from "./Button.module.scss";
import { ButtonProps } from "./types";

const Button = ({
  children,
  className,
  iconBefore,
  iconAfter,
  variant = "primary",
  disabled,
  ...rest
}: ButtonProps) => {
  return (
    <button
      disabled={disabled}
      className={clsx(s.wrap, s[variant], "focus-primary", { [s.disabled]: disabled }, className)}
      {...rest}
    >
      <div className={s.contentWrap}>
        {iconBefore}
        {children}
        {iconAfter}
      </div>
    </button>
  );
};
Button.displayName = "Button";

export default memo(Button);
