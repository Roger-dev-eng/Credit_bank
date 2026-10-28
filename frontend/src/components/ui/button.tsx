import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "../../utils/cn";
const variants = cva(
  "inline-flex items-center justify-center gap-2 rounded-lg text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:pointer-events-none disabled:opacity-50 px-4 py-2.5",
  {
    variants: {
      variant: {
        default: "bg-primary text-white hover:bg-[#2a3e6e]",
        outline: "border border-slate-200 bg-white hover:bg-slate-50",
        destructive: "bg-red-50 text-red-800 hover:bg-red-100",
      },
    },
    defaultVariants: { variant: "default" },
  },
);
export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof variants> {
  asChild?: boolean;
}
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, asChild = false, ...props }, ref) => {
    const C = asChild ? Slot : "button";
    return (
      <C
        className={cn(variants({ variant, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";
