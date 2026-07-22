# Dashboard

The home dashboard is a grid of SQL-defined panels declared in
`config/dashboard.hcl`. Every panel's SQL runs read-only, so the dashboard can
never mutate your data.

```hcl
# config/dashboard.hcl
columns = 4

panel {
  type          = "stat"
  label         = "Signals 24h"
  category      = "Summary"
  sql           = "SELECT count(*) AS v FROM markets.bot_signals WHERE created_at > now() - interval '24 hours'"
  compare_sql   = "SELECT count(*) AS v FROM markets.bot_signals WHERE created_at BETWEEN now() - interval '48 hours' AND now() - interval '24 hours'"
  compare_label = "prev 24h"
  spark         = "SELECT count(*) AS v FROM markets.bot_signals WHERE created_at > now() - interval '24 hours' GROUP BY date_trunc('hour', created_at) ORDER BY date_trunc('hour', created_at)"
  good_when     = "up"
}
```

## Grid

| Key | Type | Description |
| --- | --- | --- |
| `columns` | number | Number of grid columns the dashboard lays out. |

Panels flow into the grid in declaration order. Each may set its own `w` (column
span) and `h` (row span), and a `category` used to group panels under headings.

## Panel types

Set `type` to one of `stat`, `chart`, `table`, `iframe`.

### `stat` — a single number

A big-number tile with an optional period-over-period comparison and an inline
sparkline.

```hcl
panel {
  type          = "stat"
  label         = "Revenue 14d"
  category      = "Summary"
  format        = "money"
  sql           = "SELECT coalesce(sum(amount),0) AS v FROM markets.subscription_events WHERE created_at > now() - interval '14 days'"
  compare_sql   = "SELECT coalesce(sum(amount),0) AS v FROM markets.subscription_events WHERE created_at BETWEEN now() - interval '28 days' AND now() - interval '14 days'"
  compare_label = "prev 14d"
  spark         = "SELECT coalesce(sum(amount),0) AS v FROM ... GROUP BY date_trunc('day', created_at) ORDER BY 1"
  good_when     = "up"
  alert_above   = 20
}
```

| Key | Description |
| --- | --- |
| `sql` | Returns a single numeric column `v` — the headline value. |
| `format` | `number`, `money`, `percent`, or `duration`. |
| `compare_sql` | A second `v` query for the comparison baseline; the tile shows the delta. |
| `compare_label` | Label for the comparison period (e.g. `prev 24h`). |
| `spark` | A query returning an ordered series of `v` values, drawn as an inline sparkline. |
| `good_when` | Which delta direction is favorable: `up` (default) paints a rising value green; `down` paints a falling value green (for errors, latency, …). |
| `alert_above` / `alert_below` | Thresholds that flag the tile as warning/critical. |

### `chart` — a time or category series

```hcl
panel {
  type     = "chart"
  label    = "Revenue per day (30d)"
  category = "Trends"
  format   = "money"
  chart    = "area"          # "line" | "bar" | "area"
  sql      = "SELECT date_trunc('day', created_at) AS t, coalesce(sum(amount),0) AS v FROM markets.subscription_events WHERE created_at > now() - interval '30 days' GROUP BY 1 ORDER BY 1"
}
```

| Key | Description |
| --- | --- |
| `chart` | Chart kind: `line`, `bar`, or `area`. |
| `sql` | Returns `t` (the x label/timestamp) and `v` (the numeric value) per row. |
| `format` | Value formatter for axes and tooltips. |

### `table` — a live query as rows

```hcl
panel {
  type     = "table"
  label    = "Bots needing attention"
  category = "Attention"
  link     = "bots"          # rows deep-link into this table's records
  roles    = ["ops"]
  sql      = "SELECT id, name, status, last_error, last_eval_at FROM markets.bots WHERE status IN ('halted','error') ORDER BY last_eval_at NULLS FIRST LIMIT 10"
}
```

| Key | Description |
| --- | --- |
| `sql` | The rows to display; column set is taken from the query. |
| `link` | A table name — each row links to that table's matching record. |

### `iframe` — an embedded view

```hcl
panel {
  type  = "iframe"
  label = "Grafana"
  url   = "https://grafana.example/d/abc"
}
```

`iframe` panels require a `url` instead of `sql`.

## Common panel keys

| Key | Applies to | Description |
| --- | --- | --- |
| `type` | all | `stat`, `chart`, `table`, `iframe`. **Required.** |
| `label` | all | The panel's title. **Required.** |
| `id` | all | A stable id (assigned automatically if omitted). |
| `category` | all | Heading this panel groups under. |
| `w` / `h` | all | Column / row span in the grid. |
| `roles` | all | Restrict the panel to these roles. Omit → visible to all who can see the dashboard. |
| `link` | table | Target table for row links. |
| `url` | iframe | The embedded URL. |

## Safety

Every dashboard and panel query runs in a **read-only transaction** with a
statement timeout and row caps. The visual dashboard editor additionally offers a
**preview** that runs a panel through the same read-only path and returns the
rendered result without writing anything to config. Like all config, the
dashboard is versioned — see [Architecture](/architecture#config-versioning).
