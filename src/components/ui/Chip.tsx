import { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  selected?: boolean;
}

export function Chip({ selected, className, ...props }: ChipProps) {
  return (
    <button
      type="button"
      className={cn(
        "select-none rounded-full border border-line bg-bg-sunken px-3 py-1.5 text-sm transition-all duration-150",
        "hover:border-accent",
        selected && "border-accent bg-accent text-white",
        className
      )}
      {...props}
    />
  );
}
