# Surge.AI CI/CD Pipeline Guide

## 🎯 Overview

Surge.AI uses a **3-stage deployment pipeline** with manual approval gates:

1. **Development & Preview** - Automated on every push/PR
2. **Staging** - Manual approval required
3. **Production** - Manual approval required

---

## 📊 Pipeline Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    DEVELOPMENT PIPELINE                      │
│  Trigger: Push to main/develop or PR                        │
│                                                              │
│  1. Code Quality (lint + typecheck)                         │
│  2. Unit Tests (125+ tests)                                 │
│  3. Build                                                   │
│  4. Docker Build                                            │
│  5. Deploy Preview (PR only)                                │
│  6. Security Scan                                           │
└─────────────────────────────────────────────────────────────┘
                            ↓ (manual trigger)
┌─────────────────────────────────────────────────────────────┐
│                     STAGING PIPELINE                         │
│  Trigger: Manual (workflow_dispatch)                        │
│                                                              │
│  1. Verify Development Success                              │
│  2. Integration Tests                                       │
│  3. Security Validation                                     │
│  4. Database Migration Check                                │
│  5. Build Staging Image                                     │
│  6. ⏸️  MANUAL APPROVAL GATE                                │
│  7. Deploy to Staging                                       │
│  8. Health Check                                            │
│  9. Smoke Tests                                             │
└─────────────────────────────────────────────────────────────┘
                            ↓ (manual trigger)
┌─────────────────────────────────────────────────────────────┐
│                    PRODUCTION PIPELINE                       │
│  Trigger: Manual (workflow_dispatch)                        │
│                                                              │
│  1. Verify Staging Health                                   │
│  2. Full Test Suite (unit + integration + E2E)              │
│  3. Security Validation (strict)                            │
│  4. Database Migration Validation                           │
│  5. Build Production Image                                  │
│  6. ⏸️  MANUAL APPROVAL GATE                                │
│  7. Deploy to Production                                    │
│  8. Health Check                                            │
│  9. Smoke Tests                                             │
│  10. Post-deployment Monitoring                             │
│  ⚠️  Auto-rollback on failure                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 Workflow Files

### 1. Development & Preview (`01-development.yml`)

**Triggers:**
- Push to `main` or `develop`
- Pull requests to `main` or `develop`

**Jobs:**
1. **Code Quality** - ESLint + TypeScript
2. **Unit Tests** - 125+ tests with Vitest
3. **Build** - Production build
4. **Docker Build** - Container image
5. **Deploy Preview** - PR preview environment
6. **Security Scan** - npm audit + Snyk

**Artifacts:**
- Coverage reports
- Build output
- Security reports

### 2. Staging (`02-staging.yml`)

**Triggers:**
- Manual dispatch with version parameter
- Auto-triggered after successful development pipeline

**Jobs:**
1. **Verify Development Success** - Check pipeline passed
2. **Integration Tests** - Database + API tests
3. **Security Validation** - Strict security checks
4. **Database Migration Check** - Validate migrations
5. **Build Staging Image** - Docker image
6. **⏸️ Approval Gate** - Manual approval required
7. **Deploy to Staging** - Deploy to staging server
8. **Health Check** - Verify deployment
9. **Smoke Tests** - Basic functionality tests

**Environment:**
- URL: `https://staging.surge-ai.com`
- Requires manual approval from team leads

### 3. Production (`03-production.yml`)

**Triggers:**
- Manual dispatch with version parameter
- Options: skip tests, force deploy

**Jobs:**
1. **Verify Staging** - Check staging is healthy
2. **Full Test Suite** - Unit + Integration + E2E
3. **Security Validation** - Critical-level checks
4. **Database Migration Validation** - Production migrations
5. **Build Production Image** - Docker image
6. **⏸️ Approval Gate** - Manual approval required
7. **Deploy to Production** - Deploy to production
8. **Health Check** - Verify deployment
9. **Smoke Tests** - Critical path tests
10. **Post-deployment Monitoring** - Stability check

**Features:**
- Automatic rollback on failure
- Version tracking
- Deployment summary

---

## 🔐 Approval Gates

### Staging Approval
**Required reviewers:** Team leads
**Checks:**
- All tests passed
- Security scan passed
- Database migrations validated
- Staging environment ready

### Production Approval
**Required reviewers:** Engineering manager + CTO
**Checks:**
- Staging environment healthy
- Full test suite passed
- Security validation passed
- Database migrations validated
- Backup verified

---

## 🧪 Testing Strategy

### Unit Tests
- **Location:** `src/__tests__/*.test.ts`
- **Count:** 125+ tests
- **Coverage:** Economy, store, components
- **Run:** `npm run test`

### Integration Tests
- **Location:** `src/__tests__/integration.test.ts`
- **Count:** 20+ tests
- **Coverage:** API flows, database operations
- **Run:** `npm run test:integration`

### E2E Tests
- **Location:** `tests/e2e/`
- **Count:** 10+ tests
- **Coverage:** Critical user journeys
- **Run:** `npm run test:e2e`

---

## 🔒 Security Scanning

### Automated Scans
1. **npm audit** - Dependency vulnerabilities
2. **Snyk** - Advanced security scanning
3. **TruffleHog** - Secret detection
4. **OWASP ZAP** - Web application scanning (staging)

### Manual Checks
- Code review for security issues
- Environment variable validation
- Database migration review

---

## 🗄️ Database Migrations

### Migration Process
1. Create migration in `scripts/supabase-migration.sql`
2. Test locally: `npm run db:migrate local`
3. Validate in staging: `npm run db:migrate staging`
4. Deploy to production: `npm run db:migrate production`

### Safety Checks
- No `DROP TABLE` without backup
- No `DROP COLUMN` without data migration
- No `TRUNCATE` without confirmation
- All migrations are idempotent

---

## 🔄 Rollback Strategy

### Automatic Rollback
Triggered when:
- Health check fails after deployment
- Smoke tests fail
- Error rate exceeds threshold

Process:
1. Detect failure
2. Stop current deployment
3. Restore previous version
4. Verify health
5. Notify team

### Manual Rollback
```bash
# Rollback staging
./scripts/rollback.sh staging

# Rollback production
./scripts/rollback.sh production

# Rollback to specific version
./scripts/rollback.sh production v1.2.3
```

---

## 📊 Monitoring & Alerts

### Health Checks
- **Endpoint:** `/health`
- **Interval:** 30 seconds
- **Timeout:** 3 seconds
- **Retries:** 3

### Metrics
- Response time (< 200ms)
- Error rate (< 1%)
- Uptime (> 99.9%)
- Container health
- Database connections

### Alerts
- Health check failures
- High error rates
- Slow response times
- Container restarts
- Deployment failures

---

## 🎯 Deployment Commands

### Development
```bash
# Run locally
npm run dev

# Build
npm run build

# Test
npm run test
```

### Staging
```bash
# Via GitHub Actions
# Actions → Staging Deployment → Run workflow
# Enter version (commit SHA)

# Via CLI
./scripts/deploy.sh staging <version>
```

### Production
```bash
# Via GitHub Actions
# Actions → Production Deployment → Run workflow
# Enter version (commit SHA)
# Approve deployment

# Via CLI
./scripts/deploy.sh production <version>
```

---

## 📋 Deployment Checklist

### Pre-deployment
- [ ] All tests passing
- [ ] Linting clean
- [ ] Type check passing
- [ ] Security scan passed
- [ ] Database migrations tested
- [ ] Environment variables set
- [ ] Backup created (production)

### During deployment
- [ ] Docker image built
- [ ] Image pushed to registry
- [ ] Deployment initiated
- [ ] Health checks passing
- [ ] Smoke tests passing

### Post-deployment
- [ ] Application accessible
- [ ] All pages loading
- [ ] API endpoints working
- [ ] Database connections stable
- [ ] No errors in logs
- [ ] Monitoring active

---

## 🚨 Troubleshooting

### Deployment Failed
1. Check GitHub Actions logs
2. Review health check output
3. Check Docker container logs
4. Verify environment variables
5. Consider rollback

### Tests Failed
1. Review test output
2. Check for flaky tests
3. Verify test database
4. Re-run failed tests
5. Fix and retry

### Security Scan Failed
1. Review vulnerability report
2. Update dependencies
3. Fix security issues
4. Re-run scan
5. Document exceptions

---

## 📚 Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Deployment Guide](docs/DEPLOYMENT.md)
- [Testing Guide](docs/TESTING.md)
- [Security Best Practices](https://owasp.org/www-project-top-ten/)

---

*Last updated: 2024*
