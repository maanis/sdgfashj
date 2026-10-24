import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, useLocation } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import App from "@/App";

function LocationProbe() {
  const { pathname, search } = useLocation();
  return <div data-testid="loc">{pathname + search}</div>;
}

function renderAt(url: string) {
  return render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <MemoryRouter initialEntries={[url]}>
        <App />
        <LocationProbe />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("App routing", () => {
  beforeEach(() => {
    // Pages call the API on mount; keep the test offline.
    vi.stubGlobal("fetch", vi.fn(() => Promise.reject(new Error("offline"))));
  });

  it("redirects / to /dashboard and keeps the query string", async () => {
    renderAt("/?date=2026-01-10&cutoff=08:00");
    expect(await screen.findByTestId("loc")).toHaveTextContent("/dashboard?date=2026-01-10&cutoff=08:00");
  });

  it("redirects unknown routes to / and preserves the query string", async () => {
    renderAt("/dashboardhg?date=2026-01-10&cutoff=08:00");
    expect(await screen.findByTestId("loc")).toHaveTextContent(
      "/dashboard?date=2026-01-10&cutoff=08:00",
    );
  });
});
