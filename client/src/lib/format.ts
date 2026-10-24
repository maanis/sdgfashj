export const DASH = "-";
const isNum = (v: number | null | undefined): v is number => typeof v === "number" && Number.isFinite(v);

export function fmtNum(v: number | null | undefined, digits = 0): string {
  if (!isNum(v)) return DASH;
  return v.toLocaleString("en-GB", { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

export function fmtSigned(v: number | null | undefined, digits = 0): string {
  if (!isNum(v)) return DASH;
  const s = fmtNum(Math.abs(v), digits);
  return v > 0 ? `+${s}` : v < 0 ? `−${s}` : s;
}

/** wMAPE from the API is a ratio (0–1); shown as a percentage. */
export function fmtPct(v: number | null | undefined, digits = 1): string {
  if (!isNum(v)) return DASH;
  return `${(v * 100).toLocaleString("en-GB", { minimumFractionDigits: digits, maximumFractionDigits: digits })}%`;
}

const tz = "Europe/London";
const timeFmt = new Intl.DateTimeFormat("en-GB", { timeZone: tz, hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
const dateTimeFmt = new Intl.DateTimeFormat("en-GB", { timeZone: tz, day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
const longDateFmt = new Intl.DateTimeFormat("en-GB", { timeZone: "UTC", weekday: "short", day: "numeric", month: "short", year: "numeric" });
const shortDateFmt = new Intl.DateTimeFormat("en-GB", { timeZone: "UTC", day: "numeric", month: "short" });

const parse = (iso: string | null | undefined) => {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
};

export const londonTime = (iso: string | null | undefined) => { const d = parse(iso); return d ? timeFmt.format(d) : DASH; };
export const londonDateTime = (iso: string | null | undefined) => { const d = parse(iso); return d ? dateTimeFmt.format(d) : DASH; };
export const longDate = (ymd: string) => { const d = parse(`${ymd}T00:00:00Z`); return d ? longDateFmt.format(d) : ymd; };
export const shortDate = (ymd: string) => { const d = parse(`${ymd}T00:00:00Z`); return d ? shortDateFmt.format(d) : ymd; };
