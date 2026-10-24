/* eslint-disable @typescript-eslint/no-explicit-any */
// Centralized REST client for the Wind Forecast backend. No mock data, no fallbacks.
export const API_BASE_URL: string =
  (import.meta.env["VITE_API_BASE_URL"] as string | undefined)?.replace(/\/$/, "") ||
  "https://YOUR-BACKEND.vercel.app";

export type Num = number | null;

export interface Metrics {
  n: Num;
  mae: Num;
  rmse: Num;
  bias: Num;
  wmape: Num;
  p10_error: Num;
  p50_error: Num;
  p90_error: Num;
  p95_abs_error: Num;
  mean_actual: Num;
}

export interface MetaResponse {
  default_cutoff: string;
  default_range: { start: string; end: string };
  actuals: { rows: number; from: string | null; to: string | null };
  forecasts: { rows: number; published_from: string | null; published_to: string | null };
  error_definition: string;
}

export interface ForecastPoint {
  startTime: string;
  forecast: Num;
  actual: Num;
  error: Num;
  band_low: Num;
  band_high: Num;
  publishTime: string | null;
  horizon_h: Num;
}

export interface ForecastResponse {
  date: string;
  cutoff: string;
  decision_time_utc: string;
  forecast_published_from: string | null;
  forecast_published_to: string | null;
  summary: { mean_forecast: Num; min_forecast: Num; max_forecast: Num };
  accuracy: Metrics;
  points: ForecastPoint[];
}

export interface DailyMetrics extends Metrics {
  date: string;
}

export interface AccuracyResponse {
  overall: Metrics;
  daily: DailyMetrics[];
}

export interface HorizonBucket extends Partial<Metrics> {
  horizon_from_h: number;
  horizon_to_h: number;
}

export interface HorizonResponse {
  buckets: HorizonBucket[];
}

export type ApiErrorKind = "http" | "unavailable" | "network" | "invalid";

export class ApiError extends Error {
  constructor(
    public kind: ApiErrorKind,
    message: string,
    public status?: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

const METRIC_KEYS: (keyof Metrics)[] = [
  "n",
  "mae",
  "rmse",
  "bias",
  "wmape",
  "p10_error",
  "p50_error",
  "p90_error",
  "p95_abs_error",
  "mean_actual",
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const isObj = (v: unknown): v is any => typeof v === "object" && v !== null && !Array.isArray(v);
const num = (v: unknown): Num => (typeof v === "number" && Number.isFinite(v) ? v : null);

function invalid(what: string): never {
  throw new ApiError("invalid", `Unexpected response shape: ${what}`);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toMetrics(v: any): Metrics {
  if (!isObj(v)) invalid("metrics object missing");
  const m = {} as Record<keyof Metrics, Num>;
  for (const k of METRIC_KEYS) m[k] = num(v[k]);
  return m;
}

async function get(
  path: string,
  params: Record<string, string | number>,
  signal?: AbortSignal,
): Promise<unknown> {
  const qs = new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)])).toString();
  const url = `${API_BASE_URL}${path}${qs ? `?${qs}` : ""}`;
  let res: Response;
  try {
    res = await fetch(url, { signal: signal ?? null, headers: { Accept: "application/json" } });
  } catch (e) {
    if ((e as Error).name === "AbortError") throw e;
    throw new ApiError(
      "network",
      "Could not reach the forecast API. Check your connection or the API URL.",
    );
  }
  if (res.status === 503) {
    throw new ApiError(
      "unavailable",
      "Data not loaded: the backend is running but its datasets are not available yet.",
      503,
    );
  }
  if (!res.ok) {
    let detail = "";
    try {
      const body = await res.json();
      detail =
        isObj(body) && (body.detail || body.error || body.message)
          ? String(body.detail ?? body.error ?? body.message)
          : "";
    } catch {
      /* ignore */
    }
    throw new ApiError("http", detail || `Request failed with HTTP ${res.status}.`, res.status);
  }
  try {
    return await res.json();
  } catch {
    invalid("body is not JSON");
  }
}

export async function fetchMeta(signal?: AbortSignal): Promise<MetaResponse> {
  const d = await get("/api/meta", {}, signal);
  if (!isObj(d) || typeof d.default_cutoff !== "string" || !isObj(d.default_range)) invalid("meta");
  const a: any = isObj(d.actuals) ? d.actuals : {};
  const f: any = isObj(d.forecasts) ? d.forecasts : {};
  const str = (v: unknown) => (typeof v === "string" ? v : null);
  return {
    default_cutoff: d.default_cutoff,
    default_range: { start: String(d.default_range.start), end: String(d.default_range.end) },
    actuals: { rows: num(a.rows) ?? 0, from: str(a.from), to: str(a.to) },
    forecasts: {
      rows: num(f.rows) ?? 0,
      published_from: str(f.published_from),
      published_to: str(f.published_to),
    },
    error_definition: typeof d.error_definition === "string" ? d.error_definition : "",
  };
}

export async function fetchForecast(
  date: string,
  cutoff: string,
  signal?: AbortSignal,
): Promise<ForecastResponse> {
  const d = await get("/api/forecast", { date, cutoff }, signal);
  if (!isObj(d) || !Array.isArray(d.points) || typeof d.decision_time_utc !== "string")
    invalid("forecast");
  const s: any = isObj(d.summary) ? d.summary : {};
  const str = (v: unknown) => (typeof v === "string" ? v : null);
  return {
    date: String(d.date ?? date),
    cutoff: String(d.cutoff ?? cutoff),
    decision_time_utc: d.decision_time_utc,
    forecast_published_from: str(d.forecast_published_from),
    forecast_published_to: str(d.forecast_published_to),
    summary: {
      mean_forecast: num(s.mean_forecast),
      min_forecast: num(s.min_forecast),
      max_forecast: num(s.max_forecast),
    },
    accuracy: isObj(d.accuracy) ? toMetrics(d.accuracy) : toMetrics({}),
    points: d.points
      .filter(isObj)
      .filter((p: any) => typeof p.startTime === "string")
      .map((p: any) => ({
        startTime: p.startTime as string,
        forecast: num(p.forecast),
        actual: num(p.actual),
        error: num(p.error),
        band_low: num(p.band_low),
        band_high: num(p.band_high),
        publishTime: str(p.publishTime),
        horizon_h: num(p.horizon_h),
      })),
  };
}

export async function fetchAccuracy(
  start: string,
  end: string,
  cutoff: string,
  signal?: AbortSignal,
): Promise<AccuracyResponse> {
  const d = await get("/api/accuracy", { start, end, cutoff }, signal);
  if (!isObj(d) || !isObj(d.overall)) invalid("accuracy");
  let daily: DailyMetrics[] = [];
  if (Array.isArray(d.daily)) {
    daily = d.daily
      .filter(isObj)
      .filter((r: any) => typeof r.date === "string")
      .map((r: any) => ({ date: r.date as string, ...toMetrics(r) }));
  } else if (isObj(d.daily)) {
    daily = Object.entries(d.daily)
      .filter(([, v]) => isObj(v))
      .map(([date, v]) => ({ date, ...toMetrics(v) }));
  }
  daily.sort((a, b) => a.date.localeCompare(b.date));
  return { overall: toMetrics(d.overall), daily };
}

export async function fetchHorizon(
  start: string,
  end: string,
  cutoff: string,
  bucketHours: number,
  signal?: AbortSignal,
): Promise<HorizonResponse> {
  const d = await get(
    "/api/accuracy/horizon",
    { start, end, cutoff, bucket_hours: bucketHours },
    signal,
  );
  if (!isObj(d) || !Array.isArray(d.buckets)) invalid("horizon");
  return {
    buckets: d.buckets
      .filter(isObj)
      .filter((b: any) => num(b.horizon_from_h) !== null && num(b.horizon_to_h) !== null)
      .map((b: any) => {
        const out: HorizonBucket = {
          horizon_from_h: b.horizon_from_h as number,
          horizon_to_h: b.horizon_to_h as number,
        };
        for (const k of METRIC_KEYS)
          if (k in b) (out as unknown as Record<string, Num>)[k] = num(b[k]);
        return out;
      }),
  };
}
