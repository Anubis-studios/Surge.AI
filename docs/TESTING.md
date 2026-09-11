# Surge.AI Testing Guide

## Running Tests

### Quick Start
```bash
npm run test
```

### Watch Mode
```bash
npm run test:watch
```

### With Coverage
```bash
npm run test:coverage
```

## Test Structure

### Unit Tests
- `src/__tests__/economy.test.ts` — Economy configuration tests
- `src/__tests__/store.test.tsx` — Store/state management tests
- `src/__tests__/components.test.tsx` — Component rendering tests

### What's Tested

#### Economy Tests
- Surge Coin bundles (4 tiers, prices, amounts)
- Surge Buck bundles (3 tiers, prices, amounts)
- Streak rewards (5 days, increasing values)
- Generation costs (1 coin for images, 3 bucks for videos)
- Value per unit calculations

#### Store Tests
- Initial state (balances, streak, user profile)
- Image generation (deducts coins, adds to gallery)
- Video generation (deducts bucks, adds to gallery)
- Purchasing (adds correct amounts for each bundle)
- Daily rewards (increments streak, adds coins)
- Notifications (clear functionality)
- Edge cases (insufficient funds, empty prompts, double claims)

#### Component Tests
- Dashboard (welcome message, balances, streak, navigation)
- Image Studio (prompt input, style presets, aspect ratios, generate button)
- Video Engine (prompt input, storyboard, generate button, engine info)
- Billing (balances, all bundles, prices, purchase buttons, badges)
- Rewards (streak display, claim button, schedule, progress bar)

## Test Coverage Goals

- **Economy Logic**: 100% coverage
- **Store Reducers**: 95%+ coverage
- **Components**: 80%+ coverage
- **Critical Paths**: 100% coverage (purchases, generation, rewards)

## Running Specific Tests

```bash
# Run only economy tests
npx vitest run src/__tests__/economy.test.ts

# Run only store tests
npx vitest run src/__tests__/store.test.tsx

# Run only component tests
npx vitest run src/__tests__/components.test.tsx

# Run tests matching pattern
npx vitest run -t "Image Generation"
```

## Debugging Tests

### Verbose Output
```bash
npx vitest run --reporter=verbose
```

### Debug Mode
```bash
npx vitest run --inspect-brk
```

### Single Test
```bash
npx vitest run -t "should deduct 1 coin when generating image"
```

## CI Integration

Tests run automatically in GitHub Actions:
- On every push to `main` or `develop`
- On every pull request
- Before deployment to staging/production

See `.github/workflows/ci.yml` for details.

## Adding New Tests

### Unit Test Template
```typescript
import { describe, it, expect } from 'vitest';

describe('Feature Name', () => {
  it('should do something', () => {
    // Arrange
    const input = 'test';
    
    // Act
    const result = myFunction(input);
    
    // Assert
    expect(result).toBe('expected');
  });
});
```

### Component Test Template
```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MyComponent } from '../MyComponent';

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });
});
```

## Test Best Practices

1. **Arrange-Act-Assert** pattern
2. **Descriptive test names** (should do X when Y)
3. **One assertion per test** (when possible)
4. **Test edge cases** (empty inputs, insufficient funds)
5. **Mock external dependencies** (APIs, timers)
6. **Keep tests independent** (no shared state)

## Common Issues

### Tests Fail with "toBeInTheDocument" undefined
- Ensure `src/test/setup.ts` imports `@testing-library/jest-dom/vitest`
- Check `vitest.config.ts` includes setupFiles

### Tests Timeout
- Increase timeout in `vitest.config.ts`:
  ```typescript
  test: {
    testTimeout: 10000, // 10 seconds
  }
  ```

### Async Tests Fail
- Use `await` with async operations
- Use `waitFor` from `@testing-library/react`:
  ```typescript
  import { waitFor } from '@testing-library/react';
  
  await waitFor(() => {
    expect(screen.getByText('Loaded')).toBeInTheDocument();
  });
  ```

## Coverage Reports

Generate HTML coverage report:
```bash
npm run test:coverage
open coverage/index.html
```

Coverage includes:
- Statement coverage
- Branch coverage
- Function coverage
- Line coverage

## Continuous Integration

All tests must pass before:
- Merging PRs
- Deploying to staging
- Deploying to production

Failed tests block deployment automatically.
