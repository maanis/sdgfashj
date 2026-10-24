import { ArrowDownRight, ArrowUpRight, Info, Minus } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { Metrics } from "@/lib/api";
import { fmtNum, fmtPct, fmtSigned } from "@/lib/format";

export const METRIC_INFO = {
  mae: { label: "MAE", unit: "MW", help: "Mean absolute error: the typical size of a miss, ignoring direction." },
  rmse: { label: "RMSE", unit: "MW", help: "Root mean squared error: like MAE but penalises large misses more heavily." },
  bias: { label: "Bias", unit: "MW", help: "Mean of forecast minus actual. Positive means forecasts overstate wind." },
  wmape: { label: "wMAPE", unit: "", help: "Total absolute error divided by total actual generation." },
  p10_error: { label: "P10 error", unit: "MW", help: "10% of errors are below this signed value (deep under-forecasts)." },
  p50_error: { label: "P50 error", unit: "MW", help: "Median signed error." },
  p90_error: { label: "P90 error", unit: "MW", help: "90% of errors are below this signed value; the over-forecast tail." },
  p95_abs_error: { label: "P95 |error|", unit: "MW", help: "95% of misses are smaller than this in absolute terms." },
  mean_actual: { label: "Mean actual", unit: "MW", help: "Average measured wind generation over the period." },
  n: { label: "Samples", unit: "", help: "Number of matched forecast/actual intervals." },
} as const satisfies Record<keyof Metrics, { label: string; unit: string; help: string }>;

export function formatMetric(key: keyof Metrics, v: number | null | undefined): string {
  if (key === "wmape") return fmtPct(v);
  if (key === "bias" || key.endsWith("_error") && key !== "p95_abs_error") return fmtSigned(v);
  return fmtNum(v);
}

export function InfoTip({ text, label }: { text: string; label: string }) {
  return (
    <Tooltip>
      <TooltipTrigger
        className="inline-flex rounded-sm text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label={`About ${label}`}
      >
        <Info className="size-3.5" aria-hidden />
      </TooltipTrigger>
      <TooltipContent className="max-w-60 bg-foreground text-background">{text}</TooltipContent>
    </Tooltip>
  );
}

export function BiasDirection({ value }: { value: number | null | undefined }) {
  if (value == null) return null;
  const Icon = value > 0 ? ArrowUpRight : value < 0 ? ArrowDownRight : Minus;
  const text = value > 0 ? "Over-forecast" : value < 0 ? "Under-forecast" : "No bias";
  return (
    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
      <Icon className="size-3.5" aria-hidden /> {text}
    </span>
  );
}

export function KpiTile({ metric, value, context, loading }: { metric: "mae" | "rmse" | "bias" | "wmape"; value: number | null | undefined; context?: string; loading?: boolean }) {
  const info = METRIC_INFO[metric];
  return (
    <div className="flex flex-col gap-2 bg-card px-4 py-3.5">
      <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        {info.label}
        <InfoTip text={info.help} label={info.label} />
      </div>
      {loading ? (
        <Skeleton className="h-7 w-24" />
      ) : (
        <div className="flex items-baseline gap-1">
          <span className="tabular text-2xl font-semibold tracking-tight text-foreground">{formatMetric(metric, value)}</span>
          {info.unit && value != null && <span className="text-xs text-muted-foreground">{info.unit}</span>}
        </div>
      )}
      <div className="min-h-4 text-xs text-muted-foreground">
        {metric === "bias" && !loading ? <BiasDirection value={value} /> : context}
      </div>
    </div>
  );
}

export function MetricRow({ metrics, keys, loading }: { metrics: Metrics | undefined; keys: (keyof Metrics)[]; loading?: boolean }) {
  return (
    <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-md border border-border bg-border sm:grid-cols-3 lg:grid-cols-6">
      {keys.map((k) => (
        <div key={k} className="bg-card px-3 py-2.5">
          <dt className="flex items-center gap-1 text-xs text-muted-foreground">
            {METRIC_INFO[k].label} <InfoTip text={METRIC_INFO[k].help} label={METRIC_INFO[k].label} />
          </dt>
          <dd className="tabular mt-1 text-sm font-semibold text-foreground">
            {loading ? <Skeleton className="h-4 w-14" /> : (
              <>
                {formatMetric(k, metrics?.[k])}
                {METRIC_INFO[k].unit && metrics?.[k] != null && <span className="ml-1 text-xs font-normal text-muted-foreground">{METRIC_INFO[k].unit}</span>}
              </>
            )}
          </dd>
        </div>
      ))}
    </dl>
  );
}
