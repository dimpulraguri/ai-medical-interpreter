"use client";

import * as React from "react";
import { cn } from "@/lib/cn";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  function Input(props, ref) {
    return (
      <input
        ref={ref}
        className={cn(
          "w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-brand-300 focus:ring-2 dark:border-slate-800 dark:bg-slate-950",
          props.className
        )}
        {...props}
      />
    );
  }
);
