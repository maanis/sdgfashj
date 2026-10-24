# Wind Forecast Desk

Wind Forecast Desk is a full-stack analytics application for evaluating
**GB day-ahead wind generation forecasts** against measured generation. It is
designed to help energy and procurement teams understand forecast quality at a
realistic decision cutoff, investigate individual delivery days, and translate
historical forecast error into better-informed procurement decisions.

All generation and error values are displayed in **MW**. Decision cutoffs use
local time in **Europe/London**.

## Live application

- **Frontend:** [wind-forecastt.vercel.app](https://wind-forecastt.vercel.app/)
- **Backend API:** [wind-forecast-backend-8yst.onrender.com](https://wind-forecast-backend-8yst.onrender.com/)
- **API health check:** [/health](https://wind-forecast-backend-8yst.onrender.com/health)
- **Interactive API documentation:** [/docs](https://wind-forecast-backend-8yst.onrender.com/docs)

## What the application provides

- **Dashboard** - KPI tiles for MAE, RMSE, bias, and wMAPE; daily error charts;
  a latest-decision summary; and API-reported data coverage.
- **Day Forecast** - an hourly forecast compared with half-hourly actual
  generation for one delivery day, including summary statistics, accuracy
  metrics, publication times, lead time, and interval-level data.
- **Accuracy** - historical overall and daily metrics for a selectable date
  range and cutoff, sortable daily results, error-by-lead-time buckets, and an
  indicative procurement interpretation.
- **Global filters** - delivery date and D-1 cutoff are preserved in the URL,
  making views shareable and keeping navigation consistent.
- **Guided UX** - responsive navigation, loading and empty states, retryable
  API errors, accessible tables and charts, and an in-app help guide with
  metric definitions.

The frontend does not generate mock forecast data. It requests data from the
backend and reports unavailable, network, HTTP, and invalid-response
conditions explicitly.

## How forecast selection works

For delivery day **D**, the buyer makes a decision on **D-1** before the
day-ahead auction closes. For every half-hour on D, the backend selects the
most recent `WINDFOR` forecast published at or before the configured D-1
cutoff (default `09:30` London).

Forecasts published after the cutoff are not used, so the accuracy results only
use information that would have been available to the buyer. The exact market
gate time should be verified with the client.

Error is calculated as:

```text
error = forecast - actual
```

Positive error means over-forecasting, which is the risk direction for a buyer
because it can lead to under-procurement.

## Technology stack

### Frontend

- React 19 and TypeScript
- Vite 8
- React Router
- TanStack React Query
- Recharts
- Tailwind CSS 4 and Radix UI primitives
- Lucide React icons
- Vitest and Testing Library

### Backend

- Python and FastAPI
- Uvicorn
- Elexon BMRS data through the Elexon client
- Pandas/NumPy-based data processing and metrics
- Pytest
- Docker and Docker Compose support

## Repository structure

```text
.
├── client/                    # React/Vite frontend
│   ├── src/
│   │   ├── components/        # App shell, charts, metrics, states, and UI
│   │   ├── hooks/             # API queries, URL filters, and page metadata
│   │   ├── lib/               # API client, filters, formatting, interpretation
│   │   ├── pages/             # Dashboard, Forecast, and Accuracy pages
│   │   ├── App.tsx            # Router and application composition
│   │   └── main.tsx           # Browser entry point
│   ├── public/                # Static assets
│   └── package.json
├── server/
│   ├── backend/
│   │   ├── app/
│   │   │   ├── main.py        # FastAPI routes
│   │   │   ├── pipeline.py    # Decision-time selection and data joining
│   │   │   ├── metrics.py     # Accuracy and horizon metrics
│   │   │   ├── elexon.py      # Elexon BMRS client
│   │   │   ├── store.py       # Cached CSV loading
│   │   │   └── config.py      # Environment configuration
│   │   ├── scripts/            # Data ingestion scripts
│   │   ├── tests/              # Backend tests
│   │   └── data/               # Cached actuals and forecasts
│   └── docker-compose.yml
└── README.md
```

## Local development

### Prerequisites

- Node.js 18 or newer
- npm
- Python 3.10 or newer
- pip
- Optional: Docker and Docker Compose

### Start the backend

From the repository root:

```sh
cd server/backend
python -m venv .venv
```

Activate the virtual environment:

```sh
# macOS/Linux
source .venv/bin/activate

# Windows PowerShell
.\.venv\Scripts\Activate.ps1
```

Install dependencies and prepare data:

```sh
pip install -r requirements.txt
python -m scripts.ingest
```

For an offline demo dataset instead of real Elexon data:

```sh
python -m scripts.ingest --synthetic
```

Start the API:

```sh
uvicorn app.main:app --reload
```

The local API is available at
[`http://localhost:8000`](http://localhost:8000), with Swagger UI at
[`http://localhost:8000/docs`](http://localhost:8000/docs).

### Start the frontend

In a second terminal:

```sh
cd client
npm install
```

Create `client/.env`:

```env
VITE_API_BASE_URL=http://localhost:8000
```

Then start Vite:

```sh
npm run dev
```

The frontend normally runs at
[`http://localhost:5173`](http://localhost:5173).

`VITE_API_BASE_URL` is exposed to browser code, so it must contain only a
public backend URL and never a secret or private token.

## Frontend routes

| Route | Description |
| --- | --- |
| `/dashboard` | Selected-period performance overview |
| `/forecast` | Forecast versus actual for one delivery day |
| `/accuracy` | Historical and lead-time accuracy analysis |

Examples with shareable URL filters:

```text
/forecast?date=2026-01-15&cutoff=09:30
/accuracy?start=2026-01-01&end=2026-01-31&cutoff=09:30
```

## Backend API

| Endpoint | Query parameters | Purpose |
| --- | --- | --- |
| `GET /api/meta` | None | Data coverage and default filters |
| `GET /api/forecast` | `date`, `cutoff` | Decision-time forecast, actuals, and accuracy for one day |
| `GET /api/accuracy` | `start`, `end`, `cutoff` | Overall and daily accuracy metrics |
| `GET /api/accuracy/horizon` | `start`, `end`, `bucket_hours` | Accuracy grouped by forecast lead time |
| `GET /health` | None | Service liveness |

The frontend API client is centralized in `client/src/lib/api.ts`. Responses
are validated before rendering. Missing numeric values are represented as
unavailable rather than fabricated or silently replaced.

## Metrics

- `n` - number of observations
- `mae` - mean absolute error
- `rmse` - root mean squared error
- `bias` - mean signed error; positive means over-forecasting
- `wmape` - total absolute error divided by total actual generation
- `p10_error`, `p50_error`, `p90_error` - signed error percentiles
- `p95_abs_error` - 95th percentile of absolute error
- `mean_actual` - mean measured generation

wMAPE is used instead of MAPE because wind generation can be close to zero.
Missing actuals are excluded from metrics and are not interpolated.

## Data and limitations

- The backend uses national-level GB wind data from Elexon:
  `FUELHH` actuals and `WINDFOR` forecasts.
- The pilot dataset covers January 2026 delivery days.
- Data is pre-ingested and cached in compressed CSV files, so the deployed
  service does not call Elexon at runtime.
- Forecasts with lead times over 72 hours are dropped during ingestion.
- The application does not include demand data.
- Procurement interpretation is indicative analysis, not a trading,
  operational, or financial recommendation.

## Useful commands

### Frontend

Run from `client/`:

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Vite development server |
| `npm run build` | Create a production build in `dist/` |
| `npm run preview` | Preview the production build |
| `npm run typecheck` | Run the TypeScript compiler without emitting files |
| `npm run lint` | Run ESLint |
| `npm run format` | Format with Prettier |
| `npm test` | Run the Vitest suite once |
| `npm run test:watch` | Run Vitest in watch mode |

### Backend

Run from `server/backend/`:

```sh
pytest -q
```

To run the full stack with Docker:

```sh
cd server
docker compose up --build
```

## Deployment

### Frontend

Build the static frontend with `npm run build` from `client/` and deploy the
resulting `dist/` directory to a static host such as Vercel. Configure
`VITE_API_BASE_URL` in the hosting provider's build-time environment settings,
then rebuild. The host must rewrite `/dashboard`, `/forecast`, and `/accuracy`
to `index.html` for client-side routing.

### Backend

The backend can be deployed with the existing Docker/Vercel configuration or
run as a Python service. Because the data is pre-ingested, deployment should
include the cached files in `server/backend/data/`. Configure CORS so the
frontend origin can call the API.

## Coding agents and development workflow

The project was developed with AI-assisted coding tools. The agents and tools
used for each part of the application were:

### Frontend

- **Lovable** - initial application scaffold, visual direction, and project
  setup. The project can be continued in the
  [Lovable editor](https://lovable.dev/projects/bcacc6b8-a340-4a77-893c-1f080484ad1f).
- **Antigravity** - feature integration and refinement, including the REST API
  client, typed response handling, React Query loading, forecast and accuracy
  views, charts, filters, error states, and related application behavior.

### Backend

- **Claude by Anthropic** - coding assistance for backend implementation,
  debugging, and code generation.
- **OpenAI Codex** - coding assistance for backend implementation, debugging,
  and code fixes.

AI tools accelerated implementation, but product requirements, business logic,
market assumptions, design decisions, and the final review/testing remain the
responsibility of the project maintainers.