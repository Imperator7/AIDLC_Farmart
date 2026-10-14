# Supabase guide for Farmart

What Supabase is, which parts of it Farmart uses, and how to set it up for development and production. The database
itself is designed in [`database-design.md`](database-design.md).

## 1. What Supabase is (and what we use)

Supabase is a hosted **PostgreSQL** database with extra services around it. One project gives you:

| Service | What it does | Farmart uses it? |
|---|---|---|
| **Database** | A real Postgres server you can connect to with any Postgres client | **Yes**: all data |
| Connection pooler (Supavisor) | Shares a few database connections between many short-lived clients | **Yes**: Vercel functions connect through it |
| Table editor, SQL editor | Browse and edit data, run SQL in the dashboard | **Yes**, for looking (changes go through migrations) |
| Backups | Copies of the database you can restore | **Yes** (check your plan, section 8) |
| Auth | Sign-up, login, sessions, OAuth | No: we decided to build our own auth (PLAN.md › Decisions) |
| Data API (PostgREST) | An automatic REST API over your tables, called from the browser with the `anon` key | **No, and it must not expose anything** (section 5) |
| Storage | File uploads (images) | Not in the MVP (product images are URLs) |
| Realtime, Edge Functions | Live updates, serverless functions | No |

The important idea: **for Farmart, Supabase is "just Postgres, hosted".** Our Next.js server connects to it like to any
Postgres, through Drizzle. Nothing in the browser talks to Supabase directly.

## 2. Create the project

1. Sign in at https://supabase.com/dashboard (GitHub login is fine) and click **New project**.
2. **Name:** `farmart-prod` (and later a second one, `farmart-dev`, for development; never develop against production).
3. **Database password:** generate a long one and save it in your password manager. You need it in the connection
   string; Supabase won't show it again (you can reset it).
4. **Region:** `Southeast Asia (Singapore)`, the closest to Thai customers and to Vercel's Singapore region (`sin1`).
5. Plan: Free is enough to start. Free projects **pause after a week without activity**; a paused project must be
   resumed from the dashboard, so upgrade before real customers depend on it.

## 3. Connection strings: which one, and why

Click **Connect** at the top of the project dashboard. It shows several strings for the same database:

| String | Port | Use it for |
|---|---|---|
| Direct connection (`db.<ref>.supabase.co`) | 5432 | Long-running servers. IPv6 only unless you buy the IPv4 add-on, so often unreachable from home networks and CI |
| **Session pooler** (`aws-0-ap-southeast-1.pooler.supabase.com`) | 5432 | **Migrations** from your machine (`npm run db:migrate`): IPv4, supports everything migrations need |
| **Transaction pooler** (same host) | **6543** | **The app on Vercel.** Each serverless function borrows a connection only for one transaction, so hundreds of function instances don't exhaust the database's connection limit |

Two things the transaction pooler requires, already in the plan for `src/server/db/client.ts`:
- **No prepared statements:** create the client with `postgres(url, { prepare: false })`.
- **A small pool per function:** `max: 1` to 5. The pooler does the real pooling.

So Farmart uses two environment variables:

```bash
# .env.local (development; git-ignored) and Vercel → Settings → Environment Variables
DATABASE_URL="postgresql://postgres.<ref>:<password>@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres"
DATABASE_MIGRATION_URL="postgresql://postgres.<ref>:<password>@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres"
```

Never commit these (the `.env*` files are already in `.gitignore`), never put them in a `NEXT_PUBLIC_` variable, and
never log them.

## 4. Migrations: how the schema gets into Supabase

The schema lives in code (Drizzle, `src/server/db/schema.ts`), and changes reach the database only through migration
files in `drizzle/`:

```bash
npm run db:generate   # drizzle-kit generate: compares schema.ts with the last migration, writes a new SQL file
npm run db:migrate    # applies every migration not yet applied (drizzle-kit records them in a table)
npm run db:seed       # development data from src/data (dev and preview databases only)
```

Workflow for a schema change: edit `schema.ts` → `db:generate` → read the generated SQL → commit it with the code →
after merge, `db:migrate` runs against production (from your machine or the Vercel build). Don't edit tables in the
Supabase table editor: the next migration wouldn't know about the change.

## 5. Why RLS matters even with our own auth

Every Supabase project has the **Data API** turned on: anyone with the project URL and the public `anon` key can call
`https://<ref>.supabase.co/rest/v1/users` and read **any table in the `public` schema that doesn't have Row Level
Security enabled**. The `anon` key is designed to be public, so "nobody knows it" is no protection.

Farmart never uses the Data API, so we close it twice:
1. **Enable RLS on every table, with no policies** (a migration does this for each table). With RLS on and no policy,
   the `anon` and `authenticated` roles see zero rows. Our server connects as the `postgres` owner role, which
   bypasses RLS, so the app is unaffected.
2. **Turn the Data API off** in Project Settings → Data API (or remove `public` from the exposed schemas), so the
   endpoint doesn't exist at all.

Check it after every new table: Supabase's **Security Advisor** (Database → Advisors) flags tables without RLS.

## 6. Local development

Pick one:

- **A second Supabase project (`farmart-dev`)**: simplest; put its URLs in `.env.local`. Needs internet.
- **Supabase CLI locally** (`npx supabase init`, `npx supabase start`): runs Postgres and Studio in Docker on your
  machine, offline. Needs Docker Desktop.
- **Tests don't need either**: integration tests run on PGlite, an in-process Postgres, with the same migrations.

## 7. Connecting Vercel

1. Vercel project → **Settings → Environment Variables**: add `DATABASE_URL` (transaction pooler, port 6543) for
   **Production**. For **Preview** deployments, use the `farmart-dev` database, never production: a pull request's
   preview must not write real orders.
2. Set the Vercel **function region** to Singapore (`sin1`) so each query doesn't cross an ocean (Settings →
   Functions → Region).
3. Migrations: run `npm run db:migrate` with `DATABASE_MIGRATION_URL` before or as part of the production deploy
   (Phase 1 decides which; the safest start is running it yourself after merging a migration).
4. Supabase also offers a Vercel integration that fills these variables in automatically. It works, but it sets
   several variable names (`POSTGRES_URL`, …); we keep to the two above so the code reads one known name.

## 8. Operating it

- **Backups:** paid plans take daily backups (and point-in-time recovery as an add-on). On the free plan, take your
  own with `pg_dump "$DATABASE_MIGRATION_URL" > backup.sql` before risky changes. Check the current plan details in the
  dashboard; they change over time.
- **Watch:** Reports (CPU, connections, slow queries) and Logs in the dashboard.
- **Secrets:** if the database password leaks, reset it (Project Settings → Database) and update Vercel's variables.
- **Admin access:** the first admin is promoted with `npm run admin:create -- --email you@example.com` (Phase 4), never
  by editing the `users` table by hand.

## 9. Checklist

- [ ] `farmart-prod` and `farmart-dev` projects in Singapore, passwords saved
- [ ] `DATABASE_URL` (6543) and `DATABASE_MIGRATION_URL` (5432) in `.env.local` (dev) and Vercel (prod, preview → dev)
- [ ] Migrations applied; seed run on dev only, plus once on prod for the starting catalog
- [ ] RLS enabled on every table; Data API off; Security Advisor clean
- [ ] Vercel functions in `sin1`
- [ ] Backup plan decided (paid plan or regular `pg_dump`)
