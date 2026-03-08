# Modelo — פלטפורמת הדפסת תלת מימד

A search-driven 3D Printing as a Service platform in Hebrew (RTL).

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env.local
# Edit .env.local — add provider + Firebase values (see below)

# 3. Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Provider Setup

### Thingiverse (active)

Thingiverse is the first integrated external provider for real 3D model data.

1. **Get an API token** — go to [thingiverse.com/apps/create](https://www.thingiverse.com/apps/create) and create an app.
2. **Copy the access token** into `.env.local`:

   ```env
   THINGIVERSE_API_TOKEN=your_token_here
   THINGIVERSE_ENABLED=true
   ```

3. Restart the dev server. You should see this in the console:

   ```
   [Container] Thingiverse provider enabled (timeout=10000ms, retries=2, circuit-threshold=5)
   ```

### MyMiniFactory (active)

MyMiniFactory is the second external provider, offering curated 3D-printable models.

1. **Get an API key** — register at [myminifactory.com/api](https://www.myminifactory.com/pages/for-developers) and request developer access.
2. **Add your key** to `.env.local`:

   ```env
   MYMINIFACTORY_API_KEY=your_api_key_here
   MYMINIFACTORY_ENABLED=true
   ```

3. Restart the dev server. You should see:

   ```
   [Container] MyMiniFactory provider enabled (timeout=12000ms, retries=2, circuit-threshold=5)
   ```

If provider credentials are missing/invalid, storefront results will be empty rather than mocked.

## Firebase Setup (foundation)

Firebase is now the persistence foundation for app state:
- Firestore order records
- Firestore search-term + order-event analytics
- Firestore normalized model metadata cache
- client/server Firebase bootstrap for upcoming auth + notifications phases

### 1) Create project + Firestore

1. Create a Firebase project in [Firebase Console](https://console.firebase.google.com/).
2. Enable Firestore (Native mode).
3. Create a Web App and copy the `NEXT_PUBLIC_FIREBASE_*` config values.
4. Create a service account key from Project settings -> Service accounts.

### 2) Configure `.env.local`

Set all `NEXT_PUBLIC_FIREBASE_*` variables and one server auth option:
- Option A: `FIREBASE_SERVICE_ACCOUNT_JSON`
- Option B: `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`

### 3) Collections used in this phase

- `orders`
- `search_terms`
- `order_events`
- `model_cache`

### TODO markers for next phases

- `TODO(firebase-auth)`: add Firebase Authentication integration and user identity linkage.
- `TODO(firebase-notifications)`: add Firebase Cloud Messaging integration for order status notifications.

### How the provider system works

```
User searches "dragon"
        │
        ▼
  ┌───────────────┐
  │ SearchService  │─── 1. Query normalized catalog cache
  └───────┬───────┘    2. Query external providers in parallel
          │            3. Merge, deduplicate, rank, persist
          ▼
  ┌────────────────────┐
  │  ProviderRegistry   │
  │  ├─ thingiverse     │──► ThingiverseProvider → ThingiverseClient → API
  │  └─ myminifactory   │──► MyMiniFactoryProvider → MMFClient → API
  └────────────────────┘
```

**Resilience features:**

| Feature | Description |
|---------|-------------|
| **Circuit breaker** | After 5 consecutive failures, stops querying the API for 60s |
| **Exponential backoff** | Retries with increasing delay + random jitter |
| **Request timeout** | 10s per request (configurable) |
| **Rate limiting** | Sliding-window, 300 req / 5 min |
| **Negative caching** | Failed queries are cached for 30s to prevent retry storms |
| **Response caching** | Search: 5 min, model details: 30 min, images: 1 hour |
| **Graceful empty state** | If providers/cache have no real data, storefront returns empty results |

### Diagnostics

- **Provider status**: `GET /api/providers` — returns availability, circuit state, cache stats for all providers
- **Server logs**: Structured `[Thingiverse]`, `[MMF]`, `[SearchService]`, `[Container]` prefixes

### Adding more providers

The architecture supports additional providers (Printables, Thangs, etc.). Stub configs exist in `src/lib/config/providers.ts`. To add a new provider:

1. Create `src/lib/providers/<name>/types.ts`, `client.ts`, `normalizer.ts`, `provider.ts`
2. Add config in `src/lib/config/providers.ts`
3. Register in `src/lib/services/container.ts`

## Tech Stack

- **Next.js 16** (App Router, Server + Client Components)
- **React 19** + **TypeScript**
- **Tailwind CSS 4**
- **Zustand** (client-side cart + search UI state)
- **Firebase + Firestore** (persistent app state foundation)
- **Zod** (API validation)

## Project Structure

```
src/
├── app/
│   ├── (storefront)/          # Customer-facing pages
│   │   ├── page.tsx           # Homepage
│   │   ├── search/            # Search results + loading/error states
│   │   ├── model/[id]/        # Model details + loading/error states
│   │   ├── cart/              # Shopping cart
│   │   ├── checkout/          # Guest checkout
│   │   └── order/             # Confirmation + tracking
│   ├── admin/                 # Admin area
│   └── api/                   # API routes
│       ├── search/
│       ├── models/[id]/
│       ├── providers/         # Provider diagnostics
│       └── ...
├── components/
│   ├── layout/                # Header, Footer
│   └── ui/                    # Skeletons, ErrorBoundary, etc.
├── lib/
│   ├── config/                # Provider configuration + validation
│   ├── providers/
│   │   ├── cache.ts           # In-memory TTL cache with negative caching
│   │   ├── registry.ts        # Federated search orchestration
│   │   ├── base-provider.ts   # Abstract provider interface
│   │   ├── thingiverse/       # Thingiverse integration
│   │   │   ├── types.ts       # Raw API response types
│   │   │   ├── client.ts      # HTTP client + circuit breaker
│   │   │   ├── normalizer.ts  # Raw → NormalizedModel mapping
│   │   │   └── provider.ts    # Provider implementation
│   │   └── myminifactory/     # MyMiniFactory integration
│   │       ├── types.ts       # Raw API response types
│   │       ├── client.ts      # HTTP client + circuit breaker
│   │       ├── normalizer.ts  # Raw → NormalizedModel mapping
│   │       └── provider.ts    # Provider implementation
│   ├── firebase/              # Firebase client/admin bootstrap
│   ├── catalog/               # In-memory + Firestore cache layer
│   ├── services/              # SearchService, OrderService, PricingService
│   ├── repositories/          # Firestore + static repositories
│   ├── types/                 # TypeScript interfaces
│   ├── licenses.ts            # License registry + Thingiverse mapping
│   └── constants/             # Categories, filaments
└── features/                  # Feature modules (future)
```

## Architecture Highlights

### License Awareness

Every model carries a `ModelLicense` with SPDX ID, commercial-use status, and attribution requirements. Each provider normalizer maps raw license data to canonical licenses (Thingiverse maps license strings, MyMiniFactory maps license type/value arrays). The UI surfaces:

- Color-coded license banner on model detail pages
- NC (non-commercial) badges on search result cards
- Full license link and condition breakdown

### Normalized Model Schema

The `NormalizedModel` type is the single source of truth for model data in the UI. All provider-specific quirks are absorbed in the normalizer layer. The UI **never** accesses raw API fields.

### Pricing

- Size-based pricing with volume ratio
- Material/filament modifiers
- Embossed text surcharge
- Live price updates on customization changes

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `THINGIVERSE_API_TOKEN` | No* | — | Thingiverse API access token |
| `THINGIVERSE_ENABLED` | No | `true` (if token set) | Set to `false` to disable |
| `THINGIVERSE_API_URL` | No | `https://api.thingiverse.com` | API base URL override |
| `MYMINIFACTORY_API_KEY` | No* | — | MyMiniFactory API key |
| `MYMINIFACTORY_ENABLED` | No | `true` (if key set) | Set to `false` to disable |
| `MYMINIFACTORY_API_URL` | No | `https://www.myminifactory.com/api/v2` | API base URL override |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Yes | — | Firebase web app API key |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Yes | — | Firebase web app auth domain |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Yes | — | Firebase project ID |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Yes | — | Firebase storage bucket |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Yes | — | Firebase messaging sender ID |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Yes | — | Firebase web app ID |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | Yes** | — | Firebase admin service account JSON |
| `FIREBASE_PROJECT_ID` | Yes** | — | Firebase admin project id |
| `FIREBASE_CLIENT_EMAIL` | Yes** | — | Firebase admin client email |
| `FIREBASE_PRIVATE_KEY` | Yes** | — | Firebase admin private key |
| `FIREBASE_STORAGE_BUCKET` | No | — | Firebase bucket for future file flows |

\* Provider data requires credentials; no fake local catalog fallback is used.  
\** Use either `FIREBASE_SERVICE_ACCOUNT_JSON` or the explicit admin fields.

## Troubleshooting

### "Provider disabled" at startup

Your API token/key is missing or empty. Set the relevant env var in `.env.local`:
- **Thingiverse**: `THINGIVERSE_API_TOKEN` — get it from `https://www.thingiverse.com/apps/`
- **MyMiniFactory**: `MYMINIFACTORY_API_KEY` — get it from `https://www.myminifactory.com/pages/for-developers`

### Search returns no results

Check `GET /api/providers` — if a provider shows `available: false` or `circuitState: "open"`, the API may be down or your credentials may be invalid.

### "Circuit breaker OPEN" in logs

A provider failed 5+ times in a row. The circuit auto-resets after 60 seconds. If it keeps happening, check:
1. Is your API token/key valid?
2. Is the provider API reachable from your network?
3. Are you hitting rate limits?

## PWA

Manifest and icon placeholders are set up. Add actual icons to `public/icons/`.

## Language

- All UI is in Hebrew (RTL)
- Search supports Hebrew and English queries
- Font: Heebo (Google Fonts)
