# Surge.AI Deployment Guide

This document covers the complete deployment pipeline for Surge.AI, including staging, production, health checks, and rollback strategies.

---

## 🚀 Quick Start

```bash
# Build locally
npm run build

# Build Docker image
docker build -t surge-ai .

# Run locally
docker run -p 3000:80 surge-ai

# Or use docker-compose
docker-compose up -d
```

---

## 📋 Prerequisites

- Node.js 20+
- Docker & Docker Compose
- GitHub repository with Actions enabled
- Container registry access (GHCR, Docker Hub, etc.)
- Staging server with SSH access
- Production server with SSH access
- Supabase project configured
- Stripe account configured

---

## 🌍 Environments

### Local Development
```bash
npm run dev
```
- URL: `http://localhost:5173`
- Hot reload enabled
- No containerization needed

### Staging
- Branch: `develop`
- URL: `https://staging.surge.ai`
- Auto-deploys on push to `develop`
- Used for QA and testing

### Production
- Branch: `main`
- URL: `https://surge.ai`
- Auto-deploys on push to `main`
- Requires all CI checks to pass

---

## 🔄 CI/CD Pipeline

### Continuous Integration (CI)
Triggered on every push and PR:

1. **Lint** — ESLint with strict rules
2. **Type Check** — TypeScript compilation check
3. **Test** — Unit tests with Vitest
4. **Build** — Production build verification
5. **Docker** — Container image build (on push only)

### Continuous Deployment (CD)

#### Staging Deployment
- Triggered on push to `develop`
- Runs all tests
- Builds Docker image
- Pushes to container registry
- Deploys to staging server
- Runs health checks

#### Production Deployment
- Triggered on push to `main`
- Runs all CI checks
- Builds Docker image with version tags
- Deploys to production
- Runs health checks
- Auto-rollback on failure

---

## 🐳 Docker

### Building
```bash
# Build image
docker build -t surge-ai .

# Build with specific tag
docker build -t surge-ai:v1.0.0 .
```

### Running
```bash
# Run container
docker run -d -p 3000:80 \
  --name surge-ai \
  --env-file .env.production \
  surge-ai

# With docker-compose
docker-compose up -d surge-ai
```

### Health Check
```bash
# Check container health
docker inspect --format='{{.State.Health.Status}}' surge-ai

# Check health endpoint
curl http://localhost:3000/health
```

---

## 🏥 Health Checks

The application exposes a `/health` endpoint:

```bash
curl https://surge.ai/health
# Response: "healthy"
```

### Docker Health Check
Configured in Dockerfile:
- Interval: 30s
- Timeout: 3s
- Retries: 3
- Start period: 5s

### CI Health Check
After deployment, the CI pipeline:
1. Waits 10 seconds for stabilization
2. Hits `/health` endpoint
3. Fails deployment if unhealthy
4. Triggers automatic rollback

---

## 🔙 Rollback Strategy

### Automatic Rollback
If health check fails after deployment:
1. CI detects failure
2. Automatically triggers rollback
3. Restores previous Docker image
4. Verifies health post-rollback
5. Notifies team

### Manual Rollback
```bash
# Via GitHub Actions
# Go to Actions → Deploy to Production → Run workflow
# Check "Rollback to previous version"

# Via CLI
kubectl rollout undo deployment/surge-ai

# Via Docker
docker stop surge-ai
docker run -d -p 3000:80 surge-ai:previous-tag
```

### Rollback Steps
1. Identify the issue
2. Determine previous stable version
3. Trigger rollback (auto or manual)
4. Verify health post-rollback
5. Investigate root cause
6. Fix and redeploy

---

## 🔐 Environment Variables

### Required for Production
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-role-key

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Stripe Price IDs
STRIPE_SURGE_COINS_STARTER=price_...
STRIPE_SURGE_COINS_CREATOR=price_...
STRIPE_SURGE_COINS_PRO=price_...
STRIPE_SURGE_COINS_ULTRA=price_...
STRIPE_SURGE_BUCKS_SMALL=price_...
STRIPE_SURGE_BUCKS_MEDIUM=price_...
STRIPE_SURGE_BUCKS_LARGE=price_...

# App
APP_URL=https://surge.ai
```

### Setting Environment Variables
```bash
# In GitHub Actions
# Settings → Secrets and variables → Actions
# Add: STAGING_DEPLOY_TOKEN, PRODUCTION_DEPLOY_TOKEN

# In Docker
docker run --env-file .env.production surge-ai

# In docker-compose
environment:
  - NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}
```

---

## 📊 Monitoring

### Application Logs
```bash
# Docker logs
docker logs -f surge-ai

# With timestamp
docker logs --since 1h surge-ai
```

### Metrics to Monitor
- Response time (should be < 200ms)
- Error rate (should be < 1%)
- Uptime (should be > 99.9%)
- CPU/Memory usage
- Database connection pool
- Stripe webhook success rate

### Alerting
Set up alerts for:
- Health check failures
- High error rates
- Slow response times
- Container restarts
- SSL certificate expiry

---

## 🛡️ Security

### Container Security
- Non-root user in production
- Minimal base image (Alpine)
- No unnecessary packages
- Read-only filesystem where possible

### Network Security
- HTTPS only (TLS 1.3)
- Security headers configured
- CORS properly configured
- Rate limiting on API routes

### Secrets Management
- Never commit secrets
- Use GitHub Secrets for CI/CD
- Use environment variables in Docker
- Rotate secrets regularly

---

## 📝 Deployment Checklist

### Pre-deployment
- [ ] All tests passing
- [ ] Linting clean
- [ ] Type check passing
- [ ] Build successful
- [ ] Environment variables set
- [ ] Database migrations run
- [ ] Stripe products configured

### During deployment
- [ ] Docker image built
- [ ] Image pushed to registry
- [ ] Deployment initiated
- [ ] Health checks passing

### Post-deployment
- [ ] Application accessible
- [ ] All pages loading
- [ ] API endpoints working
- [ ] Stripe webhooks receiving
- [ ] Supabase connections stable
- [ ] No errors in logs

---

## 🚨 Troubleshooting

### Build Failures
```bash
# Clear npm cache
npm cache clean --force

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Check Node version
node --version  # Should be 20+
```

### Docker Issues
```bash
# Rebuild without cache
docker build --no-cache -t surge-ai .

# Check Docker logs
docker logs surge-ai

# Restart container
docker restart surge-ai
```

### Deployment Issues
```bash
# Check CI logs
# GitHub → Actions → Failed workflow → View logs

# Manual deployment
npm run build
docker build -t surge-ai .
docker run -d -p 3000:80 surge-ai
```

---

## 📞 Support

For deployment issues:
1. Check CI/CD logs in GitHub Actions
2. Review Docker container logs
3. Check application health endpoint
4. Review Supabase dashboard
5. Check Stripe webhook logs

---

## 🔄 Version Management

### Semantic Versioning
- `v1.0.0` — Major releases
- `v1.1.0` — Minor releases (new features)
- `v1.1.1` — Patch releases (bug fixes)

### Docker Tags
- `prod-latest` — Latest production version
- `prod-{sha}` — Specific commit
- `staging-latest` — Latest staging version
- `v{version}` — Semantic version tags

---

*Last updated: 2024*
