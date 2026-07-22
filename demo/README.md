# Acme demo

A self-contained example so steward has something to show on first run — and a
worked reference for how a config directory is laid out.

- [`seed.sql`](seed.sql) — schema + data for a small SaaS: `customers`,
  `products`, `orders`, `order_items`, `subscriptions` (FKs, enum-like status
  columns, money, timestamps, and one secret `api_token` column to demonstrate
  field masking).
- [`admin/`](admin/) — the config directory (`--config`):
  - `config/` — the reserved globals: `steward.hcl` (brand + the `main`
    Postgres source), `auth.hcl` (a read-only `support` role that masks
    `subscriptions.api_token`), `dashboard.hcl` (stat tiles + a bar chart + a
    recent-orders table).
  - `customers/`, `catalog/`, `sales/` — one folder per sidebar group, each with
    a `_group.hcl` and a `.hcl` per table (currency formatting, filters, and
    `update` actions like "Mark shipped").

Run it from the repo root with `docker compose up`, then open
http://localhost:8686/manage (`admin@acme.test` / `acme-admin`).
