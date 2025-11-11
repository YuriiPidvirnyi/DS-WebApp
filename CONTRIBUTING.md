# Contributing to DS-WebApp

Thank you for your interest in contributing to the Dental Story web application! This document provides guidelines and instructions for contributing.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Testing Guidelines](#testing-guidelines)
- [Documentation](#documentation)

## Code of Conduct

Please read and follow our [Code of Conduct](CODE_OF_CONDUCT.md) to foster an open and welcoming environment.

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Git
- Code editor (VS Code recommended)

### Setup

1. **Fork the repository**

   ```bash
   # Click "Fork" on GitHub
   ```

2. **Clone your fork**

   ```bash
   git clone https://github.com/YOUR_USERNAME/DS-WebApp.git
   cd DS-WebApp
   ```

3. **Add upstream remote**

   ```bash
   git remote add upstream https://github.com/YuriiPidvirnyi/DS-WebApp.git
   ```

4. **Install dependencies**

   ```bash
   npm install
   ```

5. **Create `.env.local`**

   ```bash
   cp .env.example .env.local
   # Edit .env.local with your API keys
   ```

6. **Start development server**
   ```bash
   npm run dev
   ```

## Development Workflow

### 1. Create a Feature Branch

```bash
git checkout develop
git pull upstream develop
git checkout -b feature/your-feature-name
```

### Branch Naming Convention

- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation changes
- `refactor/` - Code refactoring
- `test/` - Adding tests
- `chore/` - Maintenance tasks

**Examples**:

- `feature/add-booking-calendar`
- `fix/appointment-validation`
- `docs/update-readme`

### 2. Make Your Changes

- Write clean, self-documenting code
- Follow existing code style
- Add/update tests
- Update documentation

### 3. Commit Your Changes

```bash
git add .
git commit -m "feat(scope): description"
```

See [Commit Guidelines](#commit-guidelines) for details.

### 4. Keep Your Branch Updated

```bash
git fetch upstream
git rebase upstream/develop
```

### 5. Push to Your Fork

```bash
git push origin feature/your-feature-name
```

### 6. Create Pull Request

- Go to GitHub
- Click "New Pull Request"
- Select `develop` as base branch
- Fill in PR template
- Request review

## Coding Standards

### TypeScript

- ✅ Use TypeScript for all new code
- ✅ Avoid `any` type - use proper types
- ✅ Export types for reusability
- ✅ Use interfaces for objects
- ✅ Use type for unions/primitives

**Good**:

```typescript
interface User {
  id: string
  name: string
  email: string
}

function getUser(id: string): Promise<User> {
  // ...
}
```

**Bad**:

```typescript
function getUser(id: any): any {
  // ...
}
```

### React Components

- ✅ Use functional components with hooks
- ✅ Extract reusable logic to custom hooks
- ✅ Keep components small and focused
- ✅ Use prop destructuring
- ✅ Define prop types with TypeScript

**Good**:

```typescript
interface Props {
  title: string
  onClose: () => void
}

export const Modal: React.FC<Props> = ({ title, onClose }) => {
  return (
    <div>
      <h2>{title}</h2>
      <button onClick={onClose}>Close</button>
    </div>
  )
}
```

### File Organization

```
src/
├── components/        # React components
│   ├── ui/           # Reusable UI components
│   ├── forms/        # Form components
│   └── __tests__/    # Component tests
├── hooks/            # Custom React hooks
├── services/         # API and external services
├── utils/            # Utility functions
├── types/            # TypeScript type definitions
└── styles/           # Global styles
```

### Styling

- ✅ Use Tailwind CSS utility classes
- ✅ Use `clsx` for conditional classes
- ✅ Create reusable component variants
- ✅ Follow mobile-first approach

**Good**:

```typescript
<button
  className={clsx(
    'px-4 py-2 rounded-lg transition-colors',
    variant === 'primary' && 'bg-blue-600 text-white',
    variant === 'secondary' && 'bg-gray-200 text-gray-900'
  )}
>
  Click me
</button>
```

### Performance

- ✅ Use `React.memo()` for expensive components
- ✅ Lazy load routes and heavy components
- ✅ Optimize images (WebP, lazy loading)
- ✅ Use `useMemo()` and `useCallback()` appropriately

## Commit Guidelines

We follow [Conventional Commits](https://www.conventionalcommits.org/).

### Format

```
type(scope): subject

body (optional)

footer (optional)
```

### Types

- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation changes
- `style` - Code style (formatting, no logic change)
- `refactor` - Code restructuring
- `perf` - Performance improvement
- `test` - Adding/updating tests
- `chore` - Maintenance (dependencies, config)
- `ci` - CI/CD changes

### Scopes

- `api` - API related
- `ui` - UI components
- `forms` - Form handling
- `booking` - Booking system
- `clinicards` - CliniCards integration
- `tests` - Testing
- `deps` - Dependencies

### Examples

```bash
feat(booking): add date picker component
fix(api): handle timeout errors in appointments
docs(readme): update setup instructions
test(booking): add unit tests for booking flow
refactor(ui): extract Button component variants
perf(images): implement lazy loading for gallery
chore(deps): update React to 18.3.0
```

### Rules

- ✅ Use present tense ("add" not "added")
- ✅ Use imperative mood ("move" not "moves")
- ✅ Don't capitalize first letter
- ✅ No period at the end of subject
- ✅ Limit subject to 72 characters
- ✅ Reference issues in footer (`Closes #123`)

## Pull Request Process

### Before Submitting

- [ ] Code builds successfully (`npm run build`)
- [ ] All tests pass (`npm test`)
- [ ] Linting passes (`npm run lint`)
- [ ] Type checking passes (`npm run typecheck`)
- [ ] Documentation updated
- [ ] CHANGELOG updated (if applicable)
- [ ] Branch is up to date with `develop`

### PR Template

```markdown
## Description

Brief description of changes

## Type of Change

- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing

- [ ] Unit tests added/updated
- [ ] E2E tests added/updated
- [ ] Manual testing performed

## Screenshots

(if applicable)

## Related Issues

Closes #123
```

### Review Process

1. **Automated Checks**
   - CI/CD pipeline must pass
   - Code coverage must not decrease
   - Bundle size within limits

2. **Code Review**
   - At least 1 approval required
   - Address all review comments
   - Keep discussions professional

3. **Merge**
   - Squash commits into single commit
   - Use descriptive merge message
   - Delete branch after merge

## Testing Guidelines

### Unit Tests

- Test individual functions/components
- Mock external dependencies
- Use `vitest` and `@testing-library/react`
- Aim for 80%+ coverage

**Example**:

```typescript
describe('calculateTotal', () => {
  it('should sum prices correctly', () => {
    const items = [{ price: 100 }, { price: 200 }]
    expect(calculateTotal(items)).toBe(300)
  })
})
```

### Integration Tests

- Test component interactions
- Test API integration
- Mock external services

### E2E Tests

- Test critical user flows
- Use Playwright
- Test on different viewports

**Example**:

```typescript
test('should complete booking', async ({ page }) => {
  await page.goto('/booking')
  await page.fill('#name', 'John Doe')
  await page.click('text=Submit')
  await expect(page.locator('.success')).toBeVisible()
})
```

### Running Tests

```bash
# Unit tests
npm test

# Watch mode
npm test -- --watch

# Coverage
npm run test:coverage

# E2E tests
npm run test:e2e

# Visual regression
npm run test:visual
```

## Documentation

### Code Comments

- ✅ Comment complex logic
- ✅ Use JSDoc for public functions
- ✅ Explain "why" not "what"

**Good**:

```typescript
/**
 * Calculates discount based on loyalty tier.
 * Premium users get 20% off, Gold get 15%, others get 5%.
 */
function calculateDiscount(user: User, total: number): number {
  // Implementation
}
```

### README Updates

- Update if you add new features
- Update setup instructions if changed
- Keep it concise

### API Documentation

- Document all API endpoints
- Include request/response examples
- Note authentication requirements

## Questions?

- 📧 Email: info@dentalstory.ua
- 💬 GitHub Discussions
- 🐛 GitHub Issues

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

**Thank you for contributing! 🎉**
