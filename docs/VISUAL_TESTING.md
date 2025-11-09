# Visual Regression Testing

Visual regression testing ensures that UI changes don't introduce unintended visual bugs. This document explains how to use and maintain visual regression tests.

## Overview

We use **Playwright** for visual regression testing, which captures screenshots and compares them pixel-by-pixel against baseline images.

## Getting Started

### Prerequisites

```bash
# Install Playwright browsers
npx playwright install
```

### Running Tests

```bash
# Run all visual regression tests
npm run test:visual

# Update baseline screenshots (after intentional UI changes)
npm run test:visual:update

# Run in UI mode for debugging
npm run test:e2e:ui
```

## Test Structure

Tests are located in `tests/visual/` and cover:

1. **Page Snapshots** - Full page screenshots for all major pages
2. **Component States** - Individual component states (hover, focus, error)
3. **Responsive Layouts** - Multiple viewport sizes
4. **Browser Compatibility** - Chrome, Firefox, Safari

## Baseline Screenshots

Baseline screenshots are stored in `tests/visual/**/*-snapshots/` and are organized by:

- Browser (chromium, firefox, webkit)
- Platform (darwin, linux, win32)
- Test name

### When to Update Baselines

Update baseline screenshots when:

- ✅ Making intentional UI/design changes
- ✅ Updating component styles
- ✅ Changing layout or spacing

Do NOT update baselines to fix:

- ❌ Flaky tests (fix the flakiness instead)
- ❌ Unintended visual changes (fix the bug instead)

## CI/CD Integration

Visual regression tests run automatically on:

- Pull requests to `main` or `develop`
- Pushes to `develop`
- Manual workflow dispatch

### GitHub Actions Workflow

```yaml
# .github/workflows/visual-regression.yml
```

The workflow:

1. Builds the application
2. Runs visual regression tests across all browsers
3. Uploads screenshots and reports as artifacts
4. Comments on PR with test results

### Viewing Results

1. Go to the PR's "Checks" tab
2. Click on "Visual Regression Testing"
3. Download artifacts:
   - `visual-screenshots` - Current screenshots
   - `baseline-screenshots` - Baseline for comparison
   - `playwright-report` - HTML report with diffs

## Test Configuration

Visual regression settings in `playwright.config.ts`:

```typescript
expect: {
  toHaveScreenshot: {
    maxDiffPixels: 100,     // Max pixels that can differ
    threshold: 0.2,         // Threshold for pixel comparison (0-1)
  },
}
```

### Adjusting Thresholds

If tests are too sensitive:

```typescript
maxDiffPixels: 200,  // Allow more different pixels
threshold: 0.3,      // Less strict comparison
```

If tests are too lenient:

```typescript
maxDiffPixels: 50,   // Allow fewer different pixels
threshold: 0.1,      // More strict comparison
```

## Writing New Tests

### Basic Page Test

```typescript
test('New Page - Desktop', async ({ page }) => {
  await page.goto('/new-page')
  await page.waitForSelector('[data-testid="content"]')
  await expect(page).toHaveScreenshot('new-page-desktop.png', {
    fullPage: true,
    animations: 'disabled',
  })
})
```

### Component Test

```typescript
test('Button Hover State', async ({ page }) => {
  await page.goto('/')
  const button = page.locator('[data-testid="cta-button"]')
  await button.hover()
  await page.waitForTimeout(300) // Wait for transition
  await expect(button).toHaveScreenshot('button-hover.png', {
    animations: 'disabled',
  })
})
```

### Responsive Test

```typescript
test('Mobile Navigation', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 })
  await page.goto('/')
  await expect(page).toHaveScreenshot('mobile-nav.png')
})
```

## Best Practices

### 1. Wait for Content to Load

```typescript
// Bad - may capture loading state
await page.goto('/')
await expect(page).toHaveScreenshot()

// Good - wait for content
await page.goto('/')
await page.waitForLoadState('networkidle')
await page.waitForSelector('[data-testid="hero-section"]')
await expect(page).toHaveScreenshot()
```

### 2. Disable Animations

```typescript
await expect(page).toHaveScreenshot('page.png', {
  animations: 'disabled', // Prevents flaky tests
})
```

### 3. Use Test IDs

```typescript
// Add data-testid attributes to components
<div data-testid="hero-section">...</div>

// Use in tests
await page.waitForSelector('[data-testid="hero-section"]')
```

### 4. Handle Dynamic Content

```typescript
// Mask dynamic content (timestamps, user-specific data)
await expect(page).toHaveScreenshot('page.png', {
  mask: [
    page.locator('[data-testid="timestamp"]'),
    page.locator('[data-testid="user-avatar"]'),
  ],
})
```

### 5. Test Multiple Viewports

```typescript
const viewports = [
  { name: 'mobile', width: 375, height: 667 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1920, height: 1080 },
]

for (const viewport of viewports) {
  test(`Page - ${viewport.name}`, async ({ page }) => {
    await page.setViewportSize(viewport)
    // ... test logic
  })
}
```

## Troubleshooting

### Tests Failing Unexpectedly

1. **Check the diff images** - Playwright generates diff images showing exactly what changed
2. **Font rendering** - Fonts may render differently across OS. Use consistent CI environment
3. **Animations** - Ensure `animations: 'disabled'` is set
4. **Network timing** - Use `waitForLoadState('networkidle')`

### Flaky Tests

Common causes:

- **Dynamic content** - Mask or wait for stable state
- **Race conditions** - Add explicit waits with `waitForSelector`
- **Fonts not loaded** - Wait for `networkidle` or font load event
- **CSS animations** - Disable with `animations: 'disabled'`

### Screenshots Don't Match Locally

- Different OS/browser versions may produce slightly different screenshots
- Run tests in Docker or CI for consistent environment
- Or accept minor differences with adjusted `threshold`

## Chromatic Integration (Optional)

For a more advanced visual regression solution, consider [Chromatic](https://www.chromatic.com/):

```bash
# Install Chromatic
npm install --save-dev chromatic

# Add to package.json
"chromatic": "chromatic --project-token=<your-token>"

# Run Chromatic
npm run chromatic
```

Benefits:

- Cloud-based screenshot storage
- UI review workflow
- Automatic baseline management
- Integration with Storybook

## Resources

- [Playwright Visual Comparisons](https://playwright.dev/docs/test-snapshots)
- [Best Practices for Visual Testing](https://playwright.dev/docs/best-practices#visual-comparisons)
- [Chromatic Documentation](https://www.chromatic.com/docs/)

## Maintenance

### Regular Updates

- **Weekly** - Review and approve pending visual changes in PRs
- **Monthly** - Update baselines after design system changes
- **Quarterly** - Review and optimize test coverage

### Adding New Pages

When adding a new page:

1. Add page tests to `tests/visual/visual.spec.ts`
2. Test desktop + mobile viewports
3. Run `npm run test:visual:update` to generate baselines
4. Commit baseline screenshots with the feature

### Removing Obsolete Tests

When removing pages/components:

1. Delete the corresponding test
2. Delete baseline screenshots
3. Commit changes

## Summary

Visual regression testing is a powerful tool for catching UI bugs early. Follow these guidelines to maintain reliable, maintainable visual tests:

- ✅ Wait for content to load
- ✅ Disable animations
- ✅ Use data-testid attributes
- ✅ Test multiple viewports
- ✅ Update baselines intentionally
- ✅ Review diffs carefully before approving
