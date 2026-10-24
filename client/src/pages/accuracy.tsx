import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import { CutoffSelect, DateInput } from "@/components/app-shell";
import { DailyErrorChart, HorizonChart } from "@/components/charts";
import { METRIC_INFO, formatMetric } from "@/components/metrics";
import { ChartSkeleton, EmptyState, ErrorPanel, PageHeader, Panel } from "@/components/states";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAccuracy, useFilters, useHorizon } from "@/hooks/use-api";
import { usePageMeta } from "@/hooks/use-page-meta";
import type { DailyMetrics, Metrics } from "@/lib/api";
import { isValidDate } from "@/lib/filters";
import { fmtNum, shortDate } from "@/lib/format";
import { interpretBias } from "@/lib/interpretation";
import { toWithSearch } from "@/lib/router-utils";

const OVERALL_KEYS: (keyof Metrics)[] = [
  "mae",
  "rmse",
  "bias",
  "wmape",
  "p10_error",
  "p50_error",
  "p90_error",
  "p95_abs_error",
  "mean_actual",
  "n",
];
const DAILY_COLS: (keyof DailyMetrics)[] = [
  "date",
  "mae",
  "rmse",
  "bias",
  "wmape",
  "p90_error",
  "n",
];

export function AccuracyPage() {
  usePageMeta(
    "Accuracy · Wind Forecast Desk",
    "Historical wind forecast accuracy by day and lead time, with procurement interpretation.",
  );
  const [params] = useSearchParams();
  const search = {
    start: isValidDate(params.get("start")) ? params.get("start")! : undefined,
    end: isValidDate(params.get("end")) ? params.get("end")! : undefined,
  };
  const { cutoff, rangeStart, rangeEnd, setCutoff, setSearch } = useFilters();
  let start = search.start ?? rangeStart;
  let end = search.end ?? rangeEnd;
  if (start && end && start > end) [start, end] = [end, start];

  const acc = useAccuracy(start, end, cutoff);
  const hz = useHorizon(start, end, cutoff, 6);

  const [sort, setSort] = useState<{ key: keyof DailyMetrics; dir: "asc" | "desc" }>({
    key: "date",
    dir: "asc",
  });
  const rows = useMemo(() => {
    const r = [...(acc.data?.daily ?? [])];
    r.sort((a, b) => {
      const av = a[sort.key],
        bv = b[sort.key];
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      const c =
        typeof av === "string" ? av.localeCompare(bv as string) : (av as number) - (bv as number);
      return sort.dir === "asc" ? c : -c;
    });
    return r;
  }, [acc.data, sort]);

  const toggle = (key: keyof DailyMetrics) =>
    setSort((s) =>
      s.key === key
        ? { key, dir: s.dir === "asc" ? "desc" : "asc" }
        : { key, dir: key === "date" ? "asc" : "desc" },
    );

  return (
    <>
      <PageHeader
        title="Accuracy"
        description="How large and how directional forecast errors were across the selected period."
      />

      <div className="mb-4 flex flex-wrap items-end gap-4 rounded-md border border-border bg-card px-4 py-3">
        <div className="flex flex-col gap-1">
          <Label htmlFor="acc-start" className="text-xs text-muted-foreground">
            Start
          </Label>
          <DateInput
            id="acc-start"
            value={start}
            max={end}
            onChange={(v) => setSearch({ start: v })}
          />
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="acc-end" className="text-xs text-muted-foreground">
            End
          </Label>
          <DateInput id="acc-end" value={end} min={start} onChange={(v) => setSearch({ end: v })} />
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="acc-cutoff" className="text-xs text-muted-foreground">
            Cutoff (London, D-1)
          </Label>
          <CutoffSelect id="acc-cutoff" value={cutoff} onChange={setCutoff} />
        </div>
      </div>

      {acc.isError ? (
        <ErrorPanel error={acc.error} onRetry={() => acc.refetch()} className="mb-4" />
      ) : null}

      <div className="flex flex-col gap-4">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <Panel
            title="Overall metrics"
            description={
              start && end
                ? `${shortDate(start)} – ${shortDate(end)} 2026 · cutoff ${cutoff}`
                : undefined
            }
          >
            <Table className="tabular text-xs">
              <caption className="sr-only">Overall accuracy metrics</caption>
              <TableHeader>
                <TableRow>
                  <TableHead scope="col">Metric</TableHead>
                  <TableHead scope="col" className="text-right">
                    Value
                  </TableHead>
                  <TableHead scope="col" className="hidden sm:table-cell">
                    Definition
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {OVERALL_KEYS.map((k) => (
                  <TableRow key={k}>
                    <TableHead scope="row" className="h-auto py-1.5 font-medium text-foreground">
                      {METRIC_INFO[k].label}
                    </TableHead>
                    <TableCell className="py-1.5 text-right font-medium">
                      {acc.data ? (
                        <>
                          {formatMetric(k, acc.data.overall[k])}
                          {METRIC_INFO[k].unit && acc.data.overall[k] != null && (
                            <span className="ml-1 font-normal text-muted-foreground">MW</span>
                          )}
                        </>
                      ) : (
                        <Skeleton className="ml-auto h-3.5 w-12" />
                      )}
                    </TableCell>
                    <TableCell className="hidden py-1.5 text-muted-foreground sm:table-cell">
                      {METRIC_INFO[k].help}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Panel>

          <Panel
            title="Procurement interpretation"
            description="Indicative only; derived from the values on this page."
          >
            {!acc.data ? (
              <div className="flex flex-col gap-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            ) : (
              <div className="flex flex-col gap-3 text-sm leading-relaxed text-foreground">
                {interpretBias(acc.data.overall).map((p, i) => (
                  <p key={i} className={i === 0 ? "" : "text-muted-foreground"}>
                    {p}
                  </p>
                ))}
              </div>
            )}
          </Panel>
        </div>

        <Panel title="Daily MAE and bias" description="Select a day to open its forecast.">
          {!acc.data ? (
            <ChartSkeleton />
          ) : acc.data.daily.length === 0 ? (
            <EmptyState title="No daily metrics" />
          ) : (
            <DailyErrorChartLinked data={acc.data.daily} cutoff={cutoff} />
          )}
        </Panel>

        <Panel title="Error by forecast lead time" description="Error grows with lead time">
          {hz.isError ? (
            <ErrorPanel error={hz.error} onRetry={() => hz.refetch()} />
          ) : !hz.data ? (
            <ChartSkeleton height={260} />
          ) : hz.data.buckets.length === 0 ? (
            <EmptyState title="No lead-time buckets">
              The API returned no horizon data for this period.
            </EmptyState>
          ) : (
            <HorizonChart buckets={hz.data.buckets} />
          )}
        </Panel>

        <Panel title="Daily error table" description="Select a column header to sort.">
          {!acc.data ? (
            <Skeleton className="h-48 w-full" />
          ) : rows.length === 0 ? (
            <EmptyState title="No daily rows" />
          ) : (
            <div className="max-h-[480px] overflow-auto">
              <Table className="tabular text-xs">
                <caption className="sr-only">Daily accuracy metrics, sortable</caption>
                <TableHeader className="sticky top-0 bg-card">
                  <TableRow>
                    {DAILY_COLS.map((c) => {
                      const active = sort.key === c;
                      const Icon = !active ? ArrowUpDown : sort.dir === "asc" ? ArrowUp : ArrowDown;
                      return (
                        <TableHead
                          key={c}
                          scope="col"
                          className={c === "date" ? "" : "text-right"}
                          aria-sort={
                            active ? (sort.dir === "asc" ? "ascending" : "descending") : "none"
                          }
                        >
                          <button
                            type="button"
                            onClick={() => toggle(c)}
                            className={`inline-flex items-center gap-1 rounded-sm hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${active ? "text-foreground" : ""}`}
                          >
                            {c === "date" ? "Date" : METRIC_INFO[c as keyof Metrics].label}
                            {c !== "date" && METRIC_INFO[c as keyof Metrics].unit && (
                              <span className="font-normal text-muted-foreground">(MW)</span>
                            )}
                            <Icon className="size-3" aria-hidden />
                          </button>
                        </TableHead>
                      );
                    })}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r) => (
                    <TableRow key={r.date}>
                      <TableCell className="py-1.5 font-medium">
                        <Link
                          to={toWithSearch("/forecast", { date: r.date, cutoff })}
                          className="text-primary hover:underline"
                        >
                          {shortDate(r.date)}
                        </Link>
                      </TableCell>
                      {DAILY_COLS.slice(1).map((c) => (
                        <TableCell key={c} className="py-1.5 text-right">
                          {c === "n"
                            ? fmtNum(r.n)
                            : formatMetric(c as keyof Metrics, r[c as keyof Metrics])}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </Panel>
      </div>
    </>
  );
}

function DailyErrorChartLinked({
  data,
  cutoff,
}: {
  data: DailyMetrics[];
  cutoff: string | undefined;
}) {
  const navigate = useNavigate();
  return (
    <DailyErrorChart
      data={data}
      onSelect={(d) => navigate(toWithSearch("/forecast", { date: d, cutoff }))}
    />
  );
}
