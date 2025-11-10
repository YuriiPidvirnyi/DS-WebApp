# 🚀 Vercel Deployment Guide

Повна інструкція для деплою Dental Story WebApp на Vercel.

## 📋 Передумови

- [x] GitHub репозиторій з кодом
- [x] Vercel account ([створити тут](https://vercel.com/signup))
- [ ] Production API keys (Google Maps, Sentry, CliniCards)

---

## 🔧 Крок 1: Підключення до Vercel

### Варіант A: Через Dashboard (рекомендовано)

1. **Відкрийте** [Vercel Dashboard](https://vercel.com/new)
2. **Оберіть** "Import Project"
3. **Підключіть** GitHub
4. **Оберіть** репозиторій `DS-WebApp`
5. **Натисніть** "Import"

### Варіант B: Через Vercel CLI

```bash
# Встановіть Vercel CLI
npm i -g vercel

# Увійдіть в акаунт
vercel login

# Деплой
vercel
```

---

## ⚙️ Крок 2: Налаштування Build

Vercel автоматично визначить налаштування з `vercel.json`, але перевірте:

### Build & Development Settings

```
Framework Preset: Vite
Build Command: npm run build
Output Directory: dist
Install Command: npm install
Development Command: npm run dev
```

### Root Directory

```
./
```

---

## 🔐 Крок 3: Environment Variables

### Додайте змінні оточення:

**Settings** → **Environment Variables**

Скопіюйте всі змінні з `.env.production.example`:

#### Обов'язкові:

```env
VITE_SITE_URL=https://dentalstory.com.ua
VITE_ENVIRONMENT=production
VITE_PHONE_NUMBER=+380682323838
VITE_EMAIL=info@dentalstory.ua
```

#### API Keys (замініть реальними):

```env
VITE_GOOGLE_MAPS_API_KEY=your_real_key_here
VITE_GOOGLE_ANALYTICS_ID=G-XXXXXXXXXX
VITE_SENTRY_DSN=https://your-sentry-dsn@sentry.io/1234567
VITE_CLINICARDS_API_KEY=your_clinicards_key
```

#### Feature Flags:

```env
VITE_ENABLE_CLINICARDS_INTEGRATION=true
VITE_ENABLE_PATIENT_PORTAL=true
VITE_ENABLE_ONLINE_BOOKING=true
```

### 💡 Порада:

- Встановіть змінні для всіх середовищ: **Production**, **Preview**, **Development**
- Для Preview можна використовувати тестові ключі

---

## 🌍 Крок 4: Налаштування Domain

### Додати Custom Domain:

1. **Settings** → **Domains**
2. **Add Domain**: `dentalstory.com.ua`
3. **Додайте DNS записи** у вашого провайдера:

```dns
Type: A
Name: @
Value: 76.76.21.21

Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

### Для піддомену (staging):

```dns
Type: CNAME
Name: staging
Value: cname.vercel-dns.com
```

---

## 🚦 Крок 5: Deployment Settings

### Git Integration

**Settings** → **Git**

```
Production Branch: main
Preview Branches: develop, feature/*
Ignored Build Step: None
```

### Build Settings

```
✅ Automatically build and deploy
✅ Enable preview deployments
✅ Enable production deployments
✅ Enable comments on Pull Requests
```

---

## 📊 Крок 6: Моніторинг і Analytics

### Vercel Analytics (безкоштовно)

**Analytics** → **Enable**

Отримаєте:

- Web Vitals
- Page views
- Top pages
- Device breakdown

### Vercel Speed Insights

**Speed Insights** → **Enable**

Моніторинг продуктивності в реальному часі.

---

## 🔄 Автоматичні Deployments

### Після налаштування:

**Push to `develop`** →

- ✅ Automatic preview deployment
- 🔗 Унікальний URL: `ds-webapp-git-develop-yourname.vercel.app`

**Merge to `main`** →

- ✅ Production deployment
- 🌍 Live на: `dentalstory.com.ua`

### Preview URLs:

Кожна гілка отримує свій URL:

```
feature/new-design → ds-webapp-git-feature-new-design.vercel.app
```

---

## 🛠️ Troubleshooting

### Build Failed?

1. **Перевірте логи** в Vercel Dashboard
2. **Локально запустіть** `npm run build`
3. **Перевірте** Environment Variables

### Поширені помилки:

#### Error: `Cannot find module 'vite'`

```bash
# Перевірте package.json
npm install
npm run build
```

#### Error: `Environment variable not defined`

```bash
# Додайте змінні в Vercel Dashboard
Settings → Environment Variables
```

#### 404 on Page Refresh

```json
// Перевірте vercel.json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

---

## 🔒 Security Headers

Налаштовані в `vercel.json`:

- ✅ X-Content-Type-Options
- ✅ X-Frame-Options
- ✅ X-XSS-Protection
- ✅ Referrer-Policy
- ✅ Permissions-Policy

---

## 🚀 Перший Deploy

### Готові до деплою? Виконайте:

```bash
# 1. Комітайте зміни
git add vercel.json .vercelignore .env.production.example
git commit -m "feat: add Vercel deployment configuration"
git push origin develop

# 2. Створіть Pull Request
gh pr create --title "Add Vercel deployment" --body "Ready for production"

# 3. Після review → Merge to main
```

### Або швидкий деплой через CLI:

```bash
vercel --prod
```

---

## 📱 Post-Deployment Checklist

Після першого деплою перевірте:

- [ ] ✅ Сайт відкривається
- [ ] ✅ Routing працює (перейдіть на `/about`, `/services`)
- [ ] ✅ Google Maps завантажується
- [ ] ✅ Форми працюють
- [ ] ✅ Analytics відстежує відвідування
- [ ] ✅ PWA працює (додайте на домашній екран)
- [ ] ✅ Mobile версія коректна
- [ ] ✅ Performance > 90 (перевірте в Lighthouse)

---

## 📞 Підтримка

**Проблеми з деплоєм?**

1. Перевірте [Vercel Docs](https://vercel.com/docs)
2. Перегляньте логи в Dashboard
3. Запустіть `vercel logs` локально

**Готово!** 🎉 Ваш сайт тепер на Vercel!
