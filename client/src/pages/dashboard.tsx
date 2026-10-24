import { ArrowRight } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import { DailyErrorChart } from "@/components/charts";
import { KpiTile, MetricRow } from "@/components/metrics";
import { ChartSkeleton, EmptyState, ErrorPanel, PageHeader, Panel } from "@/components/states";
import { Skeleton } from "@/components/ui/skeleton";
import { useAccuracy, useFilters, useForecast } from "@/hooks/use-api";
import { usePageMeta } from "@/hooks/use-page-meta";
import { fmtNum, londonDateTime, longDate, shortDate } from "@/lib/format";
import { toWithSearch } from "@/lib/router-utils";

export function Dashboard() {
  usePageMeta(
    "Dashboard · Wind Forecast Desk",
    "January overview of day-ahead wind forecast accuracy: MAE, RMSE, bias and wMAPE.",
  );
  const { date, cutoff, rangeStart, rangeEnd, meta } = useFilters();
  const navigate = useNavigate();
  const acc = useAccuracy(rangeStart, rangeEnd, cutoff);

  const fc = useForecast(date, cutoff);

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Day-ahead wind forecast performance at the selected decision cutoff."
        meta={
          rangeStart && rangeEnd ? (
            <>
              <span>
                Period{" "}
                <span className="tabular text-foreground">
                  {shortDate(rangeStart)} – {shortDate(rangeEnd)} 2026
                </span>
              </span>
              <span>
                Cutoff <span className="tabular text-foreground">{cutoff}</span> London, D-1
              </span>
              <span>Error = forecast − actual</span>
            </>
          ) : (
            <Skeleton className="h-4 w-64" />
          )
        }
      />

      <div className="flex flex-col gap-4">
        {acc.isError ? (
          <ErrorPanel error={acc.error} onRetry={() => acc.refetch()} />
        ) : (
          <div className="grid grid-cols-2 gap-px overflow-hidden rounded-md border border-border bg-border lg:grid-cols-4">
            {(["mae", "rmse", "bias", "wmape"] as const).map((k) => (
              <KpiTile
                key={k}
                metric={k}
                value={acc.data?.overall[k]}
                loading={!acc.data}
                context={
                  k === "wmape"
                    ? `Mean actual ${fmtNum(acc.data?.overall.mean_actual)} MW`
                    : `n = ${fmtNum(acc.data?.overall.n)}`
                }
              />
            ))}
          </div>
        )}

        <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <Panel
            title="Daily error"
            description="MAE and bias per delivery day. Select a day to open its forecast."
          >
            {acc.isError ? (
              <ErrorPanel error={acc.error} onRetry={() => acc.refetch()} />
            ) : !acc.data ? (
              <ChartSkeleton />
            ) : acc.data.daily.length === 0 ? (
              <EmptyState title="No daily metrics">
                The API returned no daily rows for this period.
              </EmptyState>
            ) : (
              <DailyErrorChart
                data={acc.data.daily}
                onSelect={(d) => navigate(toWithSearch("/forecast", { date: d, cutoff }))}
              />
            )}
          </Panel>

          <Panel
            title="Latest decision"
            description={date ? `Delivery ${longDate(date)}` : undefined}
            actions={
              date && (
                <Link
                  to={toWithSearch("/forecast", { date, cutoff })}
                  className="inline-flex items-center gap-1 rounded-sm text-xs font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  Open forecast <ArrowRight className="size-3.5" aria-hidden />
                </Link>
              )
            }
          >
            {fc.isError ? (
              <ErrorPanel error={fc.error} onRetry={() => fc.refetch()} />
            ) : !fc.data ? (
              <div className="flex flex-col gap-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-24 w-full" />
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <dl className="grid grid-cols-2 gap-y-2 text-xs">
                  <dt className="text-muted-foreground">Decision time</dt>
                  <dd className="tabular text-right text-foreground">
                    {londonDateTime(fc.data.decision_time_utc)} London
                  </dd>
                  <dt className="text-muted-foreground">Cutoff</dt>
                  <dd className="tabular text-right text-foreground">{fc.data.cutoff}</dd>
                  {(
                    [
                      ["Mean forecast", fc.data.summary.mean_forecast],
                      ["Min forecast", fc.data.summary.min_forecast],
                      ["Max forecast", fc.data.summary.max_forecast],
                    ] as const
                  ).map(([l, v]) => (
                    <div key={l} className="contents">
                      <dt className="text-muted-foreground">{l}</dt>
                      <dd className="tabular text-right font-medium text-foreground">
                        {fmtNum(v)}
                        {v != null && (
                          <span className="ml-1 font-normal text-muted-foreground">MW</span>
                        )}
                      </dd>
                    </div>
                  ))}
                </dl>
                <div className="[&_dl]:lg:grid-cols-2">
                  <MetricRow metrics={fc.data.accuracy} keys={["mae", "rmse", "bias", "wmape"]} />
                </div>
              </div>
            )}
          </Panel>
        </div>

        <Panel title="Data coverage" description="As reported by the API.">
          {meta.isError ? (
            <ErrorPanel error={meta.error} onRetry={() => meta.refetch()} />
          ) : !meta.data ? (
            <Skeleton className="h-12 w-full" />
          ) : (
            <dl className="grid gap-4 text-xs sm:grid-cols-3">
              <div>
                <dt className="text-muted-foreground">Actuals</dt>
                <dd className="tabular mt-1 text-foreground">
                  {fmtNum(meta.data.actuals.rows)} rows · {londonDateTime(meta.data.actuals.from)} –{" "}
                  {londonDateTime(meta.data.actuals.to)}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Forecasts</dt>
                <dd className="tabular mt-1 text-foreground">
                  {fmtNum(meta.data.forecasts.rows)} rows · published{" "}
                  {londonDateTime(meta.data.forecasts.published_from)} –{" "}
                  {londonDateTime(meta.data.forecasts.published_to)}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Error definition</dt>
                <dd className="mt-1 text-foreground">{meta.data.error_definition || "-"}</dd>
              </div>
            </dl>
          )}
        </Panel>
      </div>
    </>
  );
}
