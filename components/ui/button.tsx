import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-semibold transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-[#FFB26B] text-white shadow-[0_14px_40px_rgba(255,178,107,0.24)] hover:bg-[#f2924a] hover:shadow-[0_18px_45px_rgba(255,178,107,0.28)]",
        secondary:
          "bg-[#FEF3EC] text-[#4A5565] shadow-sm hover:bg-[#F7E8DB]",
        outline:
          "border border-[#E9E2D9] bg-white text-[#475569] shadow-sm hover:border-[#FFD0A6] hover:bg-[#FEF6EE]",
        ghost: "bg-transparent text-[#475569] hover:bg-[#F7F2EC]",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90"
      },
      size: {
        default: "h-11 px-6",
        sm: "h-9 px-4",
        icon: "h-11 w-11"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  }
);
Button.displayName = "Button";
