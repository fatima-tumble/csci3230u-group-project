# My slice — Vincent Wong

**Role (per README):** UI Developer — search and interactions, overall polish

---

## M2 foundation (early work)

- **PR #38** — React Router scaffold + initial details page. Set up the routing structure the rest of the team built on.
- **PR #45** — `PlaceCard` component and the `/results` route (list view).
- **PR #46** — Search bar + client-side query filter on results.
- **PR #47** — Swapped the mock xids over to real OpenTripMap ids so detail links worked end-to-end.
- **PR #57** — Styled the header nav as pill buttons with an active state.

Plus a few direct-to-main polish commits in the same window: Tailwind v4 aspect-ratio syntax on the card, rendering the Wikipedia extract as plain text (dropped `dangerouslySetInnerHTML` for safety), and the first `SearchBar` / filter wiring.

---

## M3 — main slice work (live API + explore flow)

### Live API layer (`app/data/api.ts`)

- **PR #62** — `geocode()` (Nominatim) + `fetchNearbyPlaces()` (OpenTripMap radius). Both check `res.ok`, both take an `AbortSignal`. API shape mapped to the app's own `MockPlace` type at the boundary, so no component sees raw API data.
- **PR #80** — in-memory cache for geocode / nearby places / place details + retry wrapper (300 / 800 / 1600 ms backoff on 5xx & 429). Fixed "Something went wrong" and "Place not found" that were showing up from Nominatim's 1-req/sec throttle.

### `/results` (explore page)

- **PR #62** — rewrote the page to fetch live, with loading / error / empty states and `AbortController` cleanup.
- **PR #64** — default to Toronto with a hint banner when there's no `?q=`.
- **PR #65** — pagination (9 per page, `?page=` in URL), lazy per-card image fetch, Wikimedia 400px → 960px thumbnail rewrite, category-coloured fallback tiles for places with no photo.
- **PR #81** — sort dropdown (closest / farthest / name A–Z / Z–A, key in `?sort=`).

### Home page (`app/routes/home.tsx`)

- **PR #66** — 3 random suggested places, seeded from Toronto.
- **PR #67** — split search into city / state / country inputs, joined with commas for Nominatim.
- **PR #71** — "By location" / "By name" mode toggle. Name mode uses Nominatim's global text search and renders matches on `/results?name=`.

### Other pages

- **PR #63** — `/about` page with team members, roles, data source credits (OpenTripMap, Nominatim, Wikipedia).

### Polish + fixes

- **cursor fix** (direct to main) — restored `cursor: pointer` on buttons globally (Tailwind v4 dropped the default).
- **Explore-by-category box** (direct to main) — removed stray `flex-1` that was making the orange box stretch to fill the viewport.
- **Details page** (direct to main, in PR #80) — "Try again" button that refires the fetch; distinguishes retries-exhausted from a real 404.
- **Duplicate-React fix** (direct to main) — root-caused the 29 failing tests to two separate React copies (`react-router-dom@7` + a stray `app/node_modules/react@19.3.1`). Removed `react-router-dom`, deleted the nested `node_modules`, widened `.gitignore`. `npm test` went from 45/74 to 74/74 passing.

### Tests (per M3 rubric)

- **PR #82** — 30 tests over `app/data/resultsParams.ts`, `app/data/api.ts`, `app/data/random.ts`. Covers sort behaviour, URL param parsing (category / page / sort), the OpenTripMap `kinds` → categories mapping, the Wikimedia thumbnail rewrite, and the random picker used for suggestions. Also a small refactor extracting those helpers out of route files so vitest could import them cleanly. **`npm test` now 104/104.**

---

## Rubric mapping (what to point at during grading)

| Rubric item | What of mine covers it |
|---|---|
| Live web service (`res.ok`, `AbortController`, loading/error, mapping at boundary) | `app/data/api.ts` |
| Search + filter + sort | `/results` — `SearchBar`, `FilterBar`, sort `<select>` |
| Routed detail view with `useParams` | `/places/:xid` (route wired in PR #38) |
| Multiple routes | `/`, `/results`, `/places/:xid`, `/about` |
| Controlled form | home search form (`handleSearch` in `app/routes/home.tsx`) |
| Automated tests | `app/data/*.test.ts` |
