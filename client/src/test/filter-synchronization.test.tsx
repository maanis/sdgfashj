import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, useLocation, useNavigate } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import App from "@/App";

function jsonResponse(body: unknown) {
  return new Response(JSON.stringify(body), { headers: { "Content-Type": "application/json" } });
}

function apiResponse(url: string) {
  if (url.includes("/api/meta")) {
    return jsonResponse({
      default_cutoff: "09:30",
      default_range: { start: "2026-01-01", end: "2026-01-31" },
      actuals: { rows: 10, from: "2026-01-01T00:00:00Z", to: "2026-01-31T00:00:00Z" },
      forecasts: { rows: 10, published_from: null, published_to: null },
      error_definition: "forecast - actual",
    });
  }
  if (url.includes("/api/forecast")) {
    return jsonResponse({
      date: new URL(url).searchParams.get("date"),
      cutoff: new URL(url).searchParams.get("cutoff"),
      decision_time_utc: "2026-01-14T09:30:00Z",
      forecast_published_from: null,
      forecast_published_to: null,
      summary: { mean_forecast: 100, min_forecast: 50, max_forecast: 150 },
      accuracy: {},
      points: [],
    });
  }
  if (url.includes("/api/accuracy/horizon")) return jsonResponse({ buckets: [] });
  return jsonResponse({ overall: {}, daily: [] });
}

function LocationProbe() {
  const { pathname, search } = useLocation();
  return <div data-testid="location">{pathname + search}</div>;
}

function HistoryControls() {
  const navigate = useNavigate();
  return (
    <>
      <button type="button" onClick={() => navigate(-1)}>
        Back
      </button>
      <button type="button" onClick={() => navigate(1)}>
        Forward
      </button>
    </>
  );
}

function renderAt(initialEntries: string[], initialIndex = 0) {
  return render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      <MemoryRouter initialEntries={initialEntries} initialIndex={initialIndex}>
        <App />
        <LocationProbe />
        <HistoryControls />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

async function dismissHelp() {
  const button = screen.queryByRole("button", { name: "Got it" });
  if (button) fireEvent.click(button);
}

describe("toolbar filter synchronization", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn((input: RequestInfo | URL) => Promise.resolve(apiResponse(String(input))));
    vi.stubGlobal("fetch", fetchMock);
  });

  it("updates the date query parameter and forecast request", async () => {
    renderAt(["/dashboard?date=2026-01-15&cutoff=09:30"]);
    await screen.findByDisplayValue("2026-01-15");
    await dismissHelp();

    fireEvent.change(screen.getByLabelText("Delivery date"), { target: { value: "2026-01-20" } });

    await waitFor(() =>
      expect(screen.getByTestId("location")).toHaveTextContent(
        "/dashboard?date=2026-01-20&cutoff=09%3A30",
      ),
    );
    await waitFor(() =>
      expect(
        fetchMock.mock.calls.some(([input]) =>
          String(input).includes("/api/forecast?date=2026-01-20&cutoff=09%3A30"),
        ),
      ).toBe(true),
    );
  });

  it("updates the cutoff query parameter and cutoff-dependent requests", async () => {
    renderAt(["/dashboard?date=2026-01-15&cutoff=09:30"]);
    await screen.findByDisplayValue("2026-01-15");
    await dismissHelp();

    fireEvent.click(screen.getByLabelText("Cutoff"));
    fireEvent.click(await screen.findByRole("option", { name: "10:00" }));

    await waitFor(() =>
      expect(screen.getByTestId("location")).toHaveTextContent(
        "/dashboard?date=2026-01-15&cutoff=10%3A00",
      ),
    );
    await waitFor(() =>
      expect(
        fetchMock.mock.calls.some(([input]) =>
          String(input).includes("/api/accuracy?start=2026-01-01&end=2026-01-31&cutoff=10%3A00"),
        ),
      ).toBe(true),
    );
  });

  it("includes the selected cutoff in accuracy horizon requests", async () => {
    renderAt(["/accuracy?date=2026-01-15&cutoff=09:30"]);
    await screen.findByDisplayValue("2026-01-15");
    await dismissHelp();

    fireEvent.click(screen.getByLabelText("Cutoff"));
    fireEvent.click(await screen.findByRole("option", { name: "10:00" }));

    await waitFor(() =>
      expect(
        fetchMock.mock.calls.some(([input]) =>
          String(input).includes(
            "/api/accuracy/horizon?start=2026-01-01&end=2026-01-31&cutoff=10%3A00",
          ),
        ),
      ).toBe(true),
    );
  });

  it("keeps toolbar values and displayed requests in sync with back and forward navigation", async () => {
    renderAt(
      ["/dashboard?date=2026-01-10&cutoff=08:00", "/dashboard?date=2026-01-20&cutoff=10:00"],
      1,
    );
    expect(await screen.findByDisplayValue("2026-01-20")).toBeInTheDocument();
    await dismissHelp();

    fireEvent.click(screen.getByRole("button", { name: "Back" }));
    await waitFor(() => expect(screen.getByDisplayValue("2026-01-10")).toBeInTheDocument());
    expect(screen.getByRole("combobox", { name: "Cutoff" })).toHaveTextContent("08:00");

    fireEvent.click(screen.getByRole("button", { name: "Forward" }));
    await waitFor(() => expect(screen.getByDisplayValue("2026-01-20")).toBeInTheDocument());
    expect(screen.getByRole("combobox", { name: "Cutoff" })).toHaveTextContent("10:00");
  });
});
