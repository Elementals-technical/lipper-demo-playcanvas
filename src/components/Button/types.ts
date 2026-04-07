import { ReactNode } from "react";
import { BUTTON_VARIANTS } from "./constants";
import { FCProps } from "../../types/global.types";

export type ButtonVariant = (typeof BUTTON_VARIANTS)[number];

export type ButtonProps = FCProps<{
  variant?: ButtonVariant;
  asChild?: boolean;
  iconBefore?: ReactNode;
  iconAfter?: ReactNode;
}> &
  React.ComponentProps<"button">;
