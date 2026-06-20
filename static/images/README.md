# Website images

All **template/static images** for the site live here. Anything in `static/` is
served as-is at the site root, so a file at:

```
static/images/<page>/<name>.<ext>
```

is reachable in the browser (and in code) at:

```
/images/<page>/<name>.<ext>
```

You can **change or add a picture with repository access only** — no code or
build knowledge required. Drop a file in the right folder; if you keep the same
name as an existing one, it is swapped everywhere automatically.

## Folder convention

`static/images/<page-url-slug>/<descriptive-name>.<ext>`

- `<page-url-slug>` = the page's URL path. Homepage = `home`. Example: the
  "Despre noi" page at `/despre-noi` → `static/images/despre-noi/`.
- `shared/` = images used across the whole site (not tied to one page).

## What's here now

| Path | Used by | Reference in code |
|---|---|---|
| `shared/logo.png` | site header/footer | `src/lib/components/Navigation.svelte` |
| `shared/placeholder.png` | fallback when a product/event has no image | `PLACEHOLDER_IMAGE` in `src/lib/images.ts` |
| `shared/favicon.svg` | browser tab icon | `src/app.html` |
| `home/{hero,local,gustos,sanatos}.jpg` | homepage section art (templates) | — |
| `despre-noi/*.jpeg` | about-page photo templates | — |
| `despre-noi/*.jpg` | about-page hero, story, timeline and product photos | `src/routes/despre-noi/+page.svelte` |
| `produse/*.jpg` | product-list and category hero backgrounds | `src/routes/produse/**/+page.svelte` |
| `home/hero-produse-locale.jpg` | homepage hero background | `src/routes/+page.svelte` |
| `horeca/hero-borcane.jpg` | HORECA hero background | `src/routes/horeca/+page.svelte` |
| `contact/hero-contact.jpg` | contact hero background | `src/routes/contact/+page.svelte` |
| `evenimente/hero-degustare.jpg` | events hero background | `src/routes/evenimente/+page.svelte` |

## How to replace an existing image

1. Put your new file at the **same path and name** (e.g. overwrite
   `static/images/shared/logo.png`).
2. Keep the same file extension, or update the reference if you change it.
3. Commit. Done — the site uses the new file.

## How to add a NEW image to a page

1. Create the page folder if needed: `static/images/<page>/`.
2. Add your file: `static/images/<page>/my-photo.jpg`.
3. Reference it in that page's `.svelte` file with a plain path, e.g.
   `<img src="/images/<page>/my-photo.jpg" alt="..." />`.

## Page-URL slugs (for `<page>`)

`home` (`/`), `despre-noi`, `produse`, `evenimente`, `horeca`, `contact`,
`legal`, `cont`, `cos`, `utilizator`.

## Not stored here: product & event photos

Product and event images are **uploaded by admins** through the admin panel and
stored in **Supabase Storage** (dynamic, per-item). They are not template files.
When a product or event has no uploaded image, the site shows
`shared/placeholder.png`.
