# 🚀 Quick Start - Push to GitHub

## ✅ Що вже готово:

- ✅ Git Flow налаштовано (main + develop гілки)
- ✅ CI/CD pipeline готовий (GitHub Actions)
- ✅ Pre-commit hooks активні (Husky + lint-staged)
- ✅ Conventional commits налаштовано
- ✅ Docker підтримка
- ✅ E2E тести
- ✅ Unit тести
- ✅ Документація

## 📋 Крок 1: Створити GitHub Repository

1. Відкрийте https://github.com/new
2. Назва: **DS-WebApp**
3. Опис: **Modern dental clinic website built with React, TypeScript, and Tailwind CSS**
4. Visibility: **Private** (або Public)
5. **НЕ** додавайте README, .gitignore, чи license (вони вже є)
6. Натисніть **Create repository**

## 📋 Крок 2: Додати Remote та Push

```bash
# Додати remote (замініть YOUR_USERNAME на ваш GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/DS-WebApp.git

# Або якщо використовуєте SSH:
git remote add origin git@github.com:YOUR_USERNAME/DS-WebApp.git

# Push main branch
git push -u origin main

# Push develop branch
git push -u origin develop

# Push всі теги (якщо є)
git push --tags
```

## 📋 Крок 3: Налаштувати Branch Protection

### Main Branch:

1. Перейдіть: **Settings → Branches → Add rule**
2. Branch name pattern: main
3. Увімкніть:
   - ✅ Require a pull request before merging
     - Require approvals: **2**
     - Dismiss stale pull request approvals
   - ✅ Require status checks to pass before merging
     - Require branches to be up to date
     - Додайте обов'язкові перевірки:
       - Lint and Type Check
       - Run Tests
       - Build Application
       - End-to-End Tests
   - ✅ Require conversation resolution before merging
   - ✅ Do not allow bypassing the above settings
   - ✅ Block force pushes
4. Збережіть правила

### Develop Branch:

1. Перейдіть: **Settings → Branches → Add rule**
2. Branch name pattern: develop
3. Увімкніть:
   - ✅ Require a pull request before merging
     - Require approvals: **1**
   - ✅ Require status checks to pass before merging
   - ✅ Block force pushes
4. Збережіть правила

## 📋 Крок 4: Налаштувати Repository Settings

1. **Settings → General:**
   - Default branch: main (має бути вже встановлено)
   - Pull Requests → ✅ Automatically delete head branches

2. **Settings → Actions → General:**
   - Actions permissions → ✅ Allow all actions and reusable workflows
   - Workflow permissions → ✅ Read and write permissions
   - ✅ Allow GitHub Actions to create and approve pull requests

## 📋 Крок 5 (Опціонально): Додати Secrets

Якщо плануєте використовувати:

**Settings → Secrets and variables → Actions → New repository secret**

- CODECOV_TOKEN - для coverage звітів
- NETLIFY_AUTH_TOKEN - для Netlify деплоїв
- NETLIFY_SITE_ID - для Netlify деплоїв

## 🎉 Готово!

Тепер можна тестувати Git Flow:

```bash
# Перейти на develop
git checkout develop

# Створити feature гілку
git checkout -b feature/test-setup

# Зробити зміни
echo "Test" >> README.md
git add README.md
git commit -m "test: verify CI/CD pipeline"

# Push та створити PR
git push -u origin feature/test-setup
```

Потім на GitHub:

1. Створіть Pull Request з eature/test-setup → develop
2. Дочекайтесь проходження всіх CI/CD перевірок
3. Змерджіть PR
4. GitHub автоматично видалить feature гілку

## 📚 Детальна Документація

- docs/GIT-FLOW.md - Повний опис Git Flow
- docs/GITHUB-SETUP.md - Детальні інструкції налаштування
- .github/workflows/ci.yml - CI/CD pipeline конфігурація
- .github/pull_request_template.md - Шаблон PR

## 🔍 Перевірка Статусу

```bash
# Перевірити remote
git remote -v

# Переглянути гілки
git branch -a

# Подивитись останні коміти
git log --oneline --graph --all -10
```
