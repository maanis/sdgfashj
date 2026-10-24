export const MIN_DATE = "2026-01-01";
export const MAX_DATE = "2026-01-31";
export const FALLBACK_DATE = "2026-01-15";
export const FALLBACK_CUTOFF = "09:30";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const CUTOFF_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

export function isValidDate(v: unknown): v is string {
  if (typeof v !== "string" || !DATE_RE.test(v)) return false;
  const d = new Date(`${v}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === v && v >= MIN_DATE && v <= MAX_DATE;
}

export function isValidCutoff(v: unknown): v is string {
  return typeof v === "string" && CUTOFF_RE.test(v);
}

export function clampDate(v: string): string {
  if (v < MIN_DATE) return MIN_DATE;
  if (v > MAX_DATE) return MAX_DATE;
  return v;
}

export interface GlobalSearch {
  date?: string | undefined;
  cutoff?: string | undefined;
}

export function parseGlobalSearch(s: Record<string, unknown>): GlobalSearch {
  return {
    date: isValidDate(s["date"]) ? s["date"] : undefined,
    cutoff: isValidCutoff(s["cutoff"]) ? s["cutoff"] : undefined,
  };
}

/** Cutoff choices every 30 minutes, London local time on D-1. */
export const CUTOFF_OPTIONS: string[] = Array.from({ length: 48 }, (_, i) =>
  `${String(Math.floor(i / 2)).padStart(2, "0")}:${i % 2 ? "30" : "00"}`,
);
