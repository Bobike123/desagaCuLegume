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
| `TRUSTED_PROXY` | nu | doar server |
| `SUPABASE_FETCH_TIMEOUT_MS` | nu | doar server |
| `NODE_ENV` | nu | runtime |

`TRUSTED_PROXY` selectează un singur header de IP de încredere, potrivit
proxy-ului real din fața aplicației: `vercel` → `x-real-ip`, `cloudflare` →
`cf-connecting-ip`. Nelăsat/`none` → se folosește doar adresa directă a
conexiunii. Nu folosi o listă de headere: `cf-connecting-ip` trece nefiltrat
prin Vercel și poate fi falsificat de client.

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

După schema de bază, aplică în ordine migrările incrementale
`supabase/migrations/20260619_admin_panels_patch.sql`,
`20260620_guest_checkout.sql` și seria `20260702_*` (hardening privilegii
funcții, coș atomic `add_cart_item`/`get_cart`, ledger stoc
`admin_set_product_stock`, `orders.delivery_method` + mașina de stări,
lockout login `peek_rate_limit`/`reset_rate_limit`, indexuri +
`product_images`). Fișierul `20260702_00_verify_rls_readonly.sql` este doar de
verificare (read-only) — rulează-l și compară rezultatele cu comentariile din
el.

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
TRUSTED_PROXY=vercel
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

### Retenție Date / GDPR

Ștergerea contului (`DELETE /api/user`) anonimizează rândul din `users`
(email, username, nume, telefon, hash parolă) și închide sesiunile. Datele de
facturare din `orders` (nume, email, telefon, adrese) și conversațiile de
suport sunt păstrate intenționat: comenzile sunt documente
contabile/fiscale cu termen legal de arhivare. Nu se șterg la ștergerea
contului; documentează acest lucru în politica de confidențialitate.

## Cleanup Periodic

Cleanup-ul este automatizat prin `pg_cron` — activează extensia în Supabase
(Dashboard → Database → Extensions) și rulează
`supabase/migrations/20260710_07_pg_cron_cleanup.sql`. Migrarea creează câte o
funcție `run_cleanup_*` pentru sesiuni expirate, `app_rate_limits`,
`checkout_idempotency_keys`, `security_events`, `auth_logs`, coșuri abandonate
și arhivarea conversațiilor închise, plus programările `cron.schedule`.
Verifică rulările cu:

```sql
select * from cron.job;
select * from cron.job_run_details order by start_time desc limit 20;
```

Funcțiile pot fi rulate și manual (ex. `select public.run_cleanup_sessions();`)
dacă vrei cleanup imediat.
