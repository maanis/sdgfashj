import {
  Area, Bar, BarChart, CartesianGrid, ComposedChart, Legend, Line, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";

import type { DailyMetrics, ForecastPoint, HorizonBucket } from "@/lib/api";
import { fmtNum, fmtSigned, londonDateTime, londonTime, shortDate } from "@/lib/format";

const axis = { stroke: "var(--muted-foreground)", fontSize: 11, tickLine: false, axisLine: { stroke: "var(--border)" } } as const;
const grid = <CartesianGrid stroke="var(--grid)" vertical={false} />;
const legendStyle = { fontSize: 12, color: "var(--muted-foreground)", paddingTop: 8 };

function TipBox({ title, rows }: { title: string; rows: [string, string, string?][] }) {
  return (
    <div className="rounded-md border border-border bg-card px-3 py-2 text-xs shadow-sm">
      <p className="mb-1 font-medium text-foreground">{title}</p>
      {rows.map(([k, v, color]) => (
        <div key={k} className="flex items-center justify-between gap-6">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            {color && <span className="inline-block size-2 rounded-full" style={{ background: color }} />}
            {k}
          </span>
          <span className="tabular font-medium text-foreground">{v}</span>
        </div>
      ))}
    </div>
  );
}

export function DailyErrorChart({ data, onSelect, height = 280 }: { data: DailyMetrics[]; onSelect?: (date: string) => void; height?: number }) {
  return (
    <div role="img" aria-label="Daily MAE bars and bias line for January 2026, in MW">
      <ResponsiveContainer width="100%" height={height}>
        <ComposedChart
          data={data}
          margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
          onClick={(s) => { const l = (s as { activeLabel?: string } | null)?.activeLabel; if (l && onSelect) onSelect(l); }}
          style={{ cursor: onSelect ? "pointer" : undefined }}
        >
          {grid}
          <XAxis dataKey="date" {...axis} tickFormatter={shortDate} minTickGap={16} />
          <YAxis {...axis} width={52} tickFormatter={(v) => fmtNum(v)} />
          <ReferenceLine y={0} stroke="var(--muted-foreground)" strokeOpacity={0.5} />
          <Tooltip
            cursor={{ fill: "var(--muted)" }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const d = payload[0]!.payload as DailyMetrics;
              return <TipBox title={shortDate(d.date) + (onSelect ? " · click to open" : "")} rows={[
                ["MAE", `${fmtNum(d.mae)} MW`, "var(--chart-3)"],
                ["Bias", `${fmtSigned(d.bias)} MW`, "var(--series-forecast)"],
              ]} />;
            }}
          />
          <Legend wrapperStyle={legendStyle} iconSize={8} />
          <Bar dataKey="mae" name="MAE (MW)" fill="var(--chart-3)" radius={[2, 2, 0, 0]} maxBarSize={18} />
          <Line dataKey="bias" name="Bias (MW, + = over-forecast)" stroke="var(--series-forecast)" strokeWidth={1.75} dot={{ r: 2 }} connectNulls={false} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

type FPoint = ForecastPoint & { band: [number, number] | null };

export function ForecastChart({ points, height = 360 }: { points: ForecastPoint[]; height?: number }) {
  const data: FPoint[] = points.map((p) => ({ ...p, band: p.band_low != null && p.band_high != null ? [p.band_low, p.band_high] : null }));
  return (
    <div role="img" aria-label="Forecast versus actual wind generation in MW by half-hour, with indicative expected range">
      <ResponsiveContainer width="100%" height={height}>
        <ComposedChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          {grid}
          <XAxis dataKey="startTime" {...axis} tickFormatter={londonTime} interval={3} />
          <YAxis {...axis} width={56} tickFormatter={(v) => fmtNum(v)} />
          <Tooltip
            cursor={{ stroke: "var(--border)" }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const d = payload[0]!.payload as FPoint;
              const rows: [string, string, string?][] = [
                ["Forecast", `${fmtNum(d.forecast)} MW`, "var(--series-forecast)"],
                ["Actual", `${fmtNum(d.actual)} MW`, "var(--series-actual)"],
                ["Error", `${fmtSigned(d.error)} MW`],
              ];
              if (d.band_low != null && d.band_high != null) rows.push(["Expected range", `${fmtNum(d.band_low)}–${fmtNum(d.band_high)}`]);
              if (d.publishTime) rows.push(["Published", londonDateTime(d.publishTime)]);
              if (d.horizon_h != null) rows.push(["Lead time", `${fmtNum(d.horizon_h, 1)} h`]);
              return <TipBox title={`${londonDateTime(d.startTime)} London`} rows={rows} />;
            }}
          />
          <Legend wrapperStyle={legendStyle} iconSize={8} />
          <Area dataKey="band" name="Expected actual range (indicative, from January error distribution)" stroke="none" fill="var(--series-band)" fillOpacity={0.55} connectNulls isAnimationActive={false} />
          <Line dataKey="actual" name="Actual (half-hourly)" stroke="var(--series-actual)" strokeWidth={1.5} dot={false} connectNulls={false} />
          <Line dataKey="forecast" name="Forecast (hourly)" stroke="var(--series-forecast)" strokeWidth={2} dot={{ r: 2, fill: "var(--series-forecast)" }} connectNulls />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

export function HorizonChart({ buckets, height = 260 }: { buckets: HorizonBucket[]; height?: number }) {
  const data = buckets.map((b) => ({ ...b, label: `${b.horizon_from_h}–${b.horizon_to_h}h` }));
  return (
    <div role="img" aria-label="MAE and RMSE by forecast lead-time bucket, in MW">
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barGap={2}>
          {grid}
          <XAxis dataKey="label" {...axis} />
          <YAxis {...axis} width={52} tickFormatter={(v) => fmtNum(v)} />
          <Tooltip
            cursor={{ fill: "var(--muted)" }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const d = payload[0]!.payload as HorizonBucket & { label: string };
              return <TipBox title={`Lead time ${d.label}`} rows={[
                ["MAE", `${fmtNum(d.mae)} MW`, "var(--series-forecast)"],
                ["RMSE", `${fmtNum(d.rmse)} MW`, "var(--chart-4)"],
                ...(d.n != null ? [["Samples", fmtNum(d.n)] as [string, string]] : []),
              ]} />;
            }}
          />
          <Legend wrapperStyle={legendStyle} iconSize={8} />
          <Bar dataKey="mae" name="MAE (MW)" fill="var(--series-forecast)" radius={[2, 2, 0, 0]} maxBarSize={28} />
          <Bar dataKey="rmse" name="RMSE (MW)" fill="var(--chart-4)" radius={[2, 2, 0, 0]} maxBarSize={28} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
