# Wind Forecast Desk

Wind Forecast Desk is a responsive analytics dashboard for evaluating **GB
day-ahead wind generation forecasts** against measured generation. It helps
energy and procurement teams understand forecast quality at a selected
decision cutoff, investigate individual delivery days, and translate historical
forecast error into better-informed procurement decisions.

All generation and error values are displayed in **MW**. Decision cutoffs use
local time in **Europe/London** and represent the D-1 point at which a forecast
is committed.

## What the app provides

- **Dashboard** - KPI tiles for MAE, RMSE, bias, and wMAPE; daily error charts;
  a latest-decision summary; and API-reported data coverage.
- **Day Forecast** - an hourly forecast compared with half-hourly actual
  generation for one delivery day, including summary statistics, accuracy
  metrics, forecast publication times, lead time, and interval-level data.
- **Accuracy** - historical overall and daily metrics for a selectable date
  range and cutoff, sortable daily results, error-by-lead-time buckets, and an
  indicative procurement interpretation.
- **Global filters** - delivery date and D-1 cutoff are preserved in the URL,
  making views shareable and navigation between pages consistent.
- **Guided UX** - responsive desktop/mobile navigation, loading states,
  empty states, retryable API errors, accessible tables and charts, and an
  in-app help guide with metric definitions.

The frontend does not generate mock forecast data. It requests data from the
configured backend and reports unavailable, network, HTTP, and invalid-response
conditions explicitly in the interface.

## Technology

- React 19 and TypeScript
- Vite 8
- React Router
- TanStack React Query for request caching, loading states, and cancellation
- Recharts for forecast and accuracy visualizations
- Tailwind CSS 4 and Radix UI primitives
- Lucide React icons
- Vitest and Testing Library for tests

## Project structure

```text
.
├── public/                  # Static assets
├── src/
│   ├── components/          # App shell, charts, metrics, states, and UI primitives
│   ├── hooks/               # API-backed queries, URL filters, and page metadata
│   ├── lib/
│   │   ├── api.ts           # Typed REST client and response validation
│   │   ├── filters.ts       # Date/cutoff validation and filter defaults
│   │   ├── format.ts        # Number, date, and time formatting
│   │   └── interpretation.ts # Procurement-oriented interpretation helpers
│   ├── pages/               # Dashboard, Day Forecast, and Accuracy pages
│   ├── App.tsx              # Router and application composition
│   ├── main.tsx             # Browser entry point
│   └── styles.css           # Global styles and theme tokens
├── index.html
├── package.json
└── vite.config.ts
```

## Requirements

- Node.js 18 or newer
- npm
- A running Wind Forecast backend that implements the API described below

## Getting started

```sh
git clone <this-repository-url>
cd wind-forecast-frontend
npm install
```

Create a local `.env` file in the project root:

```env
VITE_API_BASE_URL=https://your-backend.example.com
```

`VITE_API_BASE_URL` is optional in the code, but it should be set for a usable
deployment. The frontend otherwise uses a placeholder backend URL. Do not
commit credentials or private tokens to `.env` files. Vite exposes
`VITE_*` values to browser code, so this variable must contain only a public
base URL and not a secret.

Start the development server:

```sh
npm run dev
```

Vite will print the local URL, normally
[`http://localhost:5173`](http://localhost:5173).

## Available scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Vite development server |
| `npm run build` | Create a production build in `dist/` |
| `npm run preview` | Preview the production build locally |
| `npm run typecheck` | Run the TypeScript compiler without emitting files |
| `npm run lint` | Run ESLint |
| `npm run format` | Format the project with Prettier |
| `npm test` | Run the Vitest test suite once |
| `npm run test:watch` | Run Vitest in watch mode |

Before opening a pull request, run:

```sh
npm run typecheck
npm run lint
npm test
npm run build
```

## Backend API contract

The REST client is centralized in `src/lib/api.ts`. The base URL is taken from
`VITE_API_BASE_URL`, and requests use the following endpoints:

| Endpoint | Query parameters | Used for |
| --- | --- | --- |
| `GET /api/meta` | None | Default cutoff/range and actual/forecast data coverage |
| `GET /api/forecast` | `date`, `cutoff` | Forecast points and metrics for one delivery day |
| `GET /api/accuracy` | `start`, `end`, `cutoff` | Overall and daily accuracy metrics |
| `GET /api/accuracy/horizon` | `start`, `end`, `bucket_hours` | Accuracy grouped by forecast lead time |

The backend responses should be JSON. The frontend validates the important
response shapes before rendering them and supports both array and
date-keyed-object forms for the `daily` accuracy data.

### Forecast response fields

`/api/forecast` returns the selected date and cutoff, decision and publication
timestamps, summary values (`mean_forecast`, `min_forecast`,
`max_forecast`), accuracy metrics, and a `points` array. Each point may
include:

- `startTime`
- `forecast`
- `actual`
- `error` (forecast minus actual)
- `band_low` and `band_high`
- `publishTime`
- `horizon_h`

### Metrics

The application understands the following metric fields:

- `n` - number of observations
- `mae` - mean absolute error
- `rmse` - root mean squared error
- `bias` - mean of forecast minus actual; positive means over-forecasting
- `wmape` - total absolute error divided by total actual generation
- `p10_error`, `p50_error`, `p90_error` - signed error percentiles
- `p95_abs_error` - 95th percentile of absolute error
- `mean_actual` - mean measured generation

## Routes and URL filters

| Route | Description |
| --- | --- |
| `/dashboard` | Selected-period performance overview |
| `/forecast` | Forecast versus actual for one delivery day |
| `/accuracy` | Historical and lead-time accuracy analysis |

The main filters can be shared through query parameters:

```text
/forecast?date=2026-01-15&cutoff=12:00
/accuracy?start=2026-01-01&end=2026-01-31&cutoff=12:00
```

The initial values are taken from `/api/meta` when available. The UI also
validates dates and cutoffs before using them in requests.

## Error handling and data behavior

- Requests are canceled when their query inputs change.
- Previously loaded data can remain visible while a new request is fetched.
- HTTP 503 responses are shown as a backend data-availability message.
- Network failures, other HTTP failures, and invalid JSON/response shapes are
  shown as distinct retryable errors.
- Missing numeric values are represented as unavailable rather than fabricated
  or silently replaced with mock values.

## Build workflow and tooling

This project was built with an AI-assisted workflow:

- **Lovable** was used for the initial application scaffold, visual direction,
  and project setup. The project can be continued in the
  [Lovable editor](https://lovable.dev/projects/bcacc6b8-a340-4a77-893c-1f080484ad1f).
- **AI agents** were used throughout development to help shape the
  implementation, refine the user experience, and review code changes.
- **Antigravity** was used to add and integrate product features after the
  scaffold, including the REST API client, backend API calls, typed response
  handling, React Query data loading, forecast and accuracy views, charts,
  filters, error states, and related application behavior.

AI tools accelerated implementation, but the resulting code, API contract,
validation, accessibility behavior, and test/build checks should still be
reviewed by the maintainers before production use.

## Continuing development in Lovable

You can continue developing this project in the
[Lovable editor](https://lovable.dev/projects/bcacc6b8-a340-4a77-893c-1f080484ad1f).

- Describe the next change and Lovable can update the project.
- Changes made in Lovable are synchronized with the connected repository.
- The repository remains available for local development, code review, and
  deployment through your normal Git workflow.

When working locally, keep the repository and Lovable project synchronized and
avoid committing local environment files or backend credentials.

## Deployment

Build the static frontend:

```sh
npm run build
```

Deploy the generated `dist/` directory to a static hosting provider such as
Vercel, Netlify, GitHub Pages, or any server capable of serving a single-page
Vite application. Configure `VITE_API_BASE_URL` in the hosting provider's
build-time environment settings, then rebuild the app. The host must also
rewrite application routes such as `/dashboard`, `/forecast`, and `/accuracy`
to `index.html`.

The frontend and backend must be reachable from the browser and the backend
must allow the frontend origin through its CORS configuration.

## Notes

- The current dashboard is focused on GB wind generation, day-ahead decisions,
  Europe/London time, and MW values.
- Procurement interpretation is indicative analysis, not a trading,
  operational, or financial recommendation.
- The backend owns the source data, metric calculations, and data-coverage
  dates; the frontend presents and validates those responses.
