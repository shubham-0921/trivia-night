import { cn } from "@/lib/cn";

export function TeamDot({ color, className }: { color: string; className?: string }) {
  return (
    <span
      className={cn("inline-block h-2.5 w-2.5 flex-shrink-0 rounded-full", className)}
      style={{ background: `var(${color})` }}
    />
  );
}
