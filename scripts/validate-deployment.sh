#!/bin/bash

# Deployment Validation Script
# Checks environment, Docker setup, and application readiness

set -e

echo "=========================================="
echo "Change Liberia Deployment Validator"
echo "=========================================="
echo ""

# Check prerequisites
echo "1. Checking prerequisites..."

if ! command -v docker &> /dev/null; then
    echo "   ❌ Docker not found. Please install Docker."
    exit 1
else
    DOCKER_VERSION=$(docker --version)
    echo "   ✓ $DOCKER_VERSION"
fi

if ! command -v docker &> /dev/null || ! docker compose version &> /dev/null; then
    echo "   ❌ Docker Compose not found. Please install Docker Compose."
    exit 1
else
    echo "   ✓ Docker Compose installed"
fi

if ! command -v git &> /dev/null; then
    echo "   ❌ Git not found. Please install Git."
    exit 1
else
    echo "   ✓ $(git --version)"
fi

# Check environment file
echo ""
echo "2. Checking environment configuration..."

if [ ! -f ".env.local" ] && [ ! -f ".env" ]; then
    echo "   ⚠ No .env file found. Copying from .env.example..."
    cp .env.example .env.local
    echo "   ✓ Created .env.local (update with your values)"
else
    echo "   ✓ Environment file exists"
fi

# Check required directories
echo ""
echo "3. Checking project structure..."

REQUIRED_DIRS=(
    "apps/api"
    "apps/web"
    "packages"
)

for dir in "${REQUIRED_DIRS[@]}"; do
    if [ -d "$dir" ]; then
        echo "   ✓ $dir exists"
    else
        echo "   ❌ $dir missing"
        exit 1
    fi
done

# Validate docker-compose file
echo ""
echo "4. Validating docker-compose.yml..."

if docker compose config > /dev/null 2>&1; then
    echo "   ✓ docker-compose.yml is valid"
else
    echo "   ❌ docker-compose.yml has errors:"
    docker compose config 2>&1
    exit 1
fi

# Check for required services in docker-compose
echo ""
echo "5. Checking docker-compose services..."

REQUIRED_SERVICES=("postgres" "api" "web" "mailhog")

for service in "${REQUIRED_SERVICES[@]}"; do
    if docker compose config | grep -q "^\s*${service}:"; then
        echo "   ✓ Service '${service}' defined"
    else
        echo "   ⚠ Service '${service}' not found"
    fi
done

# Check Dockerfile
echo ""
echo "6. Checking Dockerfiles..."

if [ -f "apps/api/Dockerfile" ]; then
    echo "   ✓ apps/api/Dockerfile exists"
else
    echo "   ❌ apps/api/Dockerfile not found"
    exit 1
fi

if [ -f "apps/web/Dockerfile" ]; then
    echo "   ✓ apps/web/Dockerfile exists"
else
    echo "   ❌ apps/web/Dockerfile not found"
    exit 1
fi

# Check required files
echo ""
echo "7. Checking configuration files..."

REQUIRED_FILES=(
    "apps/api/docker-entrypoint.sh"
    ".dockerignore"
    "docker-compose.yml"
    ".env.example"
    "apps/api/PHASE_12_4_DOCKER_DEPLOYMENT.md"
)

for file in "${REQUIRED_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "   ✓ $file exists"
    else
        echo "   ⚠ $file not found"
    fi
done

# Check environment variables in .env file
echo ""
echo "8. Checking critical environment variables..."

if [ -f ".env.local" ]; then
    ENV_FILE=".env.local"
elif [ -f ".env" ]; then
    ENV_FILE=".env"
else
    ENV_FILE=""
fi

if [ -n "$ENV_FILE" ]; then
    CRITICAL_VARS=("DATABASE_URL" "JWT_SECRET" "STRIPE_API_KEY")
    
    for var in "${CRITICAL_VARS[@]}"; do
        if grep -q "^${var}=" "$ENV_FILE" 2>/dev/null; then
            echo "   ✓ $var is defined"
        else
            echo "   ⚠ $var is not defined in $ENV_FILE"
        fi
    done
else
    echo "   ⚠ No .env file found to check"
fi

# Summary
echo ""
echo "=========================================="
echo "✓ Validation Complete"
echo "=========================================="
echo ""
echo "Next steps:"
echo "  1. Update .env.local with your settings (if not already done)"
echo "  2. Run: docker compose up -d"
echo "  3. Check logs: docker compose logs -f api"
echo "  4. Access API: http://localhost:4000"
echo "  5. Access Web: http://localhost:3000"
echo "  6. Check emails: http://localhost:8025 (MailHog)"
echo ""
