import { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export function Pill({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full bg-accent-soft px-3 py-1 text-xs font-extrabold uppercase tracking-wider text-accent",
        className
      )}
      {...props}
    />
  );
}

export function Eyebrow({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn(
        "mb-2 inline-block rounded-full bg-accent-soft px-3 py-1 text-xs font-extrabold uppercase tracking-[0.14em] text-accent",
        className
      )}
      {...props}
    />
  );
}
