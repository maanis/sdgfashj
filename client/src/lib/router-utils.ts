import type { To } from "react-router-dom";

/** Build a react-router `To` object with a query string, skipping undefined/empty values. */
export function toWithSearch(pathname: string, params: object): To {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params) as [string, string | undefined][]) {
    if (v !== undefined && v !== "") sp.set(k, v);
  }
  const search = sp.toString();
  return { pathname, search: search ? `?${search}` : "" };
}
