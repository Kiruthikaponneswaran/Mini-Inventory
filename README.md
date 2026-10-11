# Mini Inventory System
**Live demo:** https://mini-inventory-sigma.vercel.app (login: `demo` / `demo12345`)
The API runs on Render's free tier, so the first request may take about a minute to wake up. Data resets on restart.

A small inventory manager: **Django REST Framework** API + **React (TypeScript)** SPA.

- Products CRUD with pagination, category filter and debounced name search
- JWT authentication
- Validation on both sides, with server errors mapped back onto the form fields
- Loading / error / empty states everywhere, responsive layout (table on desktop, cards on mobile)
- Bonus: Docker Compose, backend tests (pytest), frontend tests (Vitest + React Testing Library), TanStack Query, GitHub Actions CI

## Test login

| Username | Password    |
|----------|-------------|
| `demo`   | `demo12345` |

Created by the `seed` command (23 products across 6 categories). The credentials are also shown on the login page.

---

## Run it

### Option A: Docker Compose (everything, one command)

```bash
docker compose up --build
```

- App: http://localhost:8080
- API: http://localhost:8000/api/ · Django admin: http://localhost:8000/admin/

The backend container runs migrations and seeds demo data on start (disable with `SEED_ON_START=0`).

### Option B: local development

**Backend** (Python 3.12, uses SQLite, no other setup):

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements-dev.txt
python manage.py migrate
python manage.py seed            # demo data + demo user (use --reset to wipe first)
python manage.py runserver       # http://localhost:8000
```

**Frontend** (Node 20+):

```bash
cd frontend
npm install
npm run dev                      # http://localhost:5173
```

In dev, Vite proxies `/api` to `localhost:8000`, so there is no CORS configuration to fiddle with.

### Tests

```bash
cd backend  && pytest            # 25 tests
cd frontend && npm test          # 35 tests
cd frontend && npm run typecheck
```

---

## API

All endpoints except login require `Authorization: Bearer <access token>`.

| Method | Endpoint | Notes |
|---|---|---|
| POST | `/api/auth/token/` | `{username, password}` → `{access, refresh}` (rate-limited, 10/min per IP) |
| POST | `/api/auth/token/refresh/` | `{refresh}` → `{access}` |
| GET | `/api/categories/` | Read-only, unpaginated (feeds dropdowns) |
| GET | `/api/products/` | `?page=`, `?page_size=` (max 100), `?category=<id>`, `?search=<name>`, `?is_active=`, `?ordering=price,-created_at` |
| POST | `/api/products/` | Create |
| GET / PUT / PATCH / DELETE | `/api/products/<id>/` | |

Validation errors come back as `400` with DRF's standard shape: `{"price": ["Price must be greater than 0."]}`.

## Project layout

```
backend/
  config/            settings (env-driven), urls
  inventory/         models, serializers, viewsets, filters, pagination, seed command
  inventory/tests/   pytest suite
frontend/src/
  api/               axios client (+ token refresh), endpoint functions
  auth/              AuthContext, ProtectedRoute
  components/        ProductTable, ProductForm, Modal, ConfirmDialog, Pagination, States
  hooks/             useDebounce, TanStack Query hooks
  lib/               validation (zod), error parsing, formatting
  pages/             LoginPage, ProductsPage
docker-compose.yml   db (Postgres) + backend (gunicorn) + frontend (nginx)
```

---

## Key technical decisions

**Backend**
- **JWT via `simplejwt`.** Stateless, works naturally with a separate SPA, and gives access/refresh tokens out of the box. Access tokens last 30 min, refresh tokens 1 day. Login is throttled to slow down password guessing.
- **Validation in the serializer *and* the DB.** `validate_price` / `validate_stock` give friendly messages; a `CHECK (price > 0)` constraint and `PositiveIntegerField` protect the data if anything bypasses the API (admin, shell, scripts).
- **`select_related("category")`** on the queryset so `category_name` doesn't cause an N+1 query per row.
- **`on_delete=PROTECT`** for the category FK: silently cascading away products when a category is deleted seemed more dangerous than refusing.
- **Prices are `DecimalField`** (serialised as strings), never floats.
- **Page size capped at 100** so a client can't ask for the whole table.
- **Categories are read-only** over the API since the spec only asks for product CRUD; they're managed via admin/seed.
- **Seed as a management command** (idempotent via `update_or_create`) rather than a JSON fixture: it also creates the demo user with a properly hashed password, and is safe to run on every container start.
- **SQLite by default, Postgres when `POSTGRES_DB` is set**, so local setup is zero-config while Compose runs something production-like.

**Frontend**
- **TanStack Query** for server state: caching, request de-duplication, and `keepPreviousData` so the table doesn't flash a spinner while paging or typing. Mutations invalidate the `["products"]` key.
- **Debounce in a small `useDebounce` hook** (400 ms). The input is controlled and instant; only the debounced value feeds the query key. Changing search or category resets to page 1.
- **react-hook-form + zod** for the form. Price/stock stay strings in the form (instead of `type="number"`) so *I* control the error messages and avoid browser quirks, and convert to numbers only when building the payload.
- **Server errors are mapped back onto the fields** (`setError`), so rules enforced only by the API still show up inline.
- **Axios interceptor with single-flight token refresh**: on a 401 it refreshes once, retries the request, and if refresh fails it logs the user out. Concurrent 401s share one refresh call.
- **Responsive without duplicate markup**: one semantic `<table>` that CSS turns into cards below 720px, using `data-label` for captions.
- **Small hand-written `Modal`** (focus trap, Esc, focus restore, `role="dialog"`/`alertdialog`) instead of a UI-kit dependency, to keep the bundle small (~150 kB gzipped total).
- **Edge cases handled:** deleting the last row of a page moves back a page; a stale page number (404) falls back; delete failures show inside the confirmation dialog; the cache is cleared on logout.

## What I'd improve with more time

- **Token storage.** Tokens are in `localStorage`, which is simple but readable by any XSS. I'd move the refresh token to an `httpOnly`, `SameSite` cookie, and add refresh-token rotation/blacklisting on logout.
- **Optimistic updates** for delete/edit, plus a "undo" toast.
- **Soft delete** (or archiving via `is_active`) instead of hard delete, and an audit trail of who changed stock.
- **Roles/permissions** (viewer vs. editor), and per-user data if this became multi-tenant.
- **Sortable columns** in the UI (the API already supports `?ordering=`), filter by active/inactive, and persisting filters/page in the URL.
- **Category management UI**, and a unique constraint on product name per category.
- **E2E tests** (Playwright) for the full login → CRUD flow, plus coverage reporting in CI.
- **Production hardening:** HTTPS settings (HSTS, secure cookies), real secrets management, structured logging, and a health-check endpoint.
- **Live deployment** (e.g. Render/Fly for the API + DB, static hosting for the SPA). The Compose setup is the starting point for this.
