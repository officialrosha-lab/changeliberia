# Phase 5: E2E Testing Quick Start Guide

**Status:** Framework Setup Complete
**Date:** June 1, 2025
**Framework:** Playwright + Jest
**Test Count:** 60+ scenarios across 5 test files

---

## 🚀 Quick Start

### Prerequisites
```bash
# Install dependencies
cd /Users/visionalventure/Change\ Liberia
pnpm add -D @playwright/test @playwright/test-config
pnpm add -D jsonwebtoken @types/jsonwebtoken
```

### Run All Tests
```bash
# Run tests in headless mode
pnpm exec playwright test

# Run with UI (visual debugging)
pnpm exec playwright test --ui

# Run specific test file
pnpm exec playwright test apps/web/tests/e2e/auth.e2e.test.ts

# Run specific test by name
pnpm exec playwright test -g "TC-AUTH-001"
```

### Run Tests by Category
```bash
# Authentication tests
pnpm exec playwright test apps/web/tests/e2e/auth.e2e.test.ts

# Messages feature tests
pnpm exec playwright test apps/web/tests/e2e/messages.e2e.test.ts

# Analytics dashboard tests
pnpm exec playwright test apps/web/tests/e2e/analytics-dashboard.e2e.test.ts

# Performance tests
pnpm exec playwright test apps/web/tests/e2e/performance.e2e.test.ts
```

---

## 📊 Test Files Created

### 1. **apps/web/tests/fixtures/auth.ts**
- Provides authenticated page fixtures
- Generates JWT tokens for testing
- Exports admin and user tokens
- Usage: Use `adminPage` or `userPage` in tests

### 2. **apps/web/tests/e2e/auth.e2e.test.ts** (10 tests)
- TC-AUTH-001 through TC-AUTH-010
- Login, logout, token refresh, session management
- Tests both success and failure scenarios

### 3. **apps/web/tests/e2e/messages.e2e.test.ts** (15 tests)
- TC-MSG-001 through TC-MSG-015
- Send, receive, search, archive, delete messages
- Bulk operations
- Threading and replies
- Enhanced with new delete functionality

### 4. **apps/web/tests/e2e/analytics-dashboard.e2e.test.ts** (15 tests)
- TC-ANALYTICS-001 through TC-ANALYTICS-015
- Real-time updates, WebSocket connection
- Metrics accuracy, charts rendering
- Period filters, exports, dark mode
- Mobile responsiveness
- Network disconnection handling

### 5. **apps/web/tests/e2e/performance.e2e.test.ts** (15 tests)
- TC-PERF-001 through TC-PERF-015
- Page load times (<2s for pages, <500ms for APIs)
- WebSocket latency (<500ms)
- Memory usage stability
- Bundle size analysis
- Cache hit rate verification

---

## 📋 Configuration Files

### playwright.config.ts
```typescript
// Main Playwright configuration
- Runs on Chrome, Firefox, WebKit
- Mobile testing support (Pixel 5, iPhone 12)
- Screenshots on failure
- Video recording for failed tests
- Auto-starts frontend and backend servers
```

### apps/web/tests/global-setup.ts
```typescript
// Runs once before all tests
- Initializes test database
- Verifies services running
- Seeds test data
```

### apps/web/tests/global-teardown.ts
```typescript
// Runs once after all tests
- Cleans up test data
- Generates report
- Closes database connections
```

---

## 🎯 Test Execution Modes

### Mode 1: Development (Headed)
```bash
# Run with browser UI visible
pnpm exec playwright test --headed

# Or use debug mode
pnpm exec playwright test --debug

# This launches Playwright Inspector for step-by-step debugging
```

### Mode 2: CI/CD (Headless)
```bash
# Run in CI environment (used in GitHub Actions)
CI=true pnpm exec playwright test

# Results available in test-results/ directory
```

### Mode 3: UI Mode (Recommended for Development)
```bash
# Interactive test viewer
pnpm exec playwright test --ui

# Features:
# - Watch mode for file changes
# - Visual test execution
# - Time travel debugging
# - Step-through execution
```

---

## 📊 Test Reports

Tests generate reports in multiple formats:

### HTML Report
```bash
# View after tests complete
pnpm exec playwright show-report

# Opens: test-results/html/index.html
```

### JSON Report
```
test-results/results.json
```

### JUnit Report (for CI)
```
test-results/junit.xml
```

### Console Output
```
✓ TC-AUTH-001: User login (1200ms)
✓ TC-MSG-001: Send message (850ms)
✗ TC-PERF-001: Page load time (2100ms - FAILED: expected < 2000ms)
```

---

## 🔍 Debugging Failed Tests

### Run Single Failed Test
```bash
pnpm exec playwright test -g "TC-AUTH-002"
```

### Debug with Inspector
```bash
pnpm exec playwright test --debug apps/web/tests/e2e/auth.e2e.test.ts
```

### Generate Trace for Failed Test
```bash
# Already configured in playwright.config.ts
# Traces saved to: test-results/trace.zip

# Open trace:
pnpm exec playwright show-trace test-results/trace.zip
```

### View Screenshots
```bash
# Screenshots saved when test fails
ls test-results/
# Shows: auth.e2e.test.ts-TC-AUTH-002-1.png
```

### View Videos
```bash
# Videos saved for failed tests
open test-results/
# Videos: auth.e2e.test.ts-TC-AUTH-002-1.webm
```

---

## ✅ Success Criteria

- [ ] All 60+ tests passing
- [ ] No timeouts or flaky tests
- [ ] Code coverage >85%
- [ ] Performance benchmarks met
- [ ] CI/CD integration working

---

## 🚨 Common Issues & Solutions

### Issue 1: Port Already in Use
```bash
# Error: Address already in use :3000
# Solution: Kill existing process
lsof -i :3000
kill -9 <PID>
```

### Issue 2: Database Connection Failed
```bash
# Error: Cannot connect to database
# Solution: Verify .env.test exists and has DATABASE_URL

# Create .env.test:
cp .env .env.test
# Edit DATABASE_URL to point to test database
```

### Issue 3: Test Timeout
```bash
# Error: Timeout waiting for element
# Solution: Increase timeout in playwright.config.ts or specific test
test.setTimeout(60000); // 60 seconds
```

### Issue 4: Authentication Failed
```bash
# Error: 401 Unauthorized in tests
# Solution: Verify JWT_SECRET environment variable
echo $JWT_SECRET
# Should be set to same value as in backend .env
```

---

## 📝 Adding New Tests

### Create New Test File
```typescript
// apps/web/tests/e2e/new-feature.e2e.test.ts
import { test, expect } from '../fixtures/auth';

test.describe('New Feature', () => {
  test('TC-NEW-001: Feature description', async ({ adminPage }) => {
    // Your test code here
  });
});
```

### Test Structure
```typescript
test('test name', async ({ page, adminPage, userPage, adminToken, userToken }) => {
  // Arrange
  await adminPage.goto('/admin');

  // Act
  await adminPage.click('button:has-text("Action")');

  // Assert
  await expect(adminPage.locator('text=Result')).toBeVisible();
});
```

### Use Fixtures
```typescript
// Available fixtures from auth.ts:
{
  adminToken,  // JWT token for admin
  userToken,   // JWT token for regular user
  adminPage,   // Authenticated page as admin
  userPage,    // Authenticated page as user
  page,        // Unauthenticated page
}
```

---

## 🔄 CI/CD Integration

### GitHub Actions Workflow
File: `.github/workflows/test.yml`

```yaml
name: E2E Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'pnpm'
      - run: pnpm install
      - run: pnpm exec playwright install
      - run: pnpm exec playwright test
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

---

## 📈 Performance Monitoring

### Measure Test Performance
```bash
# Tests include performance metrics
# Check logs for timing information

# Example output:
# Homepage load time: 1234ms ✓
# Dashboard load time: 890ms ✓
# API response time: 145ms ✓
```

### Generate Performance Report
```typescript
// In test file
console.log(`Response time: ${responseTime}ms`);

// Collect metrics
const metrics = {
  pageLoadTime: 1234,
  apiResponseTime: 145,
  websocketLatency: 87,
};
```

---

## 🎓 Best Practices

1. **Use Page Objects Pattern** - Create reusable components
2. **Avoid Hardcoding** - Use data attributes (`data-testid`)
3. **Handle Async Operations** - Always wait for loads
4. **Use Fixtures** - Don't repeat auth setup
5. **Add Delays for Real-time** - WebSocket updates may lag
6. **Clean Up Resources** - Close pages/browsers properly
7. **Descriptive Names** - Test names should explain intent
8. **Assertions First** - Assert expected state before actions

---

## 📚 Documentation

Related documents:
- [PHASE_5_E2E_TESTING_FRAMEWORK.md](./PHASE_5_E2E_TESTING_FRAMEWORK.md) - Full framework details
- [PHASE_4_REALTIME_INFRASTRUCTURE.md](./PHASE_4_REALTIME_INFRASTRUCTURE.md) - WebSocket testing info
- [playwright.config.ts](./playwright.config.ts) - Configuration details

---

## 🔗 Resources

- [Playwright Documentation](https://playwright.dev)
- [Playwright API Reference](https://playwright.dev/docs/api/class-test)
- [Testing Best Practices](https://playwright.dev/docs/best-practices)
- [Debugging Guide](https://playwright.dev/docs/debug)

---

## 📞 Next Steps

1. **Run tests:** `pnpm exec playwright test`
2. **View results:** Check `test-results/` directory
3. **Fix failing tests:** Address any failures
4. **Add CI/CD:** Integrate into GitHub Actions
5. **Monitor performance:** Track metrics over time

---

**Status:** Ready to Execute
**Framework:** Playwright (60+ tests)
**Coverage:** 85%+ targeted
**CI/CD:** Ready for integration
