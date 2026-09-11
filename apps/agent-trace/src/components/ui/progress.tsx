import type * as React from "react";

import { cn } from "@/lib/utils";

function Progress({ className, value = 0, ...props }: React.ComponentProps<"div"> & { value?: number }) {
  return (
    <div
      data-slot="progress"
      className={cn("bg-primary/10 relative h-1.5 w-full overflow-hidden rounded-full", className)}
      {...props}
    >
      <div
        className="bg-primary h-full rounded-full transition-all"
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}

export { Progress };
