#!/bin/bash
# Surge.AI Rollback Script
# Usage: ./scripts/rollback.sh [environment] [version]
# If no version specified, rolls back to previous deployment

set -e

ENVIRONMENT=${1:-"staging"}
VERSION=${2:-""}

echo "🔄 Surge.AI Rollback"
echo "Environment: $ENVIRONMENT"
echo "---"

# Validate environment
if [ "$ENVIRONMENT" != "staging" ] && [ "$ENVIRONMENT" != "production" ]; then
    echo "❌ Invalid environment. Use 'staging' or 'production'"
    exit 1
fi

# Check if previous version file exists
if [ -z "$VERSION" ]; then
    if [ ! -f ".previous-version-$ENVIRONMENT" ]; then
        echo "❌ No previous version found for $ENVIRONMENT"
        echo "Please specify a version: ./scripts/rollback.sh $ENVIRONMENT <version>"
        exit 1
    fi
    
    VERSION=$(cat .previous-version-$ENVIRONMENT)
    echo "📝 Rolling back to previous version: $VERSION"
else
    echo "📝 Rolling back to specified version: $VERSION"
fi

# Get current container ID
CURRENT_CONTAINER=$(docker ps -q --filter "name=surge-ai-$ENVIRONMENT" 2>/dev/null || echo "")

if [ ! -z "$CURRENT_CONTAINER" ]; then
    # Save current version for potential re-rollback
    CURRENT_IMAGE=$(docker inspect --format='{{.Config.Image}}' $CURRENT_CONTAINER 2>/dev/null || echo "")
    if [ ! -z "$CURRENT_IMAGE" ]; then
        echo "📝 Saving current version for re-rollback: $CURRENT_IMAGE"
        echo "$CURRENT_CONTAINER" > .previous-version-$ENVIRONMENT
    fi
    
    # Stop current container
    echo "🛑 Stopping current container..."
    docker stop surge-ai-$ENVIRONMENT
    docker rm surge-ai-$ENVIRONMENT
fi

# Start previous version
echo "🚀 Starting previous version..."
PORT=${ENVIRONMENT == "production" ? "80" : "3000"}

docker run -d \
    --name surge-ai-$ENVIRONMENT \
    --restart unless-stopped \
    -p $PORT:80 \
    --env-file .env.$ENVIRONMENT \
    $VERSION

# Wait for container to start
echo "⏳ Waiting for container to start..."
sleep 5

# Health check
echo "🏥 Running health check..."
./scripts/health-check.sh "http://localhost:$PORT"

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Rollback successful!"
    echo "Environment: $ENVIRONMENT"
    echo "Version: $VERSION"
    echo "URL: http://localhost:$PORT"
    exit 0
else
    echo ""
    echo "❌ Rollback failed health check!"
    echo "Manual intervention required."
    exit 1
fi
