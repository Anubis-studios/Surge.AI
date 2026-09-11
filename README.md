# Surge.AI

**AI Video & Image Generation Platform with Dual-Currency Creator Economy**

> Create stunning AI images and premium videos via our low cost Surge.AI. Powered by a dual-currency creator economy.

---

## 🚀 Features

- **Image Studio** — Premium AI image generation
- **Video Engine** — Premium AI video generation
- **Daily Rewards** — Login streak engine with increasing Surge Coin rewards
- **Dual Currency** — Surge Coins (images) + Surge Bucks (videos)
- **Stripe Billing** — Secure payment processing
- **PWA** — Installable progressive web app with offline support
- **Obsidian + Gold UI** — Premium dark cyber aesthetic

---

## 📁 Project Structure

```
surge-ai/
├── index.html                  # Entry HTML with PWA meta tags
├── package.json                # Dependencies
├── vite.config.js              # Vite configuration
├── .env.local.example          # Environment variables template
│
├── public/
│   ├── manifest.json           # PWA manifest
│   ├── service-worker.js       # Service worker (offline + caching)
│   ├── offline.html            # Offline fallback page
│   └── icons/
│       └── icon.svg            # App icon
│
├── src/
│   ├── main.tsx                # React entry point
│   ├── App.tsx                 # Root component with routing
│   ├── index.css               # Tailwind + custom theme
│   │
│   ├── components/
│   │   ├── Layout.tsx          # Sidebar + navigation shell
│   │   ├── Notification.tsx    # Toast notifications
│   │   ├── ParticleBackground.tsx  # Animated background
│   │   └── InstallPrompt.tsx   # PWA install prompt
│   │
│   ├── pages/
│   │   ├── AuthGate.tsx        # Login/signup page
│   │   ├── Dashboard.tsx       # Main dashboard
│   │   ├── ImageStudio.tsx     # AI image generation
│   │   ├── VideoEngine.tsx     # AI video generation
│   │   ├── Billing.tsx         # Purchase coins/bucks
│   │   └── Rewards.tsx         # Daily streak rewards
│   │
│   ├── store/
│   │   └── index.tsx           # State management + economy logic
│   │
│   ├── types/
│   │   └── index.ts            # TypeScript type definitions
│   │
│   └── config/
│       ├── backend-architecture.ts  # Backend reference
│       └── api-routes.ts            # API route documentation
│
└── scripts/
    ├── supabase-migration.sql  # Database schema + RLS + RPC
    └── stripe-setup.js         # One-time Stripe product creation
```

---

## 🛠️ Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Variables

Copy `.env.local.example` to `.env.local` and fill in:

```bash
cp .env.local.example .env.local
```

### 3. Supabase Setup

Run `scripts/supabase-migration.sql` in your Supabase SQL Editor to create:
- All tables (tenants, profiles, billing_accounts, images, videos, etc.)
- Row Level Security policies
- RPC functions for atomic currency operations
- Storage bucket for images

### 4. Stripe Setup

Create all Stripe products and prices:

```bash
STRIPE_SECRET_KEY=sk_live_... node scripts/stripe-setup.js
```

This outputs the price IDs to add to your `.env.local`.

### 5. Run Development Server

```bash
npm run dev
```

### 6. Build for Production

```bash
npm run build
```

---

## 🧪 Testing & Linting

### Run Tests
```bash
npm run test              # Run all tests
npm run test:watch        # Watch mode
npm run test:coverage     # With coverage report
```

### Run Linter
```bash
npm run lint              # Check for issues
npm run lint:fix          # Auto-fix issues
```

### Type Check
```bash
npm run typecheck         # TypeScript validation
```

### Test Coverage
Tests cover:
- Economy configuration (bundles, costs, rewards)
- Store logic (state management, currency operations)
- Component rendering (all pages)
- User interactions (image/video generation, purchases)

---

## 💰 Economy System

### Surge Coins
- Used for AI image generation (1 coin per image)
- Earned via daily login streak
- Purchasable via Stripe

| Pack | Price | Coins |
|------|-------|-------|
| Starter | £3 | 30 |
| Creator | £7 | 80 |
| Pro | £15 | 200 |
| Ultra | £30 | 450 |

### Surge Bucks
- Used for AI video generation (3 bucks per video)
- Purchasable via Stripe

| Pack | Price | Bucks |
|------|-------|-------|
| Small | £10 | 100 |
| Medium | £25 | 300 |
| Large | £50 | 700 |

### Daily Streak Rewards

| Day | Coins |
|-----|-------|
| 1 | 10 |
| 2 | 15 |
| 3 | 20 |
| 4 | 25 |
| 5+ | 30 |

---

## 🔒 Branding Rules

**NEVER reveal to users:**
- Supplier names
- Model names (SDXL, etc.)
- Technical pipelines
- Backend engine details
- Internal API endpoints

**Always use:**
- "Image Studio" (not SDXL)
- "Video Engine" (not supplier name)
- "Premium AI generation" (not model-specific)
- "Surge.AI rendering network" (not supplier network)

---

## 📱 PWA

The app is a fully installable Progressive Web App:
- **manifest.json** — App metadata, icons, shortcuts
- **service-worker.js** — Offline caching + app shell
- **offline.html** — Beautiful offline fallback
- **InstallPrompt** — Native install prompt component

---

## 🎨 Theme

**Obsidian + Gold** cyber aesthetic:
- Background: `#050509` → `#0b0c10`
- Gold accent: `#fbbf24` → `#f59e0b`
- Purple accent: `#8b5cf6`
- Cyan accent: `#06b6d4`

Custom CSS classes:
- `.obsidian-panel` — Dark panel with subtle border
- `.gold-heading` — Gold gradient text
- `.gold-capsule-button` — Pill-shaped CTA button
- `.terminal-input` — Dark monospace input
- `.stat-box` — Balance display card
- `.gold-glow-panel` — Panel with gold glow border

---

## 🐳 Docker & Deployment

### Docker Build
```bash
npm run docker:build      # Build Docker image
npm run docker:run        # Run container on port 3000
```

### Docker Compose
```bash
docker-compose up -d      # Production mode
docker-compose --profile dev up -d  # Development mode
```

### Deployment Scripts
```bash
# Health check
./scripts/health-check.sh http://localhost:3000

# Deploy to staging
./scripts/deploy.sh staging latest

# Deploy to production
./scripts/deploy.sh production v1.0.0

# Rollback
./scripts/rollback.sh staging
./scripts/rollback.sh production v0.9.0
```

### CI/CD Pipeline
- **CI**: Runs on every push/PR (lint, typecheck, test, build)
- **Staging**: Auto-deploys on push to `develop`
- **Production**: Auto-deploys on push to `main`
- **Rollback**: Automatic on health check failure

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for full deployment guide.

---

## 📡 API Routes (Production Backend)

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/rewards/daily` | Claim daily streak reward |
| POST | `/api/purchase/surge-coins` | Stripe checkout for coins |
| POST | `/api/purchase/surge-bucks` | Stripe checkout for bucks |
| POST | `/api/stripe/webhook` | Handle Stripe events |
| GET | `/api/billing/status` | Get current balances |
| POST | `/api/tool/sdxl` | Generate image (internal) |
| POST | `/api/render` | Generate video (internal) |
| GET | `/api/images/recent` | Get recent images |
| POST | `/api/supplier/callback` | Video completion callback |

---

## 🗄️ Database Schema

Tables:
- `tenants` — Organization/workspace
- `profiles` — User profiles (linked to auth.users)
- `billing_accounts` — Dual currency balances + streak
- `image_jobs` — Pending image generation jobs
- `images` — Completed image records
- `render_jobs` — Pending video render jobs
- `videos` — Completed video records

Storage:
- `images` bucket — Public image storage

---

## License

Private — Surge.AI Platform
