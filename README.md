# Mini Inventory System

A small inventory manager: **Django REST Framework** API + **React (TypeScript)** app.

**Live demo:** https://mini-inventory-sigma.vercel.app/login (login: `demo` / `demo12345`)

> The API runs on Render's free tier, so the first sign-in may take up to a minute while the server wakes up. The login page shows progress during that time. Demo data resets on restart.

## Screenshots

| Login | Products |
|-------|----------|
| ![Login page](docs/login.webp) | ![Products page](docs/product.webp) |

| Add / Update product (mobile) | Products (mobile) |
|-------------|--------|
| ![Add product form](docs/add.webp) | ![Mobile view](docs/mobile.webp) |

## Features

- Product CRUD with pagination, category filter and debounced name search
- JWT login with a show/hide password toggle and server-wake progress on the login page
- Validation on both sides; server errors are shown on the matching form field
- Delete with a confirmation step
- Loading, error and empty states, plus a global loading bar
- Responsive layout (table on desktop, cards on mobile)
- Prices in AED and dates in UAE time (Asia/Dubai)
- Excel export of the filtered product list
- Bonus: Docker Compose, pytest and Vitest tests, TanStack Query, GitHub Actions CI, live deployment

## Test login

| Username | Password    |
|----------|-------------|
| `demo`   | `demo12345` |

Created by the `seed` command (23 products across 6 categories). The credentials are also shown on the login page.

---

## Run it

### Option A: Docker Compose (one command)

Verified on Windows 10 with Docker Desktop.

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
python -m venv .venv && source .venv/bin/activate    # Windows: .venv\Scripts\activate
pip install -r requirements-dev.txt
python manage.py migrate
python manage.py seed            # demo data + demo user (use --reset to wipe first)
python manage.py runserver       # http://localhost:8000
```

**Frontend** (Node 22+):

```bash
cd frontend
npm install
npm run dev                      # http://localhost:5173
```

In dev, Vite proxies `/api` to `localhost:8000`, so no CORS setup is needed.

### Tests

```bash
cd backend  && pytest            # 25 tests
cd frontend && npm test          # 35 tests (needs Node 22+)
cd frontend && npm run typecheck
```

---

## API

All endpoints except login need the header `Authorization: Bearer <access token>`.

| Method | Endpoint | Notes |
|---|---|---|
| POST | `/api/auth/token/` | `{username, password}` → `{access, refresh}` (limited to 10/min per IP) |
| POST | `/api/auth/token/refresh/` | `{refresh}` → `{access}` |
| GET | `/api/categories/` | Read-only list for dropdowns |
| GET | `/api/products/` | `?page=`, `?page_size=` (max 100), `?category=<id>`, `?search=<name>`, `?is_active=`, `?ordering=price,-created_at` |
| POST | `/api/products/` | Create |
| GET / PUT / PATCH / DELETE | `/api/products/<id>/` | |

Validation errors return `400`, for example `{"price": ["Price must be greater than 0."]}`.

## Project layout

```
backend/
  config/            settings, urls
  inventory/         models, serializers, viewsets, filters, pagination, seed command
  inventory/tests/   pytest suite
frontend/src/
  api/               axios client (with token refresh), endpoint functions
  auth/              AuthContext, ProtectedRoute
  components/        ProductTable, ProductForm, Modal, ConfirmDialog, Pagination, LoadingBar, States
  hooks/             useDebounce, TanStack Query hooks
  lib/               validation (zod), error parsing, formatting (AED, UAE time), Excel export
  pages/             LoginPage, ProductsPage
docker-compose.yml   db (Postgres) + backend (gunicorn) + frontend (nginx)
```

## Deployment

- **Frontend:** Vercel, redeployed on every push to `main`.
- **API:** Render free tier (sleeps when idle, so the first request can be slow).

---

## Key technical decisions

**Backend**
- **JWT (`simplejwt`):** stateless and works well with a separate React app. Access token 30 min, refresh token 1 day. Login is rate-limited.
- **Validation in the serializer and the database:** serializers give clear messages; a `CHECK (price > 0)` constraint and `PositiveIntegerField` protect the data even if the API is bypassed.
- **`select_related("category")`** avoids one extra query per row (N+1).
- **`on_delete=PROTECT`** on the category link, so deleting a category cannot silently delete its products.
- **`DecimalField` for price**, never float, to avoid rounding errors with money.
- **Page size capped at 100** so a client cannot request the whole table.
- **Seed as a management command** (safe to run repeatedly) so the demo user gets a properly hashed password.
- **SQLite by default, Postgres in Docker** (when `POSTGRES_DB` is set): easy local setup, production-like Compose.

**Frontend**
- **TanStack Query** handles caching, loading states and refetching; saving or deleting refreshes the product list automatically.
- **Debounced search (400 ms)** so the API is called once after typing stops, not on every key press.
- **react-hook-form + zod** for form validation; server errors are mapped back onto the matching fields.
- **Axios interceptor** adds the token and refreshes it once on a 401 (several failed requests share one refresh).
- **Responsive without duplicate markup:** one table that CSS turns into cards on small screens.
- **Small hand-written confirmation modal** (keyboard and focus handling) instead of a UI library.
- **Excel export in the browser** (`exceljs`, loaded only on click), using the same search and category filters as the table.
- **Edge cases handled:** deleting the last item on a page moves back one page, and the cache is cleared on logout.

---

## What I would improve with more time

**Inventory flow (stock in / stock out)**
- Record every stock change as a movement (stock in, stock out, adjustment) with date, quantity, reason and user, instead of editing the stock number directly.
- Show a movement history for each product, so it is clear how the current stock was reached.
- Low-stock and out-of-stock alerts, with a configurable minimum level per product.

**Products and UI**
- Product images with size and type validation.
- Sortable columns (the API already supports `?ordering=`), and filters and page saved in the URL.
- Category management screen.
- Optimistic updates with an undo option for delete.

**Reports**
- A simple stock summary: total products, total items, stock value and low-stock count.
- Printable report and server-side CSV/Excel export for large tables.

**Quality and security**
- Playwright end-to-end test for login → add/edit/delete → export, and coverage reporting in CI.
- Move the refresh token from `localStorage` to an `httpOnly` cookie, with token rotation.
- Production hardening: HTTPS settings, secrets management, logging and a health-check endpoint.