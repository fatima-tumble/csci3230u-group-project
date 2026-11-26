# AI-USAGE.md

Per `ai-policy.md`, M1–M2 were AI-free. AI assistance is permitted from M3 onwards and
is logged below.

## Entry template (copy for each use)

### #N — <short title>

- **Date:** YYYY-MM-DD
- **Member:** <your name>
- **Tool / model:** <e.g. free-tier assistant> (free models only)
- **Files:** `app/...`
- **Prompt (verbatim):**

  ```
  <paste the exact prompt you gave the AI>
  ```

- **What it produced & what I changed:** <1–3 sentences>

---

## Log

<!-- Entries go below, newest last. -->

### #1 — Rate-limit for Nominatim/OpenTripMap calls

- **Date:** 2026-11-25
- **Member:** Vincent Wong
- **Tool / model:** ChatGPT (free)
- **Files:** `app/data/api.ts`, `app/routes/details.tsx`
- **Prompt (verbatim):**

  ```
  Can we add a buffer or something, why is this happening so often
  sometimes place not found happens. Might need to add a buffer there too (when clicking a location)
  ```

- **What it produced & what I changed:** Added an in-memory cache
  and a 3-attempt retry wrapper (300/800/1600ms) around the geocode
  and OpenTripMap calls, and swapped the details page onto the
  shared helper. I added a "Try again" button and tuned the backoff
  against Nominatim's 1-req/sec limit.

---

### #2 — Sorting on /results

- **Date:** 2026-11-25
- **Member:** Vincent Wong
- **Tool / model:** ChatGPT (free)
- **Files:** `app/routes/results.tsx`
- **Prompt (verbatim):**

  ```
  Can we work on adding sorting to the results page, things such as closest, furtherest, and alphabet.
  ```

- **What it produced & what I changed:** A four-option sort
  (closest / farthest / name A–Z / Z–A), a pure `sortPlaces()`
  helper, and a `<select>` next to the category chips with the
  key kept in `?sort=`. Later moved the helpers to
  `app/data/resultsParams.ts` so I could unit-test them.

---

### #3 — Random suggestions on home page

- **Date:** 2026-11-24
- **Member:** Vincent Wong
- **Tool / model:** ChatGPT (free)
- **Files:** `app/routes/home.tsx` (later refactored to `app/data/random.ts`)
- **Prompt (verbatim):**

  ```
  Let's work on a feature to have 3 random locations suggested on the homepage using our APIs.
  ```

- **What it produced & what I changed:** A `pickRandom()` and
  amount-time fetch that seeds from Toronto, shuffles, and renders
  3 cards through the existing `PlaceCard`. Later pulled
  `pickRandom` into its own file and added tests that stub
  `Math.random` for determinism.

---

### #N — Bug fix

- **Date:** 2026-11-25
- **Member:** Julian Cruzet
- **Tool / model:** ChatGPT (free)
- **Files:** `app/routes/results.tsx`
- **Prompt (verbatim):**

  ```
  hey theres a bug, the sort helpers were declared twice in results.tsx, breaking the build. fix it please and leave it for me to review.
  ```

- **What it produced & what I changed:** 

  ```
  It fixed the bug and the results page now loads properly.
  ```

---
