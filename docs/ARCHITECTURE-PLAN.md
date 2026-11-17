# Marqueuet — Next Steps: Database + Hexagonal Architecture

A plan for moving the current prototype from "everything in one script" to a
hexagonal (ports & adapters) structure with a real database behind it.

---

## 1. Where the code is today

| File | What it really does |
| --- | --- |
| `index.html` | Landing overlay + app shell + three views (`view-compare`, `view-pulse`, `view-results`) + modals |
| `landing.js` | Header, scroll reveals, typewriter, `openMatchup()` |
| `script.js` | Spring physics, `ENTITIES` data, `getProfile()` fake-data generator, guardrail rules, all chart rendering, CSV export, sidebar drag, segmented controls, toasts |
| `style.css` | Glassmorphism theme |

Problems the architecture has to solve:

- **No data layer at all.** Data lives in a `const ENTITIES = {...}` object inside the script, and `getProfile()` invents numbers for unknown names with a seeded random. Nothing is `fetch`ed, nothing is stored.
- **Domain logic and DOM are welded together.** `executeComparison()` both decides "is this a valid matchup?" and calls `switchView('results')` + `renderVisualResults()`.
- **`window.*` globals.** `window.executeComparison`, `window.switchView`, `window.toggleTheme`... markup calls them by name, so nothing can be swapped or tested.
- **State is one mutable object** (`state.activeProfiles`, `state.recentHistory`) shared by every feature.
- Git history is still the prototype: `feat: initial prototype`, then a "modularize" refactor that only split HTML/CSS/JS out of one file.

What is already good and should be kept: the guardrail idea (brand vs SKU mismatch),
the matchup suggestion list, the spring chart controllers, and the landing page.

---

## 2. The hexagonal shape for this project

Three layers, and only the outer two know about the outside world:

1. **Domain (center)** — plain rules and plain objects. `Entity`, `Matchup`,
   `Metrics`, `buildMatchup()`, `validateMatchup()`, `computeShareOfVoice()`.
   No DOM, no network, no `window`. Testable on its own.
2. **Application (use cases)** — one function per user action:
   `RunComparison`, `LoadPulseFeed`, `SearchEntities`, `SaveComparison`,
   `ExportComparisonCsv`. They call the domain and talk to **ports**.
3. **Ports (interfaces)** — small contracts the inside needs from the outside:
   - `EntityRepository` — `get(name)`, `search(query)`, `list(category)`
   - `ComparisonRepository` — `save()`, `listRecent()`, `pin()`
   - `PulseRepository` — `feed(filter)`
   - `SuggestionRepository` — `forCategory(cat)`
   - `Clock` / `IdGenerator` — so tests can be deterministic
4. **Adapters (outer ring)** —
   - *Driving* (who calls in): `html-dom-adapter` (buttons/views), `landing-adapter`
   - *Driven* (what we call out to): `memory-adapter` (today: the `ENTITIES` object),
     `supabase-adapter` (tomorrow: real database), `csv-download-adapter`

Swap `memory-adapter` for `supabase-adapter` in one place (the composition root)
and the whole app reads from the database without any domain change.

```
marqueuet/
  src/
    domain/            entities.js  matchup.js  metrics.js  errors.js
    application/       run-comparison.js  load-pulse.js  save-comparison.js  export-csv.js
    ports/             entity-repository.js  comparison-repository.js  pulse-repository.js
    adapters/
      driven/          memory/  supabase/  csv/
      driving/         dom/  landing/
    composition/       container.js   <- the ONLY file that picks adapters
  tests/               domain tests + in-memory use case tests
```

---

## 3. Database (Postgres via Supabase)

Why Supabase: the site is static on GitHub Pages, so it cannot hold a database
itself. Supabase gives a hosted Postgres with a REST/RPC API the browser can call
directly (anon key + row level security), plus auth for saved comparisons.
No server to build or host. A plain Node API would work too, but it is more work.

The rule that matters: **the anon key is public, so every table must have RLS
policies.** Public read for reference data, per-user write for bookmarks.

Core tables:

| Table | Key columns |
| --- | --- |
| `entities` | `id`, `slug` (unique), `name`, `type` (`brand` \| `product`), `parent_brand_id`, `peer_slug`, `sku_sample`, `category` |
| `entity_metrics` | `entity_id`, `window_days`, `mentions`, `avg_likes`, `comment_ratio`, `share_amp`, `velocity`, `sentiment`, `ugc`, `reach`, `captured_at` — *one row per snapshot, so history is possible* |
| `entity_drivers` | `entity_id`, `driver` (`speed`/`aesthetic`/`value`/`quality`/`service`), `score` |
| `entity_platform_share` | `entity_id`, `platform` (`tiktok`/`instagram`/`facebook`), `share_pct` |
| `pulse_posts` | `id`, `category`, `platform`, `handle`, `posted_at`, `sentiment_label`, `caption`, `views`, `likes`, `comment_ratio`, `velocity_label`, `matchup_query` |
| `matchup_suggestions` | `id`, `category`, `query_text`, `tag_line`, `icon` |
| `shared_comparisons` | `id`, `query`, `category`, `created_at`, `created_by` (null for the seeded demo ones) |
| `user_bookmarks` | `user_id`, `comparison_query`, `category`, `created_at` (RLS: own rows only) |

Views/RPC to add later: `v_entity_30d` (latest metrics per entity) so the UI
never has to sort snapshots itself.

Seeding: take the 17 entries already in `ENTITIES` plus the 5 `PULSE_POSTS` and the
`MATCHUP_SUGGESTIONS` lists and write them as an SQL seed file. Same data, real home.

Note on `getProfile()`: the fake seeded-RNG numbers are *presentation demo*. Give
the memory adapter a `demoMode` flag so it can still invent numbers for unknown
names in a demo, but the Supabase adapter must return "unknown entity" and let
the guardrail ask the user to search — never silently invent real-looking metrics.

---

## 4. Order of work (each step ships on its own)

1. **Freeze the contract.** Write `domain/entities.js` and `domain/matchup.js` with
   `buildMatchup(names)`, `validateMatchup(profiles)` (the brand-vs-SKU rule) and
   `computeShareOfVoice(profiles, mode)`. Pure functions, in/out objects only.
2. **Add the ports + memory adapter.** Move `ENTITIES`, `PULSE_POSTS`,
   `MATCHUP_SUGGESTIONS`, `state.recentHistory` behind `EntityRepository` etc. The
   memory adapter is filled with the exact objects that are in `script.js` today.
3. **Write the use cases.** `runComparison(query)` returns
   `{ ok, profiles, guardrail }` — no DOM. `loadPulseFeed(filter)` returns posts.
4. **Rewire the front end through the use cases.** `script.js` splits into
   `adapters/driving/dom/*` (renderers that take plain data as arguments) and one
   composition root. Delete the `window.*` globals; use `addEventListener` in the
   DOM adapter (markup changes from `onclick=` to `data-action=`).
5. **Move CSV export into `adapters/driven/csv`** — it already only needs
   `activeProfiles`, so this is a 20-line move and proves the port pattern works.
6. **Create the Supabase project, run the schema + seed, check RLS** with a
   signed-out request (must read reference tables, must fail to write bookmarks).
7. **Write `adapters/driven/supabase/`** implementing the same four ports.
   `composition/container.js` gets one switch: `if (env.BACKEND === 'supabase')`.
   Keep the memory adapter as the offline/demo fallback.
8. **Auth + bookmarks.** `bookmarkCurrentComparison()` and `togglePinRecent()` stop
   being toasts and become real rows (Supabase Auth, RLS on `user_bookmarks`).
9. **Real ingestion (later, optional).** One small job that writes `entity_metrics`
   snapshots from a public source, so `captured_at` history has meaning. Until
   then the UI labels the numbers as demo data.
10. **Publishing (optional).** GitHub Pages keeps the HTML/CSS; add a build step (or
    a tiny `config.js`) that injects the Supabase URL + anon key per environment.
    This is opt-in. The graded requirement is that a fresh clone runs on the
    checker's computer (section 6.6), so the default backend stays `memory` and
    nothing needs a key to start.

---

## 5. Rules to keep it honest

- Domain files must never contain `document`, `window`, `fetch` or `localStorage`.
  If a domain file needs one, the design is wrong.
- One adapter per port per environment. Two adapters at once (memory + supabase)
  is fine; two *sources of truth* for the same data is not.
- Bookmarking must be idempotent (`upsert`, not blind `insert`).
- Never put the `service_role` key in the browser. Only the anon key, with RLS.
- Each step keeps the site working. The entry point stays `index.html` the whole
  time — it must never depend on a running database or a dev server.
- A fresh `git clone` must run with no setup: open `index.html`, no keys, no
  database, no install. So demo data in the memory adapter is the **default**
  backend and stays in the repo permanently — it is the offline mode, not
  scaffolding to delete once Supabase exists.

---

## 6. Open questions, answered

### 6.1 Is dummy data still allowed in the database?

Yes — and it is the *right* way to start. What matters is that demo data is
labelled as demo data, never mixed silently with real data.

- Keep every seeded row and add a `source` column: `'demo'` or `'ingested'`.
  Today every row is `'demo'`. When a real job writes rows later, it writes
  `'ingested'` and nothing else has to change.
- The UI reads `source` and shows one small badge — "Sample data" — so nobody
  mistakes invented numbers for measurements. That is honest, and it protects the
  project in a defence or demo: the numbers are openly placeholders.
- The fake `getProfile()` random numbers for unknown names stay **only** in the
  memory adapter with `demoMode: true`. The database adapter never invents a row.
  Unknown name = guardrail message: "We have no data for that yet — try one of these."
- The seed SQL is generated *from* today's `ENTITIES` object, so the 17 entities,
  their metrics, the 5 pulse posts and the matchup suggestions all survive the move.
  Nothing is lost, and the site looks identical on day one.

### 6.2 How does the API come in?

There are two different things people call "an API" here, and only one of them is work:

| Meaning | Who builds it | What you do |
| --- | --- | --- |
| The REST API in front of the database | Supabase already built it | nothing — `select`, `insert`, `rpc` through the SDK |
| The social platform APIs (TikTok, Instagram, Facebook) that would give *real* numbers | you | later, optional, and limited — see below |

So: the database API is a URL plus a public key in `config.js`. The browser calls it
through the Supabase client, which is the `supabase-adapter` implementing the same
ports. That is the whole integration. No server of yours is deployed.

About real-data APIs, honestly: TikTok's Research/Display APIs and Meta's Graph API
need approved business apps and only return data for accounts you own or that grant
permission; unauthenticated public post search is not offered. So "live OSINT across
every brand" is not a switch you flip. That is exactly why the plan puts it last
(step 9) and why demo data with a clear badge is the safe default.

### 6.3 The jargon — plain words instead

The results screen is written for analysts. Change the labels only; keep the same
numbers and charts underneath.

| Now | Say instead |
| --- | --- |
| Share of Voice (SOV) | **Who is getting talked about more** |
| Net Sentiment | **Good vs bad reactions** |
| 24h Velocity | **How fast the buzz is growing today** |
| Community Depth | **How much people reply and discuss** |
| Creator UGC | **Posts made by real customers** |
| Share Virality (`shareAmp`) | **How often it gets shared** |
| Reach | **How many people saw it** |
| 6-Axis OSINT Signals | **Six things we measured** |
| Purchase Drivers | **What makes people buy** |
| OSINT / "30-Day Trailing OSINT" | **public posts from the last 30 days** |
| "Earned" SOV | drop the word "earned" — nobody outside ads uses it |

Places to change: the three `viz-card` titles, the radar axis list, the legend strip,
and the two badges in the top bar. Add one short line under each chart: "What this
means" — one sentence a non-technical reader can repeat out loud.

### 6.4 Too many charts at once — show one answer first

The results page currently asks the reader to process 5 visualisations after typing
one sentence. Restructure it in three levels, one click apart:

1. **The verdict (always visible)** — one card, no chart clutter: "**Jollibee is
   getting talked about more than McDo** — 12,420 vs 9,340 public posts in 30 days,
   with warmer reactions." Plus the single share-of-voice donut. This is the answer.
   Data: the two `mentions` numbers and `sentiment` from the metrics already loaded.
2. **Two supporting charts, collapsed under one "Show the details" button** — the
   sentiment/velocity map and the six-thing radar. One open control, not two.
3. **Everything else (drivers, platform split, CSV, print)** — behind a second
   "More detail" accordion, for the analyst who wants it.

Rules that keep it honest: the verdict must be generated from the data (compare
`mentions` and `sentiment`), not hardcoded prose. If the two are close, say "it is a
tie" instead of inventing a winner. This is a domain function
(`buildVerdict(profiles)`) — step 1 of the plan, next to `buildMatchup()`.

This also reduces the spring-physics work on load: only the donut animates first,
the rest is built when the accordion opens.

### 6.5 Where these fit in the order of work

- **6.3 and 6.4 belong with step 3–4** (use cases + front-end rewire), because they
  are pure rendering changes done while `script.js` is being split anyway.
- **6.1 belongs with step 6** (schema + seed): the `source` column is one line in
  the migration, and it is far cheaper now than after data exists.
- **6.2 needs nothing now** beyond `config.js` in the composition root, and step 9
  stays optional.

### 6.6 Is Supabase required to "be hexagonal"? (No — and the clone rule)

Hexagonal is a shape of the **code**, not a location. It is not "have a cloud
database"; it is "the core does not know or care who supplies the data". Running
entirely on a laptop is a perfectly normal hexagon — the adapter just happens to be
the in-memory one.

So Supabase is **optional for the architecture**. It is one adapter on a socket:

| What proves the hexagon | Where the checker looks |
| --- | --- |
| Core has no `document`, `window`, `fetch`, `localStorage` | `domain/`, `application/` |
| Sockets are defined by name, not by a library | `ports/*.js` — 4 tiny files |
| At least one adapter on each side | `adapters/driving/dom`, `adapters/driven/memory` |
| One place decides which adapter wins | `composition/container.js` |
| Adding a real database touches no core file | step 7 is one new folder + one line |

The clever part of the demo for a panel: **flip one line** (`BACKEND: 'memory'` →
`'supabase'`) and the whole site changes data source with no other edit. That is the
argument for the architecture, and it works even if the grader never has the key.

#### The clone requirement (treat this as a hard rule, not a nice-to-have)

A checker will clone the repo, open it, and expect it to work. That constrains the
design:

- **`memory` is the default backend.** Cloned repo → open `index.html` → full site
  with demo data. Zero setup, zero secrets, zero terminal commands.
- **`supabase` is an opt-in mode** switched on by `config.local.js` (git-ignored)
  or by pasting a URL + anon key in a form the README explains. A missing key must
  fall back to `memory` with a small "running offline with sample data" note, never
  a blank page or a thrown error.
- **Commit `config.example.js`, `.env.example`, and a README** with the two ways to
  run it (offline demo, optional database) and one screenshot of each.
- **Never commit** `.env`, `config.local.js`, keys, or the Supabase seed dump of any
  private row. Demo rows are public by design, so they may be committed as `seed.sql`.
- **No build step required to view.** Keep it plain HTML/CSS/JS that opens from disk;
  if a bundler or `npm install` becomes necessary, that breaks "clone and it works"
  for a grader who will not read the instructions first.
- **Schema travels with the repo**: `supabase/migrations/*.sql` + `supabase/seed.sql`,
  so the database can be rebuilt on any machine (or in a free local Postgres) with
  two commands.

#### Local Postgres vs Supabase — both are real Postgres

"Supabase is optional" means the **cloud account** is optional, not the database.
The same SQL files run on either one, because Supabase *is* Postgres.

| Where it runs | What is needed | Who can run it |
| --- | --- | --- |
| `memory` adapter (default) | nothing — open `index.html` | the grader, in one click |
| Postgres on your own laptop | install Postgres, create the database, run `migrations/*.sql` + `seed.sql`, **plus a small server in front of it** (a tiny Node API or PostgREST) because a browser cannot open a Postgres connection itself | anyone willing to install and run two things |
| Supabase (hosted Postgres) | a free account, two SQL files run in its editor, URL + anon key in `config.local.js` | anyone with the key |

The middle row is the honest catch: a database on the laptop is still a real
database, but it needs a small API layer between the page and Postgres. Supabase
already supplies that layer over HTTPS, which is why it is the cheap path — not
because it is a different kind of database. Either way the domain sees only the
`EntityRepository` port, so switching between the three touches one line in
`composition/container.js`.

Priority order is unchanged (labels → verdict card → core + memory adapter →
Supabase). Section 6.6 only sets the **default**: demo data stays the fallback after
the database lands, so the project is never dependent on a live cloud account to be
viewable.

---

## 7. Honest risks

- Splitting `script.js` (1257 lines, all coupled) is the biggest and least
  glamorous chunk of the work. Do it incrementally: extract one renderer at a time,
  ship, repeat.
- The spring chart controllers hold their own state (`chartSprings`). They belong
  in the DOM adapter and should be passed data, not read `state` directly.
- Supabase from a static page is fine, but a public anon key means the tables are
  effectively public — RLS is not optional, and no private data goes in them.
- Demo data lives in the database long-term, so the "Sample data" badge is a
  permanent UI element, not scaffolding to remove later. Forgetting it is the
  single easiest way to mislead a reader.
