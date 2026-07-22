# Groups & navigation

The sidebar is built from your folder layout. Each folder under the config root
(other than the reserved `config/`) is a navigation group, and the table configs
inside it are that group's entries.

## `_group.hcl`

A folder becomes a labeled sidebar group by carrying a `_group.hcl`. The folder
name is the group's stable key (its slug); the file supplies presentation and
ordering.

```hcl
# market-data/_group.hcl
label       = "Market data"
icon        = "trending-up"
order       = 3
table_order = ["instruments", "exchanges", "universes", "funding_rates", "logos"]
```

| Key | Type | Description |
| --- | --- | --- |
| `label` | string | The group's display name. **Required.** |
| `icon` | string | A [lucide](https://lucide.dev) icon name (`trending-up`, `bot`, `package`, …). |
| `order` | number | Sort key among groups (lower first). Defaults to `0`. |
| `table_order` | list | Explicit ordering of the tables within the group. Unlisted tables follow. |

## Ordering

- **Groups** sort by `order`, then alphabetically by `label` to break ties.
- **Tables within a group** follow `table_order` when present; any table not
  listed there is appended after the ordered ones.

## Grouping rules

- A folder may hold only a `_group.hcl` — an empty, table-less group is valid.
- A folder without a `_group.hcl` still groups its tables, but under the folder
  name with no custom label/icon.
- **Root-level table files** (a `.hcl` directly under the config root, not in any
  folder) render in an "Ungrouped" section.
- Folders whose name begins with an underscore (like `config`) are never sidebar
  groups. A `_group.hcl` in such a folder is ignored with a warning.

## Moving a table between groups

A table's identity and its URL are its **stem** (the filename), never its group.
Moving `instruments.hcl` from one folder to another changes which sidebar group
it appears in but does not change its identity or any deep links to its records.

::: warning Renaming a group changes custom page URLs
Custom pages are identified as `<group-slug>/<page-slug>` (both folder-derived).
Renaming a group folder therefore changes the ids of any pages inside it and
breaks existing deep links to those pages. Table record links are unaffected.
:::

## The in-app groups editor

The visual builder can create groups, rename them, reorder groups and tables,
and move tables between groups — all of which just rewrite `_group.hcl` files and
relocate table configs on disk. When the config bundle is mounted read-only,
these edits are disabled (see [Deployment](/deployment#writable-config-volume)).
