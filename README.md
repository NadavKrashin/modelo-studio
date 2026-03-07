# Modelo — פלטפורמת הדפסת תלת מימד

A search-driven 3D Printing as a Service platform in Hebrew (RTL).

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env.local
# Edit .env.local — add your Thingiverse API token (see below)

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

**Without tokens**, the app still works — it shows models from the local mock catalog only. Each provider is independently optional.

### How the provider system works

```
User searches "dragon"
        │
        ▼
  ┌───────────────┐
  │ SearchService  │─── 1. Query local catalog (fast, always available)
  └───────┬───────┘    2. Query external providers in parallel
          │            3. Merge, deduplicate, rank, cache
          ▼
  ┌────────────────────┐
  │  ProviderRegistry   │
  │  ├─ local           │──► MockModelRepository (built-in models)
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
| **Graceful fallback** | If the API is down, local results are shown with a notice |

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
- **Zustand** (client-side cart state)
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
│   │   ├── local-provider.ts  # Local mock data provider
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
│   ├── services/              # SearchService, OrderService, PricingService
│   ├── repositories/          # Data access layer (mock implementations)
│   ├── types/                 # TypeScript interfaces
│   ├── licenses.ts            # License registry + Thingiverse mapping
│   ├── db/                    # Mock database / seed data
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

\* Without tokens, the app runs with local data only. Each provider is independently optional.

## Troubleshooting

### "Provider disabled" at startup

Your API token/key is missing or empty. Set the relevant env var in `.env.local`:
- **Thingiverse**: `THINGIVERSE_API_TOKEN` — get it from `https://www.thingiverse.com/apps/`
- **MyMiniFactory**: `MYMINIFACTORY_API_KEY` — get it from `https://www.myminifactory.com/pages/for-developers`

### Search returns only local results

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
