import { PrimaryButton, type ButtonVariant } from "./PrimaryButton";
import type { ComponentProps } from "react";

type Props = Omit<ComponentProps<typeof PrimaryButton>, "variant"> & {
  variant?: ButtonVariant;
};

export function GlassButton({ variant = "secondary", ...props }: Props) {
  return <PrimaryButton variant={variant} {...props} />;
}
