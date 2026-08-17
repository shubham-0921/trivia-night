"use client";

import { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "primary" | "ghost";
  size?: "lg" | "md" | "sm";
}

export function Button({ variant = "default", size = "md", className, ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "cursor-pointer rounded-full border-2 font-body font-bold transition-all duration-150",
        "hover:-translate-y-px active:translate-y-px active:scale-[0.98]",
        "focus-visible:outline focus-visible:outline-3 focus-visible:outline-accent focus-visible:outline-offset-2",
        "disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none disabled:translate-y-0",
        size === "lg" && "px-8 py-4 text-base",
        size === "md" && "px-5 py-2.5 text-sm",
        size === "sm" && "px-3.5 py-1.5 text-xs",
        variant === "primary" &&
          "border-transparent bg-linear-to-br from-accent to-accent2 text-white pop-shadow hover:brightness-110 hover:-translate-y-0.5",
        variant === "default" && "border-line bg-bg-raised text-ink hover:border-accent",
        variant === "ghost" && "border-line bg-transparent text-ink hover:border-accent shadow-none",
        className
      )}
      {...props}
    />
  );
}
