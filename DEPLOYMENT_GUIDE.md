# 🚀 Surge.AI — Complete Deployment Guide

This guide covers the full deployment of Surge.AI including the Next.js backend, frontend, and end-to-end testing.

---

## 📋 Prerequisites

- Node.js 20+
- npm 9+
- Supabase account & project
- Stripe account
- Git

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                  FRONTEND (Vite + React)                 │
│                  http://localhost:5173                    │
│                  https://surge.ai                        │
└────────────────────────┬────────────────────────────────┘
                         │ VITE_API_URL
                         ▼
┌─────────────────────────────────────────────────────────┐
│                  BACKEND (Next.js)                       │
│                  http://localhost:3001                    │
│                  https://api.surge.ai                    │
└────────────────────────┬────────────────────────────────┘
                         │
          ┌──────────────┼──────────────┐
          ▼              ▼              ▼
   ┌────────────┐ ┌────────────┐ ┌────────────┐
   │  Supabase  │ │   Stripe   │ │  Supplier  │
   │  Database  │ │  Payments  │ │   APIs     │
   └────────────┘ └────────────┘ └────────────┘
```

---

## 🔧 Step 1: Backend Setup

### 1.1 Install Backend Dependencies

```bash
cd backend
npm install
```

### 1.2 Configure Backend Environment

Copy the example environment file:

```bash
cp backend/.env.local.example backend/.env.local
```

Edit `backend/.env.local` with your actual values:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIs...

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Stripe Price IDs (from scripts/stripe-setup.js)
STRIPE_SURGE_COINS_STARTER=price_...
STRIPE_SURGE_COINS_CREATOR=price_...
STRIPE_SURGE_COINS_PRO=price_...
STRIPE_SURGE_COINS_ULTRA=price_...
STRIPE_SURGE_BUCKS_SMALL=price_...
STRIPE_SURGE_BUCKS_MEDIUM=price_...
STRIPE_SURGE_BUCKS_LARGE=price_...

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5173

# Application URL
APP_URL=http://localhost:3001
```

### 1.3 Run Database Migration

1. Go to your Supabase dashboard
2. Open SQL Editor
3. Copy and run the contents of `scripts/supabase-migration.sql`
4. Verify all tables are created

### 1.4 Set Up Stripe Products

```bash
cd backend
STRIPE_SECRET_KEY=sk_live_... node ../scripts/stripe-setup.js
```

This creates all Stripe products and outputs price IDs to add to your `.env.local`.

### 1.5 Start Backend Server

```bash
cd backend
npm run dev
```

Backend will be available at `http://localhost:3000` (or 3001 if port conflict).

### 1.6 Verify Backend Health

```bash
curl http://localhost:3000/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "service": "surge-ai-backend",
  "version": "1.0.0",
  "timestamp": "2024-..."
}
```

---

## 🎨 Step 2: Frontend Setup

### 2.1 Install Frontend Dependencies

```bash
npm install
```

### 2.2 Configure Frontend Environment

The `.env.local` file is already configured with:

```bash
VITE_API_URL=http://localhost:3001
```

Update this to match your backend URL.

### 2.3 Start Frontend Dev Server

```bash
npm run dev
```

Frontend will be available at `http://localhost:5173`.

---

## 🔗 Step 3: Connect Frontend to Backend

### 3.1 Verify API Connection

With both servers running, test the connection:

```bash
# From frontend, should fetch billing status
curl -X GET http://localhost:3001/api/billing/status \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 3.2 CORS Configuration

CORS is already configured in `backend/middleware.ts` and `backend/next.config.js`:

```javascript
// middleware.ts
headers: {
  'Access-Control-Allow-Origin': process.env.FRONTEND_URL || '*',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}
```

For production, update `FRONTEND_URL` to your production domain.

---

## 🧪 Step 4: End-to-End Testing

### 4.1 Install Playwright Browsers

```bash
npx playwright install
```

### 4.2 Run E2E Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run with UI mode (interactive)
npm run test:e2e:ui

# Run in headed mode (see browser)
npm run test:e2e:headed

# View test report
npm run test:e2e:report
```

### 4.3 Test Coverage

E2E tests cover:
- ✅ Authentication flow
- ✅ Dashboard display
- ✅ Image Studio interactions
- ✅ Video Engine interactions
- ✅ Billing page
- ✅ Rewards page
- ✅ Navigation
- ✅ Responsive design
- ✅ Complete user flows

---

## 🌐 Step 5: Production Deployment

### Option A: Vercel (Recommended)

#### Backend Deployment

1. Push backend to GitHub
2. Import project in Vercel
3. Configure environment variables
4. Deploy

```bash
cd backend
vercel --prod
```

#### Frontend Deployment

1. Push frontend to GitHub
2. Import project in Vercel
3. Set environment variables:
   - `VITE_API_URL=https://api.surge.ai`
4. Deploy

```bash
vercel --prod
```

### Option B: Docker

#### Build Backend Image

```bash
cd backend
docker build -t surge-ai-backend .
docker run -p 3001:3000 \
  --env-file .env.local \
  surge-ai-backend
```

#### Build Frontend Image

```bash
docker build -t surge-ai-frontend .
docker run -p 80:80 surge-ai-frontend
```

#### Docker Compose

```bash
docker-compose up -d
```

### Option C: Custom Server

#### Backend

```bash
cd backend
npm run build
npm start
```

#### Frontend

```bash
npm run build
# Serve dist/ folder with nginx/apache
```

---

## 🔐 Step 6: Production Environment Variables

### Frontend (.env.production)

```bash
VITE_API_URL=https://api.surge.ai
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### Backend (Server Environment)

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-key
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
FRONTEND_URL=https://surge.ai
APP_URL=https://api.surge.ai
# ... all other vars from .env.local.example
```

---

## 🏥 Step 7: Health Checks & Monitoring

### Backend Health Endpoint

```bash
curl https://api.surge.ai/api/health
```

### Frontend Health Check

```bash
./scripts/health-check.sh https://surge.ai
```

### Monitoring Checklist

- [ ] Backend health endpoint responding
- [ ] Frontend loading correctly
- [ ] Supabase connections stable
- [ ] Stripe webhooks receiving
- [ ] Error rates below 1%
- [ ] Response times under 200ms

---

## 🔄 Step 8: CI/CD Pipeline

The GitHub Actions workflows are already configured:

### Development Pipeline
- Triggers on push to `main`/`develop`
- Runs: lint → typecheck → test → build

### Staging Pipeline
- Manual trigger or auto after dev
- Runs: integration tests → security scan → deploy

### Production Pipeline
- Manual trigger with approval
- Runs: full tests → security validation → deploy → health check

---

## 📊 Step 9: Verify End-to-End Flow

### Test Checklist

- [ ] User can log in
- [ ] Dashboard shows balances
- [ ] Image generation works (deducts 1 coin)
- [ ] Video generation works (deducts 3 bucks)
- [ ] Daily rewards can be claimed
- [ ] Stripe checkout redirects correctly
- [ ] Webhooks update balances
- [ ] Galleries show generated content
- [ ] Responsive design works on mobile
- [ ] PWA install prompt appears

### Manual Test Flow

1. **Login**
   - Go to http://localhost:5173
   - Click "Sign In" with demo credentials

2. **Dashboard**
   - Verify Surge Coins balance shows
   - Verify Surge Bucks balance shows
   - Verify streak displays

3. **Image Studio**
   - Enter a prompt
   - Select a style
   - Click "Generate Image"
   - Verify coin balance decreases
   - Verify image appears in gallery

4. **Video Engine**
   - Enter a prompt
   - Add storyboard scenes
   - Click "Generate Video"
   - Verify buck balance decreases
   - Verify video appears in gallery

5. **Billing**
   - View all bundles
   - Click purchase button
   - Verify Stripe checkout opens (in production)

6. **Rewards**
   - View current streak
   - Click "Claim Today's Reward"
   - Verify coins increase
   - Verify confetti animation

---

## 🐛 Troubleshooting

### Backend Not Starting

```bash
# Check for port conflicts
lsof -i :3000
lsof -i :3001

# Kill process on port
kill -9 <PID>
```

### CORS Errors

- Verify `FRONTEND_URL` in backend `.env.local`
- Check `middleware.ts` is configured
- Clear browser cache

### API Not Responding

- Check backend is running
- Verify `VITE_API_URL` in frontend `.env.local`
- Check network tab in browser devtools

### Database Errors

- Verify Supabase migration ran successfully
- Check RLS policies are applied
- Verify service role key is correct

### Stripe Errors

- Verify webhook secret matches
- Check price IDs are correct
- Verify Stripe account is in correct mode (test/live)

---

## 📞 Support

For issues:
1. Check logs in Vercel dashboard
2. Review Supabase logs
3. Check Stripe webhook logs
4. Review browser console for frontend errors
5. Check backend terminal for API errors

---

## ✅ Deployment Complete Checklist

- [ ] Backend deployed and healthy
- [ ] Frontend deployed and accessible
- [ ] Environment variables configured
- [ ] Database migrated
- [ ] Stripe products created
- [ ] Webhooks configured
- [ ] CORS configured
- [ ] E2E tests passing
- [ ] Health checks working
- [ ] Monitoring set up
- [ ] CI/CD pipeline working

---

**Status:** 🟢 Ready for Production Deployment

**Last Updated:** 2024
