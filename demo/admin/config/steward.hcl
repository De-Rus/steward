brand = "Acme Admin"
per_page = 50

source "main" {
  type    = "postgres"
  url     = "env:STEWARD_DB"
  primary = true
}
