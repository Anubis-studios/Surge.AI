#!/bin/bash
# Surge.AI Deployment Script
# Usage: ./scripts/deploy.sh [environment] [version]
# Environments: staging, production
# Version: Docker image tag (optional, defaults to latest)

set -e

ENVIRONMENT=${1:-"staging"}
VERSION=${2:-"latest"}
REGISTRY="ghcr.io"
IMAGE_NAME="surge-ai"
FULL_IMAGE="$REGISTRY/$IMAGE_NAME:$VERSION"

echo "🚀 Surge.AI Deployment"
echo "Environment: $ENVIRONMENT"
echo "Version: $VERSION"
echo "Image: $FULL_IMAGE"
echo "---"

# Validate environment
if [ "$ENVIRONMENT" != "staging" ] && [ "$ENVIRONMENT" != "production" ]; then
    echo "❌ Invalid environment. Use 'staging' or 'production'"
    exit 1
fi

# Pre-deployment checks
echo ""
echo "📋 Pre-deployment checks..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running"
    exit 1
fi
echo "✅ Docker is running"

# Check if image exists
if ! docker manifest inspect $FULL_IMAGE > /dev/null 2>&1; then
    echo "⚠️  Image $FULL_IMAGE not found in registry"
    echo "Building locally..."
    docker build -t $FULL_IMAGE .
fi
echo "✅ Image available"

# Save current version for rollback
PREVIOUS_VERSION=$(docker ps -q --filter "name=surge-ai-$ENVIRONMENT" 2>/dev/null || echo "none")
if [ "$PREVIOUS_VERSION" != "none" ]; then
    echo "📝 Saving current version for rollback: $PREVIOUS_VERSION"
    echo $PREVIOUS_VERSION > .previous-version-$ENVIRONMENT
fi

# Stop existing container
echo ""
echo "🛑 Stopping existing container..."
docker stop surge-ai-$ENVIRONMENT 2>/dev/null || true
docker rm surge-ai-$ENVIRONMENT 2>/dev/null || true

# Start new container
echo ""
echo "🚀 Starting new container..."
docker run -d \
    --name surge-ai-$ENVIRONMENT \
    --restart unless-stopped \
    -p ${ENVIRONMENT == "production" ? "80:80" : "3000:80"} \
    --env-file .env.$ENVIRONMENT \
    $FULL_IMAGE

# Wait for container to start
echo ""
echo "⏳ Waiting for container to start..."
sleep 5

# Health check
echo ""
echo "🏥 Running health check..."
PORT=${ENVIRONMENT == "production" ? "80" : "3000"}
./scripts/health-check.sh "http://localhost:$PORT"

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Deployment successful!"
    echo "Environment: $ENVIRONMENT"
    echo "Version: $VERSION"
    echo "URL: http://localhost:$PORT"
    exit 0
else
    echo ""
    echo "❌ Health check failed!"
    echo "Initiating rollback..."
    
    # Rollback
    if [ "$PREVIOUS_VERSION" != "none" ]; then
        docker stop surge-ai-$ENVIRONMENT 2>/dev/null || true
        docker rm surge-ai-$ENVIRONMENT 2>/dev/null || true
        
        # Get previous image tag
        PREVIOUS_IMAGE=$(docker inspect --format='{{.Config.Image}}' $PREVIOUS_VERSION 2>/dev/null || echo "")
        
        if [ ! -z "$PREVIOUS_IMAGE" ]; then
            echo "🔄 Rolling back to: $PREVIOUS_IMAGE"
            docker run -d \
                --name surge-ai-$ENVIRONMENT \
                --restart unless-stopped \
                -p ${ENVIRONMENT == "production" ? "80:80" : "3000:80"} \
                --env-file .env.$ENVIRONMENT \
                $PREVIOUS_IMAGE
            
            sleep 5
            ./scripts/health-check.sh "http://localhost:$PORT"
            
            if [ $? -eq 0 ]; then
                echo "✅ Rollback successful!"
            else
                echo "❌ Rollback also failed. Manual intervention required."
            fi
        else
            echo "❌ No previous version found. Manual intervention required."
        fi
    else
        echo "❌ No previous version to rollback to. Manual intervention required."
    fi
    
    exit 1
fi
