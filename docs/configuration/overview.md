# Configuration overview

steward is configured by a directory of [HCL](https://github.com/hashicorp/hcl)
files. The directory is a self-contained bundle — config, roles, dashboards,
and any custom widget/page code all live inside it — so the whole panel is one
portable, versionable folder you point `--config` at.

There is an in-app visual builder that edits this same config, but it writes the
identical HCL. The files are the source of truth.

## Folders are navigation groups

The layout of the config directory *is* the layout of the sidebar. One folder
per navigation group, plus the reserved `config/` folder for globals:

```
admin/
├── config/                 # reserved — globals + shared assets, never a group
│   ├── steward.hcl        #   brand, theme, database, defaults
│   ├── auth.hcl           #   roles & permissions
│   ├── dashboard.hcl      #   dashboard widgets
│   └── widgets/           #   shared custom-widget JS (served at /static)
│       ├── sparkline.js
│       ├── statuspill.js
│       └── minibar.js
├── market-data/           # a folder IS a sidebar group
│   ├── _group.hcl         #   its label, icon, order, table order
│   ├── instruments.hcl    #   one file per exposed table
│   └── exchanges.hcl
├── bots-live/
│   ├── _group.hcl
│   └── bots.hcl
└── overview/
    ├── _group.hcl
    └── ops/               # a custom page: its own folder with a page.hcl
        ├── page.hcl       #   slug = folder name, group = enclosing folder
        ├── ops.js         #   the page module
        └── queries.hcl    #   named read-only queries the page calls
```

The folder a table's `.hcl` lives in is its sidebar group — the single source of
truth for grouping. Config files are discovered recursively; load order is
deterministic (files sorted by path).

- A **table config** is any `<table>.hcl` whose stem matches a real table.
- A folder's **`_group.hcl`** names and orders that sidebar group.
- A **`page.hcl`** in its own subfolder is a custom full-screen page.
- A **`queries.hcl`** in any folder contributes named read-only queries.
- Root-level table files (directly under `admin/`) land in an "Ungrouped"
  section.

## The reserved `config/` folder

`config/` is special: it is never a sidebar group and is never scanned for table
configs. It holds exactly three global files plus a `widgets/` asset folder:

| File | Contents |
| --- | --- |
| `config/steward.hcl` | Brand, logo, locale, `per_page`, the secret key, `theme { }`, and the `database { }` block. |
| `config/auth.hcl` | `role "…" { }` blocks — the permission model. See [Roles & permissions](/roles-and-permissions). |
| `config/dashboard.hcl` | The home dashboard's `widget { }` blocks. See [Dashboard](/configuration/dashboard). |
| `config/widgets/*.js` | Shared custom-widget web components, served at `/static/config/widgets/`. See [Pages & queries](/configuration/pages-and-queries). |

Putting anything else in `config/` is a loud load error. Folders whose name
starts with an underscore are never treated as sidebar groups.

## `config/steward.hcl` — globals

```hcl
brand      = "Acme Admin"
brand_logo = "https://acme.example/logo.png"
per_page   = 100
locale     = "en"

# The signing secret. Prefer env interpolation over a literal.
secret_key = "env:STEWARD_SECRET_KEY"

theme {
  preset = "steward"          # "steward" (default) | "django"
  accent = "hsl(33 100% 50%)"
  mode   = "auto"             # "light" | "dark" | "auto"
}

database {
  url     = "env:STEWARD_DB"
  schemas = ["public"]
  engine  = "postgres"        # only "postgres" is supported today
}
```

Top-level `[steward]` keys:

| Key | Type | Description |
| --- | --- | --- |
| `brand` | string | Panel name, shown in the header. Defaults to `steward`. |
| `brand_logo` | string | Logo URL, data URL, or a bundle asset filename served under `/static/`. |
| `locale` | string | UI locale hint. |
| `strings` | map | Override individual UI strings (`{ "key" = "value" }`). |
| `per_page` | number | Default list page size (a table's `list.per_page` overrides it). |
| `secret_key` | string | Session-signing root. Supports `env:`/`${}`. Overridden by `STEWARD_SECRET_KEY`. **Required** somewhere. |
| `theme { }` | block | Theme preset, accent, per-mode CSS token overrides, logos. |
| `database { }` | block | Connection URL, schema(s), engine. |

### `theme { }`

| Key | Description |
| --- | --- |
| `preset` | Named base theme: `steward` (default) or `django`. |
| `accent` / `accent_btn` | Shorthand accent overrides (win over the preset). |
| `light` / `dark` | Per-mode maps of CSS token → value. Keys are steward token names without the `--` prefix (`page`, `surface`, `ink`, `accent`, `good`, `critical`, …). |
| `mode` | Force `light`, `dark`, or `auto` (default). |
| `logo_light` / `logo_dark` | Per-mode brand logo, overriding `brand_logo` for that mode. |

### `database { }`

| Key | Description |
| --- | --- |
| `url` | Connection URL. Supports `env:NAME` / `${NAME}`. |
| `schema` | Single-schema shorthand. |
| `schemas` | List of schemas — every one is introspected. |
| `engine` | Reserved for future engines; must be `postgres`. |

## Environment interpolation

Any config value of the form `env:NAME` or `${NAME}` is replaced at load time
with the environment variable `NAME`. Use it to keep secrets out of committed
config:

```hcl
database {
  url = "env:DATABASE_URL"
}

secret_key = "${STEWARD_SECRET_KEY}"
```

## Validation & hot-reload

Config is validated as it loads, and again on every in-app edit:

- **Unknown keys are rejected.** Every block uses strict parsing, so a typo like
  `filterz = [...]` is a load error, not a silent no-op.
- **Duplicate labeled blocks are rejected** — two `field "x"` blocks, or two
  configs for the same table, fail loudly rather than silently merging.
- **`format` and `color` are validated** against their allowed vocabularies
  (see [Fields & widgets](/configuration/fields-and-widgets)).
- **Named queries must be unique** across the whole bundle.

When you edit config through the in-app builder, steward **hot-swaps** the live
config with no restart. A bad edit can never replace the running config: writes
are trial-parsed first, and a failed reload restores the previous state.

::: tip Round-tripping through the visual builder drops comments
The builder regenerates canonical HCL from the parsed model. If you keep
comments or bespoke formatting in a file, edit it as raw HCL (in your repo or the
raw editor), not through the visual form.
:::

## Next

- **[Tables](/configuration/tables)** — every block in a `<table>.hcl`.
- **[Groups & navigation](/configuration/groups-and-nav)** — `_group.hcl` in detail.
