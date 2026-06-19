import * as React from "react";
import { cn } from "@/lib/utils";

export function Badge({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full bg-gradient-to-r from-[#FFF2E7] via-[#FFF7F0] to-[#FFE8CF] px-3 py-1 text-xs font-semibold text-[#B15A2D] shadow-sm ring-1 ring-[#F4DFD2]",
        className
      )}
      {...props}
    />
  );
}
