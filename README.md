# HELPSTiR — CSR Intelligence Platform

AI-powered CSR project design, NGO matching, and impact management platform built for the Indian regulatory environment (Schedule VII, Companies Act 2013).

---

## Quick Start

### Prerequisites

- **Python 3.11+** (tested with 3.13)
- **Node.js 18+** and npm
- **Anthropic API key** — get one at [console.anthropic.com](https://console.anthropic.com)

### 1. Clone and set up the backend

```bash
cd backend

# Create and activate virtual environment
python3 -m venv .venv
source .venv/bin/activate    # macOS/Linux
# .venv\Scripts\activate     # Windows

# Install dependencies
pip install -e .
```

### 2. Configure your API key

```bash
cp .env.example .env
```

Edit `backend/.env` and replace `your-anthropic-api-key-here` with your actual Anthropic API key:

```
ANTHROPIC_API_KEY=sk-ant-api03-...
```

The default model is `claude-haiku-4-5-20251001` (fast and cheap). To use a more capable model, change `ANTHROPIC_MODEL`:

```
ANTHROPIC_MODEL=claude-sonnet-4-6
```

### 3. Start the backend

```bash
cd backend
source .venv/bin/activate
uvicorn src.main:app --reload --port 8001
```

On first startup, the SQLite database is created and seeded with mock data automatically. API docs are at `http://localhost:8001/docs`.

### 4. Set up and start the frontend

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173` in your browser. The Vite dev server proxies API calls to the backend at `localhost:8001`.

### 5. Log in

Use any of the seeded demo accounts:

| Role   | Email                        | Password      |
|--------|------------------------------|---------------|
| Funder | csr@tatagroup.example.com    | password123   |
| Funder | csr@infosys.example.com      | password123   |
| NGO    | ngo1@example.com             | password123   |
| NGO    | ngo2@example.com             | password123   |
| Admin  | admin@helpstir.in            | admin123      |

---

## Environment Variables

All configuration lives in `backend/.env`. Copy from `backend/.env.example` to get started.

| Variable             | Default                             | Description                                    |
|----------------------|-------------------------------------|------------------------------------------------|
| `SECRET_KEY`         | `change-me-in-production`           | JWT signing key — change this in production    |
| `ANTHROPIC_API_KEY`  | *(required)*                        | Your Anthropic API key                         |
| `ANTHROPIC_MODEL`    | `claude-haiku-4-5-20251001`         | Default Claude model for project generation    |
| `DEFAULT_AI_BACKEND` | `claude`                            | AI backend to use (`claude` or `ollama`)       |
| `DATABASE_URL`       | `sqlite+aiosqlite:///./helpstir.db` | Database connection string                     |
| `OLLAMA_BASE_URL`    | `http://localhost:11434`            | Ollama server URL (only if using Ollama)       |
| `DEBUG`              | `false`                             | Enable debug logging                           |

---

## Mock Data

The app seeds mock data on first startup via `backend/src/db/seed.py`. This includes:

- **5 NGOs** — Pratham Education Foundation, Gram Vikas Sansthan, Green Earth Foundation, Mahila Kalyan Samiti, Rural Health Connect
- **4 NGO programmes** — with beneficiary counts, locations, and outcomes
- **3 location needs** — district-level demographic gaps and community problems
- **2 funder profiles** — Tata Steel CSR and Infosys Foundation (with budgets)
- **1 admin user**

Each NGO has trust scores computed from verifiable credentials (12A, 80G, FCRA, CSR-1, etc.), thematic areas, and operating regions. The AI uses this data to match NGOs to generated projects.

### Replacing mock data with real data

The mock seeder only runs if the database is empty (no users exist). To use your own data:

**Option A — Edit the seed file:**
Modify `backend/src/db/seed.py` to populate with your real NGO/funder data. The seeder creates `User` -> `NGOProfile` -> `NGOProgramme` / `LocationNeed` records. Delete `helpstir.db` and restart the server to re-seed.

**Option B — Use the API:**
Register users via `POST /v1/auth/register` and create profiles through the API endpoints. The admin role can manage all data.

**Option C — Swap to an external API:**
The service layer (`backend/src/services/project_designer.py`) fetches NGO data through SQLModel ORM queries. To pull from an external API instead:

1. Create a service (e.g., `backend/src/services/ngo_registry.py`) that fetches NGO data from your external source
2. Replace the `session.execute(select(NGOProfile)...)` calls in `project_designer.py` with calls to your new service
3. Map the external data to the same shape (`NGOProfile`, `NGOProgramme`, `LocationNeed`) so the prompt formatting and relevance filtering continue to work

**Option D — Switch to PostgreSQL:**
Change `DATABASE_URL` in `.env` to a PostgreSQL connection string:

```
DATABASE_URL=postgresql+asyncpg://user:password@localhost:5432/helpstir
```

Install the async driver: `pip install asyncpg`. The SQLModel schema creates tables automatically on startup.

---

## AI Backend

The AI layer is provider-agnostic. An `AIBackend` abstract class defines `generate()`, `stream()`, and `health_check()` methods. The `AIEngine` routes requests to the correct backend by model prefix.

### Using Claude (default)

Set your `ANTHROPIC_API_KEY` in `.env`. Project generation uses Claude to produce structured CSR proposals with:
- Problem statements grounded in Indian development context
- Theory of Change (Action -> Output -> Outcome -> Impact)
- M&E frameworks with verifiable indicators
- NGO recommendations ranked by theme/geography match and trust scores
- Schedule VII compliance mapping

### Using Ollama (local/open-source models)

```bash
# Set in .env
DEFAULT_AI_BACKEND=ollama
OLLAMA_BASE_URL=http://localhost:11434

# Or specify per-request via model prefix in the API:
# POST /v1/projects/generate  ->  { "model": "ollama/llama3.2", "brief_text": "..." }
```

### Adding a new backend

1. Create `backend/src/ai/backends/your_backend.py` implementing the `AIBackend` ABC
2. Register it in `AIEngine.__init__()` or call `engine.register_backend()`
3. Add a prefix mapping in `PREFIX_MAP`

No changes needed in the service layer or API routes.

---

## Project Structure

```
helpstir/
├── backend/
│   ├── src/
│   │   ├── ai/
│   │   │   ├── backends/
│   │   │   │   ├── base.py              # AIBackend ABC + AIResponse
│   │   │   │   ├── claude.py            # Anthropic Claude backend
│   │   │   │   └── ollama.py            # Ollama (local models) backend
│   │   │   ├── prompts/
│   │   │   │   └── project_generator.py # System & generation prompts
│   │   │   └── engine.py               # AIEngine — prefix-based routing
│   │   ├── api/v1/
│   │   │   ├── auth.py                  # Register, login
│   │   │   ├── projects.py             # Generate, list, get, delete, award
│   │   │   ├── ngos.py                 # NGO profiles, location needs
│   │   │   ├── funders.py              # Funder profile management
│   │   │   └── health.py              # Health check
│   │   ├── auth/
│   │   │   ├── jwt.py                  # JWT creation, verification, role checks
│   │   │   └── passwords.py           # bcrypt hash/verify
│   │   ├── core/
│   │   │   └── config.py              # Pydantic settings (env-driven)
│   │   ├── db/
│   │   │   ├── session.py             # Async engine + session factory
│   │   │   └── seed.py               # Mock data seeder
│   │   ├── models/
│   │   │   ├── enums.py               # UserRole, ProjectStatus, ScheduleVIIHead, etc.
│   │   │   ├── user.py
│   │   │   ├── ngo.py                # NGOProfile, NGOProgramme, LocationNeed
│   │   │   ├── funder.py
│   │   │   ├── project.py            # Project, NGORecommendation
│   │   │   ├── rfp.py                # RFP, PlatformMessage
│   │   │   └── mne.py               # Milestone
│   │   ├── services/
│   │   │   ├── project_designer.py   # AI project generation orchestrator
│   │   │   ├── fee_engine.py         # Tiered platform fee calculation
│   │   │   └── trust_score.py        # Trust/impact score computation
│   │   └── main.py                   # FastAPI app + lifespan
│   ├── pyproject.toml
│   ├── .env.example
│   └── .gitignore
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── ProjectDesigner.tsx    # AI project generation form
    │   │   ├── ProjectReport.tsx      # Branded report with PDF export
    │   │   └── EditableStatCard.tsx   # Inline-editable stat cards
    │   ├── pages/
    │   │   ├── LoginPage.tsx
    │   │   ├── FunderDashboard.tsx    # Portfolio, stats, project list
    │   │   ├── ProjectDetailPage.tsx  # Full report + award + delete
    │   │   └── NGODashboard.tsx       # NGO profile + trust breakdown
    │   ├── services/
    │   │   └── api.ts                # API client with auth headers
    │   ├── hooks/
    │   │   └── useAuth.ts            # Auth state (localStorage)
    │   ├── types/
    │   │   └── api.ts                # TypeScript interfaces
    │   ├── App.tsx                    # Role-based routing
    │   ├── main.tsx
    │   └── index.css                 # HELPSTiR brand styles
    ├── index.html
    ├── package.json
    ├── tsconfig.json
    └── vite.config.ts                # Proxy /v1 -> backend:8001
```

---

## API Endpoints

| Method | Path                                 | Auth        | Description                      |
|--------|--------------------------------------|-------------|----------------------------------|
| POST   | `/v1/auth/register`                  | --          | Create account                   |
| POST   | `/v1/auth/login`                     | --          | Get JWT token                    |
| GET    | `/v1/funders/me`                     | Funder      | Get funder profile               |
| PATCH  | `/v1/funders/me`                     | Funder      | Update funder profile            |
| GET    | `/v1/ngos/`                          | Funder      | List all NGOs                    |
| GET    | `/v1/ngos/me`                        | NGO         | Get own NGO profile              |
| POST   | `/v1/projects/generate`              | Funder      | AI-generate a CSR project        |
| GET    | `/v1/projects/`                      | Funder      | List own projects                |
| GET    | `/v1/projects/{id}`                  | Funder      | Get project with recommendations |
| DELETE | `/v1/projects/{id}`                  | Funder      | Delete a project                 |
| POST   | `/v1/projects/{id}/award/{ngo_id}`   | Funder      | Award project to an NGO          |
| GET    | `/health`                            | --          | Health check                     |

---

## Key Features

- **AI Project Generation** — describe your CSR vision in free text; the AI produces a full project proposal with problem statement, intervention logic, outcomes, M&E framework, and Schedule VII mapping
- **NGO Matching** — AI ranks NGOs by relevance (theme, geography, trust score) and provides match rationale
- **Themed Reports** — branded report layout with category-themed header banners (color-coded by Schedule VII head) and PDF download
- **Platform Fee Engine** — tiered facilitation fee (3-10%) calculated at project award
- **Trust Scores** — weighted credential-based scoring (12A, 80G, FCRA, CSR-1, audit, adverse news, leadership, MCA21)
- **Editable Dashboard** — click-to-edit stat cards for budget tracking
- **Role-Based Access** — separate funder and NGO portals with JWT auth

---

## Production Deployment

- Change `SECRET_KEY` to a strong random value
- Switch `DATABASE_URL` to PostgreSQL with `asyncpg`
- Set `DEBUG=false`
- Run behind a reverse proxy (nginx/Caddy) with HTTPS
- The backend runs on port 8001 by default; adjust the Vite proxy in `frontend/vite.config.ts` if you change it
