# DeSaga cu Legume

DeSaga cu Legume is a full-stack web application for the local DeSaga store in Cluj-Napoca. It includes a public storefront, product catalog, cart, checkout, customer accounts, support messaging, event pages, and an admin panel for daily operations.

The application is built with SvelteKit. The public UI and admin interface run in Svelte, while private operations are handled through SvelteKit server routes connected to Supabase.

## Features

* Public catalog for seasonal products and jarred products.
* Product cards with multiple images, measurement units, labels such as `NEW` and `PROMOTION`, and real stock status.
* Shopping cart, authenticated checkout, and guest checkout.
* Pickup or delivery options, with delivery rules stored in the database.
* Customer account page, order history, and account deletion/anonymization.
* Support messages linked to orders or general questions.
* Public pages for events, HORECA, contact, legal information, and company details.
* Admin panel for managing products, orders, events, conversations, HORECA requests, users, and operational records.
* Basic operational monitoring for authentication, suspicious activity, and request handling.

## Tech Stack

* SvelteKit 2, Svelte 5, TypeScript, and Vite.
* Supabase Postgres, Supabase Storage, and `@supabase/supabase-js`.
* Custom authentication using server-side sessions and HTTP-only cookies.
* Bootstrap 5 and Bootstrap Icons for the UI.
* Vercel deployment through `@sveltejs/adapter-vercel`.
* Vitest, Testing Library, Playwright browser provider, ESLint, and `svelte-check`.

## Project Structure

```text
src/routes/                  SvelteKit pages and API endpoints
src/routes/admin/            admin panel
src/routes/api/              internal API used by the UI
src/lib/components/          reusable UI components
src/lib/stores/              client stores for products, events, and cart
src/lib/server/              server-side auth, Supabase, validation, and utilities
src/lib/styles/global.css    global styles
static/images/               static page images
supabase/migrations/         database schema and versioned patches
supabase/apply_missing_cloud_migrations.sql
                             SQL bundle for the current cloud schema
scripts/create-clean-zip.mjs clean archive script
```

Static image details are documented in `static/images/README.md`. Product and event images uploaded from the admin panel are stored dynamically in the Supabase `images` bucket.

## Local Requirements

* Node.js 22.x or a version compatible with the dependencies in `package.json`.
* npm.
* A Supabase project with the required database and storage configuration.
* Optional: Supabase CLI for applying database migrations from the terminal.

## Local Setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Fill `.env.local` with the required Supabase and application environment variables.

The Vite development server will show the local URL in the terminal, usually:

```text
http://localhost:5173
```

## Environment Variables

The application expects the environment variables listed in `.env.example`.

For local development, place them in:

```text
.env.local
```

For production deployment, add them in:

```text
Vercel → Project → Settings → Environment Variables
```

Vercel must contain the same required Supabase variables used by the application. Configure them for the correct Vercel environments: Production, Preview, and Development.

## Supabase Database

The Supabase schema is defined through SQL migration files and a catch-up SQL bundle.

For development on a fresh Supabase project, apply these files in order:

1. `supabase/migrations/20260619_reproducible_schema.sql`
2. `supabase/migrations/20260619_admin_panels_patch.sql`
3. `supabase/migrations/20260620_guest_checkout.sql`
4. `supabase/apply_missing_cloud_migrations.sql`

The catch-up bundle contains database functions, cart logic, stock updates, dashboard statistics, shipping rules, cleanup jobs, and recent schema patches required by the current codebase.

Do not assume that only the files inside `supabase/migrations/` are enough for a new environment. The current application also depends on objects from `supabase/apply_missing_cloud_migrations.sql`.

## Applying the Supabase Schema

Using Supabase CLI:

```bash
supabase link --project-ref <project-ref>
supabase db push
```

For the catch-up SQL bundle, run the file contents in the Supabase SQL Editor or with a SQL client connected to the project.

## Minimal Seed Data

The base schema creates:

* `USER` and `ADMIN` roles.
* Product categories: `de-sezon` and `la-borcan`.
* Public Supabase Storage bucket: `images`.

There is no hardcoded admin user or hardcoded admin password.

## Creating an Admin User

1. Create a normal account from `/cont`.
2. Run this in the Supabase SQL Editor:

```sql
select public.grant_admin_role(user_id)
from public.users
where email = 'admin-email@example.com';
```

3. Log in through `/admin/login`.

## Useful Commands

```bash
npm run dev        # local Vite server
npm run check      # svelte-kit sync + svelte-check
npm run lint       # ESLint
npm run build      # production build
npm run preview    # serve the production build locally
npm test           # Vitest in --run mode
npm run zip:clean  # clean archive in dist/
```

If browser tests require Playwright binaries:

```bash
npx playwright install
```

## Deployment

The project is configured for Vercel through `svelte.config.js` using the Vercel adapter.

Deployment checklist:

1. Apply the complete Supabase schema, including `supabase/apply_missing_cloud_migrations.sql`.
2. Add the required environment variables in Vercel.
3. Create or promote an admin account.
4. Run a production build locally:

```bash
npm run build
```

Recommended production configuration:

```text
NODE_ENV=production
TRUSTED_PROXY=vercel
SECURITY_ENFORCE_HTTPS=true
```

After pushing to GitHub, Vercel can automatically build and deploy the project from the configured production branch.

## Data Handling

Account deletion through `DELETE /api/user` anonymizes the user record and closes active sessions.

Orders and support conversations are retained for operational and accounting purposes. The privacy policy should stay aligned with the actual application behavior.

## Periodic Operations

Periodic cleanup jobs are defined in:

```text
supabase/apply_missing_cloud_migrations.sql
```

The cleanup logic handles expired sessions, old request records, abandoned carts, closed conversations, and related operational data.

Check scheduled jobs:

```sql
select * from cron.job;

select *
from cron.job_run_details
order by start_time desc
limit 20;
```

Run a cleanup function manually:

```sql
select public.run_cleanup_sessions();
```

The delivery rule is stored in:

```text
public.app_shipping_rules
```

Example update:

```sql
update public.app_shipping_rules
set free_delivery_threshold = 200,
    delivery_fee = 25
where id = 1;
```

## Clean ZIP for Submission

```bash
npm run zip:clean
```

The archive is created at:

```text
dist/desagaCuLegume-clean.zip
```

The script includes tracked and non-ignored files while excluding local build artifacts, dependency folders, generated files, and local environment files.

## Development Notes

* Public products are read through `/api/products`.
* The admin panel uses internal endpoints for product creation, editing, image upload, and status changes.
* The authenticated cart uses database functions for consistent cart updates.
* Stock changes are handled through admin stock functions and inventory movement records.
* Checkout totals are displayed in the UI, while the final authoritative total is calculated server-side.
* Legal pages are static Svelte components and should remain aligned with the actual API behavior.
