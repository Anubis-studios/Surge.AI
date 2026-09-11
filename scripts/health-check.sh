#!/bin/bash
# Surge.AI Health Check Script
# Usage: ./scripts/health-check.sh [URL]

URL=${1:-"http://localhost:3000"}
TIMEOUT=5
MAX_RETRIES=3

echo "🏥 Surge.AI Health Check"
echo "URL: $URL"
echo "---"

retry_count=0
while [ $retry_count -lt $MAX_RETRIES ]; do
    echo "Attempt $((retry_count + 1))/$MAX_RETRIES..."
    
    response=$(curl -s -o /dev/null -w "%{http_code}" --max-time $TIMEOUT "$URL/health" 2>/dev/null)
    
    if [ "$response" = "200" ]; then
        echo "✅ Health check passed (HTTP $response)"
        
        # Additional checks
        echo ""
        echo "Running additional checks..."
        
        # Check main page
        main_response=$(curl -s -o /dev/null -w "%{http_code}" --max-time $TIMEOUT "$URL/" 2>/dev/null)
        if [ "$main_response" = "200" ]; then
            echo "✅ Main page accessible"
        else
            echo "⚠️  Main page returned HTTP $main_response"
        fi
        
        # Check service worker
        sw_response=$(curl -s -o /dev/null -w "%{http_code}" --max-time $TIMEOUT "$URL/service-worker.js" 2>/dev/null)
        if [ "$sw_response" = "200" ]; then
            echo "✅ Service worker accessible"
        else
            echo "⚠️  Service worker returned HTTP $sw_response"
        fi
        
        # Check manifest
        manifest_response=$(curl -s -o /dev/null -w "%{http_code}" --max-time $TIMEOUT "$URL/manifest.json" 2>/dev/null)
        if [ "$manifest_response" = "200" ]; then
            echo "✅ PWA manifest accessible"
        else
            echo "⚠️  PWA manifest returned HTTP $manifest_response"
        fi
        
        echo ""
        echo "✅ All health checks passed!"
        exit 0
    else
        echo "⚠️  Health check failed (HTTP $response)"
        retry_count=$((retry_count + 1))
        sleep 2
    fi
done

echo ""
echo "❌ Health check failed after $MAX_RETRIES attempts"
exit 1
