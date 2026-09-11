#!/bin/bash
# Quick test runner for Surge.AI

echo "🧪 Running Surge.AI Tests"
echo "---"

# Run tests
npx vitest run --reporter=verbose

exit_code=$?

if [ $exit_code -eq 0 ]; then
    echo ""
    echo "✅ All tests passed!"
else
    echo ""
    echo "❌ Some tests failed"
fi

exit $exit_code
