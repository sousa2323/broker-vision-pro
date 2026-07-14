import { Hexagon } from "lucide-react";
import { cn } from "@/lib/utils";

export function UbrokerLogo({ className, mark = false }: { className?: string; mark?: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 font-display text-xl tracking-tight",
        className,
      )}
    >
      <span className="grid h-7 w-7 place-items-center rounded-md bg-brand text-brand-foreground">
        <Hexagon className="h-4 w-4" strokeWidth={2.5} />
      </span>
      {!mark && <span>Ubroker</span>}
    </span>
  );
}
