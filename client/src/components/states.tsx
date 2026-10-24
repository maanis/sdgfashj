import { AlertTriangle, DatabaseZap, Inbox, RotateCw, WifiOff } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiError } from "@/lib/api";
import { cn } from "@/lib/utils";

export function ErrorPanel({ error, onRetry, className }: { error: unknown; onRetry: () => void; className?: string }) {
  const e = error instanceof ApiError ? error : null;
  const Icon = e?.kind === "network" ? WifiOff : e?.kind === "unavailable" ? DatabaseZap : AlertTriangle;
  const title =
    e?.kind === "unavailable" ? "Data not loaded"
    : e?.kind === "network" ? "API unreachable"
    : e?.kind === "invalid" ? "Unexpected response"
    : e?.status ? `Request failed (HTTP ${e.status})`
    : "Something went wrong";
  return (
    <div role="alert" className={cn("flex flex-col items-start gap-3 rounded-md border border-border bg-card p-4 sm:flex-row sm:items-center", className)}>
      <Icon className="size-4 shrink-0 text-destructive" aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{error instanceof Error ? error.message : String(error)}</p>
      </div>
      <Button variant="outline" size="sm" onClick={onRetry}>
        <RotateCw className="size-3.5" aria-hidden /> Retry
      </Button>
    </div>
  );
}

export function EmptyState({ title, children, className }: { title: string; children?: ReactNode; className?: string }) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-2 rounded-md border border-dashed border-border bg-card px-6 py-12 text-center", className)}>
      <Inbox className="size-5 text-muted-foreground" aria-hidden />
      <p className="text-sm font-medium text-foreground">{title}</p>
      {children && <p className="max-w-sm text-xs text-muted-foreground">{children}</p>}
    </div>
  );
}

export function ChartSkeleton({ height = 280 }: { height?: number }) {
  return <Skeleton className="w-full rounded-md" style={{ height }} aria-label="Loading chart" />;
}

export function Panel({ title, description, actions, children, className }: { title?: ReactNode; description?: ReactNode; actions?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn("rounded-md border border-border bg-card", className)}>
      {(title || actions) && (
        <header className="flex flex-wrap items-start justify-between gap-2 border-b border-border px-4 py-3">
          <div>
            {title && <h2 className="text-sm font-semibold text-foreground">{title}</h2>}
            {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
          </div>
          {actions}
        </header>
      )}
      <div className="p-4">{children}</div>
    </section>
  );
}

export function PageHeader({ title, description, meta }: { title: ReactNode; description?: ReactNode; meta?: ReactNode }) {
  return (
    <div className="flex flex-col gap-1 pb-5">
      <h1 className="text-xl font-semibold tracking-tight text-foreground">{title}</h1>
      {description && <p className="text-sm text-muted-foreground">{description}</p>}
      {meta && <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">{meta}</div>}
    </div>
  );
}
