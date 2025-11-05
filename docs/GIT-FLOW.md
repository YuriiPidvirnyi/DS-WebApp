# Git Flow Strategy - Dental Story WebApp

## 📋 Branch Structure

### Main Branches

- **`main`** - Production-ready code (protected)
- **`develop`** - Integration branch for features

### Supporting Branches

- **`feature/*`** - New features (from `develop`)
- **`release/*`** - Release preparation (from `develop` to `main`)
- **`hotfix/*`** - Emergency fixes (from `main`)
- **`bugfix/*`** - Non-critical bug fixes (from `develop`)

## 🔀 Branch Naming Convention

```
feature/DS-123-add-payment-integration
bugfix/DS-124-fix-booking-form
hotfix/DS-125-critical-security-patch
release/v1.2.0
```

## 📝 Commit Message Convention (Conventional Commits)

### Format

```
<type>(<scope>): <subject>

[optional body]

[optional footer(s)]
```

### Types

- **feat**: New feature
- **fix**: Bug fix
- **docs**: Documentation changes
- **style**: Code style changes (formatting, etc)
- **refactor**: Code refactoring
- **perf**: Performance improvements
- **test**: Test additions or corrections
- **build**: Build system changes
- **ci**: CI configuration changes
- **chore**: Maintenance tasks

### Examples

```bash
feat(booking): add doctor selection to booking form
fix(gallery): resolve lightbox navigation issue
docs(readme): update installation instructions
perf(images): implement lazy loading for gallery
```

## 🔄 Workflow

### 1. Feature Development

```bash
# Start from develop
git checkout develop
git pull origin develop

# Create feature branch
git checkout -b feature/DS-100-new-feature

# Work and commit
git add .
git commit -m "feat(scope): description"

# Push and create PR
git push origin feature/DS-100-new-feature
```

### 2. Release Process

```bash
# Create release branch from develop
git checkout -b release/v1.2.0 develop

# Bump version, update changelog
npm version minor
git commit -m "chore(release): bump version to v1.2.0"

# Merge to main
git checkout main
git merge --no-ff release/v1.2.0
git tag -a v1.2.0 -m "Release version 1.2.0"

# Back-merge to develop
git checkout develop
git merge --no-ff release/v1.2.0
```

### 3. Hotfix Process

```bash
# Create from main
git checkout -b hotfix/v1.2.1 main

# Fix and commit
git commit -m "fix(critical): resolve security vulnerability"

# Merge to main and develop
git checkout main
git merge --no-ff hotfix/v1.2.1
git tag -a v1.2.1 -m "Hotfix version 1.2.1"

git checkout develop
git merge --no-ff hotfix/v1.2.1
```

## 🛡️ Branch Protection Rules

### Main Branch

- ✅ Require pull request reviews (2 approvers)
- ✅ Dismiss stale PR approvals
- ✅ Require status checks (CI/CD)
- ✅ Require branches to be up to date
- ✅ Include administrators
- ✅ Restrict force pushes and deletions

### Develop Branch

- ✅ Require pull request reviews (1 approver)
- ✅ Require status checks
- ✅ Restrict force pushes

## 📊 Version Numbering (Semantic Versioning)

```
MAJOR.MINOR.PATCH
  │      │     └── Bug fixes
  │      └──────── New features (backwards compatible)
  └──────────────── Breaking changes
```

### Examples

- `1.0.0` → `2.0.0` - Breaking changes
- `1.0.0` → `1.1.0` - New features
- `1.0.0` → `1.0.1` - Bug fixes

## 🔄 Pull Request Template

```markdown
## Description

Brief description of changes

## Type of Change

- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing

- [ ] Unit tests pass
- [ ] E2E tests pass
- [ ] Manual testing completed

## Checklist

- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No console errors
- [ ] Performance impact considered

## Screenshots (if applicable)
```

## 🚀 Release Checklist

- [ ] All tests passing
- [ ] Version bumped
- [ ] CHANGELOG.md updated
- [ ] Documentation updated
- [ ] Performance benchmarks acceptable
- [ ] Security scan completed
- [ ] Accessibility audit passed
- [ ] Cross-browser testing done
- [ ] Staging environment tested
- [ ] Rollback plan prepared

## 📅 Release Schedule

- **Production Releases**: Every 2 weeks (Thursday)
- **Hotfixes**: As needed
- **Feature Freeze**: 2 days before release
- **Code Freeze**: 1 day before release
