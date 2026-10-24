import type { Metrics } from "./api";
import { fmtNum } from "./format";

/** Plain-English, indicative procurement reading built only from API metric values. */
export function interpretBias(m: Pick<Metrics, "bias" | "p90_error" | "p10_error">): string[] {
  const out: string[] = [];
  const { bias, p90_error: p90, p10_error: p10 } = m;

  if (bias == null) {
    out.push("Bias is unavailable for this period, so no directional conclusion can be drawn.");
  } else if (bias > 0) {
    out.push(`Forecasts overstate wind generation on average, by about ${fmtNum(Math.abs(bias))} MW per interval.`);
  } else if (bias < 0) {
    out.push(`Forecasts understate wind generation on average, by about ${fmtNum(Math.abs(bias))} MW per interval.`);
  } else {
    out.push("There is no average directional bias: over- and under-forecasts balance out over the period.");
  }

  if (p90 == null) {
    out.push("The P90 error is unavailable, so the over-forecast tail cannot be assessed.");
  } else if (p90 > 0) {
    out.push(`In 10% of intervals the forecast exceeded actual output by more than ${fmtNum(p90)} MW (P90 error). This is the shortfall-risk tail: wind delivering less than planned.`);
  } else {
    out.push(`P90 error is ${fmtNum(p90)} MW or below, meaning even the upper tail of errors did not over-forecast; shortfall risk from over-forecasting was limited in this sample.`);
  }

  if (p10 != null) {
    out.push(`At the other end, P10 error is ${p10 < 0 ? "−" : ""}${fmtNum(Math.abs(p10))} MW, describing the under-forecast tail (more wind than expected).`);
  }

  out.push("These figures describe historical forecast error; they are not a guaranteed buffer. Any cover decision should also reflect market prices, reserve requirements and current conditions.");
  return out;
}
