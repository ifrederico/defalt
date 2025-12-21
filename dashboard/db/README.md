# Dashboard DB schema

This folder contains the Postgres schema used by the dashboard service.

## Apply on Railway (Postgres)

Option A — Railway CLI (recommended)

1) Log in and link the project:
```bash
railway login
railway link
```

2) Connect to the Postgres service (opens `psql`):
```bash
railway connect <POSTGRES_SERVICE_NAME>
```

3) From the `psql` prompt, apply the schema:
```sql
\i /absolute/path/to/defalt/dashboard/db/schema.sql
```

Option B — Direct `psql` via Railway TCP proxy

1) Enable the TCP proxy in Railway and copy the proxy host/port.
2) Run:
```bash
psql "postgres://USER:PASSWORD@PROXY_HOST:PROXY_PORT/DBNAME" -f dashboard/db/schema.sql
```

## Apply locally

From the repo root:
```bash
psql "${DATABASE_URL}" -f dashboard/db/schema.sql
```

If you don't use `DATABASE_URL`, pass a full connection string:
```bash
psql "postgres://USER:PASSWORD@HOST:PORT/DBNAME" -f dashboard/db/schema.sql
```

## Notes

- If you see `function gen_random_uuid does not exist`, run this once:
```sql
CREATE EXTENSION IF NOT EXISTS pgcrypto;
```
- Re-running the schema is safe (uses `IF NOT EXISTS`).
