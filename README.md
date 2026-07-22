# steward

Point a single binary at your existing Postgres and get a Django-admin-quality
panel. No framework, no ORM, no Node runtime — your database schema is the
source of truth, and customization is code you version, not a GUI you click.

```bash
git clone … && cd steward
docker compose up            # → populated demo on http://localhost:8686/manage
```

- **Opt-in tables**: the admin exposes only the tables you register with a
  config file — an introspected-but-unconfigured table is not part of the panel.
  Once registered, columns, PKs and FKs are introspected: lists get pagination,
  search, sorting and sane widgets (FKs as links, enums as badges, timestamps
  localized). Views and PK-less tables degrade to read-only.
- **Code-first customization**: a directory of per-table HCL files — list
  columns, search fields, filters (incl. raw-SQL filters), field widgets,
  readonly/masked fields, inline child tables, bulk actions (declarative
  `UPDATE`s or HMAC-signed webhooks into your real backend).
- **Auth, roles, audit**: built-in users/sessions (stored in steward's own
  SQLite file — your database is never written to unless you edit a row),
  per-table/per-field/row-level permissions, and an audit log of every write
  with before/after diffs.
- **Dashboards**: SQL-defined stat tiles, charts and tables, evaluated
  read-only.

## Try the demo

A self-contained "Acme" dataset (customers, products, orders, subscriptions)
with a ready-made config, so you can click around before pointing steward at
your own database:

```bash
docker compose up
```

Then open **http://localhost:8686/manage** and log in with
`admin@acme.test` / `acme-admin`. The stack is `db` (Postgres, auto-seeded from
[`demo/seed.sql`](demo/seed.sql)) + `steward` (built from this repo, config in
[`demo/admin/`](demo/admin/)). Nothing is written to your machine outside the
containers; `docker compose down -v` removes everything.

## Point it at your own database

steward is config-first: a table appears only once you give it a `.hcl` file,
and the database it reads is declared as a `source`. A minimal `config/steward.hcl`:

```hcl
source "main" {
  type    = "postgres"
  url     = "env:STEWARD_DB"   # or a literal postgres:// url
  primary = true
}
```

```bash
export STEWARD_DB=postgres://user:pass@host:5432/mydb
export STEWARD_SECRET_KEY=$(openssl rand -hex 32)
export STEWARD_ADMIN_EMAIL=you@example.com STEWARD_ADMIN_PASSWORD=change-me
steward serve \
  --config ./admin --data ./steward-data \
  --base-path /manage --listen 0.0.0.0:8686
```

`--db postgres://…` / `STEWARD_DB` overrides the primary source's URL, so the
same config runs against staging or prod by swapping one env var.

`--config` points at a directory of HCL files:

```
admin/
├── config/              # reserved framework folder — globals + shared assets
│   ├── steward.hcl     #   brand, defaults
│   ├── auth.hcl        #   roles, field masking, row-level filters
│   ├── dashboard.hcl   #   widgets
│   └── widgets/        #   shared widget-kind JS (minibar.js, sparkline.js, …)
├── market-data/        # a folder IS a sidebar group
│   ├── _group.hcl      #   its label, icon (lucide), order
│   ├── instruments.hcl #   one file per table you want to customize
│   └── exchanges.hcl
├── bots-live/
│   ├── _group.hcl
│   └── bots.hcl
└── overview/
    ├── _group.hcl
    └── ops/            # a custom page: its own folder holding a page.hcl
        └── page.hcl    #   slug = folder name, group = enclosing folder
```

The `admin/` root reads exactly like the sidebar: one folder per nav group, plus
the reserved `config/` folder. `config/` is never a sidebar group and is never
scanned for table configs — it holds only the three globals
(`steward.hcl`/`auth.hcl`/`dashboard.hcl`) and the served `widgets/` assets.

The folder a table's `.hcl` lives in is its sidebar group — the single source of
truth for grouping. Each folder carries a `_group.hcl` (`label`, `icon`, `order`);
groups sort by `order` then `label`. A folder may hold only a `_group.hcl` (an
empty, table-less group). Root-level table files land in an "Ungrouped" section.

Custom pages (JS-plugin modules) follow the same folder-as-group rule: each is a
subfolder with a `page.hcl`, and the page's slug is that folder's name while its
group is the enclosing group folder. See the [configuration docs](docs/configuration/pages-and-queries.md).

The admin is an allowlist: only tables with a `.hcl` file are exposed. To add a
table, create its config (an empty file is enough — it then renders with
introspected defaults); an admin can author one in-app from the generated
template. Unconfigured tables are absent from the nav and 404 by direct URL, so
there is no denylist to maintain. See [`docs/`](docs/) for the full option
surface and [`demo/admin/`](demo/admin/) for a worked example config.

## Configuration sketch

```hcl
# admin/instruments.hcl
list {
  columns = ["symbol", "exchange", "asset_class", "active"]
  search  = ["symbol", "name"]
  filters = ["asset_class", "active", "stale"]
  sort    = "-id"

  filter_def "stale" {
    label = "No recent price"
    sql   = "id NOT IN (SELECT instrument_id FROM prices WHERE ts > now() - interval '7 days')"
  }
}

field "asset_class" {
  widget = "badge"
  params = { colors = { crypto = "orange", stock = "blue" } }
}

edit {
  readonly = ["id", "source", "symbol"]
}

action "deactivate" {
  label   = "Deactivate"
  kind    = "update"
  set     = { active = false }
  confirm = "Deactivate {count} instruments?"
}
```

## Build

```bash
cd ui && pnpm install && pnpm build && cd ..   # SPA, embedded into the binary
cargo build --release                          # → target/release/steward
```

## Security model

- Session cookies (HttpOnly, SameSite=Lax) are HMAC-SHA256-signed with the
  app secret key; a tampered or unsigned cookie is treated as no session.
  The signature is verified before any DB session lookup.
- **Secret key** — steward's signing/encryption root. **REQUIRED**: steward
  refuses to start without it. Resolved at startup by precedence:
  `STEWARD_SECRET_KEY` env → `[steward].secret_key` in `config/steward.hcl`
  (env-interpolated, e.g. `secret_key = "env:STEWARD_SECRET_KEY"`). Prefer the
  env var or `${...}` interpolation — never commit a literal key to config.
  Rotating the key invalidates all existing sessions (users re-login once).
- Passwords are argon2id; login is rate-limited per IP.
- Every SQL identifier is validated against the introspected schema; every
  value is a bound parameter. Raw-SQL fragments exist only in your config
  files, which live in your repo and are trusted like code.
- Dashboard SQL runs in `READ ONLY` transactions with a statement timeout.
- Webhook actions are signed (`X-Steward-Signature`, HMAC-SHA256 with
  `STEWARD_WEBHOOK_SECRET`).

MIT licensed.
