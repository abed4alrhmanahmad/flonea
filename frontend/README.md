# FLONEA — Frontend

Skin-friendly bedding & pillow collection. A React storefront (frontend only) with demo catalog data, a working cart, wishlist, Bedding Set Builder and a simulated checkout.

> **Demo only:** no backend, database or payment provider. Cart, wishlist, demo orders and every Admin change are stored in the browser's `localStorage`. Checkout never collects payment details or places a real order.

## Admin Dashboard (frontend-only demo)

Start the dev server (below), then open **http://localhost:5173/admin** — you are sent to `/admin/login`.

| Demo credentials (development only — not production credentials) | |
| --- | --- |
| Email | `admin@flonea.local` |
| Password | `FloneaDemo2026!` |

The login page shows these in a **Demo Access** panel with copy buttons and a "Fill in the demo credentials" link.

| Admin route | What it manages |
| --- | --- |
| `/admin` | Dashboard: active products, collections, low-stock / sold-out products, demo orders and their value, stock health, recent products and activity, quick actions |
| `/admin/products` (`/new`, `/:id`) | Search, filter, sort, add, edit, duplicate, preview, draft / archive, delete; Featured / New / Best Seller flags. The editor manages each product's **own** sizes, colours (hex + live swatch + colour images) and materials, restriction rules, and a variant matrix (offered on/off, price override, stock per variant) |
| `/admin/collections` | Collection pages: name, slug, description, banner, enabled, listed, and an explicit, ordered product list |
| `/admin/inventory` | Stock per variant (no negatives), available on/off per variant or product, low-stock threshold, stock filters |
| `/admin/orders` | Demo orders from this browser's checkout: details (incl. grouped custom sets), search / filters, demo status changes, cancel. Optional, clearly-labelled sample orders |
| `/admin/build-a-set` | Which Pillows & Pillowcases products and duvet covers can be chosen, step hints, pillow quantity limit, live price check |
| `/admin/content` | Announcement bar, hero slides, Featured / New Arrivals / Best Sellers (selection + order), homepage sections, Shop by Color, brand story, demo testimonials, newsletter text, header navigation, footer, About page |
| `/admin/settings` | Store name, logo URL, contact, social links, display currency, demo shipping methods & free-shipping threshold, low-stock threshold, checkout countries, section visibility, JSON export, resets |
| `/admin/activity` | Local history of Admin changes |

**What this demo login is — and isn't.** It is a client-side convenience so the Admin works without a backend. The credentials ship in the JavaScript bundle, the "session" is a marker in `sessionStorage` (or `localStorage` for 7 days with *Remember me*; the password is never stored), and the route guard only decides what this browser renders. It is **not authentication and protects no data** — anyone can read the bundle or edit browser storage. Set `VITE_ENABLE_DEMO_ADMIN=false` at build time to switch the demo login off. To connect real authentication, implement the provider interface in `src/admin/auth/demoAuthProvider.js` (`signIn`, `getSession`, `signOut`) and pass it to `<AdminAuthProvider>` in `src/admin/AdminApp.jsx`; a real backend must also authorise every write.

**How Admin changes reach the storefront.** `src/store/` holds one shared store: products, collections, content, settings and Build a Set settings, seeded from `src/data/*` and saved under `flonea.store.v1` (demo orders under `flonea.orders.v1`, activity under `flonea.adminActivity.v1`). The storefront and Admin both read it, so a saved change appears immediately — also in other open tabs. Stored data is validated on load; unreadable or outdated data falls back to the defaults (the Admin says so). Cart, wishlist and set-builder keys are never overwritten: cart lines for products that are switched off are set aside (shown as unavailable), not deleted. localStorage is **local demo persistence**: it lives in one browser, isn't shared between devices or visitors, and clearing site data removes it. Every mutation goes through `commit()` in `src/store/store.js`, the place to swap in API calls later.

Business rules kept by the Admin: every product owns its options (adding a colour to a duvet cover never adds it to pillows); each Pillows & Pillowcases product is one item with one price, stock level and cart line; custom sets pair one pillow product and one duvet cover with independent sizes, are priced at the sum of regular prices (no bundle discount) and go to the cart as one grouped line; stock is never deducted automatically by carts or demo orders.

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
| `npm test`        | Unit tests: pricing, variants, cart, filters, validation, the shared store, Admin rules and persistence |
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
| `/admin/*`                   | Admin Dashboard (demo login, see above)          |
| `*`                          | 404                                              |

Filters, search and sorting live in the URL (e.g. `/shop?material=linen&color=sage&sort=price-asc`), so results can be shared and survive a refresh.

## Project structure

```
src/
  data/          Factory defaults the store starts from
    catalog.js     Option presets (materials, colours, sizes), default collections & shipping, currencies
    products.js    Seed products (documented schema at the top of the file)
    setBuilder.js  Build a Set roles (limits are read from the store)
    images.js      Central image registry (swap photos here); image refs may also be URLs
    content.js     Default site copy, navigation, sample reviews, help pages
  store/         Shared store used by storefront + Admin (seed, sanitising, persistence, hooks)
  admin/         Admin app: demo auth, layout, pages, editors (lazy-loaded at /admin)
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

- In the store, each product owns its `materials`, `colors` and `sizes` (with names, hex values, dimensions, size prices and material surcharges, each enabled or disabled), the combinations that are **not produced** (`unavailable` rules), per-variant settings (`variantSettings`: offered, stock, price override) and a `defaultStock`. `src/store/seed.js` converts the seed products into this model.
- `buildCatalog()` expands these into concrete `variants`, an `inventory` map and `availableMaterials`, `availableColors` and `availableSizes`; only active products with at least one variant are shown to customers.
- **Bedding sets** define `bundle.components` and `discountPercent`. Set variants exist only when every component variant exists. A set's price is the sum of its components minus the configured discount, and its stock is limited by the scarcest component.
- Pillowcases and pillows inside sets are sized from the bed size using `PILLOW_SIZE_FOR_BED`.
- The cart stores only identifiers. Prices are always recalculated from the catalog, so the product page, builder, cart and checkout always match.
- Adding the same variant again increases its quantity, capped at stock and at 10 per line. Different variants of the same product stay as separate lines.

## Images

Photography is free-licence Unsplash imagery, downloaded into `public/images/` (`<key>-sm.jpg` at 700px and `<key>-lg.jpg` at 1600px) and served with `srcset`. To use real FLONEA photography, replace those files, or add a key to `src/data/images.js` and reference it from a product's `images` or `colorImages`.

## Brand

Logo: `src/assets/brand/flonea-logo.png`, the original file, unmodified (2172 × 724 PNG with a transparent background). It's rendered by `components/layout/Logo.jsx` in the header, mobile menu, footer and page loader. Size it with the `--logo-h` CSS variable (see `.logo` in `styles/layout.css`). The favicon is a separate square mark (`public/favicon.svg`), because the wide wordmark isn't legible at favicon sizes.

Palette: White `#FFFFFF`, Champagne Gold `#C9AB78`, Warm Taupe `#B8AEA4`, Soft Beige `#DDC9BA`, Forest Green `#4D644F`, Black `#000000`. They are defined in `src/styles/tokens.css`. Headings use Cormorant Garamond and body text uses Jost (Google Fonts).
