# FLONEA — Frontend

Skin-friendly bedding & pillow collection. A React storefront (frontend only) with demo catalog data, a working cart, wishlist, Bedding Set Builder and a simulated checkout.

> **Demo only:** no backend, database or payment provider. Cart, wishlist and the last demo order are stored in the browser's `localStorage`. Checkout never collects payment details or places a real order.

## Getting started

Requires Node.js 20+.

```bash
cd frontend        # run every command from this folder; Flonea/ itself has no package.json
npm install        # first time only
npm run dev        # then open http://localhost:5173 (or http://127.0.0.1:5173)
```

Keep the terminal running while you use the site: the site is only reachable while `npm run dev` is running. Press `Ctrl + C` to stop it.

**"localhost refused to connect" (ERR_CONNECTION_REFUSED)?**
1. Make sure `npm run dev` is running in a terminal opened in `frontend/` and shows `VITE … ready`.
2. Open the exact URL Vite prints under `Local:`. If port 5173 is busy, Vite picks the next free port (5174, …).
3. The dev server listens on `127.0.0.1` (see `vite.config.js`), so both `localhost` and `127.0.0.1` work.

| Script            | What it does                                                  |
| ----------------- | ------------------------------------------------------------- |
| `npm run dev`     | Start the Vite dev server                                      |
| `npm run build`   | Production build into `dist/`                                  |
| `npm run preview` | Serve the production build locally                             |
| `npm run lint`    | ESLint                                                         |
| `npm test`        | Unit tests for pricing, variants, cart, filters and validation |
| `npm run images`  | Re-download product photography into `public/images`           |

## Deploying to Vercel

The site is a static Vite build, so no environment variables, server or database are needed.

| Vercel setting   | Value                                                                                   |
| ---------------- | --------------------------------------------------------------------------------------- |
| Root Directory   | `frontend` (if the Git repository root is the `Flonea` folder); leave empty if the repository root is `frontend` itself |
| Framework Preset | Vite                                                                                    |
| Build Command    | `npm run build`                                                                         |
| Output Directory | `dist`                                                                                  |
| Install Command  | `npm install` (npm, because of `package-lock.json`)                                     |
| Node.js Version  | 22.x or newer (Vite 8 needs Node `^20.19` or `>=22.12`)                                  |

`vercel.json` rewrites every path that isn't a real file to `index.html`, so refreshing or deep-linking a React Router page (e.g. `/shop` or `/products/cloud-pillow`) works instead of returning a 404.

## Routes

| Path                         | Page                                             |
| ---------------------------- | ------------------------------------------------ |
| `/`                          | Homepage                                         |
| `/shop`                      | All products — search, filters, sort, pagination |
| `/collections/duvet-covers`  | Duvet covers collection                          |
| `/collections/pillows`       | Pillows & pillowcases collection                 |
| `/collections/bedding-sets`  | Ready-made bedding sets                          |
| `/products/:slug`            | Product details                                  |
| `/bedding-sets/builder`      | Bedding Set Builder (Full Set / Individual Items) |
| `/cart`                      | Cart                                             |
| `/checkout`                  | Demo checkout → review → demo confirmation       |
| `/wishlist`                  | Wishlist                                         |
| `/about`                     | Brand story                                      |
| `/account`, `/help/:topic`   | Demo account summary, help & policy pages        |
| `*`                          | 404                                              |

Filters, search and sorting live in the URL (e.g. `/shop?material=linen&color=sage&sort=price-asc`), so results can be shared and survive a refresh.

## Project structure

```
src/
  data/          Demo catalog & content (the only place to edit products)
    catalog.js     Materials, colours, sizes, collections, shipping rules
    products.js    Products (documented schema at the top of the file)
    setBuilder.js  Set Builder items, limits and Full Set discount rule
    images.js      Central image registry (swap photos here)
    content.js     Navigation, announcements, sample reviews, help pages
  lib/           Pure logic (unit-tested in lib/logic.test.js)
    variants.js    Expands products into variants, bundle pricing, option compatibility
    pricing.js     Cart line pricing & totals (shared by cart and checkout)
    cart.js        Add / merge / update / sanitise cart lines
    filters.js     Search, filters and sorting
    validation.js  Checkout & email/phone validation
  context/       Cart, Wishlist and Toast providers (localStorage-backed)
  hooks/         useVariantSelection, useProductFilters, useShopActions, …
  components/    layout/, product/, shop/, cart/, ui/
  pages/         One component per route (lazy-loaded)
  styles/        Design tokens + global and page styles (plain CSS)
```

## How the catalog works

- Each product lists its `materials`, `colors` and `sizes`, its price per size (plus optional material surcharges), the combinations that are **not produced** (`unavailable`), and demo stock (`stock.overrides`, where `0` means sold out).
- `buildCatalog()` expands these into concrete `variants`, an `inventory` map and `availableMaterials`, `availableColors` and `availableSizes`.
- **Bedding sets** define `bundle.components` and `discountPercent`. Set variants exist only when every component variant exists. A set's price is the sum of its components minus the configured discount, and its stock is limited by the scarcest component.
- Pillowcases and pillows inside sets are sized from the bed size using `PILLOW_SIZE_FOR_BED`.
- The cart stores only identifiers. Prices are always recalculated from the catalog, so the product page, builder, cart and checkout always match.
- Adding the same variant again increases its quantity, capped at stock and at 10 per line. Different variants of the same product stay as separate lines.

## Images

Photography is free-licence Unsplash imagery, downloaded into `public/images/` (`<key>-sm.jpg` at 700px and `<key>-lg.jpg` at 1600px) and served with `srcset`. To use real FLONEA photography, replace those files, or add a key to `src/data/images.js` and reference it from a product's `images` or `colorImages`.

## Brand

Logo: `src/assets/brand/flonea-logo.png`, the original file, unmodified (2172 × 724 PNG with a transparent background). It's rendered by `components/layout/Logo.jsx` in the header, mobile menu, footer and page loader. Size it with the `--logo-h` CSS variable (see `.logo` in `styles/layout.css`). The favicon is a separate square mark (`public/favicon.svg`), because the wide wordmark isn't legible at favicon sizes.

Palette: White `#FFFFFF`, Champagne Gold `#C9AB78`, Warm Taupe `#B8AEA4`, Soft Beige `#DDC9BA`, Forest Green `#4D644F`, Black `#000000`. They are defined in `src/styles/tokens.css`. Headings use Cormorant Garamond and body text uses Jost (Google Fonts).
