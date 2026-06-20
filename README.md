# DeSaga cu Legume

Aplicație SvelteKit + Supabase pentru magazinul DeSaga cu Legume: catalog de
produse, coș, checkout, cont client, mesaje suport și panou de administrare.

## Stack

- SvelteKit 2 + TypeScript
- Supabase Postgres + Storage
- Autentificare custom: hash scrypt, tabel `sessions`, cookie HTTP-only
  `desaga_session`
- Vercel (`@sveltejs/adapter-vercel`)
- Vitest, ESLint, svelte-check

## Instalare Locală

```bash
npm install
cp .env.example .env.local
npm run dev
```

Completează `.env.local` cu valori reale. Fișierul este ignorat de git și nu
trebuie livrat.

## Variabile De Mediu

Vezi [`.env.example`](./.env.example). Aplicația citește doar:

| Variabilă | Obligatorie | Expunere |
|---|---:|---|
| `PUBLIC_SUPABASE_URL` | da | publică |
| `PUBLIC_SUPABASE_ANON_KEY` | da | publică |
| `SUPABASE_SERVICE_ROLE_KEY` | da | doar server |
| `SECURITY_ENFORCE_HTTPS` | nu | doar server |
| `SECURITY_LOG_RETENTION_DAYS` | nu | doar server |
| `TRUST_PROXY_HEADERS` | nu | doar server |
| `NODE_ENV` | nu | runtime |

`SUPABASE_SERVICE_ROLE_KEY` nu se importă în cod client. Validarea server-side
refuză valori lipsă, placeholder sau service-role identic cu anon key.

## Supabase De La Zero

Baza Supabase poate fi ștearsă înainte de deploy. Schema canonică este:

```text
supabase/migrations/20260619_reproducible_schema.sql
```

După resetarea bazei, rulează conținutul acestui fișier în SQL Editor Supabase
sau aplică migrarea cu Supabase CLI:

```bash
supabase link --project-ref <project-ref>
supabase db push
```

Migrarea creează enum-uri, tabele, constrângeri, indexuri, RLS, trigger-e
`updated_at`, bucket-ul public `images`, seed minim și RPC-urile folosite de
aplicație:

- `replace_cart_items`
- `support_conversation_summaries`
- `update_order_admin`
- `resolve_session`
- `consume_rate_limit`
- `place_order`

Seed minim inclus:

- roluri `USER`, `ADMIN`
- categorii produse `de-sezon`, `la-borcan`

Nu există parolă admin hardcodată.

## Creare Admin

1. Creează un cont normal din `/cont`.
2. În Supabase SQL Editor, promovează utilizatorul:

```sql
select public.grant_admin_role(user_id)
from public.users
where email = 'emailul-adminului@example.com';
```

3. Autentifică-te în `/admin/login`.

## Rulare, Build Și Teste

```bash
npm run check
npm run lint
npm run build
npm test
```

Dacă testele cu browser cer Playwright instalat local:

```bash
npx playwright install
```

## Deploy

1. Resetează baza Supabase.
2. Rulează `supabase/migrations/20260619_reproducible_schema.sql`.
3. Creează/administrează contul admin prin procedura de mai sus.
4. Setează variabilele de mediu în Vercel.
5. Folosește build command:

```bash
npm run build
```

Recomandat în producție:

```text
NODE_ENV=production
TRUST_PROXY_HEADERS=true
SECURITY_ENFORCE_HTTPS=true
```

## ZIP Curat Pentru Predare

```bash
npm run zip:clean
```

Arhiva se creează în:

```text
dist/desagaCuLegume-clean.zip
```

Scriptul include fișierele urmărite/neignorate și exclude automat `.git`,
`.env*`, `node_modules/`, `.svelte-kit/`, `.vercel/`, `build/`, `dist/`,
`coverage/` și cache-uri locale.

## Securitate

- Orice cheie expusă anterior trebuie regenerată înainte de deploy:
  Supabase anon key, Supabase service-role key, Resend/API keys, parole admin
  sau parole de conturi folosite la test.
- Nu livra `.env.local`, `.env`, dump-uri DB sau arhive vechi.
- Aplicația nu folosește Supabase Auth pentru sesiuni. Autentificarea reală
  este custom: cookie HTTP-only, tabel `sessions`, hash scrypt versionat.
- Toate operațiile private trec prin SvelteKit server routes cu
  `SUPABASE_SERVICE_ROLE_KEY`; autorizarea reală se aplică în `locals.user` /
  `locals.isAdmin`.
- RLS rămâne protecție defensivă pentru acces direct prin rolurile
  `anon`/`authenticated`, nu sursa primară de autorizare a aplicației.
- Ruta `/security-decoy` și path-urile decoy din `hooks.server.ts` sunt
  deliberate: înregistrează accesări suspecte în `security_events`.

## Cleanup Periodic

Rulează periodic, prin `pg_cron` sau un endpoint Vercel Cron protejat:

```sql
update public.sessions
set status = 'TIMED_OUT',
    ended_at = now()
where status = 'ACTIVE'
  and expires_at <= now();

delete from public.app_rate_limits
where reset_at < now() - interval '1 day';

delete from public.checkout_idempotency_keys
where created_at < now() - interval '7 days';

delete from public.security_events
where created_at < now() - interval '30 days';
```
