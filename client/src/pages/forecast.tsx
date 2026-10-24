import { ForecastChart } from "@/components/charts";
import { MetricRow } from "@/components/metrics";
import { ChartSkeleton, EmptyState, ErrorPanel, PageHeader, Panel } from "@/components/states";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useFilters, useForecast } from "@/hooks/use-api";
import { usePageMeta } from "@/hooks/use-page-meta";
import { fmtNum, fmtSigned, londonDateTime, londonTime, longDate } from "@/lib/format";

export function ForecastPage() {
  usePageMeta(
    "Day Forecast · Wind Forecast Desk",
    "Day-ahead wind forecast versus actual generation for a single delivery day.",
  );
  const { date, cutoff } = useFilters();
  const fc = useForecast(date, cutoff);
  const d = fc.data;
  const hasForecast = !!d && d.points.some((p) => p.forecast != null);

  return (
    <>
      <PageHeader
        title={d ? <>Forecast available at <span className="tabular">{londonDateTime(d.decision_time_utc)}</span> for delivery on {longDate(d.date)}</> : <Skeleton className="h-7 w-96 max-w-full" />}
        description="Latest forecasts published before the cutoff, compared with measured generation."
        meta={d && (
          <>
            <span>Cutoff <span className="tabular text-foreground">{d.cutoff}</span> Europe/London, D-1</span>
            <span>Published <span className="tabular text-foreground">{londonDateTime(d.forecast_published_from)} – {londonDateTime(d.forecast_published_to)}</span></span>
          </>
        )}
      />

      {fc.isError ? <ErrorPanel error={fc.error} onRetry={() => fc.refetch()} /> : (
        <div className={fc.isFetching && d ? "flex flex-col gap-4 opacity-70 transition-opacity" : "flex flex-col gap-4 transition-opacity"}>
          <dl className="grid grid-cols-3 gap-px overflow-hidden rounded-md border border-border bg-border">
            {([["Mean forecast", d?.summary.mean_forecast], ["Min forecast", d?.summary.min_forecast], ["Max forecast", d?.summary.max_forecast]] as const).map(([l, v]) => (
              <div key={l} className="bg-card px-4 py-3">
                <dt className="text-xs text-muted-foreground">{l}</dt>
                <dd className="tabular mt-1 text-lg font-semibold text-foreground">
                  {d ? fmtNum(v) : <Skeleton className="h-6 w-16" />}
                  {d && v != null && <span className="ml-1 text-xs font-normal text-muted-foreground">MW</span>}
                </dd>
              </div>
            ))}
          </dl>

          <Panel title="Forecast vs actual" description="Forecast is hourly; actuals are half-hourly. Times in Europe/London.">
            {!d ? <ChartSkeleton height={360} />
              : !hasForecast ? <EmptyState title="No usable forecast">No forecast published before this cutoff covers {longDate(d.date)}. Try an earlier date or a later cutoff.</EmptyState>
              : <ForecastChart points={d.points} />}
          </Panel>

          <MetricRow metrics={d?.accuracy} loading={!d} keys={["mae", "rmse", "bias", "wmape", "p10_error", "p90_error"]} />

          {d && d.points.length > 0 && (
            <Panel title="Interval data" description={`${d.points.length} intervals · error = forecast − actual`}>
              <div className="max-h-[420px] overflow-auto">
                <Table className="tabular text-xs">
                  <caption className="sr-only">Forecast, actual and error by interval</caption>
                  <TableHeader className="sticky top-0 bg-card">
                    <TableRow>
                      <TableHead scope="col">Time</TableHead>
                      <TableHead scope="col" className="text-right">Forecast (MW)</TableHead>
                      <TableHead scope="col" className="text-right">Actual (MW)</TableHead>
                      <TableHead scope="col" className="text-right">Error (MW)</TableHead>
                      <TableHead scope="col" className="text-right">Published</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {d.points.map((p) => (
                      <TableRow key={p.startTime}>
                        <TableCell className="py-1.5 font-medium">{londonTime(p.startTime)}</TableCell>
                        <TableCell className="py-1.5 text-right">{fmtNum(p.forecast)}</TableCell>
                        <TableCell className="py-1.5 text-right">{fmtNum(p.actual)}</TableCell>
                        <TableCell className="py-1.5 text-right">{fmtSigned(p.error)}</TableCell>
                        <TableCell className="py-1.5 text-right text-muted-foreground">{londonDateTime(p.publishTime)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Panel>
          )}
        </div>
      )}
    </>
  );
}
