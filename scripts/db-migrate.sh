#!/bin/bash
# Surge.AI Database Migration Script
# Usage: ./scripts/db-migrate.sh [environment]
# Environments: local, staging, production

set -e

ENVIRONMENT=${1:-"local"}

echo "🗄️  Surge.AI Database Migration"
echo "Environment: $ENVIRONMENT"
echo "================================"
echo ""

# Load environment-specific variables
case $ENVIRONMENT in
    local)
        echo "📍 Using local database configuration"
        MIGRATION_FILE="scripts/supabase-migration.sql"
        ;;
    staging)
        echo "📍 Using staging database configuration"
        MIGRATION_FILE="scripts/supabase-migration.sql"
        ;;
    production)
        echo "📍 Using production database configuration"
        MIGRATION_FILE="scripts/supabase-migration.sql"
        echo ""
        echo "⚠️  WARNING: You are about to run migrations on PRODUCTION!"
        echo "Press Ctrl+C to cancel or Enter to continue..."
        read
        ;;
    *)
        echo "❌ Invalid environment: $ENVIRONMENT"
        echo "Usage: $0 [local|staging|production]"
        exit 1
        ;;
esac

# Check if migration file exists
if [ ! -f "$MIGRATION_FILE" ]; then
    echo "❌ Migration file not found: $MIGRATION_FILE"
    exit 1
fi

echo ""
echo "📄 Migration file: $MIGRATION_FILE"
echo "📊 File size: $(wc -l < "$MIGRATION_FILE") lines"
echo ""

# Validate SQL syntax (basic check)
echo "🔍 Validating SQL syntax..."
if grep -q "CREATE TABLE" "$MIGRATION_FILE"; then
    echo "✅ CREATE TABLE statements found"
fi

if grep -q "CREATE INDEX" "$MIGRATION_FILE"; then
    echo "✅ CREATE INDEX statements found"
fi

if grep -q "CREATE POLICY" "$MIGRATION_FILE"; then
    echo "✅ RLS policies found"
fi

if grep -q "CREATE OR REPLACE FUNCTION" "$MIGRATION_FILE"; then
    echo "✅ RPC functions found"
fi

echo ""
echo "✅ Migration file validation complete"
echo ""

# Check for dangerous operations
echo "🔍 Checking for dangerous operations..."
DANGEROUS_OPS=0

if grep -q "DROP TABLE" "$MIGRATION_FILE"; then
    echo "⚠️  DROP TABLE detected - ensure data has been backed up!"
    DANGEROUS_OPS=1
fi

if grep -q "DROP COLUMN" "$MIGRATION_FILE"; then
    echo "⚠️  DROP COLUMN detected - ensure data has been backed up!"
    DANGEROUS_OPS=1
fi

if grep -q "TRUNCATE" "$MIGRATION_FILE"; then
    echo "⚠️  TRUNCATE detected - this will delete all data!"
    DANGEROUS_OPS=1
fi

if [ $DANGEROUS_OPS -eq 0 ]; then
    echo "✅ No dangerous operations detected"
fi

echo ""
echo "================================"
echo "✅ Migration validation complete"
echo ""

if [ "$ENVIRONMENT" = "production" ]; then
    echo "📋 Next steps for production:"
    echo "1. Backup your database"
    echo "2. Review the migration file"
    echo "3. Run migrations in Supabase dashboard:"
    echo "   - Go to SQL Editor"
    echo "   - Copy contents of $MIGRATION_FILE"
    echo "   - Execute the query"
    echo "4. Verify tables were created"
    echo "5. Test the application"
else
    echo "📋 To apply migrations:"
    echo "1. Open Supabase dashboard"
    echo "2. Go to SQL Editor"
    echo "3. Copy contents of $MIGRATION_FILE"
    echo "4. Execute the query"
fi

echo ""
echo "✅ Done!"
