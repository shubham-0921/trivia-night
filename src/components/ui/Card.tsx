import { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("rounded-[20px] border border-line bg-bg-raised p-5 card-shadow", className)}
      {...props}
    />
  );
}
