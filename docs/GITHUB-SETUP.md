# GitHub Repository Setup Instructions

## 📦 Initial Repository Setup

### 1. Create GitHub Repository

If repository doesn't exist yet, create it on GitHub:

- URL: https://github.com/new
- Repository name: DS-WebApp
- Description: Modern dental clinic website built with React, TypeScript, and Tailwind CSS
- Visibility: Private (or Public)

### 2. Add Remote and Push

```bash
# Add remote origin
git remote add origin https://github.com/YOUR_USERNAME/DS-WebApp.git

# Or if using SSH:
git remote add origin git@github.com:YOUR_USERNAME/DS-WebApp.git

# Push main branch
git push -u origin main

# Push develop branch
git push -u origin develop
```

## 🔐 Branch Protection Rules

### For main branch:

1. Go to: **Settings → Branches → Add rule**
2. Branch name pattern: main
3. Enable:
   - ✅ Require a pull request before merging (2 approvers)
   - ✅ Dismiss stale pull request approvals when new commits are pushed
   - ✅ Require status checks to pass before merging
   - ✅ Require branches to be up to date before merging
   - ✅ Require conversation resolution before merging
   - ✅ Do not allow bypassing the above settings
   - ✅ Block force pushes

Required status checks:

- Lint and Type Check
- Run Tests
- Build Application
- End-to-End Tests

### For develop branch:

1. Go to: **Settings → Branches → Add rule**
2. Branch name pattern: develop
3. Enable:
   - ✅ Require a pull request before merging (1 approver)
   - ✅ Require status checks to pass before merging
   - ✅ Block force pushes

Required status checks:

- Lint and Type Check
- Run Tests
- Build Application

## 🔑 Repository Secrets

Go to: **Settings → Secrets and variables → Actions → New repository secret**

Optional secrets for CI/CD:

1. CODECOV_TOKEN - For test coverage reporting
2. NETLIFY_AUTH_TOKEN - For Netlify deployments
3. NETLIFY_SITE_ID - For Netlify deployments
4. SENTRY_DSN - For error tracking

## 📋 Repository Settings

### General Settings

**Settings → General:**

1. Default branch: Set to main
2. Features:
   - ✅ Issues
   - ✅ Projects
3. Pull Requests:
   - ✅ Allow squash merging
   - ✅ Allow merge commits
   - ✅ Automatically delete head branches

### Actions Settings

**Settings → Actions → General:**

1. Actions permissions:
   - ✅ Allow all actions and reusable workflows
2. Workflow permissions:
   - ✅ Read and write permissions
   - ✅ Allow GitHub Actions to create and approve pull requests

## 🏷️ Repository Topics

Add topics for better discoverability:

- dental-clinic
- healthcare
- react
- typescript
- vite
- tailwindcss
- pwa
- accessibility
- docker

## ✅ Verification Checklist

- [ ] Remote origin is configured
- [ ] Both main and develop branches are pushed
- [ ] Branch protection rules are active
- [ ] CI/CD workflows run successfully
- [ ] Default branch is set to main
- [ ] Auto-delete head branches is enabled

## 🚀 Test the Setup

```bash
# Create a test feature branch
git checkout develop
git checkout -b feature/test-setup

# Make a small change
echo "" >> README.md
git add README.md
git commit -m "test: verify CI/CD pipeline"

# Push and create PR
git push -u origin feature/test-setup

# Go to GitHub and create PR from feature/test-setup → develop
# Watch CI/CD pipeline run
# If all checks pass, merge the PR
```

## 📚 Resources

- [GitHub Branch Protection](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches)
- [GitHub Actions](https://docs.github.com/en/actions)
- [GitHub Environments](https://docs.github.com/en/actions/deployment/targeting-different-environments/using-environments-for-deployment)
