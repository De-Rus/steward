use crate::meta::{fk_label_col, humanize, search_columns, table_config};
use crate::sqlval::{ident, Binds};
use crate::state::{AppError, AppState, CurrentUser};
use axum::extract::{Query, State};
use axum::Json;
use serde_json::{json, Value};
use std::collections::HashMap;
use std::sync::Arc;
use std::time::{Duration, Instant};

const PER_TABLE: i64 = 5;
const TOTAL_CAP: usize = 40;
const BUDGET: Duration = Duration::from_secs(8);

pub async fn search_handler(
    State(state): State<Arc<AppState>>,
    user: CurrentUser,
    Query(params): Query<HashMap<String, String>>,
) -> Result<Json<Value>, AppError> {
    let q = params.get("q").map(|s| s.trim().to_string()).filter(|s| !s.is_empty());
    let Some(q) = q else {
        return Ok(Json(json!({ "results": [] })));
    };
    let started = Instant::now();
    let mut results: Vec<Value> = Vec::new();

    for table in state.visible_tables(&user) {
        if results.len() >= TOTAL_CAP || started.elapsed() > BUDGET {
            break;
        }
        let Ok(dbt) = state.readable_table(&user, &table) else { continue };
        let Some(pk) = dbt.pk.clone() else { continue };
        let cfg = table_config(&state, &table);
        let masked = state.masked_columns(&user, &table);
        let cols: Vec<String> = search_columns(dbt, &cfg)
            .into_iter()
            .filter(|c| !masked.contains(c))
            .collect();
        if cols.is_empty() {
            continue;
        }
        let title_col = fk_label_col(dbt);
        let title_col = if masked.contains(&title_col) { pk.clone() } else { title_col };

        let mut binds = Binds::new();
        let n = binds.push(Some(format!("%{q}%")));
        let ors: Vec<String> = cols
            .iter()
            .map(|c| format!("{}::text ILIKE ${n}", ident(c)))
            .collect();
        let mut where_sql = format!("({})", ors.join(" OR "));
        if let Some(rf) = state.row_filter(&user, &table) {
            where_sql = format!("{where_sql} AND ({rf})");
        }
        let sql = format!(
            "SELECT {}::text AS pk, {}::text AS title FROM {} t WHERE {where_sql} LIMIT {PER_TABLE}",
            ident(&pk),
            ident(&title_col),
            state.qualified_of(dbt),
        );

        let hits: Vec<(Option<String>, Option<String>)> = async {
            let mut tx = state.pool_of(dbt).begin().await.ok()?;
            sqlx::query("SET TRANSACTION READ ONLY").execute(&mut *tx).await.ok()?;
            sqlx::query("SET LOCAL statement_timeout = '2000ms'").execute(&mut *tx).await.ok()?;
            let mut q = sqlx::query_as::<_, (Option<String>, Option<String>)>(&sql);
            for v in &binds.values {
                q = q.bind(v.as_deref());
            }
            q.fetch_all(&mut *tx).await.ok()
        }
        .await
        .unwrap_or_default();

        let label = cfg.label.clone().unwrap_or_else(|| humanize(&table));
        for (pkv, titlev) in hits {
            if results.len() >= TOTAL_CAP {
                break;
            }
            let Some(pkv) = pkv else { continue };
            results.push(json!({
                "table": table,
                "label": label,
                "pk": pkv,
                "title": titlev,
            }));
        }
    }

    Ok(Json(json!({ "results": results })))
}
