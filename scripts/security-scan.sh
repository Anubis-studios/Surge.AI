#!/bin/bash
# Surge.AI Security Scan Script
# Usage: ./scripts/security-scan.sh

set -e

echo "🔒 Surge.AI Security Scan"
echo "========================="
echo ""

# 1. NPM Audit
echo "📦 Running npm audit..."
npm audit --audit-level=moderate || {
    echo "⚠️  npm audit found vulnerabilities"
    echo "Run 'npm audit fix' to automatically fix issues"
}
echo "✅ npm audit complete"
echo ""

# 2. Check for outdated packages
echo "📦 Checking for outdated packages..."
npm outdated || true
echo "✅ Outdated check complete"
echo ""

# 3. Check for secrets in code
echo "🔍 Scanning for potential secrets..."
SECRETS_FOUND=0

# Check for common secret patterns
if grep -r "sk_live_" src/ --include="*.ts" --include="*.tsx" 2>/dev/null; then
    echo "⚠️  Found potential Stripe live key in source code!"
    SECRETS_FOUND=1
fi

if grep -r "sk_test_" src/ --include="*.ts" --include="*.tsx" 2>/dev/null; then
    echo "⚠️  Found potential Stripe test key in source code!"
    SECRETS_FOUND=1
fi

if grep -r "password.*=.*['\"]" src/ --include="*.ts" --include="*.tsx" 2>/dev/null | grep -v "test" | grep -v "spec"; then
    echo "⚠️  Found potential hardcoded passwords!"
    SECRETS_FOUND=1
fi

if [ $SECRETS_FOUND -eq 0 ]; then
    echo "✅ No obvious secrets found in source code"
fi
echo ""

# 4. Check environment files
echo "🔍 Checking environment files..."
if [ -f ".env.local" ]; then
    echo "⚠️  .env.local exists - ensure it's in .gitignore"
    if ! grep -q ".env.local" .gitignore 2>/dev/null; then
        echo "❌ .env.local is NOT in .gitignore!"
    else
        echo "✅ .env.local is properly ignored"
    fi
fi

if [ -f ".env" ]; then
    echo "⚠️  .env exists - ensure it's in .gitignore"
fi
echo ""

# 5. Check for exposed API keys in frontend
echo "🔍 Checking for exposed API keys..."
if grep -r "SUPABASE_SERVICE" src/ --include="*.ts" --include="*.tsx" 2>/dev/null; then
    echo "❌ Found SUPABASE_SERVICE key in frontend code!"
    echo "Service keys should only be used in backend/API routes"
else
    echo "✅ No service keys found in frontend code"
fi
echo ""

# 6. Check Docker image for vulnerabilities (if Docker is available)
if command -v docker &> /dev/null; then
    echo "🐳 Checking Docker image (if built)..."
    if docker images | grep -q "surge-ai"; then
        echo "Found surge-ai image. Consider running:"
        echo "  docker scout cves surge-ai:latest"
        echo "  or use Snyk: snyk container test surge-ai:latest"
    else
        echo "ℹ️  No surge-ai Docker image found (skipping)"
    fi
else
    echo "ℹ️  Docker not available (skipping Docker scan)"
fi
echo ""

# 7. Check HTTPS configuration
echo "🔍 Checking security headers..."
if [ -f "nginx.conf" ]; then
    if grep -q "X-Frame-Options" nginx.conf; then
        echo "✅ X-Frame-Options header configured"
    else
        echo "⚠️  X-Frame-Options header not found in nginx.conf"
    fi
    
    if grep -q "X-Content-Type-Options" nginx.conf; then
        echo "✅ X-Content-Type-Options header configured"
    else
        echo "⚠️  X-Content-Type-Options header not found in nginx.conf"
    fi
    
    if grep -q "X-XSS-Protection" nginx.conf; then
        echo "✅ X-XSS-Protection header configured"
    else
        echo "⚠️  X-XSS-Protection header not found in nginx.conf"
    fi
else
    echo "ℹ️  nginx.conf not found (skipping header check)"
fi
echo ""

echo "========================="
echo "✅ Security scan complete"
echo ""
echo "📋 Recommendations:"
echo "1. Run 'npm audit fix' to fix known vulnerabilities"
echo "2. Use environment variables for all secrets"
echo "3. Enable Snyk or similar for continuous monitoring"
echo "4. Regularly rotate API keys and secrets"
echo "5. Use HTTPS in production"
